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

async function contexto({
  grupoId,
  actividadId,
  indicacionId,
}: {
  grupoId: string;
  actividadId: string;
  indicacionId: string;
}) {
  const grupo =
    await obtenerContextoAgendaGrupo(
      grupoId
    );

  if (!grupo) {
    return {
      error:
        "Grupo no encontrado.",
      status: 404,
    } as const;
  }

  if (
    grupo.estado !==
    "ACTIVO"
  ) {
    return {
      error:
        "La Agenda grupal ya no puede modificarse.",
      status: 409,
    } as const;
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
    return {
      error:
        "Actividad no encontrada.",
      status: 404,
    } as const;
  }

  if (
    actividad.seccion !==
    "ADICIONAL"
  ) {
    return {
      error:
        "Las indicaciones del protocolo principal no se modifican después de iniciar el grupo.",
      status: 409,
    } as const;
  }

  if (
    !actividad.activo
  ) {
    return {
      error:
        "Esta actividad ya no está activa.",
      status: 409,
    } as const;
  }

  const indicacion =
    actividad.indicaciones.find(
      (
        item
      ) =>
        item.id ===
        indicacionId
    );

  if (!indicacion) {
    return {
      error:
        "Indicación no encontrada.",
      status: 404,
    } as const;
  }

  return {
    grupo,
    actividad,
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

  const ctx =
    await contexto({
      grupoId:
        id,

      actividadId,

      indicacionId,
    });

  if (
    "error" in ctx
  ) {
    return NextResponse.json(
      {
        error:
          ctx.error,
      },
      {
        status:
          ctx.status,
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

  const ordenPedido =
    Number(
      body?.orden
    );

  const nuevoOrden =
    Number.isInteger(
      ordenPedido
    )
      ? ordenPedido
      : ctx.indicacion
          .orden;

  const diaCambio =
    diaCambioGrupo({
      fechaInicio:
        ctx.grupo
          .fechaInicio,

      duracionDias:
        ctx.grupo
          .duracionDias,
    });

  const ultimoDia =
    ctx.actividad
      .diaFin ??
    ctx.grupo
      .duracionDias;

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

  if (
    diaCambio <=
    ctx.actividad
      .diaInicio
  ) {
    const resultado =
      await prisma.$transaction(
        async (
          tx
        ) => {
          const copias =
            await copiasActividadGrupo(
              tx,
              {
                actividadPlanId:
                  ctx.actividad
                    .id,

                seguimientoIds:
                  ctx.grupo
                    .seguimientosActivos,
              }
            );

          for (
            const copia of
            copias
          ) {
            const hija =
              copia.indicaciones.find(
                (
                  item
                ) =>
                  item.orden ===
                    ctx.indicacion
                      .orden &&
                  item.hora ===
                    ctx.indicacion
                      .hora &&
                  item.texto ===
                    ctx.indicacion
                      .texto
              ) ??
              copia.indicaciones.find(
                (
                  item
                ) =>
                  item.orden ===
                  ctx.indicacion
                    .orden
              );

            if (hija) {
              await tx.indicacionActividadSeguimiento.update({
                where: {
                  id:
                    hija.id,
                },

                data: {
                  hora,
                  texto,
                  orden:
                    nuevoOrden,
                },
              });
            }
          }

          return tx.indicacionActividadPlan.update({
            where: {
              id:
                ctx.indicacion
                  .id,
            },

            data: {
              hora,
              texto,
              orden:
                nuevoOrden,
            },
          });
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
              ctx.grupo
                .planId,

            actividadAnteriorId:
              ctx.actividad
                .id,

            seguimientoIds:
              ctx.grupo
                .seguimientosActivos,

            diaCambio,

            datos: {
              tipo:
                ctx.actividad
                  .tipo,

              recordatorio:
                ctx.actividad
                  .recordatorio,

              seccion:
                "ADICIONAL",

              titulo:
                ctx.actividad
                  .titulo,

              descripcion:
                ctx.actividad
                  .descripcion,

              momento:
                ctx.actividad
                  .momento,

              hora:
                ctx.actividad
                  .hora,

              diaInicio:
                diaCambio,

              diaFin:
                ctx.actividad
                  .diaFin,

              orden:
                ctx.actividad
                  .orden,

              activo:
                true,
            },

            indicaciones:
              ctx.actividad
                .indicaciones.map(
                  (
                    indicacion
                  ) => ({
                    hora:
                      indicacion.id ===
                      ctx.indicacion
                        .id
                        ? hora
                        : indicacion.hora,

                    texto:
                      indicacion.id ===
                      ctx.indicacion
                        .id
                        ? texto
                        : indicacion.texto,

                    orden:
                      indicacion.id ===
                      ctx.indicacion
                        .id
                        ? nuevoOrden
                        : indicacion.orden,

                    activo:
                      true,
                  })
                ),
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

  const ctx =
    await contexto({
      grupoId:
        id,

      actividadId,

      indicacionId,
    });

  if (
    "error" in ctx
  ) {
    return NextResponse.json(
      {
        error:
          ctx.error,
      },
      {
        status:
          ctx.status,
      }
    );
  }

  const diaCambio =
    diaCambioGrupo({
      fechaInicio:
        ctx.grupo
          .fechaInicio,

      duracionDias:
        ctx.grupo
          .duracionDias,
    });

  const ultimoDia =
    ctx.actividad
      .diaFin ??
    ctx.grupo
      .duracionDias;

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

  if (
    diaCambio <=
    ctx.actividad
      .diaInicio
  ) {
    await prisma.$transaction(
      async (
        tx
      ) => {
        const copias =
          await copiasActividadGrupo(
            tx,
            {
              actividadPlanId:
                ctx.actividad
                  .id,

              seguimientoIds:
                ctx.grupo
                  .seguimientosActivos,
            }
          );

        for (
          const copia of
          copias
        ) {
          const hija =
            copia.indicaciones.find(
              (
                item
              ) =>
                item.orden ===
                  ctx.indicacion
                    .orden &&
                item.hora ===
                  ctx.indicacion
                    .hora &&
                item.texto ===
                  ctx.indicacion
                    .texto
            ) ??
            copia.indicaciones.find(
              (
                item
              ) =>
                item.orden ===
                ctx.indicacion
                  .orden
            );

          if (hija) {
            await tx.indicacionActividadSeguimiento.delete({
              where: {
                id:
                  hija.id,
              },
            });
          }
        }

        await tx.indicacionActividadPlan.delete({
          where: {
            id:
              ctx.indicacion
                .id,
          },
        });
      }
    );

    return NextResponse.json({
      ok: true,
      versionada:
        false,
    });
  }

  const restantes =
    ctx.actividad
      .indicaciones.filter(
        (
          indicacion
        ) =>
          indicacion.id !==
          ctx.indicacion
            .id
      );

  const nueva =
    await prisma.$transaction(
      (
        tx
      ) =>
        versionarAdicionalGrupo(
          tx,
          {
            planId:
              ctx.grupo
                .planId,

            actividadAnteriorId:
              ctx.actividad
                .id,

            seguimientoIds:
              ctx.grupo
                .seguimientosActivos,

            diaCambio,

            datos: {
              tipo:
                ctx.actividad
                  .tipo,

              recordatorio:
                ctx.actividad
                  .recordatorio,

              seccion:
                "ADICIONAL",

              titulo:
                ctx.actividad
                  .titulo,

              descripcion:
                ctx.actividad
                  .descripcion,

              momento:
                ctx.actividad
                  .momento,

              hora:
                ctx.actividad
                  .hora,

              diaInicio:
                diaCambio,

              diaFin:
                ctx.actividad
                  .diaFin,

              orden:
                ctx.actividad
                  .orden,

              activo:
                true,
            },

            indicaciones:
              restantes.map(
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
