import { z } from "zod";

import type {
  ClientePruebaAutorizado,
} from "./autorizar-acceso";

import {
  prepararConsultaDetalle,
} from "./operaciones-registros";

import {
  prepararInicioConFechasBolivia,
  prepararFinalizacionConFechaBolivia,
} from "./fechas-bolivia";

import {
  fechaPruebaSchema,
  horaPruebaSchema,
  glucosaPruebaSchema,
} from "./validaciones";

/**
 * Servicio de Pruebas de alimentos.
 *
 * No importa Prisma ni consulta Neon.
 *
 * Para producción, la futura API deberá:
 * 1. Verificar el enlace privado.
 * 2. Obtener el cliente autorizado.
 * 3. Aplicar el límite de solicitudes.
 * 4. Proporcionar un repositorio seguro.
 *
 * No aceptar clienteId desde el cuerpo HTTP.
 */

export type PlanInicioAlimento = ReturnType<
  typeof prepararInicioConFechasBolivia
>;

export type PlanFinalizacionAlimento = ReturnType<
  typeof prepararFinalizacionConFechaBolivia
>;

type RegistroPropio = {
  id: string;
  clienteId: string;
  horaComida: Date;
  glucosaDespues: unknown;
  horaMedicionDespues: Date | null;
};

/**
 * Contrato para el futuro adaptador Prisma.
 *
 * completarAtomico deberá ejecutarse mediante
 * una actualización condicional indivisible.
 * Es obligatorio comprobar el count devuelto.
 */
export type RepositorioPruebaAlimentos = {
  crear: (
    datos: PlanInicioAlimento
  ) => Promise<{ id: string }>;

  encontrarPropio: (
    where: {
      id: string;
      clienteId: string;
    }
  ) => Promise<RegistroPropio | null>;

  completarAtomico: (
    plan: PlanFinalizacionAlimento
  ) => Promise<{ count: number }>;
};

const segundaMedicionSchema = z.strictObject({
  fechaMedicionReal: fechaPruebaSchema,
  horaMedicionDespues: horaPruebaSchema,
  glucosaDespues: glucosaPruebaSchema,
});

type ResultadoFinalizacion =
  | {
      ok: true;
      registroId: string;
    }
  | {
      ok: false;
      motivo: "registro_no_disponible";
    };

/**
 * Primera etapa: registra los datos iniciales
 * mediante el repositorio proporcionado.
 *
 * La función no genera identidades ni enlaces.
 */
export async function iniciarPruebaAlimento(
  cliente: ClientePruebaAutorizado,
  entrada: unknown,
  repositorio: RepositorioPruebaAlimentos
): Promise<{ registroId: string }> {
  const datos = prepararInicioConFechasBolivia(
    cliente,
    entrada
  );

  const creado = await repositorio.crear(datos);

  if (
    !creado ||
    typeof creado.id !== "string"
  ) {
    throw new Error(
      "Respuesta de registro no válida"
    );
  }

  // Validar formato sin aceptar ID del navegador.
  prepararConsultaDetalle(cliente, creado.id);

  return {
    registroId: creado.id,
  };
}

/**
 * Segunda etapa: completa una prueba pendiente.
 *
 * La búsqueda exige simultáneamente:
 * - ID del registro;
 * - ID del cliente autorizado.
 *
 * La actualización vuelve a exigir:
 * - ID del registro;
 * - ID del cliente;
 * - glucosaDespues null;
 * - horaMedicionDespues null.
 *
 * Así se evita la sobrescritura incluso ante
 * solicitudes simultáneas, siempre que el
 * repositorio implemente la operación atómica.
 */
export async function completarPruebaAlimento(
  cliente: ClientePruebaAutorizado,
  registroId: string,
  entrada: unknown,
  repositorio: RepositorioPruebaAlimentos
): Promise<ResultadoFinalizacion> {
  const datos = segundaMedicionSchema.parse(
    entrada
  );

  const consulta = prepararConsultaDetalle(
    cliente,
    registroId
  );

  const registro = await repositorio.encontrarPropio(
    consulta.where
  );

  // No distinguir entre inexistente y ajeno.
  if (
    !registro ||
    registro.id !== consulta.where.id ||
    registro.clienteId !== consulta.where.clienteId ||
    registro.glucosaDespues !== null ||
    registro.horaMedicionDespues !== null
  ) {
    return {
      ok: false,
      motivo: "registro_no_disponible",
    };
  }

  const plan = prepararFinalizacionConFechaBolivia(
    cliente,
    registroId,
    {
      glucosaDespues: datos.glucosaDespues,
      horaMedicionDespues:
        datos.horaMedicionDespues,
    },
    datos.fechaMedicionReal,
    registro.horaComida
  );

  const respuesta =
    await repositorio.completarAtomico(plan);

  if (
    !respuesta ||
    !Number.isInteger(respuesta.count)
  ) {
    throw new Error(
      "Respuesta de actualización no válida"
    );
  }

  if (respuesta.count === 0) {
    return {
      ok: false,
      motivo: "registro_no_disponible",
    };
  }

  if (respuesta.count !== 1) {
    throw new Error(
      "Actualización de registros inesperada"
    );
  }

  return {
    ok: true,
    registroId,
  };
}
