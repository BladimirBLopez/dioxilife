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
  momentosRecordatorio,
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

      const candidatas =
        seguimiento.actividades
          .filter(
            (actividad) =>
              diaPlan >=
                actividad.diaInicio &&
              diaPlan <=
                (actividad.diaFin ??
                  actividad.diaInicio)
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
