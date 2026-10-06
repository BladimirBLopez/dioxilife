import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function horaValida(
  valor: string
) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
    valor
  );
}

async function obtenerContexto({
  planId,
  actividadId,
  indicacionId,
}: {
  planId: string;
  actividadId: string;
  indicacionId: string;
}) {
  const plan =
    await prisma.planSeguimiento.findFirst({
      where: {
        id:
          planId,

        actividades: {
          some: {
            id:
              actividadId,

            indicaciones: {
              some: {
                id:
                  indicacionId,
              },
            },
          },
        },
      },

      select: {
        id: true,
        estado: true,
        esCopiaGrupo: true,
      },
    });

  if (!plan) {
    return null;
  }

  const indicacion =
    await prisma.indicacionActividadPlan.findFirst({
      where: {
        id:
          indicacionId,

        actividadPlanId:
          actividadId,

        actividadPlan: {
          planId,
        },
      },

      select: {
        id: true,
        hora: true,
        texto: true,
        orden: true,
      },
    });

  if (!indicacion) {
    return null;
  }

  return {
    plan,
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
    actividadId,
    indicacionId,
  } = await params;

  const contexto =
    await obtenerContexto({
      planId:
        id,

      actividadId,

      indicacionId,
    });

  if (!contexto) {
    return NextResponse.json(
      {
        error:
          "Indicación no encontrada.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    contexto.plan.esCopiaGrupo &&
    contexto.plan.estado !==
      "BORRADOR"
  ) {
    return NextResponse.json(
      {
        error:
          "El protocolo de un grupo activo ya no se modifica desde la preparación.",
      },
      {
        status: 409,
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
          .slice(
            0,
            5000
          )
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
    Number(
      body?.orden
    );

  const indicacion =
    await prisma.indicacionActividadPlan.update({
      where: {
        id:
          contexto.indicacion.id,
      },

      data: {
        hora,

        texto,

        orden:
          Number.isInteger(
            ordenSolicitado
          )
            ? ordenSolicitado
            : contexto.indicacion.orden,
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
    actividadId,
    indicacionId,
  } = await params;

  const contexto =
    await obtenerContexto({
      planId:
        id,

      actividadId,

      indicacionId,
    });

  if (!contexto) {
    return NextResponse.json(
      {
        error:
          "Indicación no encontrada.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    contexto.plan.esCopiaGrupo &&
    contexto.plan.estado !==
      "BORRADOR"
  ) {
    return NextResponse.json(
      {
        error:
          "El protocolo de un grupo activo ya no se modifica desde la preparación.",
      },
      {
        status: 409,
      }
    );
  }

  await prisma.indicacionActividadPlan.delete({
    where: {
      id:
        contexto.indicacion.id,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}
