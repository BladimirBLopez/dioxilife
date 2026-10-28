import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { obtenerWebPush } from "@/lib/web-push";
import { obtenerClientePilotoPush } from
  "@/lib/pruebas-alimentos/piloto-push";
import { pruebasAlimentosHabilitadas } from
  "@/lib/pruebas-alimentos/activacion";

type Candidato = {
  registroId: string;
};

type Reserva = {
  id: string;
};

type Suscripcion = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function ejecutarRecordatoriosPush() {
  const piloto = obtenerClientePilotoPush();

  if (
    !piloto ||
    !pruebasAlimentosHabilitadas() ||
    process.env.PRUEBAS_ALIMENTOS_PUSH_ACTIVO !== "true" ||
    !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    !process.env.VAPID_PRIVATE_KEY ||
    !process.env.VAPID_SUBJECT
  ) {
    return {
      revisados: 0,
      enviados: 0,
      fallidos: 0,
      caducados: 0,
    };
  }

  // Las reservas abandonadas se cancelan.
  // No se reenvian automaticamente.
  const caducados = await prisma.$executeRaw`
    UPDATE "RecordatorioPushPruebaAlimento"
    SET "estado" =
          'CANCELADO'::"EstadoRecordatorioPruebaAlimento",
        "updatedAt" = (NOW() AT TIME ZONE 'UTC')
    WHERE "estado" =
          'EN_PROCESO'::"EstadoRecordatorioPruebaAlimento"
      AND "reservadoAt" <
        (NOW() AT TIME ZONE 'UTC') - INTERVAL '20 minutes'
      AND EXISTS (
        SELECT 1
        FROM "RegistroPruebaAlimento" r
        WHERE r."id" =
          "RecordatorioPushPruebaAlimento"."registroId"
          AND r."clienteId" = ${piloto}
      )
  `;

  const pendientes = await prisma.$queryRaw<Candidato[]>`
    SELECT r."id" AS "registroId"
    FROM "RegistroPruebaAlimento" r
    JOIN "ClientePruebaAlimento" c
      ON c."id" = r."clienteId"
    WHERE r."clienteId" = ${piloto}
      AND r."glucosaDespues" IS NULL
      AND r."horaMedicionDespues" IS NULL
      AND r."horaComida" <=
        (NOW() AT TIME ZONE 'UTC') - INTERVAL '120 minutes'
      AND r."horaComida" >=
        (NOW() AT TIME ZONE 'UTC') - INTERVAL '135 minutes'
      AND c."tokenRevocadoAt" IS NULL
      AND c."tokenExpiraAt" > (NOW() AT TIME ZONE 'UTC')
      AND EXISTS (
        SELECT 1
        FROM "SuscripcionPushPruebaAlimento" s
        WHERE s."clienteId" = r."clienteId"
          AND s."activa" = TRUE
      )
    ORDER BY r."horaComida", r."id"
    LIMIT 25
  `;

  let enviados = 0;
  let fallidos = 0;

  for (const item of pendientes) {
    let reservaId: string | null = null;

    try {
      const reserva = await prisma.$queryRaw<Reserva[]>`
        INSERT INTO "RecordatorioPushPruebaAlimento"
          ("id", "registroId", "programadoPara",
           "estado", "reservadoAt", "intentos",
           "createdAt", "updatedAt")
        SELECT
          ${randomUUID()},
          r."id",
          r."horaComida" + INTERVAL '120 minutes',
          'EN_PROCESO'::"EstadoRecordatorioPruebaAlimento",
          (NOW() AT TIME ZONE 'UTC'),
          1,
          (NOW() AT TIME ZONE 'UTC'),
          (NOW() AT TIME ZONE 'UTC')
        FROM "RegistroPruebaAlimento" r
        JOIN "ClientePruebaAlimento" c
          ON c."id" = r."clienteId"
        WHERE r."id" = ${item.registroId}
          AND r."clienteId" = ${piloto}
          AND r."glucosaDespues" IS NULL
          AND r."horaMedicionDespues" IS NULL
          AND r."horaComida" <=
            (NOW() AT TIME ZONE 'UTC') - INTERVAL '120 minutes'
          AND r."horaComida" >=
            (NOW() AT TIME ZONE 'UTC') - INTERVAL '135 minutes'
          AND c."tokenRevocadoAt" IS NULL
          AND c."tokenExpiraAt" > (NOW() AT TIME ZONE 'UTC')
          AND EXISTS (
            SELECT 1
            FROM "SuscripcionPushPruebaAlimento" s
            WHERE s."clienteId" = r."clienteId"
              AND s."activa" = TRUE
          )
        ON CONFLICT ("registroId") DO NOTHING
        RETURNING "id"
      `;

      // Si otro Cron lo reservo, no reenviar.
      if (reserva.length !== 1) continue;

      reservaId = reserva[0].id;

      // Revalidar medicion, acceso y suscripciones.
      const suscripciones = await prisma.$queryRaw<
        Suscripcion[]
      >`
        SELECT s."id", s."endpoint",
               s."p256dh", s."auth"
        FROM "SuscripcionPushPruebaAlimento" s
        JOIN "RegistroPruebaAlimento" r
          ON r."clienteId" = s."clienteId"
        JOIN "ClientePruebaAlimento" c
          ON c."id" = r."clienteId"
        WHERE r."id" = ${item.registroId}
          AND r."clienteId" = ${piloto}
          AND r."glucosaDespues" IS NULL
          AND r."horaMedicionDespues" IS NULL
          AND c."tokenRevocadoAt" IS NULL
          AND c."tokenExpiraAt" > (NOW() AT TIME ZONE 'UTC')
          AND s."activa" = TRUE
        ORDER BY s."id"
        LIMIT 10
      `;

      let aceptadas = 0;

      for (const s of suscripciones) {
        try {
          await obtenerWebPush().sendNotification(
            {
              endpoint: s.endpoint,
              keys: {
                p256dh: s.p256dh,
                auth: s.auth,
              },
            },
            JSON.stringify({
              title: "DioxiLife Bolivia",
              body: "Es momento de completar tu segunda medición.",
              tag: "dioxilife-recordatorio-glucosa",
              url: "/",
            }),
            { TTL: 900 }
          );

          aceptadas++;
        } catch (error) {
          const codigo =
            typeof error === "object" &&
            error !== null &&
            "statusCode" in error
              ? Number(error.statusCode)
              : 0;

          if (codigo === 404 || codigo === 410) {
            await prisma.$executeRaw`
              UPDATE "SuscripcionPushPruebaAlimento"
              SET "activa" = FALSE,
                  "revocadaAt" = (NOW() AT TIME ZONE 'UTC'),
                  "updatedAt" = (NOW() AT TIME ZONE 'UTC')
              WHERE "id" = ${s.id}
            `;
          }
        }
      }

      if (aceptadas > 0) {
        await prisma.$executeRaw`
          UPDATE "RecordatorioPushPruebaAlimento"
          SET "estado" =
                'ENVIADO'::"EstadoRecordatorioPruebaAlimento",
              "enviadoAt" = (NOW() AT TIME ZONE 'UTC'),
              "updatedAt" = (NOW() AT TIME ZONE 'UTC')
          WHERE "id" = ${reservaId}
            AND "estado" =
                'EN_PROCESO'::"EstadoRecordatorioPruebaAlimento"
        `;

        enviados++;
      } else {
        await prisma.$executeRaw`
          UPDATE "RecordatorioPushPruebaAlimento"
          SET "estado" =
                'CANCELADO'::"EstadoRecordatorioPruebaAlimento",
              "ultimoErrorAt" = (NOW() AT TIME ZONE 'UTC'),
              "updatedAt" = (NOW() AT TIME ZONE 'UTC')
          WHERE "id" = ${reservaId}
            AND "estado" =
                'EN_PROCESO'::"EstadoRecordatorioPruebaAlimento"
        `;

        fallidos++;
      }
    } catch {
      fallidos++;

      if (reservaId) {
        try {
          await prisma.$executeRaw`
            UPDATE "RecordatorioPushPruebaAlimento"
            SET "estado" =
                  'CANCELADO'::"EstadoRecordatorioPruebaAlimento",
                "ultimoErrorAt" = (NOW() AT TIME ZONE 'UTC'),
                "updatedAt" = (NOW() AT TIME ZONE 'UTC')
            WHERE "id" = ${reservaId}
              AND "estado" =
                  'EN_PROCESO'::"EstadoRecordatorioPruebaAlimento"
          `;
        } catch {
          // La limpieza futura cancelara la reserva.
        }
      }
    }
  }

  return {
    revisados: pendientes.length,
    enviados,
    fallidos,
    caducados,
  };
}
