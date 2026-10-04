export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { timingSafeEqual } from "crypto";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";
import { obtenerWebPush } from "@/lib/web-push";
import { obtenerDiaSeguimiento } from "@/lib/seguimiento-publico";
import {
  mensajeRecordatorio,
  mensajeRecordatorioTardio,
  momentosRecordatorio,
  recordatorioTardioVigente,
  recordatorioVigente,
} from "@/lib/recordatorios-seguimiento";

type Suscripcion = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function cronAutorizado(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;

  if (!secreto) {
    return false;
  }

  const recibido = Buffer.from(
    req.headers.get("authorization") || ""
  );

  const esperado = Buffer.from(
    `Bearer ${secreto}`
  );

  return (
    recibido.length === esperado.length &&
    timingSafeEqual(recibido, esperado)
  );
}

function codigoHttp(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error
  ) {
    return Number(
      (error as { statusCode: unknown })
        .statusCode
    );
  }

  return null;
}

async function enviarASuscripciones(
  suscripciones: Suscripcion[],
  payload: Record<string, string>
) {
  const webpush = obtenerWebPush();

  const cuerpo = JSON.stringify(payload);

  let entregadas = 0;
  let fallidas = 0;

  for (const suscripcion of suscripciones) {
    try {
      await webpush.sendNotification(
        {
          endpoint: suscripcion.endpoint,
          keys: {
            p256dh: suscripcion.p256dh,
            auth: suscripcion.auth,
          },
        },
        cuerpo,
        {
          TTL: 3600,
          urgency: "high",
        }
      );

      entregadas++;

      await prisma.suscripcionPush
        .update({
          where: {
            id: suscripcion.id,
          },
          data: {
            ultimaEntregaAt: new Date(),
            ultimoErrorAt: null,
          },
        })
        .catch(() => null);
    } catch (error) {
      fallidas++;

      const codigo = codigoHttp(error);

      await prisma.suscripcionPush
        .update({
          where: {
            id: suscripcion.id,
          },
          data: {
            ultimoErrorAt: new Date(),
            ...(codigo === 404 ||
            codigo === 410
              ? { activa: false }
              : {}),
          },
        })
        .catch(() => null);
    }
  }

  return {
    entregadas,
    fallidas,
  };
}

type ActividadAviso = {
  id: string;
  titulo: string;
  hora: string | null;
  recordatorio: string;
  seccion:
    | "PRINCIPAL"
    | "ADICIONAL";
  diaInicio: number;
  diaFin: number | null;
};

