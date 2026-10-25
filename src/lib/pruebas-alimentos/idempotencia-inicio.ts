import { createHmac } from "node:crypto";

import type {
  PlanInicioAlimento,
} from "./servicio-registros";

/**
 * Identificador privado y determinista.
 *
 * Solicitudes iniciales idénticas del mismo cliente
 * producen el mismo ID de registro.
 *
 * La unicidad real la impone la clave primaria
 * ya existente en PostgreSQL.
 *
 * Se utiliza HMAC para que el identificador
 * no revele los valores de glucosa, alimento
 * ni otros campos originales.
 *
 * El secreto debe mantenerse estable en producción.
 */

const ID_CLIENTE = /^[A-Za-z0-9_-]{5,128}$/;
const SECRETO_HEX = /^[0-9a-fA-F]{64}$/;

export function crearIdInicioIdempotente(
  datos: PlanInicioAlimento,
  secretoHex: string | undefined
): string {
  if (
    typeof secretoHex !== "string" ||
    !SECRETO_HEX.test(secretoHex)
  ) {
    throw new Error(
      "Identificación de registros no disponible"
    );
  }

  if (
    !datos ||
    typeof datos.clienteId !== "string" ||
    !ID_CLIENTE.test(datos.clienteId) ||
    !(datos.fecha instanceof Date) ||
    !(datos.horaComida instanceof Date) ||
    !Number.isFinite(datos.fecha.getTime()) ||
    !Number.isFinite(datos.horaComida.getTime()) ||
    typeof datos.glucosaAntes !== "number" ||
    !Number.isFinite(datos.glucosaAntes) ||
    (
      datos.glucosaAyunas != null &&
      (
        typeof datos.glucosaAyunas !== "number" ||
        !Number.isFinite(datos.glucosaAyunas)
      )
    ) ||
    typeof datos.alimento !== "string"
  ) {
    throw new Error(
      "Datos iniciales no válidos"
    );
  }

  const contenido = JSON.stringify([
    "inicio-v1",
    datos.clienteId,
    datos.fecha.toISOString(),
    datos.horaComida.toISOString(),
    datos.glucosaAyunas ?? null,
    datos.glucosaAntes,
    datos.alimento,
    datos.cantidad ?? null,
    datos.observacion ?? null,
  ]);

  const huella = createHmac(
    "sha256",
    Buffer.from(secretoHex, "hex")
  )
    .update(
      "dioxilife/pruebas-alimentos/idempotencia/v1\0",
      "utf8"
    )
    .update(contenido, "utf8")
    .digest("hex");

  return `pa_${huella}`;
}
