import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";
import { obtenerDiaSeguimiento } from "@/lib/seguimiento-publico";

function horaValida(
  valor: string
) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
    valor
  );
}

function diaDelCambio({
  fechaInicio,
  duracionDias,
  diaInicio,
}: {
  fechaInicio: Date | null;
  duracionDias: number;
  diaInicio: number;
}) {
  if (!fechaInicio) {
    return diaInicio;
  }

  return Math.min(
    Math.max(
      obtenerDiaSeguimiento(
        fechaInicio
      ),
      1
    ),
    duracionDias
  );
}

async function obtenerContexto(
  seguimientoId: string,
  actividadId: string
) {
  return prisma.seguimientoCliente.findFirst({
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
      fechaInicio: true,
      duracionDias: true,

      actividades: {
        where: {
          id: actividadId,
        },

        select: {
          id: true,
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
          activo: true,

          indicaciones: {
            where: {
              activo: true,
            },

            orderBy: [
              {
                hora: "asc",
              },
              {
                orden: "asc",
              },
              {
                createdAt: "asc",
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
    contexto.estado ===
      "COMPLETADO" ||
    contexto.estado ===
      "CANCELADO"
  ) {
    return NextResponse.json(
      {
        error:
          "No se puede modificar un seguimiento finalizado.",
      },
      {
        status: 409,
      }
    );
  }

  const actividad =
    contexto.actividades[0];

  const enPreparacion =
    contexto.estado ===
      "PENDIENTE" &&
    !contexto.preparadoAt;

  if (
    !enPreparacion &&
    actividad.seccion !==
      "ADICIONAL"
  ) {
    return NextResponse.json(
      {
        error:
          "Las indicaciones del protocolo principal solo pueden modificarse durante la preparación.",
      },
      {
        status: 409,
      }
    );
  }

  if (!actividad.activo) {
    return NextResponse.json(
      {
        error:
          "Esta actividad ya no está activa.",
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

  /*
   * Durante la preparación, o si el
   * protocolo todavía no tiene días
   * anteriores, podemos modificarlo
   * directamente.
   */
  if (
    enPreparacion ||
    !contexto.fechaInicio
  ) {
    const indicacion =
      await prisma.indicacionActividadSeguimiento.create({
        data: {
          actividadSeguimientoId:
            actividad.id,

          hora,

          texto,

          orden:
            nuevoOrden,

          activo: true,
        },
      });

    return NextResponse.json(
      indicacion
    );
  }

  const diaCambio =
    diaDelCambio({
      fechaInicio:
        contexto.fechaInicio,

      duracionDias:
        contexto.duracionDias,

      diaInicio:
        actividad.diaInicio,
    });

  const ultimoDia =
    actividad.diaFin ??
    contexto.duracionDias;

  if (
    diaCambio >
    ultimoDia
  ) {
    return NextResponse.json(
      {
        error:
          "Esta versión del protocolo adicional ya terminó.",
      },
      {
        status: 409,
      }
    );
  }

  /*
   * Si comienza hoy o en el futuro,
   * todavía no existe historial de esta
   * versión y podemos modificarla
   * directamente.
   */
  if (
    diaCambio <=
    actividad.diaInicio
  ) {
    const indicacion =
      await prisma.indicacionActividadSeguimiento.create({
        data: {
          actividadSeguimientoId:
            actividad.id,

          hora,

          texto,

          orden:
            nuevoOrden,

          activo: true,
        },
      });

    return NextResponse.json(
      indicacion
    );
  }

  /*
   * Ya existen días anteriores:
   * cerramos la versión histórica y
   * creamos una nueva desde hoy.
   */
  const nuevaActividad =
    await prisma.$transaction(
      async (tx) => {
        await tx.actividadSeguimiento.update({
          where: {
            id:
              actividad.id,
          },

          data: {
            diaFin:
              diaCambio - 1,

            activo:
              true,
          },
        });

        return tx.actividadSeguimiento.create({
          data: {
            seguimientoId:
              contexto.id,

            tipo:
              actividad.tipo,

            recordatorio:
              actividad.recordatorio,

            seccion:
              "ADICIONAL",

            titulo:
              actividad.titulo,

            descripcion:
              actividad.descripcion,

            momento:
              actividad.momento,

            hora:
              actividad.hora,

            diaInicio:
              diaCambio,

            diaFin:
              actividad.diaFin,

            orden:
              actividad.orden,

            activo:
              true,

            indicaciones: {
              create: [
                ...actividad.indicaciones.map(
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

                {
                  hora,
                  texto,
                  orden:
                    nuevoOrden,
                  activo:
                    true,
                },
              ],
            },
          },
        });
      }
    );

  return NextResponse.json({
    ok: true,
    versionada: true,
    actividadId:
      nuevaActividad.id,
  });
}
