import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function horaValida(valor: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
    valor
  );
}

async function validarEdicion({
  seguimientoId,
  actividadId,
  indicacionId,
}: {
  seguimientoId: string;
  actividadId: string;
  indicacionId: string;
}) {
  const seguimiento =
    await prisma.seguimientoCliente.findFirst({
      where: {
        id: seguimientoId,

        actividades: {
          some: {
            id: actividadId,
          },
        },
      },

      select: {
        id: true,
        estado: true,
        preparadoAt: true,
      },
    });

  if (!seguimiento) {
    return {
      error:
        "Actividad no encontrada.",
      status: 404,
    } as const;
  }

  const indicacion =
    await prisma.indicacionActividadSeguimiento.findFirst({
      where: {
        id: indicacionId,

        actividadSeguimientoId:
          actividadId,
      },

      select: {
        id: true,
        orden: true,
      },
    });

  if (!indicacion) {
    return {
      error:
        "Indicación no encontrada.",
      status: 404,
    } as const;
  }

  if (
    seguimiento.estado !==
      "PENDIENTE" ||
    seguimiento.preparadoAt
  ) {
    return {
      error:
        "Las indicaciones solo pueden modificarse durante la preparación del seguimiento.",
      status: 409,
    } as const;
  }

  return {
    seguimiento,
    indicacion,
  };
}

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      actividadId: string;
      indicacionId: string;
    }>;
  }
) {
  const admin =
    await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      {
        error: "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  const {
    id,
    actividadId,
    indicacionId,
  } = await params;

  const validacion =
    await validarEdicion({
      seguimientoId: id,
      actividadId,
      indicacionId,
    });

  if ("error" in validacion) {
    return NextResponse.json(
      {
        error:
          validacion.error,
      },
      {
        status:
          validacion.status,
      }
    );
  }

  const body =
    await req
      .json()
      .catch(() => null);

  const hora =
    typeof body?.hora ===
    "string"
      ? body.hora.trim()
      : "";

  const texto =
    typeof body?.texto ===
    "string"
      ? body.texto
          .trim()
          .slice(0, 5000)
      : "";

  if (!horaValida(hora)) {
    return NextResponse.json(
      {
        error:
          "Selecciona un horario válido.",
      },
      {
        status: 400,
      }
    );
  }

  if (!texto) {
    return NextResponse.json(
      {
        error:
          "La indicación es obligatoria.",
      },
      {
        status: 400,
      }
    );
  }

  const ordenSolicitado =
    Number(body?.orden);

  const indicacion =
    await prisma.indicacionActividadSeguimiento.update({
      where: {
        id: indicacionId,
      },

      data: {
        hora,
        texto,

        orden:
          Number.isInteger(
            ordenSolicitado
          )
            ? ordenSolicitado
            : validacion
                .indicacion
                .orden,
      },
    });

  return NextResponse.json(
    indicacion
  );
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      actividadId: string;
      indicacionId: string;
    }>;
  }
) {
  const admin =
    await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      {
        error: "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  const {
    id,
    actividadId,
    indicacionId,
  } = await params;

  const validacion =
    await validarEdicion({
      seguimientoId: id,
      actividadId,
      indicacionId,
    });

  if ("error" in validacion) {
    return NextResponse.json(
      {
        error:
          validacion.error,
      },
      {
        status:
          validacion.status,
      }
    );
  }

  /*
   * Durante la preparación todavía
   * no existe historial del cliente.
   * Por eso es seguro eliminarla.
   */
  await prisma.indicacionActividadSeguimiento.delete({
    where: {
      id: indicacionId,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}
