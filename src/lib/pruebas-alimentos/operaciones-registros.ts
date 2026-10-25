import type {
  ClientePruebaAutorizado,
} from "./autorizar-acceso";

import {
  iniciarRegistroAlimentoSchema,
  completarRegistroAlimentoSchema,
} from "./validaciones";

/**
 * Preparación de consultas y escrituras.
 *
 * No importa Prisma, no consulta Neon
 * y no realiza modificaciones reales.
 *
 * El clienteId SIEMPRE procede de la identidad
 * previamente autorizada, nunca del formulario.
 */

const ID_VALIDO = /^[A-Za-z0-9_-]{5,128}$/;

function validarId(
  valor: string,
  nombre: string
): string {
  if (
    typeof valor !== "string" ||
    !ID_VALIDO.test(valor)
  ) {
    throw new Error(`${nombre} no válido`);
  }

  return valor;
}

function clienteIdAutorizado(
  cliente: ClientePruebaAutorizado
): string {
  return validarId(cliente.id, "Cliente");
}

/**
 * Futuro historial de un único cliente.
 * La API deberá aplicar este filtro en Prisma.
 */
export function prepararConsultaHistorial(
  cliente: ClientePruebaAutorizado,
  cantidad = 30
) {
  const clienteId = clienteIdAutorizado(cliente);

  if (
    !Number.isInteger(cantidad) ||
    cantidad < 1 ||
    cantidad > 50
  ) {
    throw new Error("Cantidad no permitida");
  }

  return {
    where: {
      clienteId,
    },
    orderBy: [
      { fecha: "desc" as const },
      { createdAt: "desc" as const },
    ],
    take: cantidad,
  };
}

/**
 * Futuro detalle de una prueba.
 * Exige ID del registro y propietario.
 */
export function prepararConsultaDetalle(
  cliente: ClientePruebaAutorizado,
  registroId: string
) {
  return {
    where: {
      id: validarId(registroId, "Registro"),
      clienteId: clienteIdAutorizado(cliente),
    },
  };
}

/**
 * Preparación de la primera medición.
 *
 * Conserva fecha y horas locales como texto
 * validado. La conversión a DateTime se hará
 * posteriormente con una zona horaria definida.
 *
 * Este resultado aún NO es un payload Prisma.
 */
export function prepararRegistroInicial(
  cliente: ClientePruebaAutorizado,
  entrada: unknown
) {
  const clienteId = clienteIdAutorizado(cliente);

  const datos =
    iniciarRegistroAlimentoSchema.parse(entrada);

  return {
    clienteId,
    ...datos,
  };
}

/**
 * Preparación de la segunda medición.
 *
 * La futura API utilizará updateMany con
 * estas condiciones en una sola operación.
 *
 * Debe exigir count === 1 para considerarla
 * completada. count === 0 no autoriza a
 * revelar si el registro pertenece a otro cliente.
 *
 * La hora se conserva como texto local validado
 * hasta definir la conversión de zona horaria.
 */
export function prepararSegundaMedicion(
  cliente: ClientePruebaAutorizado,
  registroId: string,
  entrada: unknown
) {
  const clienteId = clienteIdAutorizado(cliente);

  const datos =
    completarRegistroAlimentoSchema.parse(entrada);

  return {
    where: {
      id: validarId(registroId, "Registro"),
      clienteId,
      glucosaDespues: null,
      horaMedicionDespues: null,
    },
    data: {
      glucosaDespues: datos.glucosaDespues,
      horaMedicionDespues: datos.horaMedicionDespues,
    },
  };
}
