import { NextRequest, NextResponse } from "next/server";

import { origenAdministrativoValido } from "@/lib/pruebas-alimentos/origen-admin";

import {
  crearAccesoPruebaSchema,
  revocarAccesoPruebaSchema,
} from "@/lib/pruebas-alimentos/contratos-admin";

import {
  crearEnlaceAdministrativo,
  revocarEnlaceAdministrativo,
} from "@/lib/pruebas-alimentos/servicio-enlaces-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * API administrativa para pruebas de alimentos.
 *
 * FASE ACTUAL:
 * - Comprueba la sesión administrativa.
 * - Valida solicitudes y limita su tamaño.
 * - NO consulta clientes.
 * - NO genera tokens.
 * - NO escribe ni modifica datos.
 *
 * La generación y revocación reales quedan
 * deliberadamente inhabilitadas hasta autorizar
 * y revisar la migración de base de datos.
 */

const MAX_BYTES = 4096;

/**
 * Solo se activará después de comprobar
 * el flujo completo de clientes y mediciones.
 */
const ENLACES_ADMIN_HABILITADOS = false;

function responder(
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
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}

function responderExito(
  status: number,
  datos: Record<string, unknown>
) {
  return NextResponse.json(
    {
      ok: true,
      ...datos,
    },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Referrer-Policy": "no-referrer",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}

type Lectura =
  | { ok: true; datos: unknown }
  | { ok: false; status: number; mensaje: string };

async function leerSolicitud(
  request: NextRequest
): Promise<Lectura> {
  const tipo = request.headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();

  if (tipo !== "application/json") {
    return {
      ok: false,
      status: 415,
      mensaje: "Se requiere contenido JSON.",
    };
  }

  const largoDeclarado = request.headers.get(
    "content-length"
  );

  if (
    largoDeclarado &&
    /^\d+$/.test(largoDeclarado) &&
    Number(largoDeclarado) > MAX_BYTES
  ) {
    return {
      ok: false,
      status: 413,
      mensaje: "Solicitud demasiado grande.",
    };
  }

  const lector = request.body?.getReader();

  if (!lector) {
    return {
      ok: false,
      status: 400,
      mensaje: "Solicitud vacía.",
    };
  }

  const fragmentos: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const resultado = await lector.read();

    if (resultado.done) break;

    total += resultado.value.byteLength;

    if (total > MAX_BYTES) {
      await lector.cancel();

      return {
        ok: false,
        status: 413,
        mensaje: "Solicitud demasiado grande.",
      };
    }

    fragmentos.push(resultado.value);
  }

  if (total === 0) {
    return {
      ok: false,
      status: 400,
      mensaje: "Solicitud vacía.",
    };
  }

  try {
    const texto = Buffer.concat(
      fragmentos
    ).toString("utf8");

    return {
      ok: true,
      datos: JSON.parse(texto) as unknown,
    };
  } catch {
    return {
      ok: false,
      status: 400,
      mensaje: "JSON no válido.",
    };
  }
}

/**
 * POST: futura generación de enlace privado.
 */
export async function POST(
  request: NextRequest
) {
  try {
    if (!ENLACES_ADMIN_HABILITADOS) {
      return responder(
        503,
        "La generación de enlaces aún no está habilitada."
      );
    }

    const { obtenerAdminActual } = await import("@/lib/admin-auth");

    const admin = await obtenerAdminActual();

    if (!admin) {
      return responder(
        401,
        "Se requiere una sesión administrativa."
      );
    }

    if (!origenAdministrativoValido(request)) {
      return responder(
        403,
        "Origen de solicitud no autorizado."
      );
    }

    const solicitud = await leerSolicitud(request);

    if (!solicitud.ok) {
      return responder(
        solicitud.status,
        solicitud.mensaje
      );
    }

    const validacion =
      crearAccesoPruebaSchema.safeParse(
        solicitud.datos
      );

    if (!validacion.success) {
      return responder(
        400,
        "Los datos del acceso no son válidos."
      );
    }


    const { obtenerDependenciasEnlacesPrisma } =
      await import(
        "@/lib/pruebas-alimentos/repositorio-enlaces-admin-prisma"
      );

    const resultado = await crearEnlaceAdministrativo(
      validacion.data,
      obtenerDependenciasEnlacesPrisma()
    );

    if (resultado.estado === "creado") {
      return responderExito(201, {
        clientePruebaId: resultado.clientePruebaId,
        nombre: resultado.nombre,

        // Ruta relativa: no confiar en cabeceras Host
        // para construir enlaces absolutos.
        enlaceRuta:
          "/prueba-alimentos/" + resultado.token,

        tokenExpiraAt:
          resultado.tokenExpiraAt.toISOString(),
      });
    }

    if (
      resultado.estado ===
      "seguimiento_no_disponible"
    ) {
      return responder(
        404,
        "No se encontró el cliente de Seguimiento."
      );
    }

    if (
      resultado.estado ===
      "seguimiento_incompleto"
    ) {
      return responder(
        422,
        "El cliente de Seguimiento no tiene un nombre válido."
      );
    }

    return responder(
      400,
      "Los datos del acceso no son válidos."
    );
  } catch {
    return responder(
      500,
      "No fue posible procesar la solicitud."
    );
  }
}

/**
 * DELETE: futura revocación de enlace privado.
 */
export async function DELETE(
  request: NextRequest
) {
  try {
    if (!ENLACES_ADMIN_HABILITADOS) {
      return responder(
        503,
        "La revocación de enlaces aún no está habilitada."
      );
    }

    const { obtenerAdminActual } = await import("@/lib/admin-auth");

    const admin = await obtenerAdminActual();

    if (!admin) {
      return responder(
        401,
        "Se requiere una sesión administrativa."
      );
    }

    if (!origenAdministrativoValido(request)) {
      return responder(
        403,
        "Origen de solicitud no autorizado."
      );
    }

    const solicitud = await leerSolicitud(request);

    if (!solicitud.ok) {
      return responder(
        solicitud.status,
        solicitud.mensaje
      );
    }

    const validacion =
      revocarAccesoPruebaSchema.safeParse(
        solicitud.datos
      );

    if (!validacion.success) {
      return responder(
        400,
        "Los datos de revocación no son válidos."
      );
    }


    const { obtenerDependenciasEnlacesPrisma } =
      await import(
        "@/lib/pruebas-alimentos/repositorio-enlaces-admin-prisma"
      );

    const resultado = await revocarEnlaceAdministrativo(
      validacion.data,
      obtenerDependenciasEnlacesPrisma()
    );

    if (resultado.estado === "revocado") {
      return responderExito(200, {
        mensaje: "Enlace privado revocado.",
      });
    }

    if (
      resultado.estado ===
      "acceso_no_disponible"
    ) {
      return responder(
        404,
        "El enlace no está disponible o ya fue revocado."
      );
    }

    return responder(
      400,
      "Los datos de revocación no son válidos."
    );
  } catch {
    return responder(
      500,
      "No fue posible procesar la solicitud."
    );
  }
}
