import { z } from "zod";

/**
 * Datos permitidos en el navegador administrativo.
 *
 * Nunca se admiten el token original ni su hash.
 */

const instanteUTC = z.string().refine(valor => {
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

const identificador = z.string().regex(
  /^[A-Za-z0-9_-]{5,128}$/
);

const enlaceSchema = z.strictObject({
  id: identificador,
  nombre: z.string().min(1).max(120),
  seguimientoId: identificador.nullable(),
  tokenCreadoAt: instanteUTC,
  tokenExpiraAt: instanteUTC.nullable(),
  tokenRevocadoAt: instanteUTC.nullable(),
  estado: z.enum([
    "vigente",
    "vencido",
    "revocado",
    "sin_vigencia",
  ]),
});

const respuestaSchema = z.strictObject({
  ok: z.literal(true),
  enlaces: z.array(enlaceSchema).max(100),
});

export type EnlaceListadoCliente =
  z.infer<typeof enlaceSchema>;

export function leerListadoEnlacesCliente(
  entrada: unknown
): EnlaceListadoCliente[] | null {
  const resultado = respuestaSchema.safeParse(
    entrada
  );

  return resultado.success
    ? resultado.data.enlaces
    : null;
}
