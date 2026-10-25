import {
  PruebaPendienteExistente,
} from "./error-prueba-pendiente";

import {
  evaluarAccesoPublicoPrueba,
  type DependenciasPuertaPublica,
} from "./puerta-publica";

import type {
  ClientePruebaAutorizado,
} from "./autorizar-acceso";

import {
  SolicitudPublicaInvalida,
  leerSolicitudInicioPrueba,
  leerSolicitudCompletarPrueba,
} from "./solicitudes-publicas";

import {
  iniciarPruebaAlimento,
  completarPruebaAlimento,
  type RepositorioPruebaAlimentos,
} from "./servicio-registros";

/**
 * DioxiLife Bolivia - Pruebas de alimentos.
 *
 * Coordina la seguridad de futuras escrituras.
 *
 * No conecta Redis ni Neon por sí mismo.
 * No activa ninguna ruta pública.
 */

export type DependenciasFlujoEscritura =
  DependenciasPuertaPublica & {
    repositorio: RepositorioPruebaAlimentos | null;
  };

export type ResultadoFlujoEscritura =
  | {
      estado: "registrado";
      registroId: string;
    }
  | {
      estado: "acceso_denegado";
    }
  | {
      estado: "no_disponible";
    }
  | {
      estado: "solicitud_invalida";
    }
  | {
      estado: "registro_no_disponible";
    }
  | {
      estado: "pendiente";
    }
  | {
      estado: "limite";
      reintentarEnSegundos: number;
    };

type AccionEscritura = (
  cliente: ClientePruebaAutorizado,
  repositorio: RepositorioPruebaAlimentos
) => Promise<ResultadoFlujoEscritura>;

/**
 * Orden:
 * 1. Limitación de solicitudes.
 * 2. Autorización del enlace.
 * 3. Disponibilidad del repositorio.
 * 4. Validación del formulario.
 * 5. Escritura condicionada al propietario.
 *
 * Los errores internos se devuelven sin
 * detalles de infraestructura o datos médicos.
 */
async function ejecutarFlujo(
  dependencias: DependenciasFlujoEscritura,
  accion: AccionEscritura
): Promise<ResultadoFlujoEscritura> {
  try {
    const acceso = await evaluarAccesoPublicoPrueba(
      dependencias
    );

    if (!acceso.autorizado) {
      if (acceso.motivo === "limite") {
        return {
          estado: "limite",
          reintentarEnSegundos:
            acceso.reintentarEnSegundos,
        };
      }

      if (acceso.motivo === "acceso_denegado") {
        return {
          estado: "acceso_denegado",
        };
      }

      return {
        estado: "no_disponible",
      };
    }

    if (!dependencias.repositorio) {
      return {
        estado: "no_disponible",
      };
    }

    return await accion(
      acceso.cliente,
      dependencias.repositorio
    );
  } catch (error) {
    if (error instanceof PruebaPendienteExistente) {
      return {
        estado: "pendiente",
      };
    }

    if (
      error instanceof SolicitudPublicaInvalida
    ) {
      return {
        estado: "solicitud_invalida",
      };
    }

    return {
      estado: "no_disponible",
    };
  }
}

/**
 * Iniciar prueba.
 *
 * El clienteId procede exclusivamente
 * del enlace previamente autorizado.
 */
export async function ejecutarInicioSeguro(
  solicitud: Request,
  dependencias: DependenciasFlujoEscritura
): Promise<ResultadoFlujoEscritura> {
  return ejecutarFlujo(
    dependencias,
    async (cliente, repositorio) => {
      const datos = await leerSolicitudInicioPrueba(
        solicitud
      );

      const resultado = await iniciarPruebaAlimento(
        cliente,
        datos,
        repositorio
      );

      return {
        estado: "registrado",
        registroId: resultado.registroId,
      };
    }
  );
}

/**
 * Completar prueba.
 *
 * La propiedad se comprueba al buscar
 * el registro y se exige nuevamente
 * durante la actualización condicional.
 */
export async function ejecutarFinalizacionSegura(
  solicitud: Request,
  dependencias: DependenciasFlujoEscritura
): Promise<ResultadoFlujoEscritura> {
  return ejecutarFlujo(
    dependencias,
    async (cliente, repositorio) => {
      const datos =
        await leerSolicitudCompletarPrueba(
          solicitud
        );

      const {
        registroId,
        ...medicion
      } = datos;

      const resultado =
        await completarPruebaAlimento(
          cliente,
          registroId,
          medicion,
          repositorio
        );

      if (!resultado.ok) {
        return {
          estado: "registro_no_disponible",
        };
      }

      return {
        estado: "registrado",
        registroId: resultado.registroId,
      };
    }
  );
}
