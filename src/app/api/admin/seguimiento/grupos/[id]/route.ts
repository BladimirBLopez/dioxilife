import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function fechaBoliviaActual() {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/La_Paz",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const valor = (
    tipo: string
  ) =>
    partes.find(
      (parte) =>
        parte.type === tipo
    )?.value || "";

  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

function fechaUtc(
  valor: string
) {
  return new Date(
    `${valor}T00:00:00.000Z`
  );
}

function diaActualGrupo(
  fechaInicio: Date
) {
  const hoy =
    fechaUtc(
      fechaBoliviaActual()
    );

  const inicio =
    Date.UTC(
      fechaInicio.getUTCFullYear(),
      fechaInicio.getUTCMonth(),
      fechaInicio.getUTCDate()
    );

  const actual =
    Date.UTC(
      hoy.getUTCFullYear(),
      hoy.getUTCMonth(),
      hoy.getUTCDate()
    );

  return (
    Math.floor(
      (actual - inicio) /
        86400000
    ) + 1
  );
}

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const admin =
    await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      {
        error:
          "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  const {
    id,
  } = await params;

  const body =
    await req
      .json()
      .catch(() => null);

  if (
    !body ||
    typeof body !==
      "object"
  ) {
    return NextResponse.json(
      {
        error:
          "La solicitud no es válida.",
      },
      {
        status: 400,
      }
    );
  }

  const accion =
    typeof body.accion ===
      "string"
      ? body.accion
      : "";

  const grupo =
    await prisma.grupoSeguimiento.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        estado: true,
        fechaInicio: true,
        duracionDias: true,

        miembros: {
          select: {
            diaIngreso: true,
            seguimientoId: true,
          },
        },
      },
    });

  if (!grupo) {
    return NextResponse.json(
      {
        error:
          "Grupo no encontrado.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    accion ===
    "ACTIVAR"
  ) {
    if (
      grupo.estado ===
      "ACTIVO"
    ) {
      return NextResponse.json({
        ok: true,
        estado:
          "ACTIVO",
      });
    }

    if (
      grupo.estado ===
        "FINALIZADO" ||
      grupo.estado ===
        "CANCELADO"
    ) {
      return NextResponse.json(
        {
          error:
            "Este grupo ya no puede iniciarse.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      grupo.miembros.length ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Agrega al menos un participante antes de iniciar el grupo.",
        },
        {
          status: 409,
        }
      );
    }

    const ids =
      grupo.miembros.map(
        (miembro) =>
          miembro.seguimientoId
      );

    await prisma.$transaction(
      async (tx) => {
        await tx.grupoSeguimiento.update({
          where: {
            id,
          },

          data: {
            estado:
              "ACTIVO",
          },
        });

        await tx.seguimientoCliente.updateMany({
          where: {
            id: {
              in: ids,
            },
          },

          data: {
            duracionDias:
              grupo.duracionDias,

            fechaInicio:
              grupo.fechaInicio,

            fechaInicioPrevista:
              grupo.fechaInicio,
          },
        });
      }
    );

    return NextResponse.json({
      ok: true,
      estado:
        "ACTIVO",
    });
  }

  if (
    accion ===
    "ACTUALIZAR_DURACION"
  ) {
    if (
      grupo.estado ===
        "FINALIZADO" ||
      grupo.estado ===
        "CANCELADO"
    ) {
      return NextResponse.json(
        {
          error:
            "No se puede modificar la duración de un grupo finalizado o cancelado.",
        },
        {
          status: 409,
        }
      );
    }

    const duracionDias =
      Number(
        body.duracionDias
      );

    if (
      !Number.isInteger(
        duracionDias
      ) ||
      duracionDias < 1 ||
      duracionDias > 365
    ) {
      return NextResponse.json(
        {
          error:
            "La duración debe estar entre 1 y 365 días.",
        },
        {
          status: 400,
        }
      );
    }

    const mayorDiaIngreso =
      grupo.miembros.reduce(
        (
          mayor,
          miembro
        ) =>
          Math.max(
            mayor,
            miembro.diaIngreso
          ),
        1
      );

    if (
      duracionDias <
      mayorDiaIngreso
    ) {
      return NextResponse.json(
        {
          error:
            `La duración no puede ser menor al día ${mayorDiaIngreso}, porque ya existen participantes incorporados en esa jornada.`,
        },
        {
          status: 409,
        }
      );
    }

    if (
      grupo.estado ===
      "ACTIVO"
    ) {
      const diaActual =
        diaActualGrupo(
          grupo.fechaInicio
        );

      if (
        diaActual > 0 &&
        duracionDias <
          diaActual
      ) {
        return NextResponse.json(
          {
            error:
              `El grupo ya se encuentra en el día ${diaActual}. La duración no puede reducirse por debajo de ese día.`,
          },
          {
            status: 409,
          }
        );
      }
    }

    const ids =
      grupo.miembros.map(
        (miembro) =>
          miembro.seguimientoId
      );

    await prisma.$transaction(
      async (tx) => {
        await tx.grupoSeguimiento.update({
          where: {
            id,
          },

          data: {
            duracionDias,
          },
        });

        if (
          ids.length > 0
        ) {
          await tx.seguimientoCliente.updateMany({
            where: {
              id: {
                in: ids,
              },
            },

            data: {
              duracionDias,
            },
          });
        }
      }
    );

    return NextResponse.json({
      ok: true,
      duracionDias,
    });
  }

  return NextResponse.json(
    {
      error:
        "La acción solicitada no es válida.",
    },
    {
      status: 400,
    }
  );
}
