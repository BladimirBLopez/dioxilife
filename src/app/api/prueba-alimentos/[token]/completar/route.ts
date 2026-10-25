import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ejecutarFinalizacionSegura,
  type ResultadoFlujoEscritura,
} from "@/lib/pruebas-alimentos/flujo-escrituras";

import {
  obtenerIpVerificadaVercel,
} from "@/lib/pruebas-alimentos/ip-verificada";

import {
  consumidorCuotaDesdeEntorno,
} from "@/lib/pruebas-alimentos/contador-upstash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DioxiLife Bolivia - Pruebas de alimentos.
 *
 * Ruta: completar.
 *
 * NO ACTIVAR SIN AUTORIZACION EXPRESA.
 *
 * La conexión de datos y los controles
 * reales de producción siguen pendientes.
 */
const ESCRITURAS_HABILITADAS = false;

type Contexto = {
  params: Promise<{
    token: string;
  }>;
};

function cabecerasSeguras() {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag":
      "noindex, nofollow, noarchive",
    "X-Content-Type-Options": "nosniff",
  };
}

function responderBloqueado(token: string) {
  const valido =
    /^[0-9a-f]{64}$/.test(token);

  return NextResponse.json(
    {
      ok: false,
      mensaje: valido
        ? "El registro de alimentos todavía no está habilitado."
        : "Acceso no disponible.",
    },
    {
      status: valido ? 503 : 404,
      headers: cabecerasSeguras(),
    }
  );
}

/**
 * Secreto privado del limitador.
 *
 * Solo se utiliza si la API llega a
 * habilitarse en una etapa posterior.
 *
 * No imprimir ni devolver su valor.
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
 * Traduce los posibles resultados
 * del flujo a respuestas HTTP.
 *
 * No envía datos personales ni glucosa.
 */
function responderResultado(
  resultado: ResultadoFlujoEscritura
) {
  if (resultado.estado === "registrado") {
    return NextResponse.json(
      {
        ok: true,
        registroId: resultado.registroId,
      },
      {
        status: 200,
        headers: cabecerasSeguras(),
      }
    );
  }

  if (resultado.estado === "limite") {
    return NextResponse.json(
      {
        ok: false,
        mensaje:
          "Demasiados intentos. Inténtalo más tarde.",
      },
      {
        status: 429,
        headers: {
          ...cabecerasSeguras(),
          "Retry-After": String(
            resultado.reintentarEnSegundos
          ),
        },
      }
    );
  }

  if (resultado.estado === "solicitud_invalida") {
    return NextResponse.json(
      {
        ok: false,
        mensaje: "Solicitud no válida.",
      },
      {
        status: 400,
        headers: cabecerasSeguras(),
      }
    );
  }

  if (
    resultado.estado === "acceso_denegado" ||
    resultado.estado === "registro_no_disponible"
  ) {
    return NextResponse.json(
      {
        ok: false,
        mensaje: "Acceso no disponible.",
      },
      {
        status: 404,
        headers: cabecerasSeguras(),
      }
    );
  }

  return NextResponse.json(
    {
      ok: false,
      mensaje: "Servicio no disponible.",
    },
    {
      status: 503,
      headers: cabecerasSeguras(),
    }
  );
}

/**
 * DOBLE PROTECCION:
 *
 * 1. ESCRITURAS_HABILITADAS es false.
 *
 * 2. buscarPorHash y repositorio son null.
 *
 * Por tanto, aunque alguien modificara
 * accidentalmente el primer bloqueo,
 * no existiría una conexión de datos
 * capaz de guardar mediciones.
 */
export async function POST(
  solicitud: NextRequest,
  { params }: Contexto
) {
  const { token } = await params;

  if (!ESCRITURAS_HABILITADAS) {
    return responderBloqueado(token);
  }

  try {
    const resultado = await ejecutarFinalizacionSegura(
      solicitud,
      {
        token,
        ipVerificada:
          obtenerIpVerificadaVercel(solicitud),
        secreto: leerSecretoLimitador(),
        consumirCuota:
          consumidorCuotaDesdeEntorno(),

        // No conectar Neon todavía.
        buscarPorHash: async (hash) => {
      const { buscarClientePorHash } = await import(
        "@/lib/pruebas-alimentos/buscador-cliente-prisma"
      );

      return buscarClientePorHash(hash);
    },
        repositorio: (
      await import(
        "@/lib/pruebas-alimentos/repositorio-prisma-real"
      )
    ).obtenerRepositorioPruebaAlimentos(),
      }
    );

    return responderResultado(resultado);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        mensaje: "Servicio no disponible.",
      },
      {
        status: 503,
        headers: cabecerasSeguras(),
      }
    );
  }
}
