import { z } from "zod";

/**
 * Contratos para las futuras API administrativas.
 *
 * Estas validaciones NO sustituyen la comprobación
 * de la sesión administrativa en el servidor.
 *
 * No generan tokens ni consultan la base de datos.
 */

export const vigenciaAccesoSchema = z
  .union([
    z.literal(7),
    z.literal(30),
    z.literal(90),
  ])
  .default(30);

const clienteNuevoSchema = z.strictObject({
  origen: z.literal("nuevo"),

  nombre: z
    .string()
    .trim()
    .min(2)
    .max(120),

  telefono: z
    .string()
    .trim()
    .max(30)
    .optional(),

  vigenciaDias: vigenciaAccesoSchema,
});

const clienteExistenteSchema = z.strictObject({
  origen: z.literal("existente"),

  seguimientoId: z
    .string()
    .trim()
    .min(5)
    .max(128),

  vigenciaDias: vigenciaAccesoSchema,
});

/**
 * El cliente no puede proporcionar token, hash,
 * fecha de vencimiento ni ID de administrador.
 *
 * La API obtendrá estos valores en el servidor.
 */
export const crearAccesoPruebaSchema =
  z.discriminatedUnion("origen", [
    clienteNuevoSchema,
    clienteExistenteSchema,
  ]);

export const revocarAccesoPruebaSchema =
  z.strictObject({
    clientePruebaId: z
      .string()
      .trim()
      .min(5)
      .max(128),
  });

/**
 * Cálculo exacto del vencimiento.
 * Se ejecutará en el servidor al crear el acceso.
 */
export function calcularVencimientoAcceso(
  dias: number,
  ahora: Date = new Date()
): Date {
  const validacion =
    vigenciaAccesoSchema.safeParse(dias);

  if (!validacion.success) {
    throw new Error("Vigencia no permitida");
  }

  const inicio = ahora.getTime();

  if (!Number.isFinite(inicio)) {
    throw new Error("Fecha inicial no válida");
  }

  return new Date(
    inicio + validacion.data * 24 * 60 * 60 * 1000
  );
}