async function procesarAvisosTardios({
  seguimiento,
  diaPlan,
  ahora,
  simulacion,
}: {
  seguimiento: {
    id: string;
    suscripcionesPush: Suscripcion[];
    actividades: ActividadAviso[];
  };
  diaPlan: number;
  ahora: Date;
  simulacion: boolean;
}) {
  let enviados = 0;
  let omitidos = 0;
  let fallidos = 0;

  const detalle: {
    seguimientoId: string;
    actividadId: string;
    diaPlan: number;
    estado: string;
  }[] = [];

  const candidatas = seguimiento.actividades
    .filter(
      (actividad) =>
        diaPlan >= actividad.diaInicio &&
        diaPlan <= (actividad.diaFin ??
          (
            actividad.seccion === "ADICIONAL"
              ? Number.MAX_SAFE_INTEGER
              : actividad.diaInicio
          ))
    )
    .map((actividad) => ({
      actividad,
      momentos: momentosRecordatorio(
        ahora,
        actividad.hora,
        actividad.recordatorio
      ),
    }))
    .filter(
      (item) =>
        item.momentos !== null &&
        recordatorioTardioVigente(
          ahora,
          item.momentos.evento
        )
    );

  if (candidatas.length === 0) {
    return { enviados, omitidos, fallidos, detalle };
  }

  const completadas =
    await prisma.progresoActividad.findMany({
      where: {
        seguimientoId: seguimiento.id,
        diaPlan,
        completado: true,
      },
      select: {
        actividadSeguimientoId: true,
      },
    });

  const idsCompletadas = new Set(
    completadas.map(
      (progreso: { actividadSeguimientoId: string }) =>
        progreso.actividadSeguimientoId
    )
  );

  for (const { actividad } of candidatas) {
    if (!actividad.hora) {
      continue;
    }

    const marca = {
      seguimientoId: seguimiento.id,
      actividadId: actividad.id,
      diaPlan,
    };

    if (idsCompletadas.has(actividad.id)) {
      omitidos++;

      detalle.push({
        ...marca,
        estado: "segundo aviso omitido: ya completada",
      });

      continue;
    }

    const yaEnviado =
      await prisma.recordatorioPushTardio.findUnique({
        where: {
          actividadSeguimientoId_diaPlan: {
            actividadSeguimientoId: actividad.id,
            diaPlan,
          },
        },
        select: {
          id: true,
        },
      });

    if (yaEnviado) {
      omitidos++;

      detalle.push({
        ...marca,
        estado: "segundo aviso omitido: ya enviado",
      });

      continue;
    }

    if (simulacion) {
      detalle.push({
        ...marca,
        estado: "segundo aviso: se enviaría ahora",
      });

      continue;
    }

    try {
      await prisma.recordatorioPushTardio.create({
        data: {
          seguimientoId: seguimiento.id,
          actividadSeguimientoId: actividad.id,
          diaPlan,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        omitidos++;
        continue;
      }

      throw error;
    }

    const resultado = await enviarASuscripciones(
      seguimiento.suscripcionesPush,
      {
        title: "DioxiLife",
        body: mensajeRecordatorioTardio({
          titulo: actividad.titulo,
          hora: actividad.hora,
        }),
        tag: `tarde-${actividad.id}-${diaPlan}`,
      }
    );

    if (resultado.entregadas === 0) {
      await prisma.recordatorioPushTardio.deleteMany({
        where: {
          actividadSeguimientoId: actividad.id,
          diaPlan,
        },
      });

      fallidos++;

      detalle.push({
        ...marca,
        estado: "segundo aviso falló: se reintentará",
      });

      continue;
    }

    enviados++;

    detalle.push({
      ...marca,
      estado: `segundo aviso enviado a ${resultado.entregadas} dispositivo(s)`,
    });
  }

  return { enviados, omitidos, fallidos, detalle };
}


function fechaBoliviaUtc(
  ahora: Date
) {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/La_Paz",
        year:
          "numeric",
        month:
          "2-digit",
        day:
          "2-digit",
      }
    ).formatToParts(
      ahora
    );

  const valor = (
    tipo: string
  ) =>
    partes.find(
      (parte) =>
        parte.type ===
        tipo
    )?.value || "";

  return new Date(
    `${valor("year")}-${valor("month")}-${valor("day")}T00:00:00.000Z`
  );
}

function diaActualGrupoBolivia(
  fechaInicio: Date,
  ahora: Date
) {
  const hoy =
    fechaBoliviaUtc(
      ahora
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
      (
        actual -
        inicio
      ) /
        86400000
    ) + 1
  );
}

