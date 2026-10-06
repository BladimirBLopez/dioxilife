import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";
import { sincronizarProtocoloSeguimientoDesdePlan } from "@/lib/seguimiento-grupo-protocolo";

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

function horaValida(
  valor: string | null
) {
  return Boolean(
    valor &&
      /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
        valor
      )
  );
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
        planId: true,

        plan: {
          select: {
            esCopiaGrupo:
              true,

            actividades: {
              where: {
                activo:
                  true,
              },

              select: {
                id: true,
                titulo: true,
                seccion: true,
                hora: true,

                indicaciones: {
                  where: {
                    activo:
                      true,
                  },

                  select: {
                    hora: true,
                    texto: true,
                  },
                },
              },
            },
          },
        },

        miembros: {
          where: {
            estado:
              "ACTIVO",
          },

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
      grupo.plan.actividades.length ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Configura al menos una actividad activa antes de iniciar el grupo.",
        },
        {
          status: 409,
        }
      );
    }

    for (
      const actividad of
      grupo.plan.actividades
    ) {
      if (
        actividad.seccion ===
          "ADICIONAL" &&
        !horaValida(
          actividad.hora
        )
      ) {
        return NextResponse.json(
          {
            error:
              `El protocolo adicional "${actividad.titulo}" necesita un horario válido.`,
          },
          {
            status: 409,
          }
        );
      }

      for (
        const indicacion of
        actividad.indicaciones
      ) {
        if (
          !horaValida(
            indicacion.hora
          ) ||
          !indicacion.texto.trim()
        ) {
          return NextResponse.json(
            {
              error:
                `Revisa las indicaciones de "${actividad.titulo}". Todas deben tener horario y texto válidos.`,
            },
            {
              status: 409,
            }
          );
        }
      }
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
        /*
         * Mientras estuvo en BORRADOR,
         * el grupo no consumió jornadas.
         * Todos los miembros iniciales
         * comienzan desde el día 1.
         */
        await tx.miembroGrupoSeguimiento.updateMany({
          where: {
            grupoId:
              id,

            estado:
              "ACTIVO",
          },

          data: {
            diaIngreso:
              1,
          },
        });

        /*
         * Esta es la sincronización oficial:
         * cada participante recibe exactamente
         * la misma versión del protocolo maestro.
         */
        for (
          const miembro of
          grupo.miembros
        ) {
          await sincronizarProtocoloSeguimientoDesdePlan(
            tx,
            {
              seguimientoId:
                miembro.seguimientoId,

              planId:
                grupo.planId,

              desdeDia:
                1,

              reemplazar:
                true,
            }
          );
        }

        await tx.grupoSeguimiento.update({
          where: {
            id,
          },

          data: {
            estado:
              "ACTIVO",

            fechaFinalizado:
              null,
          },
        });

        /*
         * La copia interna del grupo también
         * pasa a ACTIVO. Las plantillas
         * originales nunca se modifican.
         */
        if (
          grupo.plan.esCopiaGrupo
        ) {
          await tx.planSeguimiento.update({
            where: {
              id:
                grupo.planId,
            },

            data: {
              estado:
                "ACTIVO",
            },
          });
        }

        await tx.seguimientoCliente.updateMany({
          where: {
            id: {
              in: ids,
            },

            estado:
              "PENDIENTE",
          },

          data: {
            estado:
              "ACTIVO",

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
    "FINALIZAR"
  ) {
    if (
      grupo.estado ===
      "FINALIZADO"
    ) {
      return NextResponse.json({
        ok: true,
        estado:
          "FINALIZADO",
      });
    }

    if (
      grupo.estado !==
      "ACTIVO"
    ) {
      return NextResponse.json(
        {
          error:
            "Solo un grupo activo puede finalizarse.",
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

    const ahora =
      new Date();

    await prisma.$transaction(
      async (tx) => {
        await tx.grupoSeguimiento.update({
          where: {
            id,
          },

          data: {
            estado:
              "FINALIZADO",

            fechaFinalizado:
              ahora,
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

              estado:
                "ACTIVO",
            },

            data: {
              estado:
                "COMPLETADO",

              fechaFinalizado:
                ahora,
            },
          });
        }
      }
    );

    return NextResponse.json({
      ok: true,
      estado:
        "FINALIZADO",
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

    const duracionAnterior =
      grupo.duracionDias;

    /*
     * Si reducimos la duración, no podemos
     * dejar actividades activas que empiecen
     * después del nuevo último día.
     */
    if (
      duracionDias <
      duracionAnterior
    ) {
      const actividadFuera =
        await prisma.actividadPlan.findFirst({
          where: {
            planId:
              grupo.planId,

            activo:
              true,

            diaInicio: {
              gt:
                duracionDias,
            },
          },

          orderBy: {
            diaInicio:
              "asc",
          },

          select: {
            titulo:
              true,

            diaInicio:
              true,
          },
        });

      if (
        actividadFuera
      ) {
        return NextResponse.json(
          {
            error:
              `No se puede reducir a ${duracionDias} días porque "${actividadFuera.titulo}" comienza en el día ${actividadFuera.diaInicio}. Ajusta primero el protocolo.`,
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

        /*
         * El grupo utiliza una copia interna
         * de PlanSeguimiento. Su duración debe
         * mantenerse sincronizada.
         */
        if (
          grupo.plan.esCopiaGrupo
        ) {
          await tx.planSeguimiento.update({
            where: {
              id:
                grupo.planId,
            },

            data: {
              duracionDias,
            },
          });

          if (
            duracionDias >
            duracionAnterior
          ) {
            /*
             * Las actividades que llegaban
             * exactamente al último día anterior
             * continúan hasta el nuevo final.
             *
             * diaFin=null ya significa "hasta
             * terminar", por lo que no necesita
             * modificarse.
             */
            await tx.actividadPlan.updateMany({
              where: {
                planId:
                  grupo.planId,

                diaFin:
                  duracionAnterior,
              },

              data: {
                diaFin:
                  duracionDias,
              },
            });
          } else if (
            duracionDias <
            duracionAnterior
          ) {
            /*
             * Si reducimos, recortamos las
             * actividades que sobrepasaban
             * el nuevo último día.
             */
            await tx.actividadPlan.updateMany({
              where: {
                planId:
                  grupo.planId,

                diaInicio: {
                  lte:
                    duracionDias,
                },

                diaFin: {
                  gt:
                    duracionDias,
                },
              },

              data: {
                diaFin:
                  duracionDias,
              },
            });
          }
        }

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

          /*
           * Mantener también sincronizadas
           * las copias de actividades que ya
           * existen en participantes activos.
           */
          if (
            duracionDias >
            duracionAnterior
          ) {
            await tx.actividadSeguimiento.updateMany({
              where: {
                seguimientoId: {
                  in:
                    ids,
                },

                diaFin:
                  duracionAnterior,
              },

              data: {
                diaFin:
                  duracionDias,
              },
            });
          } else if (
            duracionDias <
            duracionAnterior
          ) {
            await tx.actividadSeguimiento.updateMany({
              where: {
                seguimientoId: {
                  in:
                    ids,
                },

                diaInicio: {
                  lte:
                    duracionDias,
                },

                diaFin: {
                  gt:
                    duracionDias,
                },
              },

              data: {
                diaFin:
                  duracionDias,
              },
            });
          }
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
