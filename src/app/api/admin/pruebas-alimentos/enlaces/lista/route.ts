import { pruebasAlimentosHabilitadas } from "@/lib/pruebas-alimentos/activacion";
import type { Prisma } from "@prisma/client";
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
const LISTADO_ENLACES_ADMIN_HABILITADO = pruebasAlimentosHabilitadas();

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


    // Mantener la respuesta antigua cuando no se pide pagina.
    if (request.nextUrl.searchParams.has("pagina")) {
      if (
        administrador.rol !== "ADMIN" &&
        administrador.rol !== "SUPER_ADMIN"
      ) {
        return responderError(
          403,
          "No autorizado para consultar enlaces."
        );
      }
      const parametros = request.nextUrl.searchParams;
      const q = (parametros.get("q") ?? "").trim();
      const filtro = parametros.get("estado") ?? "todos";
      const paginaTexto = parametros.get("pagina") ?? "";

      if (
        q.length > 80 ||
        !/^[1-9][0-9]{0,3}$/.test(paginaTexto) ||
        Number(paginaTexto) > 1000 ||
        ![
          "todos",
          "vigente",
          "vencido",
          "revocado",
        ].includes(filtro)
      ) {
        return responderError(
          400,
          "Filtros de consulta no validos."
        );
      }

      const pagina = Number(paginaTexto);
      const porPagina = 20;

      const { prisma } = await import("@/lib/prisma");
      const ahora = new Date();

      const where: Prisma.ClientePruebaAlimentoWhereInput = {};

      if (q) {
        where.nombre = {
          contains: q,
          mode: "insensitive",
        };
      }

      if (filtro === "vigente") {
        where.tokenRevocadoAt = null;
        where.tokenExpiraAt = { gt: ahora };
      } else if (filtro === "vencido") {
        where.tokenRevocadoAt = null;
        where.tokenExpiraAt = { lte: ahora };
      } else if (filtro === "revocado") {
        where.tokenRevocadoAt = { not: null };
      }

      const [filas, total] = await Promise.all([
        prisma.clientePruebaAlimento.findMany({
          where,
          orderBy: [
            { createdAt: "desc" },
            { id: "desc" },
          ],
          skip: (pagina - 1) * porPagina,
          take: porPagina,
          select: {
            id: true,
            nombre: true,
            seguimientoId: true,
            tokenCreadoAt: true,
            tokenExpiraAt: true,
            tokenRevocadoAt: true,
          },
        }),
        prisma.clientePruebaAlimento.count({
          where,
        }),
      ]);

      const enlaces =
        await listarEnlacesAdministrativos({
          listar: async () => filas,
        }, ahora);

      return NextResponse.json(
        {
          ok: true,
          enlaces,
          total,
          pagina,
          porPagina,
        },
        {
          status: 200,
          headers: CABECERAS_PRIVADAS,
        }
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
