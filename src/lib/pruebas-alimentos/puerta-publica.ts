import {
  resolverClientePruebaPorToken,
  type BuscarAccesoPorHash,
  type ClientePruebaAutorizado,
} from "./autorizar-acceso";

import {
  verificarLimiteAccesoPrueba,
  type ConsumirCuotaAtomica,
} from "./limite-intentos";

/**
 * Encadena las protecciones del acceso público.
 *
 * Orden obligatorio:
 * 1. Comprobar y consumir cuotas.
 * 2. Validar token contra su hash.
 * 3. Comprobar vigencia y revocación.
 * 4. Devolver solo la identidad mínima.
 *
 * No abre conexiones con Neon.
 * No registra datos personales en consola.
 *
 * La futura API deberá proporcionar adaptadores
 * reales y confiables antes de utilizarla.
 */

export type DependenciasPuertaPublica = {
  token: string;
  ipVerificada: string | null;
  secreto: Buffer | null;
  consumirCuota: ConsumirCuotaAtomica | null;
  buscarPorHash: BuscarAccesoPorHash | null;
  ahora?: Date;
};

export type ResultadoPuertaPublica =
  | {
      autorizado: true;
      cliente: ClientePruebaAutorizado;
    }
  | {
      autorizado: false;
      motivo: "acceso_denegado" | "no_disponible";
    }
  | {
      autorizado: false;
      motivo: "limite";
      reintentarEnSegundos: number;
    };

export async function evaluarAccesoPublicoPrueba(
  dependencias: DependenciasPuertaPublica
): Promise<ResultadoPuertaPublica> {
  const limite = await verificarLimiteAccesoPrueba({
    token: dependencias.token,
    ipVerificada: dependencias.ipVerificada,
    secreto: dependencias.secreto,
    consumirCuota: dependencias.consumirCuota,
  });

  if (!limite.permitido) {
    if (limite.estado === "limite") {
      return {
        autorizado: false,
        motivo: "limite",
        reintentarEnSegundos:
          limite.reintentarEnSegundos,
      };
    }

    if (limite.estado === "formato_invalido") {
      return {
        autorizado: false,
        motivo: "acceso_denegado",
      };
    }

    return {
      autorizado: false,
      motivo: "no_disponible",
    };
  }

  if (
    typeof dependencias.buscarPorHash !== "function"
  ) {
    return {
      autorizado: false,
      motivo: "no_disponible",
    };
  }

  try {
    const cliente =
      await resolverClientePruebaPorToken(
        dependencias.token,
        dependencias.buscarPorHash,
        dependencias.ahora
      );

    if (!cliente) {
      return {
        autorizado: false,
        motivo: "acceso_denegado",
      };
    }

    return {
      autorizado: true,
      cliente,
    };
  } catch {
    // No revelar detalles internos de la consulta.
    return {
      autorizado: false,
      motivo: "no_disponible",
    };
  }
}
