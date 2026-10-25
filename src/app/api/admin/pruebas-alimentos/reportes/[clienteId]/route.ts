import {
  NextRequest,
  NextResponse,
} from "next/server";


import {
  construirReporteIndividualAdmin,
} from "@/lib/pruebas-alimentos/reporte-individual-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORTES_ADMIN_HABILITADOS = false;

const FORMATO_ID = /^[A-Za-z0-9_-]{5,128}$/;

const CABECERAS_PRIVADAS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
  "Vary": "Cookie",
};

function error(
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

function origenPermitido(
  request: NextRequest
): boolean {
  const sitio = request.headers.get(
    "sec-fetch-site"
  );

  if (
    sitio !== null &&
    sitio !== "same-origin" &&
    sitio !== "none"
  ) {
    return false;
  }

  const origen = request.headers.get("origin");

  if (origen === null) {
    return true;
  }

  try {
    return (
      new URL(origen).origin ===
      new URL(request.url).origin
    );
  } catch {
    return false;
  }
}

type Contexto = {
  params: Promise<{
    clienteId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  contexto: Contexto
) {
  try {
    if (!REPORTES_ADMIN_HABILITADOS) {
      return error(
        503,
        "Los reportes todavía no están habilitados."
      );
    }

    const { obtenerAdminActual } = await import("@/lib/admin-auth");

    const administrador =
      await obtenerAdminActual();

    if (!administrador) {
      return error(
        401,
        "Sesión administrativa requerida."
      );
    }

    if (!origenPermitido(request)) {
      return error(
        403,
        "Solicitud no autorizada."
      );
    }


    const {clienteId} = await contexto.params;

    if (
      typeof clienteId !== "string" ||
      !FORMATO_ID.test(clienteId)
    ) {
      return error(
        400,
        "Identificador no válido."
      );
    }

    const {
      obtenerRepositorioReporteAdminPrisma,
    } = await import(
      "@/lib/pruebas-alimentos/repositorio-reporte-individual-prisma"
    );

    const reporte =
      await construirReporteIndividualAdmin(
        obtenerRepositorioReporteAdminPrisma(),
        clienteId
      );

    if (!reporte) {
      return error(
        404,
        "Cliente no encontrado."
      );
    }

    return NextResponse.json(
      {
        ok: true,
        reporte,
      },
      {
        status: 200,
        headers: CABECERAS_PRIVADAS,
      }
    );
  } catch {
    return error(
      503,
      "El reporte no está disponible."
    );
  }
}
