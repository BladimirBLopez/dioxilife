import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type DatosSuscripcionPush = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function registrarSuscripcionPush(
  clienteId: string,
  datos: DatosSuscripcionPush
) {
  await prisma.$executeRaw`
    INSERT INTO "SuscripcionPushPruebaAlimento"
      ("id", "clienteId", "endpoint", "p256dh",
       "auth", "activa", "autorizadaAt",
       "revocadaAt", "createdAt", "updatedAt")
    VALUES
      (${randomUUID()}, ${clienteId}, ${datos.endpoint},
       ${datos.keys.p256dh}, ${datos.keys.auth},
       TRUE, NOW(), NULL, NOW(), NOW())
    ON CONFLICT ("clienteId", "endpoint")
    DO UPDATE SET
      "p256dh" = EXCLUDED."p256dh",
      "auth" = EXCLUDED."auth",
      "activa" = TRUE,
      "autorizadaAt" = NOW(),
      "revocadaAt" = NULL,
      "updatedAt" = NOW()
  `;
}

export async function revocarSuscripcionPush(
  clienteId: string,
  endpoint: string
) {
  await prisma.$executeRaw`
    UPDATE "SuscripcionPushPruebaAlimento"
    SET "activa" = FALSE,
        "revocadaAt" = NOW(),
        "updatedAt" = NOW()
    WHERE "clienteId" = ${clienteId}
      AND "endpoint" = ${endpoint}
  `;
}

export async function consultarSuscripcionPush(
  clienteId: string,
  endpoint: string
): Promise<boolean> {
  const filas = await prisma.$queryRaw<
    Array<{ activa: boolean }>
  >`
    SELECT "activa"
    FROM "SuscripcionPushPruebaAlimento"
    WHERE "clienteId" = ${clienteId}
      AND "endpoint" = ${endpoint}
    LIMIT 1
  `;

  return filas[0]?.activa === true;
}
