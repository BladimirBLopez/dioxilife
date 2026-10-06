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

async function obtenerContexto(
  planId: string,
  actividadId: string
) {
  return prisma.planSeguimiento.findFirst({
    where: {
      id:
        planId,

      actividades: {
        some: {
          id:
            actividadId,
        },
      },
    },

    select: {
      id: true,
      estado: true,
      esCopiaGrupo: true,

      actividades: {
        where: {
          id:
            actividadId,
        },

        select: {
          id: true,
          activo: true,

          indicaciones: {
            where: {
              activo:
                true,
            },

            orderBy: [
              {
                hora:
                  "asc",
              },
              {
                orden:
                  "asc",
              },
              {
                createdAt:
                  "asc",
              },
            ],

            select: {
              id: true,
              hora: true,
              texto: true,
              orden: true,
              activo: true,
            },
          },
        },

        take: 1,
      },
    },
  });
}

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      actividadId: string;
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
  } = await params;

  const contexto =
    await obtenerContexto(
      id,
      actividadId
    );

  if (
    !contexto ||
    contexto.actividades.length ===
      0
  ) {
    return NextResponse.json(
      {
        error:
          "Actividad no encontrada.",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json({
    indicaciones:
      contexto.actividades[0]
        .indicaciones,
  });
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      actividadId: string;
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
  } = await params;

  const contexto =
    await obtenerContexto(
      id,
      actividadId
    );

  if (
    !contexto ||
    contexto.actividades.length ===
      0
  ) {
    return NextResponse.json(
      {
        error:
          "Actividad no encontrada.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    contexto.esCopiaGrupo &&
    contexto.estado !==
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

  const actividad =
    contexto.actividades[0];

  if (!actividad.activo) {
    return NextResponse.json(
      {
        error:
          "Esta actividad no está activa.",
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

  const nuevoOrden =
    actividad.indicaciones.reduce(
      (
        mayor,
        indicacion
      ) =>
        Math.max(
          mayor,
          indicacion.orden
        ),
      -1
    ) + 1;

  const indicacion =
    await prisma.indicacionActividadPlan.create({
      data: {
        actividadPlanId:
          actividad.id,

        hora,

        texto,

        orden:
          nuevoOrden,

        activo:
          true,
      },
    });

  return NextResponse.json(
    indicacion
  );
}
