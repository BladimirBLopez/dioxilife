import "server-only";
import { z } from "zod";
import { resolverRangosAutorizados } from "./rangos-autorizados";

const id = z.string().regex(/^[A-Za-z0-9_-]{5,128}$/);

const rango = z.strictObject({
  minimo: z.number().finite().positive().max(1000),
  maximo: z.number().finite().positive().max(1000),
}).refine(r => r.minimo <= r.maximo);

const aprobacion = z.strictObject({
  aprobado: z.literal(true),
  aprobadoPor: z.string().trim().min(3).max(120),
  aprobadoEn: z.string().datetime({ offset: true }),
  rangos: z.strictObject({
    antes: rango,
    despues: rango,
  }),
});

const esquema = z.strictObject({
  version: z.literal(1),
  unidad: z.literal("mg/dL"),
  general: aprobacion,
  excepciones: z.array(z.strictObject({
    clienteId: id,
    aprobacion,
  })).max(100),
}).refine(c => {
  const ids = c.excepciones.map(e => e.clienteId);
  return new Set(ids).size === ids.length;
});

export function leerRangosServidor(clienteId: string) {
  if (!id.safeParse(clienteId).success) return null;

  const texto =
    process.env.PRUEBAS_ALIMENTOS_RANGOS_APROBADOS_JSON;

  if (!texto || texto.length > 100000) return null;

  try {
    const c = esquema.safeParse(JSON.parse(texto));
    if (!c.success) return null;

    const excepcion = c.data.excepciones.find(
      e => e.clienteId === clienteId
    );

    return resolverRangosAutorizados({
      general: {
        autorizado: true,
        rangos: c.data.general.rangos,
      },
      excepcionCliente: excepcion ? {
        autorizado: true,
        rangos: excepcion.aprobacion.rangos,
      } : null,
    });
  } catch {
    return null;
  }
}
