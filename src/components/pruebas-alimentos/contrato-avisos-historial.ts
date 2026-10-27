import { z } from "zod";

const glucosa = z.number().finite().positive().max(1000);

export const avisosHistorialSchema = z.array(
  z.strictObject({
    registroId: z.string().regex(/^[A-Za-z0-9_-]{5,128}$/),
    aviso: z.strictObject({
      alimento: z.string().min(2).max(120),
      etapa: z.enum(["antes", "despues"]),
      valor: glucosa,
      estado: z.enum(["por_debajo", "por_encima"]),
      rango: z.strictObject({
        minimo: glucosa,
        maximo: glucosa,
      }).refine(r => r.minimo <= r.maximo),
    }),
  })
).max(100);

export type AvisoHistorialUI =
  z.infer<typeof avisosHistorialSchema>[number];
