import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

import {
  diaCambioGrupo,
  normalizarActividadGrupo,
  obtenerContextoAgendaGrupo,
  versionarAdicionalGrupo,
} from "@/lib/seguimiento-grupo-agenda";

export async function PUT(
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
    grupo.estado !==
    "ACTIVO"
  ) {
    return NextResponse.json(
      {
        error:
          "La Agenda grupal ya no puede modificarse.",
      },
      {
        status: 409,
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

  const body =
    await req
      .json()
      .catch(() => null);

  if (
    typeof body !==
      "object" ||
    body === null ||
    Array.isArray(
      body
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Los datos enviados no son válidos.",
      },
      {
        status: 400,
      }
    );
  }

  const datosBody =
    body as Record<
      string,
      unknown
    >;

  const diaCambio =
    diaCambioGrupo({
      fechaInicio:
        grupo.fechaInicio,

      duracionDias:
        grupo.duracionDias,
    });

  /*
   * Quitar un protocolo adicional.
   */
  if (
    datosBody.quitar ===
    true
  ) {
    if (
      actividad.seccion !==
      "ADICIONAL"
    ) {
      return NextResponse.json(
        {
          error:
            "Esta acción solo corresponde a protocolos adicionales.",
        },
        {
          status: 400,
        }
      );
    }

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
            "Esta versión del protocolo ya terminó.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      diaCambio <=
      actividad.diaInicio
    ) {
      await prisma.$transaction(
        async (
          tx
        ) => {
          await tx.actividadPlan.update({
            where: {
              id:
                actividad.id,
            },

            data: {
              activo:
                false,
            },
          });

          if (
            grupo.seguimientosActivos.length >
            0
          ) {
            await tx.actividadSeguimiento.updateMany({
              where: {
                actividadPlanOrigenId:
                  actividad.id,

                seguimientoId: {
                  in:
                    grupo.seguimientosActivos,
                },
              },

              data: {
                activo:
                  false,
              },
            });
          }
        }
      );

      return NextResponse.json({
        ok: true,
        versionada:
          false,
      });
    }

    await prisma.$transaction(
      async (
        tx
      ) => {
        await tx.actividadPlan.update({
          where: {
            id:
              actividad.id,
          },

          data: {
            diaFin:
              diaCambio -
              1,

            activo:
              true,
          },
        });

        if (
          grupo.seguimientosActivos.length >
          0
        ) {
          await tx.actividadSeguimiento.updateMany({
            where: {
              actividadPlanOrigenId:
                actividad.id,

              seguimientoId: {
                in:
                  grupo.seguimientosActivos,
              },
            },

            data: {
              diaFin:
                diaCambio -
                1,

              activo:
                true,
            },
          });
        }
      }
    );

    return NextResponse.json({
      ok: true,
      versionada:
        true,
    });
  }

  const normalizada =
    normalizarActividadGrupo({
      body,

      duracionDias:
        grupo.duracionDias,

      seccionActual:
        actividad.seccion,

      activoActual:
        actividad.activo,
    });

  if (
    !normalizada.ok
  ) {
    return NextResponse.json(
      {
        error:
          normalizada.error,
      },
      {
        status: 400,
      }
    );
  }

  const nuevos =
    normalizada.datos;

  if (
    actividad.seccion ===
    "ADICIONAL"
  ) {
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
            "Esta versión del protocolo ya terminó. Modifica la versión vigente.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      diaCambio >
      actividad.diaInicio
    ) {
      if (
        nuevos.seccion !==
        "ADICIONAL"
      ) {
        return NextResponse.json(
          {
            error:
              "Un protocolo adicional con historial no puede convertirse en actividad principal.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        nuevos.diaFin !==
          null &&
        nuevos.diaFin <
          diaCambio
      ) {
        return NextResponse.json(
          {
            error:
              `El día final no puede ser anterior al día ${diaCambio}. Usa "Quitar desde hoy" para retirarlo.`,
          },
          {
            status: 400,
          }
        );
      }

      const hayCambios =
        nuevos.tipo !==
          actividad.tipo ||
        nuevos.recordatorio !==
          actividad.recordatorio ||
        nuevos.titulo !==
          actividad.titulo ||
        nuevos.descripcion !==
          actividad.descripcion ||
        nuevos.momento !==
          actividad.momento ||
        nuevos.hora !==
          actividad.hora ||
        nuevos.diaFin !==
          actividad.diaFin ||
        nuevos.orden !==
          actividad.orden;

      if (
        !hayCambios
      ) {
        return NextResponse.json(
          actividad
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

                datos:
                  nuevos,

                indicaciones:
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
                        indicacion.activo,
                    })
                  ),
              }
            )
        );

      return NextResponse.json(
        nueva
      );
    }
  }

  /*
   * Principal, o adicional sin historial:
   * actualización directa del maestro
   * y de todas sus copias activas.
   */
  const resultado =
    await prisma.$transaction(
      async (
        tx
      ) => {
        const actualizado =
          await tx.actividadPlan.update({
            where: {
              id:
                actividad.id,
            },

            data: {
              tipo:
                nuevos.tipo,

              recordatorio:
                nuevos.recordatorio,

              seccion:
                nuevos.seccion,

              titulo:
                nuevos.titulo,

              descripcion:
                nuevos.descripcion,

              momento:
                nuevos.momento,

              hora:
                nuevos.hora,

              diaInicio:
                nuevos.diaInicio,

              diaFin:
                nuevos.diaFin,

              orden:
                nuevos.orden,

              activo:
                nuevos.activo,
            },
          });

        if (
          grupo.seguimientosActivos.length >
          0
        ) {
          await tx.actividadSeguimiento.updateMany({
            where: {
              actividadPlanOrigenId:
                actividad.id,

              seguimientoId: {
                in:
                  grupo.seguimientosActivos,
              },
            },

            data: {
              tipo:
                nuevos.tipo,

              recordatorio:
                nuevos.recordatorio,

              seccion:
                nuevos.seccion,

              titulo:
                nuevos.titulo,

              descripcion:
                nuevos.descripcion,

              momento:
                nuevos.momento,

              hora:
                nuevos.hora,

              diaInicio:
                nuevos.diaInicio,

              diaFin:
                nuevos.diaFin,

              orden:
                nuevos.orden,

              activo:
                nuevos.activo,
            },
          });
        }

        return actualizado;
      }
    );

  return NextResponse.json(
    resultado
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
    grupo.estado !==
    "ACTIVO"
  ) {
    return NextResponse.json(
      {
        error:
          "La Agenda grupal ya no puede modificarse.",
      },
      {
        status: 409,
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

      select: {
        id: true,
        seccion: true,
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
    actividad.seccion ===
    "ADICIONAL"
  ) {
    return NextResponse.json(
      {
        error:
          "Los protocolos adicionales deben quitarse desde la Agenda para conservar el historial.",
      },
      {
        status: 409,
      }
    );
  }

  const copias =
    grupo.todosSeguimientos.length >
    0
      ? await prisma.actividadSeguimiento.findMany({
          where: {
            actividadPlanOrigenId:
              actividad.id,

            seguimientoId: {
              in:
                grupo.todosSeguimientos,
            },
          },

          select: {
            id: true,

            _count: {
              select: {
                progresos:
                  true,
              },
            },
          },
        })
      : [];

  const tieneProgreso =
    copias.some(
      (
        copia
      ) =>
        copia._count
          .progresos >
        0
    );

  if (
    tieneProgreso
  ) {
    return NextResponse.json(
      {
        error:
          "Esta actividad ya tiene progreso registrado. Puedes desactivarla, pero no eliminarla.",
      },
      {
        status: 409,
      }
    );
  }

  await prisma.$transaction(
    async (
      tx
    ) => {
      if (
        copias.length >
        0
      ) {
        await tx.actividadSeguimiento.deleteMany({
          where: {
            id: {
              in:
                copias.map(
                  (
                    copia
                  ) =>
                    copia.id
                ),
            },
          },
        });
      }

      await tx.actividadPlan.delete({
        where: {
          id:
            actividad.id,
        },
      });
    }
  );

  return NextResponse.json({
    ok: true,
  });
}
