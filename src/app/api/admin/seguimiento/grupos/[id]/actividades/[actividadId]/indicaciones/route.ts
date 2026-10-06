import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

import {
  copiasActividadGrupo,
  diaCambioGrupo,
  horaValidaGrupo,
  obtenerContextoAgendaGrupo,
  versionarAdicionalGrupo,
} from "@/lib/seguimiento-grupo-agenda";

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

  const grupo =
    await obtenerContextoAgendaGrupo(
      id
    );

  if (
    !grupo ||
    grupo.estado !==
      "ACTIVO"
  ) {
    return NextResponse.json(
      {
        error:
          grupo
            ? "La Agenda grupal ya no puede modificarse."
            : "Grupo no encontrado.",
      },
      {
        status:
          grupo
            ? 409
            : 404,
      }
    );
  }

  const actividad =
    await prisma.actividadPlan.findFirst({
      where: {
        id:
          actividadId,

        planId:
          grupo.planId,
      },

      include: {
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
        },
      },
    });

  if (!actividad) {
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
    actividad.seccion !==
    "ADICIONAL"
  ) {
    return NextResponse.json(
      {
        error:
          "Las indicaciones del protocolo principal no se modifican después de iniciar el grupo.",
      },
      {
        status: 409,
      }
    );
  }

  if (
    !actividad.activo
  ) {
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

  if (
    !horaValidaGrupo(
      hora
    )
  ) {
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

  const diaCambio =
    diaCambioGrupo({
      fechaInicio:
        grupo.fechaInicio,

      duracionDias:
        grupo.duracionDias,
    });

  const ultimoDia =
    actividad.diaFin ??
    grupo.duracionDias;

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
   * Sin historial anterior:
   * modificamos maestro y copias directamente.
   */
  if (
    diaCambio <=
    actividad.diaInicio
  ) {
    const resultado =
      await prisma.$transaction(
        async (
          tx
        ) => {
          const nueva =
            await tx.indicacionActividadPlan.create({
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

          const copias =
            await copiasActividadGrupo(
              tx,
              {
                actividadPlanId:
                  actividad.id,

                seguimientoIds:
                  grupo.seguimientosActivos,
              }
            );

          for (
            const copia of
            copias
          ) {
            await tx.indicacionActividadSeguimiento.create({
              data: {
                actividadSeguimientoId:
                  copia.id,

                hora,

                texto,

                orden:
                  nuevoOrden,

                activo:
                  true,
              },
            });
          }

          return nueva;
        }
      );

    return NextResponse.json(
      resultado
    );
  }

  const nueva =
    await prisma.$transaction(
      (
        tx
      ) =>
        versionarAdicionalGrupo(
          tx,
          {
            planId:
              grupo.planId,

            actividadAnteriorId:
              actividad.id,

            seguimientoIds:
              grupo.seguimientosActivos,

            diaCambio,

            datos: {
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
            },

            indicaciones: [
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
          }
        )
    );

  return NextResponse.json({
    ok: true,
    versionada:
      true,
    actividadId:
      nueva.id,
  });
}
