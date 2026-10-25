import { z } from "zod";

/**
 * Contrato estricto del reporte individual.
 *
 * Nunca admite tokens privados,
 * hashes ni información de otros clientes.
 */

const identificador = z.string().regex(
  /^[A-Za-z0-9_-]{5,128}$/
);

const glucosa = z.number()
  .finite()
  .nonnegative()
  .max(1000);

const diferencia = z.number()
  .finite()
  .min(-1000)
  .max(1000);

const alimentoSchema = z.strictObject({
  alimento: z.string().trim().min(2).max(120),
  pruebas: z.number().int().min(1).max(50),
  promedioAntes: glucosa,
  promedioDespues: glucosa,
  diferencia,
});

const reporteSchema = z.strictObject({
  cliente: z.strictObject({
    id: identificador,
    nombre: z.string().trim().min(1).max(120),
  }),
  registrosRevisados: z.number()
    .int().min(0).max(50),
  pruebasCompletas: z.number()
    .int().min(0).max(50),
  alimentos: z.array(alimentoSchema).max(8),
}).superRefine((reporte, contexto) => {
  if (
    reporte.pruebasCompletas >
    reporte.registrosRevisados
  ) {
    contexto.addIssue({
      code: "custom",
      message: "Totales inconsistentes",
    });
  }

  const representadas = reporte.alimentos.reduce(
    (total, alimento) => total + alimento.pruebas,
    0
  );

  if (representadas > reporte.pruebasCompletas) {
    contexto.addIssue({
      code: "custom",
      message: "Cantidad de pruebas inconsistente",
    });
  }
});

const respuestaSchema = z.strictObject({
  ok: z.literal(true),
  reporte: reporteSchema,
});

export type ReporteIndividualCliente =
  z.infer<typeof reporteSchema>;

export function leerReporteIndividualAdmin(
  entrada: unknown
): ReporteIndividualCliente | null {
  const resultado = respuestaSchema.safeParse(
    entrada
  );

  return resultado.success
    ? resultado.data.reporte
    : null;
}
