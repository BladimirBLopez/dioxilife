import { pruebasAlimentosHabilitadas } from "@/lib/pruebas-alimentos/activacion";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  evaluarAccesoPublicoPrueba,
} from "@/lib/pruebas-alimentos/puerta-publica";

import {
  obtenerIpVerificadaVercel,
} from "@/lib/pruebas-alimentos/ip-verificada";

import {
  consumidorCuotaDesdeEntorno,
} from "@/lib/pruebas-alimentos/contador-upstash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * BLOQUEO OBLIGATORIO.
 *
 * No cambiar a true sin:
 * - autorización expresa;
 * - migración revisada;
 * - base de datos preparada;
 * - contador distribuido configurado;
 * - comprobación completa de seguridad.
 */
const ACCESO_PUBLICO_HABILITADO = pruebasAlimentosHabilitadas();

type Contexto = {
  params: Promise<{
    token: string;
  }>;
};

function responder(
  status: 404 | 429 | 503,
  mensaje: string,
  reintentarEnSegundos?: number
) {
  const headers: Record<string, string> = {
    "Cache-Control": "private, no-store, max-age=0",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "X-Content-Type-Options": "nosniff",
  };

  if (
    status === 429 &&
    typeof reintentarEnSegundos === "number" &&
    Number.isInteger(reintentarEnSegundos) &&
    reintentarEnSegundos > 0
  ) {
    headers["Retry-After"] = String(
      reintentarEnSegundos
    );
  }

  return NextResponse.json(
    {
      ok: false,
      mensaje,
    },
    {
      status,
      headers,
    }
  );
}

/**
 * Secreto exclusivo para HMAC del limitador.
 * No se crea ni modifica configuración aquí.
 *
 * Se exigirá una cadena hexadecimal aleatoria
 * de 64 caracteres (32 bytes).
 */
function leerSecretoLimitador(): Buffer | null {
  const valor =
    process.env.PRUEBAS_ALIMENTOS_HMAC_SECRET;

  if (
    typeof valor !== "string" ||
    !/^[0-9a-fA-F]{64}$/.test(valor)
  ) {
    return null;
  }

  return Buffer.from(valor, "hex");
}

/**
 * Ruta GET del acceso público.
 *
 * PRIMER BLOQUEO:
 * ACCESO_PUBLICO_HABILITADO sigue en false.
 *
 * SEGUNDO BLOQUEO:
 * buscarPorHash sigue en null.
 *
 * Aunque alguien cambiara el primer bloqueo,
 * no existiría un buscador de clientes activo.
 *
 * Nunca devuelve mediciones ni información
 * del cliente en esta fase.
 */
export async function GET(
  request: NextRequest,
  { params }: Contexto
) {
  const { token } = await params;

  const formatoValido =
    /^[0-9a-f]{64}$/.test(token);

  if (!ACCESO_PUBLICO_HABILITADO) {
    return responder(
      formatoValido ? 503 : 404,
      formatoValido
        ? "El acceso todavía no está habilitado."
        : "Acceso no disponible."
    );
  }

  try {
    const resultado =
      await evaluarAccesoPublicoPrueba({
        token,
        ipVerificada:
          obtenerIpVerificadaVercel(request),
        secreto: leerSecretoLimitador(),
        consumirCuota:
          consumidorCuotaDesdeEntorno(),

        // El buscador se usa solo después del bloqueo.
        buscarPorHash: async (hash) => {
      const { buscarClientePorHash } = await import(
        "@/lib/pruebas-alimentos/buscador-cliente-prisma"
      );

      return buscarClientePorHash(hash);
    },
      });

    if (!resultado.autorizado) {
      if (resultado.motivo === "limite") {
        return responder(
          429,
          "Demasiados intentos. Inténtalo más tarde.",
          resultado.reintentarEnSegundos
        );
      }

      if (resultado.motivo === "acceso_denegado") {
        return responder(
          404,
          "Acceso no disponible."
        );
      }

      return responder(
        503,
        "Acceso temporalmente no disponible."
      );
    }

    const { consultarHistorialCliente } =
      await import(
        "@/lib/pruebas-alimentos/historial-cliente"
      );

    const historial = await consultarHistorialCliente(
      resultado.cliente.id
    );

    const { obtenerAvisosAutorizados } =
      await import("@/lib/pruebas-alimentos/avisos-entrega-servidor");

    const alertas = await obtenerAvisosAutorizados(
      resultado.cliente.id,
      historial.registros
    );

    return NextResponse.json(
      {
        ok: true,
        ...alertas,
        registros: historial.registros,
        pendiente: historial.pendiente,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          "Referrer-Policy": "no-referrer",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch {
    return responder(
      503,
      "Acceso temporalmente no disponible."
    );
  }
}
