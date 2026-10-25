import { z } from "zod";

import {
  iniciarRegistroAlimentoSchema,
  fechaPruebaSchema,
  horaPruebaSchema,
  glucosaPruebaSchema,
  calcularHoraSegundaMedicion,
} from "@/lib/pruebas-alimentos/validaciones";

/**
 * Solo prepara datos para las API existentes.
 *
 * Nunca admite clienteId ni tokenAccesoHash
 * como campos de formulario.
 */

export type CamposInicioCliente = {
  fecha: string;
  glucosaAyunas: string;
  glucosaAntes: string;
  alimento: string;
  cantidad: string;
  horaComida: string;
  observacion: string;
};

export type CamposFinalCliente = {
  fechaMedicionReal: string;
  horaMedicionDespues: string;
  glucosaDespues: string;
};

function convertirGlucosa(valor: string): number {
  const normalizado = valor.trim().replace(",", ".");

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizado)) {
    return Number.NaN;
  }

  return Number(normalizado);
}

export function prepararInicioCliente(
  campos: CamposInicioCliente
) {
  const ayunas = campos.glucosaAyunas.trim();

  const resultado =
    iniciarRegistroAlimentoSchema.safeParse({
      fecha: campos.fecha,
      glucosaAyunas: ayunas
        ? convertirGlucosa(ayunas)
        : null,
      glucosaAntes:
        convertirGlucosa(campos.glucosaAntes),
      alimento: campos.alimento.trim(),
      cantidad: campos.cantidad.trim() || undefined,
      horaComida: campos.horaComida,
      observacion:
        campos.observacion.trim() || undefined,
    });

  return resultado.success
    ? resultado.data
    : null;
}

const completarSchema = z.strictObject({
  registroId: z.string().regex(
    /^[A-Za-z0-9_-]{5,128}$/
  ),
  fechaMedicionReal: fechaPruebaSchema,
  horaMedicionDespues: horaPruebaSchema,
  glucosaDespues: glucosaPruebaSchema,
});

export function prepararFinalCliente(
  registroId: string,
  campos: CamposFinalCliente
) {
  const resultado = completarSchema.safeParse({
    registroId,
    fechaMedicionReal: campos.fechaMedicionReal,
    horaMedicionDespues:
      campos.horaMedicionDespues,
    glucosaDespues:
      convertirGlucosa(campos.glucosaDespues),
  });

  return resultado.success
    ? resultado.data
    : null;
}

export function obtenerSugerenciaCliente(
  fecha: string,
  horaComida: string
) {
  if (
    !fechaPruebaSchema.safeParse(fecha).success ||
    !horaPruebaSchema.safeParse(horaComida).success
  ) {
    return null;
  }

  return calcularHoraSegundaMedicion(
    fecha,
    horaComida
  );
}