async function finalizarGruposVencidos(
  ahora: Date
) {
  const grupos =
    await prisma.grupoSeguimiento.findMany({
      where: {
        estado:
          "ACTIVO",
      },

      select: {
        id: true,
        fechaInicio: true,
        duracionDias: true,

        miembros: {
          where: {
            estado:
              "ACTIVO",
          },

          select: {
            seguimientoId:
              true,
          },
        },
      },
    });

  const vencidos =
    grupos.filter(
      (grupo) =>
        diaActualGrupoBolivia(
          grupo.fechaInicio,
          ahora
        ) >
        grupo.duracionDias
    );

  if (
    vencidos.length ===
    0
  ) {
    return;
  }

  const idsGrupos =
    vencidos.map(
      (grupo) =>
        grupo.id
    );

  const idsSeguimientos =
    [
      ...new Set(
        vencidos.flatMap(
          (grupo) =>
            grupo.miembros.map(
              (miembro) =>
                miembro.seguimientoId
            )
        )
      ),
    ];

  await prisma.$transaction(
    async (tx) => {
      await tx.grupoSeguimiento.updateMany({
        where: {
          id: {
            in:
              idsGrupos,
          },

          estado:
            "ACTIVO",
        },

        data: {
          estado:
            "FINALIZADO",
        },
      });

      if (
        idsSeguimientos.length >
        0
      ) {
        await tx.seguimientoCliente.updateMany({
          where: {
            id: {
              in:
                idsSeguimientos,
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
}


export async function GET(
  req: NextRequest
) {
  const esCron = cronAutorizado(req);

  const admin = esCron
    ? null
    : await obtenerAdminActual();

  if (!esCron && !admin) {
    return NextResponse.json(
      {
        error: "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  const parametros =
    req.nextUrl.searchParams;

  const probar = !esCron
    ? parametros.get("probar")
    : null;

  const simulacion =
    !esCron &&
    parametros.get("dry") === "1";

  if (probar) {
    const suscripciones =
      await prisma.suscripcionPush.findMany({
        where: {
          seguimientoId: probar,
          activa: true,
        },
        select: {
          id: true,
          endpoint: true,
          p256dh: true,
          auth: true,
        },
      });

    if (suscripciones.length === 0) {
      return NextResponse.json(
        {
          error:
            "Ese seguimiento no tiene dispositivos con recordatorios activos.",
        },
        {
          status: 404,
        }
      );
    }

    const resultado =
      await enviarASuscripciones(
        suscripciones,
        {
          title: "DioxiLife",
          body: "Notificación de prueba. Si la ves, los recordatorios funcionan.",
          tag: `prueba-${Date.now()}`,
        }
      );

    return NextResponse.json({
      ok: true,
      prueba: true,
      dispositivos:
        suscripciones.length,
      ...resultado,
    });
  }

  const ahora = new Date();

  if (!simulacion) {
    try {
      await finalizarGruposVencidos(
        ahora
      );
    } catch (error) {
      console.error(
        "No se pudieron finalizar los grupos vencidos:",
        error
      );
    }
  }

  const seguimientos =
    await prisma.seguimientoCliente.findMany({
      where: {
        estado: "ACTIVO",

        fechaInicio: {
          not: null,
        },

        suscripcionesPush: {
          some: {
            activa: true,
          },
        },
      },

      select: {
        id: true,
        fechaInicio: true,
        duracionDias: true,

        suscripcionesPush: {
          where: {
            activa: true,
          },
          select: {
            id: true,
            endpoint: true,
            p256dh: true,
            auth: true,
          },
        },

        actividades: {
          where: {
            activo: true,

            hora: {
              not: null,
            },

            recordatorio: {
              not: "NINGUNO",
            },
          },

          select: {
            id: true,
            titulo: true,
            hora: true,
            recordatorio: true,
            seccion: true,
            diaInicio: true,
            diaFin: true,
          },
        },
      },
    });

  let enviados = 0;
  let omitidos = 0;
  let fallidos = 0;

  const detalle: {
    seguimientoId: string;
    actividadId: string;
    diaPlan: number;
    estado: string;
  }[] = [];

  const errores: string[] = [];

  for (const seguimiento of seguimientos) {
    try {
      if (!seguimiento.fechaInicio) {
        continue;
      }

      const diaPlan =
        obtenerDiaSeguimiento(
          seguimiento.fechaInicio,
          ahora
        );

      if (
        diaPlan < 1 ||
        diaPlan > seguimiento.duracionDias
      ) {
        continue;
      }
      const tardios =
        await procesarAvisosTardios({
          seguimiento,
          diaPlan,
          ahora,
          simulacion,
        });

      enviados += tardios.enviados;
      omitidos += tardios.omitidos;
      fallidos += tardios.fallidos;
      detalle.push(...tardios.detalle);

      const candidatas =
        seguimiento.actividades
          .filter(
            (actividad) =>
              diaPlan >=
                actividad.diaInicio &&
              diaPlan <=
                (actividad.diaFin ??
          (
            actividad.seccion === "ADICIONAL"
              ? Number.MAX_SAFE_INTEGER
              : actividad.diaInicio
          ))
          )
          .map((actividad) => ({
            actividad,
            momentos:
              momentosRecordatorio(
                ahora,
                actividad.hora,
                actividad.recordatorio
              ),
          }))
          .filter(
            (item) =>
              item.momentos !== null &&
              recordatorioVigente(
                ahora,
                item.momentos
              )
          );

      if (candidatas.length === 0) {
        continue;
      }

      const completadas =
        await prisma.progresoActividad.findMany(
          {
            where: {
              seguimientoId:
                seguimiento.id,
              diaPlan,
              completado: true,
            },
            select: {
              actividadSeguimientoId: true,
            },
          }
        );

      const idsCompletadas = new Set(
        completadas.map(
          (progreso) =>
            progreso.actividadSeguimientoId
        )
      );

      for (const item of candidatas) {
        const {
          actividad,
          momentos,
        } = item;

        if (!momentos || !actividad.hora) {
          continue;
        }

        const marca = {
          seguimientoId:
            seguimiento.id,
          actividadId:
            actividad.id,
          diaPlan,
        };

        if (
          idsCompletadas.has(actividad.id)
        ) {
          omitidos++;

          detalle.push({
            ...marca,
            estado:
              "omitido: ya completada",
          });

          continue;
        }

        const yaEnviado =
          await prisma.recordatorioPushEnviado.findUnique(
            {
              where: {
                actividadSeguimientoId_diaPlan:
                  {
                    actividadSeguimientoId:
                      actividad.id,
                    diaPlan,
                  },
              },
              select: {
                id: true,
              },
            }
          );

        if (yaEnviado) {
          omitidos++;

          detalle.push({
            ...marca,
            estado:
              "omitido: ya enviado",
          });

          continue;
        }

        if (simulacion) {
          detalle.push({
            ...marca,
            estado:
              "se enviaría ahora",
          });

          continue;
        }

        try {
          await prisma.recordatorioPushEnviado.create(
            {
              data: {
                seguimientoId:
                  seguimiento.id,
                actividadSeguimientoId:
                  actividad.id,
                diaPlan,
              },
            }
          );
        } catch (error) {
          if (
            error instanceof
              Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            omitidos++;
            continue;
          }

          throw error;
        }

        const resultado =
          await enviarASuscripciones(
            seguimiento.suscripcionesPush,
            {
              title: "DioxiLife",
              body: mensajeRecordatorio({
                titulo:
                  actividad.titulo,
                hora: actividad.hora,
                antes: momentos.antes,
              }),
              tag: `act-${actividad.id}-${diaPlan}`,
            }
          );

        if (resultado.entregadas === 0) {
          await prisma.recordatorioPushEnviado.deleteMany(
            {
              where: {
                actividadSeguimientoId:
                  actividad.id,
                diaPlan,
              },
            }
          );

          fallidos++;

          detalle.push({
            ...marca,
            estado:
              "falló: se reintentará",
          });

          continue;
        }

        enviados++;

        detalle.push({
          ...marca,
          estado: `enviado a ${resultado.entregadas} dispositivo(s)`,
        });
      }
    } catch (error) {
      errores.push(
        `${seguimiento.id}: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
    }
  }

  return NextResponse.json({
    ok: errores.length === 0,
    simulacion,
    ahora: ahora.toISOString(),
    revisados: seguimientos.length,
    enviados,
    omitidos,
    fallidos,
    errores,
    detalle: esCron
      ? undefined
      : detalle,
  });
}
