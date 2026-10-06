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

  return `${valor(
    "year"
  )}-${valor(
    "month"
  )}-${valor(
    "day"
  )}`;
}

function fechaUtc(
  valor: string
) {
  return new Date(
    `${valor}T00:00:00.000Z`
  );
}

export async function PATCH(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      miembroId: string;
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
    id: grupoId,
    miembroId,
  } = await params;

  const miembro =
    await prisma.miembroGrupoSeguimiento.findFirst({
      where: {
        id:
          miembroId,

        grupoId,
      },

      select: {
        id: true,
        estado: true,
        seguimientoId: true,

        grupo: {
          select: {
            estado: true,
            fechaInicio: true,
          },
        },
      },
    });

  if (!miembro) {
    return NextResponse.json(
      {
        error:
          "Participante no encontrado.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    miembro.grupo.estado ===
      "FINALIZADO" ||
    miembro.grupo.estado ===
      "CANCELADO"
  ) {
    return NextResponse.json(
      {
        error:
          "Ya no se pueden modificar los participantes de este grupo.",
      },
      {
        status: 409,
      }
    );
  }

  const hoy =
    fechaUtc(
      fechaBoliviaActual()
    );

  const programado =
    miembro.grupo.estado ===
      "ACTIVO" &&
    miembro.grupo.fechaInicio.getTime() >
      hoy.getTime();

  /*
   * Antes de comenzar no existe historial
   * que conservar.
   *
   * Eliminamos el miembro y su seguimiento
   * preparado.
   */
  if (
    miembro.grupo.estado ===
      "BORRADOR" ||
    programado
  ) {
    await prisma.$transaction(
      async (tx) => {
        await tx.miembroGrupoSeguimiento.delete({
          where: {
            id:
              miembro.id,
          },
        });

        await tx.seguimientoCliente.delete({
          where: {
            id:
              miembro.seguimientoId,
          },
        });
      }
    );

    return NextResponse.json({
      ok: true,
      eliminado: true,
      retirado: false,
    });
  }

  if (
    miembro.estado ===
    "RETIRADO"
  ) {
    return NextResponse.json({
      ok: true,
      eliminado: false,
      retirado: true,
    });
  }

  if (
    miembro.grupo.estado !==
    "ACTIVO"
  ) {
    return NextResponse.json(
      {
        error:
          "El grupo no permite retirar participantes en este momento.",
      },
      {
        status: 409,
      }
    );
  }

  const ahora =
    new Date();

  await prisma.$transaction(
    async (tx) => {
      await tx.miembroGrupoSeguimiento.update({
        where: {
          id:
            miembro.id,
        },

        data: {
          estado:
            "RETIRADO",

          fechaRetiro:
            hoy,
        },
      });

      await tx.seguimientoCliente.update({
        where: {
          id:
            miembro.seguimientoId,
        },

        data: {
          estado:
            "CANCELADO",

          fechaFinalizado:
            ahora,

          ultimoAccesoAt:
            ahora,
        },
      });
    }
  );

  return NextResponse.json({
    ok: true,
    eliminado: false,
    retirado: true,

    fechaRetiro:
      fechaBoliviaActual(),
  });
}
