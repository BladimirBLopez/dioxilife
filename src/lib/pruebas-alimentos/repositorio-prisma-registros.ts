import {
  PruebaPendienteExistente,
} from "./error-prueba-pendiente";

import {
  crearIdInicioIdempotente,
} from "./idempotencia-inicio";

import type {
  PlanInicioAlimento,
  PlanFinalizacionAlimento,
  RepositorioPruebaAlimentos,
} from "./servicio-registros";

/**
 * Adaptador para RegistroPruebaAlimento.
 *
 * No importa PrismaClient.
 * No abre conexiones.
 * No usa variables de entorno.
 * No realiza migraciones.
 *
 * La futura API deberá proporcionar el delegado
 * Prisma del modelo correspondiente.
 */

type FiltroPropiedad = {
  id: string;
  clienteId: string;
};

/**
 * Filtro para encontrar una medición pendiente.
 *
 * No sustituye la restricción de unicidad
 * necesaria en PostgreSQL.
 */
type FiltroPendiente = {
  clienteId: string;
  glucosaDespues: null;
  horaMedicionDespues: null;
};

type RegistroSeleccionado = {
  id: string;
  clienteId: string;
  horaComida: Date;
  glucosaDespues: unknown;
  horaMedicionDespues: Date | null;
};

export type DelegadoPrismaRegistros = {
  create: (argumentos: {
    data: PlanInicioAlimento & {
      id: string;
    };
    select: {
      id: true;
    };
  }) => Promise<{
    id: string;
  }>;

  findFirst: (argumentos: {
    where: FiltroPropiedad | FiltroPendiente;
    select: {
      id: true;
      clienteId: true;
      horaComida: true;
      glucosaDespues: true;
      horaMedicionDespues: true;
    };
  }) => Promise<RegistroSeleccionado | null>;

  updateMany: (argumentos: {
    where: PlanFinalizacionAlimento["where"];
    data: PlanFinalizacionAlimento["data"];
  }) => Promise<{
    count: number;
  }>;
};

/**
 * Solo construye funciones.
 * No ejecuta consultas hasta que se invoque
 * una operación del repositorio.
 */
export function crearRepositorioPruebaAlimentosPrisma(
  delegado: DelegadoPrismaRegistros,
  secretoHex: string | undefined =
    process.env.PRUEBAS_ALIMENTOS_HMAC_SECRET
): RepositorioPruebaAlimentos {
  if (
    !delegado ||
    typeof delegado.create !== "function" ||
    typeof delegado.findFirst !== "function" ||
    typeof delegado.updateMany !== "function"
  ) {
    throw new Error("Repositorio no disponible");
  }

  return {
    async crear(datos) {
      const id = crearIdInicioIdempotente(
        datos,
        secretoHex
      );

      /**
       * Evita nuevos inicios secuenciales
       * mientras exista una prueba pendiente.
       *
       * La comprobación NO garantiza unicidad
       * ante dos solicitudes concurrentes.
       */
      const pendiente = await delegado.findFirst({
        where: {
          clienteId: datos.clienteId,
          glucosaDespues: null,
          horaMedicionDespues: null,
        },
        select: {
          id: true,
          clienteId: true,
          horaComida: true,
          glucosaDespues: true,
          horaMedicionDespues: true,
        },
      });

      if (pendiente) {
        if (
          typeof pendiente.id !== "string" ||
          pendiente.clienteId !== datos.clienteId ||
          pendiente.glucosaDespues !== null ||
          pendiente.horaMedicionDespues !== null
        ) {
          throw new Error(
            "Prueba pendiente no válida"
          );
        }

        // Reintento idéntico de una prueba pendiente.
        if (pendiente.id === id) {
          return {id};
        }

        // El cliente debe completar la primera.
        throw new PruebaPendienteExistente();
      }

      try {
        const resultado = await delegado.create({
          data: {
            ...datos,
            id,
          },
          select: {
            id: true,
          },
        });

        if (
          !resultado ||
          resultado.id !== id
        ) {
          throw new Error("Creación no válida");
        }

        return {id};
      } catch (error) {
        /**
         * P2002 significa una colisión de unicidad.
         *
         * Ante un reintento idéntico, PostgreSQL
         * habrá conservado el primer registro.
         *
         * Solo reutilizamos el ID si pertenece
         * al mismo cliente y continúa pendiente.
         *
         * Otros errores no se ocultan.
         */
        const esConflicto =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002";

        if (!esConflicto) {
          throw error;
        }

        const existente = await delegado.findFirst({
          where: {
            id,
            clienteId: datos.clienteId,
          },
          select: {
            id: true,
            clienteId: true,
            horaComida: true,
            glucosaDespues: true,
            horaMedicionDespues: true,
          },
        });

        if (
          existente &&
          existente.id === id &&
          existente.clienteId === datos.clienteId &&
          existente.glucosaDespues === null &&
          existente.horaMedicionDespues === null
        ) {
          return {id};
        }

        /**
         * Si el conflicto P2002 procede del índice
         * único parcial de pendientes, puede existir
         * otro registro del mismo cliente con un ID
         * diferente.
         *
         * Consultamos únicamente los pendientes
         * del cliente previamente autorizado.
         *
         * Si se encuentra uno diferente, el flujo
         * público responderá 409 sin revelar datos.
         *
         * El índice único parcial en Neon todavía
         * NO está aplicado.
         */
        const pendienteTrasConflicto =
          await delegado.findFirst({
            where: {
              clienteId: datos.clienteId,
              glucosaDespues: null,
              horaMedicionDespues: null,
            },
            select: {
              id: true,
              clienteId: true,
              horaComida: true,
              glucosaDespues: true,
              horaMedicionDespues: true,
            },
          });

        if (
          pendienteTrasConflicto &&
          typeof pendienteTrasConflicto.id === "string" &&
          pendienteTrasConflicto.id !== id &&
          pendienteTrasConflicto.clienteId === datos.clienteId &&
          pendienteTrasConflicto.glucosaDespues === null &&
          pendienteTrasConflicto.horaMedicionDespues === null
        ) {
          throw new PruebaPendienteExistente();
        }

        // Otros conflictos mantienen el error original.
        throw error;
      }
    },

    async encontrarPropio(where) {
      const resultado = await delegado.findFirst({
        where: {
          id: where.id,
          clienteId: where.clienteId,
        },
        select: {
          id: true,
          clienteId: true,
          horaComida: true,
          glucosaDespues: true,
          horaMedicionDespues: true,
        },
      });

      if (
        !resultado ||
        resultado.id !== where.id ||
        resultado.clienteId !== where.clienteId
      ) {
        return null;
      }

      return resultado;
    },

    async completarAtomico(plan) {
      /**
       * Una sola actualización condicional:
       *
       * ID del registro + ID del cliente
       * + campos de segunda medición en null.
       *
       * El servicio superior comprueba count=1.
       */
      const resultado = await delegado.updateMany({
        where: {
          id: plan.where.id,
          clienteId: plan.where.clienteId,
          glucosaDespues: null,
          horaMedicionDespues: null,
        },
        data: {
          glucosaDespues:
            plan.data.glucosaDespues,
          horaMedicionDespues:
            plan.data.horaMedicionDespues,
        },
      });

      if (
        !resultado ||
        !Number.isInteger(resultado.count) ||
        resultado.count < 0 ||
        resultado.count > 1
      ) {
        throw new Error("Actualización no válida");
      }

      return {
        count: resultado.count,
      };
    },
  };
}
