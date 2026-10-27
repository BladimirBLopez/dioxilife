import { z } from "zod";
import { avisosHistorialSchema } from "./contrato-avisos-historial";

import {
  fechaPruebaSchema,
} from "@/lib/pruebas-alimentos/validaciones";

const glucosa = z.number().finite().positive().max(1000);

const instanteUTC = z.string().refine((valor) => {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
      valor
    )
  ) {
    return false;
  }

  const fecha = new Date(valor);

  return (
    Number.isFinite(fecha.getTime()) &&
    fecha.toISOString() === valor
  );
});

const registroSchema = z.strictObject({
  id: z.string().regex(/^[A-Za-z0-9_-]{5,128}$/),
  fecha: fechaPruebaSchema,
  glucosaAyunas: glucosa.nullable(),
  glucosaAntes: glucosa,
  alimento: z.string().min(2).max(120),
  cantidad: z.string().max(100).nullable(),
  horaComida: instanteUTC,
  glucosaDespues: glucosa.nullable(),
  horaMedicionDespues: instanteUTC.nullable(),
  observacion: z.string().max(1500).nullable(),
});

const respuestaSchema = z.strictObject({
  ok: z.literal(true),
  registros: z.array(registroSchema).max(50),
  pendiente: registroSchema.nullable(),
  avisos: avisosHistorialSchema.optional(),
  alertasActivas: z.boolean().optional(),
});

export type RegistroHistorialCliente =
  z.infer<typeof registroSchema>;

/**
 * Acepta solamente la estructura esperada
 * de la API privada.
 */
export function leerHistorialCliente(entrada: unknown) {
  const resultado = respuestaSchema.safeParse(entrada);

  return resultado.success
    ? {
        registros: resultado.data.registros,
        pendiente: resultado.data.pendiente,
        avisos: resultado.data.avisos ?? [],
        alertasActivas: resultado.data.alertasActivas ?? false,
      }
    : null;
}

/**
 * Hora sugerida dos horas después de comer,
 * expresada en el horario de Bolivia (UTC-4).
 * No programa recordatorios.
 */
export function obtenerSugerenciaPendiente(
  horaComidaUTC: string
) {
  if (!instanteUTC.safeParse(horaComidaUTC).success) {
    return null;
  }

  const instante = Date.parse(horaComidaUTC);

  if (!Number.isFinite(instante)) {
    return null;
  }

  const fechaBolivia = new Date(
    instante +
    120 * 60 * 1000 -
    4 * 60 * 60 * 1000
  );

  const calendario = fechaBolivia.toISOString();

  return {
    fecha: calendario.slice(0, 10),
    hora: calendario.slice(11, 16),
  };
}
