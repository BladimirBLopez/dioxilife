import {
  createHash,
  randomBytes,
} from "crypto";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function hashToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function fechaValida(
  valor: unknown
): valor is string {
  if (
    typeof valor !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      valor
    )
  ) {
    return false;
  }

  const [
    year,
    month,
    day,
  ] = valor
    .split("-")
    .map(Number);

  const fecha =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  return (
    fecha.getUTCFullYear() ===
      year &&
    fecha.getUTCMonth() ===
      month - 1 &&
    fecha.getUTCDate() ===
      day
  );
}

export async function GET() {
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

  const [
    grupos,
    planes,
  ] = await Promise.all([
    prisma.grupoSeguimiento.findMany({
      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        nombre: true,
        objetivo: true,
        descripcion: true,
        fechaInicio: true,
        duracionDias: true,
        estado: true,
        createdAt: true,

        plan: {
          select: {
            id: true,
            nombre: true,
            duracionDias: true,
          },
        },

        _count: {
          select: {
            miembros: true,
          },
        },
      },
    }),

    prisma.planSeguimiento.findMany({
      where: {
        estado:
          "ACTIVO",

        esCopiaGrupo:
          false,
      },

      orderBy: {
        nombre: "asc",
      },

      select: {
        id: true,
        nombre: true,
        duracionDias: true,

        _count: {
          select: {
            actividades: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    grupos,

    planes:
      planes.filter(
        (plan) =>
          plan._count
            .actividades > 0
      ),
  });
}

export async function POST(
  req: NextRequest
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

  const body =
    await req
      .json()
      .catch(() => null);

  if (
    !body ||
    typeof body !== "object"
  ) {
    return NextResponse.json(
      {
        error:
          "Los datos del grupo no son válidos.",
      },
      {
        status: 400,
      }
    );
  }

  const nombre =
    typeof body.nombre === "string"
      ? body.nombre
          .trim()
          .slice(0, 200)
      : "";

  const objetivo =
    typeof body.objetivo === "string"
      ? body.objetivo
          .trim()
          .slice(0, 1000)
      : "";

  const descripcion =
    typeof body.descripcion ===
      "string" &&
    body.descripcion.trim()
      ? body.descripcion
          .trim()
          .slice(0, 3000)
      : null;

  const planId =
    typeof body.planId === "string"
      ? body.planId.trim()
      : "";

  const fechaInicio =
    body.fechaInicio;

  const duracionDias =
    Number(
      body.duracionDias
    );

  if (!nombre) {
    return NextResponse.json(
      {
        error:
          "El nombre del grupo es obligatorio.",
      },
      {
        status: 400,
      }
    );
  }

  if (!objetivo) {
    return NextResponse.json(
      {
        error:
          "El objetivo del grupo es obligatorio.",
      },
      {
        status: 400,
      }
    );
  }

  if (!planId) {
    return NextResponse.json(
      {
        error:
          "Selecciona el protocolo común del grupo.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !fechaValida(
      fechaInicio
    )
  ) {
    return NextResponse.json(
      {
        error:
          "La fecha de inicio no es válida.",
      },
      {
        status: 400,
      }
    );
  }

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

  const plan =
    await prisma.planSeguimiento.findUnique({
      where: {
        id:
          planId,
      },

      select: {
        id: true,
        nombre: true,
        descripcion: true,
        estado: true,
        esCopiaGrupo: true,

        actividades: {
          where: {
            activo:
              true,
          },

          orderBy: [
            {
              diaInicio:
                "asc",
            },
            {
              orden:
                "asc",
            },
          ],

          select: {
            tipo: true,
            recordatorio: true,
            seccion: true,
            titulo: true,
            descripcion: true,
            momento: true,
            hora: true,
            diaInicio: true,
            diaFin: true,
            orden: true,

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
              ],

              select: {
                hora: true,
                texto: true,
                orden: true,
              },
            },
          },
        },
      },
    });

  if (!plan) {
    return NextResponse.json(
      {
        error:
          "El protocolo seleccionado no existe.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    plan.esCopiaGrupo
  ) {
    return NextResponse.json(
      {
        error:
          "Selecciona una plantilla original.",
      },
      {
        status: 409,
      }
    );
  }

  if (
    plan.estado !== "ACTIVO"
  ) {
    return NextResponse.json(
      {
        error:
          "Solo se pueden utilizar plantillas activas.",
      },
      {
        status: 409,
      }
    );
  }

  if (
    plan.actividades.length ===
      0
  ) {
    return NextResponse.json(
      {
        error:
          "El protocolo debe tener al menos una actividad activa.",
      },
      {
        status: 409,
      }
    );
  }

  const tokenRanking =
    randomBytes(32)
      .toString("hex");

  const resultado =
    await prisma.$transaction(
      async (tx) => {
        const planGrupo =
          await tx.planSeguimiento.create({
            data: {
              nombre:
                plan.nombre,

              descripcion:
                plan.descripcion,

              duracionDias,

              estado:
                "BORRADOR",

              esCopiaGrupo:
                true,

              actividades: {
                create:
                  plan.actividades
                    .filter(
                      (actividad) =>
                        actividad.diaInicio <=
                        duracionDias
                    )
                    .map(
                      (actividad) => ({
                        tipo:
                          actividad.tipo,

                        recordatorio:
                          actividad.recordatorio,

                        seccion:
                          actividad.seccion,

                        titulo:
                          actividad.titulo,

                        descripcion:
                          actividad.descripcion,

                        momento:
                          actividad.momento,

                        hora:
                          actividad.hora,

                        diaInicio:
                          actividad.diaInicio,

                        diaFin:
                          actividad.diaFin ===
                            null
                            ? null
                            : Math.min(
                                actividad.diaFin,
                                duracionDias
                              ),

                        orden:
                          actividad.orden,

                        activo:
                          true,

                        indicaciones: {
                          create:
                            actividad.indicaciones.map(
                              (
                                indicacion
                              ) => ({
                                hora:
                                  indicacion.hora,

                                texto:
                                  indicacion.texto,

                                orden:
                                  indicacion.orden,

                                activo:
                                  true,
                              })
                            ),
                        },
                      })
                    ),
              },
            },

            select: {
              id: true,
              nombre: true,
            },
          });

        const grupo =
          await tx.grupoSeguimiento.create({
            data: {
              nombre,
              objetivo,
              descripcion,

              planId:
                planGrupo.id,

              fechaInicio:
                new Date(
                  `${fechaInicio}T00:00:00.000Z`
                ),

              duracionDias,

              estado:
                "BORRADOR",

              tokenRankingHash:
                hashToken(
                  tokenRanking
                ),

              tokenCreadoAt:
                new Date(),
            },

            select: {
              id: true,
              nombre: true,
              objetivo: true,
              descripcion: true,
              fechaInicio: true,
              duracionDias: true,
              estado: true,

              plan: {
                select: {
                  id: true,
                  nombre: true,
                  duracionDias: true,
                },
              },

              _count: {
                select: {
                  miembros: true,
                },
              },
            },
          });

        return {
          grupo,
          planGrupoId:
            planGrupo.id,
        };
      }
    );

  const {
    grupo,
    planGrupoId,
  } = resultado;

  return NextResponse.json(
    {
      grupo,

      siguientePaso: {
        tipo:
          "CONFIGURAR_PROTOCOLO",

        planId:
          planGrupoId,
      },
    },
    {
      status: 201,
    }
  );
}
