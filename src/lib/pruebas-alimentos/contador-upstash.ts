import type {
  ConsumirCuotaAtomica,
} from "./limite-intentos";

/**
 * Adaptador opcional para Upstash Redis REST.
 *
 * No abre conexiones al importarse.
 * Sin configuración no entrega un consumidor.
 *
 * La futura API deberá utilizar el adaptador
 * solamente después de verificar su entorno.
 */

type Configuracion = {
  url: string | null;
  token: string | null;
  fetcher?: typeof fetch;
};

/**
 * Script ejecutado atómicamente por Redis.
 *
 * INCR + vencimiento + comprobación de cuota
 * ocurren dentro de una sola ejecución Lua.
 */
const SCRIPT_CUOTA = `
local cantidad = redis.call("INCR", KEYS[1])

if cantidad == 1 then
  redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1]))
end

local restante = redis.call("TTL", KEYS[1])

if restante < 1 then
  redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1]))
  restante = tonumber(ARGV[1])
end

if cantidad > tonumber(ARGV[2]) then
  return {0, restante}
end

return {1, restante}
`;

const CLAVE_VALIDA =
  /^pa:(ip|token):[0-9a-f]{64}$/;

function endpointPermitido(
  valor: string
): string | null {
  try {
    const destino = new URL(valor);

    if (
      destino.protocol !== "https:" ||
      !destino.hostname.endsWith(".upstash.io") ||
      destino.hostname === ".upstash.io" ||
      destino.username ||
      destino.password ||
      destino.port ||
      destino.pathname !== "/" ||
      destino.search ||
      destino.hash
    ) {
      return null;
    }

    return destino.origin;
  } catch {
    return null;
  }
}

export function crearConsumidorCuotaUpstash(
  configuracion: Configuracion
): ConsumirCuotaAtomica | null {
  const { url, token } = configuracion;

  if (
    typeof url !== "string" ||
    typeof token !== "string" ||
    token.length < 16 ||
    token.trim() !== token
  ) {
    return null;
  }

  const endpoint = endpointPermitido(url);

  if (!endpoint) {
    return null;
  }

  const enviar = configuracion.fetcher ?? fetch;

  return async (solicitud) => {
    const claveValida =
      CLAVE_VALIDA.exec(solicitud.clave);

    if (
      !claveValida ||
      solicitud.ventanaSegundos !== 60 ||
      (
        claveValida[1] === "ip" &&
        solicitud.limite !== 60
      ) ||
      (
        claveValida[1] === "token" &&
        solicitud.limite !== 20
      )
    ) {
      throw new Error("Cuota no permitida");
    }

    try {
      const respuesta = await enviar(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify([
          "EVAL",
          SCRIPT_CUOTA,
          "1",
          solicitud.clave,
          String(solicitud.ventanaSegundos),
          String(solicitud.limite),
        ]),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(3500),
      });

      if (!respuesta.ok) {
        throw new Error("Respuesta no disponible");
      }

      const cuerpo: unknown = await respuesta.json();

      if (
        typeof cuerpo !== "object" ||
        cuerpo === null ||
        !("result" in cuerpo)
      ) {
        throw new Error("Respuesta inválida");
      }

      const resultado = cuerpo.result;

      if (
        !Array.isArray(resultado) ||
        resultado.length !== 2 ||
        !Number.isInteger(resultado[0]) ||
        !Number.isInteger(resultado[1]) ||
        ![0, 1].includes(resultado[0]) ||
        resultado[1] < 1 ||
        resultado[1] > 60
      ) {
        throw new Error("Resultado inválido");
      }

      return {
        permitida: resultado[0] === 1,
        reintentarEnSegundos:
          resultado[0] === 1 ? 0 : resultado[1],
      };
    } catch {
      // No mostrar URLs, credenciales o claves.
      // La puerta pública interpretará este fallo
      // como servicio no disponible.
      throw new Error(
        "Servicio de limitación no disponible"
      );
    }
  };
}

/**
 * Preparado para una futura integración.
 *
 * No configurar ni activar estas variables aún:
 * UPSTASH_REDIS_REST_URL
 * UPSTASH_REDIS_REST_TOKEN
 */
export function consumidorCuotaDesdeEntorno():
  ConsumirCuotaAtomica | null {
  return crearConsumidorCuotaUpstash({
    url: process.env.UPSTASH_REDIS_REST_URL ?? null,
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? null,
  });
}
