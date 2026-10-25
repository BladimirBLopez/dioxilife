import {
  fechaPruebaSchema,
  horaPruebaSchema,
} from "./validaciones";

import {
  prepararRegistroInicial,
  prepararSegundaMedicion,
} from "./operaciones-registros";

import type {
  ClientePruebaAutorizado,
} from "./autorizar-acceso";

/**
 * DioxiLife Bolivia - Pruebas de alimentos.
 *
 * Calendario de referencia: America/La_Paz.
 * Bolivia utiliza UTC-04:00 durante 2026.
 *
 * Estas funciones no dependen del huso horario
 * del servidor ni de la configuración del teléfono.
 *
 * No realizan consultas ni escrituras.
 */

export const ZONA_HORARIA_PRUEBAS = "America/La_Paz";

const DOS_HORAS_MILISEGUNDOS = 120 * 60 * 1000;

/**
 * Fecha de calendario para un campo Prisma @db.Date.
 *
 * Importante: la fecha de calendario se representa
 * a medianoche UTC. Al mostrarla después, se debe
 * utilizar su parte UTC, no convertirla a la hora
 * local del dispositivo.
 */
export function fechaCalendarioParaPrisma(
  fecha: string
): Date {
  const validada = fechaPruebaSchema.parse(fecha);

  const resultado = new Date(
    `${validada}T00:00:00.000Z`
  );

  if (!Number.isFinite(resultado.getTime())) {
    throw new Error("Fecha no válida");
  }

  return resultado;
}

/**
 * Convierte una fecha y hora de Bolivia
 * en un instante UTC para Prisma DateTime.
 *
 * Ejemplo:
 * 2026-10-24 13:00 Bolivia
 * corresponde a 2026-10-24 17:00 UTC.
 */
export function fechaHoraBoliviaParaPrisma(
  fecha: string,
  hora: string
): Date {
  const dia = fechaPruebaSchema.parse(fecha);
  const reloj = horaPruebaSchema.parse(hora);

  const resultado = new Date(
    `${dia}T${reloj}:00.000-04:00`
  );

  if (!Number.isFinite(resultado.getTime())) {
    throw new Error("Fecha u hora no válida");
  }

  return resultado;
}

/**
 * Momento sugerido para la segunda medición:
 * exactamente 120 minutos después del inicio
 * de la comida.
 *
 * No programa notificaciones ni envía mensajes.
 */
export function momentoSegundaMedicionSugerido(
  fecha: string,
  horaComida: string
): Date {
  const inicio = fechaHoraBoliviaParaPrisma(
    fecha,
    horaComida
  );

  return new Date(
    inicio.getTime() + DOS_HORAS_MILISEGUNDOS
  );
}

/**
 * Convierte el plan de registro inicial
 * en datos con fechas de tipo Date.
 *
 * La propiedad del cliente y los campos
 * se validan primero por operaciones-registros.
 *
 * Todavía no se guarda nada en Prisma.
 */
export function prepararInicioConFechasBolivia(
  cliente: ClientePruebaAutorizado,
  entrada: unknown
) {
  const plan = prepararRegistroInicial(
    cliente,
    entrada
  );

  return {
    ...plan,
    fecha: fechaCalendarioParaPrisma(plan.fecha),
    horaComida: fechaHoraBoliviaParaPrisma(
      plan.fecha,
      plan.horaComida
    ),
  };
}

/**
 * Convierte la segunda medición a DateTime.
 *
 * Se exige explícitamente su fecha real:
 * no se supone que siempre sea el mismo día
 * de la comida ni el día siguiente.
 *
 * horaComidaRegistrada debe proceder del registro
 * obtenido por la futura API, con su propiedad
 * previamente verificada.
 *
 * Conserva las condiciones de actualización
 * del plan: ID, cliente autorizado y campos
 * posteriores todavía vacíos.
 *
 * Todavía no ejecuta updateMany ni consulta Neon.
 */
export function prepararFinalizacionConFechaBolivia(
  cliente: ClientePruebaAutorizado,
  registroId: string,
  entrada: unknown,
  fechaMedicionReal: string,
  horaComidaRegistrada: Date
) {
  if (
    !(horaComidaRegistrada instanceof Date) ||
    !Number.isFinite(horaComidaRegistrada.getTime())
  ) {
    throw new Error(
      "Hora original de comida no válida"
    );
  }

  const plan = prepararSegundaMedicion(
    cliente,
    registroId,
    entrada
  );

  const medicion = fechaHoraBoliviaParaPrisma(
    fechaMedicionReal,
    plan.data.horaMedicionDespues
  );

  if (
    medicion.getTime() <=
    horaComidaRegistrada.getTime()
  ) {
    throw new Error(
      "La medición posterior debe ser después de comer"
    );
  }

  return {
    where: plan.where,
    data: {
      ...plan.data,
      horaMedicionDespues: medicion,
    },
  };
}
