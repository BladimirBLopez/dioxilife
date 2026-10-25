import {
  NextRequest,
  NextResponse,
} from "next/server";


import {
  listarEnlacesAdministrativos,
} from "@/lib/pruebas-alimentos/listado-enlaces-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * No activar sin autorización,
 * revisión de seguridad y pruebas reales.
 */
const LISTADO_ENLACES_ADMIN_HABILITADO = false;

const CABECERAS_PRIVADAS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
};

function responderError(
  status: number,
  mensaje: string
) {
  return NextResponse.json(
    {
      ok: false,
      mensaje,
    },
    {
      status,
      headers: CABECERAS_PRIVADAS,
    }
  );
}

function origenLecturaPermitido(
  request: NextRequest
): boolean {
  const contexto = request.headers.get(
    "sec-fetch-site"
  );

  if (
    contexto !== null &&
    contexto !== "same-origin" &&
    contexto !== "none"
  ) {
    return false;
  }

  const origen = request.headers.get("origin");

  if (origen === null) {
    return true;
  }

  try {
    const recibido = new URL(origen);
    const esperado = new URL(request.url);

    return (
      recibido.origin === origen &&
      recibido.origin === esperado.origin &&
      !recibido.username &&
      !recibido.password &&
      (
        recibido.protocol === "https:" ||
        recibido.protocol === "http:"
      )
    );
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest
) {
  try {
    if (!LISTADO_ENLACES_ADMIN_HABILITADO) {
      return responderError(
        503,
        "El listado todavía no está habilitado."
      );
    }

    const { obtenerAdminActual } = await import("@/lib/admin-auth");

    const administrador =
      await obtenerAdminActual();

    if (!administrador) {
      return responderError(
        401,
        "Sesión administrativa requerida."
      );
    }

    if (!origenLecturaPermitido(request)) {
      return responderError(
        403,
        "Solicitud no permitida."
      );
    }


    const { obtenerListadoEnlacesPrisma } =
      await import(
        "@/lib/pruebas-alimentos/repositorio-listado-enlaces-prisma"
      );

    const enlaces =
      await listarEnlacesAdministrativos(
        obtenerListadoEnlacesPrisma()
      );

    return NextResponse.json(
      {
        ok: true,
        enlaces,
      },
      {
        status: 200,
        headers: CABECERAS_PRIVADAS,
      }
    );
  } catch {
    return responderError(
      503,
      "Listado temporalmente no disponible."
    );
  }
}
