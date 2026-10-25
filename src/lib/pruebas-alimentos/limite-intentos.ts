import { createHmac } from "node:crypto";
import { isIP } from "node:net";

/**
 * Contrato para un limitador compartido.
 *
 * Su implementación real DEBE hacer en una sola
 * operación atómica:
 *
 * - comprobar la cuota;
 * - consumir un intento si corresponde;
 * - conservar el vencimiento de la ventana.
 *
 * No es suficiente leer y después incrementar.
 * No utilizar Map ni variables globales en producción.
 */

export type SolicitudCuota = {
  clave: string;
  limite: number;
  ventanaSegundos: number;
};

export type RespuestaCuota = {
  permitida: boolean;
  reintentarEnSegundos: number;
};

export type ConsumirCuotaAtomica = (
  solicitud: SolicitudCuota
) => Promise<RespuestaCuota>;

export type ResultadoLimite =
  | {
      permitido: true;
      estado: "permitido";
    }
  | {
      permitido: false;
      estado: "limite";
      reintentarEnSegundos: number;
    }
  | {
      permitido: false;
      estado: "no_disponible";
    }
  | {
      permitido: false;
      estado: "formato_invalido";
    };

export type OpcionesLimite = {
  token: string;

  /**
   * IP obtenida de un proxy previamente verificado.
   * No pasar directamente una cabecera suministrada
   * por el cliente sin verificar su procedencia.
   */
  ipVerificada: string | null;

  /**
   * Clave privada del servidor, independiente
   * de los tokens de acceso.
   *
   * Se proporcionará mediante configuración segura
   * cuando el limitador real esté habilitado.
   */
  secreto: Buffer | null;

  /**
   * Adaptador distribuido.
   * Si no existe, se rechaza el acceso.
   */
  consumirCuota: ConsumirCuotaAtomica | null;
};

const VENTANA_SEGUNDOS = 60;
const MAXIMO_IP = 60;
const MAXIMO_TOKEN = 20;

const TOKEN_VALIDO = /^[0-9a-f]{64}$/;

function clavePrivada(
  categoria: "ip" | "token",
  valor: string,
  secreto: Buffer
): string {
  const huella = createHmac("sha256", secreto)
    .update(categoria, "utf8")
    .update("\0", "utf8")
    .update(valor, "utf8")
    .digest("hex");

  return `pa:${categoria}:${huella}`;
}

async function comprobarCuota(
  consumir: ConsumirCuotaAtomica,
  solicitud: SolicitudCuota
): Promise<ResultadoLimite> {
  try {
    const respuesta = await consumir(solicitud);

    if (
      !respuesta ||
      typeof respuesta.permitida !== "boolean" ||
      !Number.isInteger(
        respuesta.reintentarEnSegundos
      ) ||
      respuesta.reintentarEnSegundos < 0 ||
      (
        !respuesta.permitida &&
        respuesta.reintentarEnSegundos === 0
      )
    ) {
      return {
        permitido: false,
        estado: "no_disponible",
      };
    }

    if (!respuesta.permitida) {
      return {
        permitido: false,
        estado: "limite",
        reintentarEnSegundos:
          respuesta.reintentarEnSegundos,
      };
    }

    return {
      permitido: true,
      estado: "permitido",
    };
  } catch {
    return {
      permitido: false,
      estado: "no_disponible",
    };
  }
}

/**
 * Se deberán aplicar ambos límites antes
 * de consultar registros médicos.
 *
 * Sin adaptador distribuido, IP confiable o
 * secreto suficiente, la respuesta es cerrada.
 */
export async function verificarLimiteAccesoPrueba(
  opciones: OpcionesLimite
): Promise<ResultadoLimite> {
  const {
    token,
    ipVerificada,
    secreto,
    consumirCuota,
  } = opciones;

  if (
    !ipVerificada ||
    isIP(ipVerificada) === 0 ||
    !Buffer.isBuffer(secreto) ||
    secreto.length < 32 ||
    typeof consumirCuota !== "function"
  ) {
    return {
      permitido: false,
      estado: "no_disponible",
    };
  }

  const resultadoIP = await comprobarCuota(
    consumirCuota,
    {
      clave: clavePrivada(
        "ip",
        ipVerificada,
        secreto
      ),
      limite: MAXIMO_IP,
      ventanaSegundos: VENTANA_SEGUNDOS,
    }
  );

  if (!resultadoIP.permitido) {
    return resultadoIP;
  }

  // La cuota por IP se aplica incluso
  // a tokens mal formados.
  if (
    typeof token !== "string" ||
    !TOKEN_VALIDO.test(token)
  ) {
    return {
      permitido: false,
      estado: "formato_invalido",
    };
  }

  const resultadoToken = await comprobarCuota(
    consumirCuota,
    {
      clave: clavePrivada(
        "token",
        token,
        secreto
      ),
      limite: MAXIMO_TOKEN,
      ventanaSegundos: VENTANA_SEGUNDOS,
    }
  );

  return resultadoToken;
}
