import { NextRequest, NextResponse } from "next/server";
import { pruebasAlimentosHabilitadas } from "@/lib/pruebas-alimentos/activacion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID_VALIDO = /^[A-Za-z0-9_-]{5,128}$/;

const CABECERAS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
};

function responder(status: number, datos: object) {
  return NextResponse.json(datos, {
    status,
    headers: CABECERAS,
  });
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor);
}

function origenSeguro(request: NextRequest): boolean {
  const contexto = request.headers.get("sec-fetch-site");

  if (
    contexto !== null &&
    contexto !== "same-origin" &&
    contexto !== "none"
  ) return false;

  const origen = request.headers.get("origin");
  if (!origen) return true;

  try {
    const recibido = new URL(origen);
    return recibido.origin === new URL(request.url).origin &&
      !recibido.username &&
      !recibido.password;
  } catch {
    return false;
  }
}

async function autorizar(request: NextRequest) {
  if (!pruebasAlimentosHabilitadas()) {
    return responder(503, {
      ok: false,
      mensaje: "Módulo no habilitado.",
    });
  }

  if (!origenSeguro(request)) {
    return responder(403, {
      ok: false,
      mensaje: "Origen no permitido.",
    });
  }

  const { obtenerAdminActual } =
    await import("@/lib/admin-auth");

  const admin = await obtenerAdminActual();

  if (!admin) {
    return responder(401, {
      ok: false,
      mensaje: "Sesión administrativa requerida.",
    });
  }

  if (admin.rol !== "SUPER_ADMIN") {
    return responder(403, {
      ok: false,
      mensaje: "Solo SUPER_ADMIN puede eliminar clientes.",
    });
  }

  if (
    process.env.PRUEBAS_ALIMENTOS_ELIMINACION_HABILITADA !== "true"
  ) {
    return responder(503, {
      ok: false,
      mensaje: "La eliminación está deshabilitada.",
    });
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const denegado = await autorizar(request);
    if (denegado) return denegado;

    const ids = request.nextUrl.searchParams.getAll("clienteId");
    const id = ids[0];

    if (
      ids.length !== 1 ||
      typeof id !== "string" ||
      !ID_VALIDO.test(id)
    ) {
      return responder(400, {
        ok: false,
        mensaje: "Identificador inválido.",
      });
    }

    const { prisma } = await import("@/lib/prisma");

    const cliente = await prisma.clientePruebaAlimento.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        seguimientoId: true,
      },
    });

    if (!cliente) {
      return responder(404, {
        ok: false,
        mensaje: "Cliente no encontrado.",
      });
    }

    const [mediciones, recordatorios, suscripciones] =
      await Promise.all([
        prisma.registroPruebaAlimento.count({
          where: { clienteId: id },
        }),
        prisma.recordatorioPushPruebaAlimento.count({
          where: { registro: { clienteId: id } },
        }),
        prisma.suscripcionPushPruebaAlimento.count({
          where: { clienteId: id },
        }),
      ]);

    return responder(200, {
      ok: true,
      clientePruebaId: cliente.id,
      nombre: cliente.nombre,
      vinculadoASeguimiento: cliente.seguimientoId !== null,
      mediciones,
      recordatorios,
      suscripciones,
    });
  } catch {
    return responder(503, {
      ok: false,
      mensaje: "No se pudo consultar el cliente.",
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const denegado = await autorizar(request);
    if (denegado) return denegado;

    if (
      !request.headers.get("content-type")?.toLowerCase()
        .startsWith("application/json")
    ) {
      return responder(415, {
        ok: false,
        mensaje: "Se requiere JSON.",
      });
    }

    const cuerpo = await request.text();

    if (cuerpo.length > 2048) {
      return responder(413, {
        ok: false,
        mensaje: "Solicitud demasiado grande.",
      });
    }

    let entrada: unknown;

    try {
      entrada = JSON.parse(cuerpo);
    } catch {
      return responder(400, {
        ok: false,
        mensaje: "Solicitud inválida.",
      });
    }

    if (!esObjeto(entrada)) {
      return responder(400, {
        ok: false,
        mensaje: "Datos inválidos.",
      });
    }

    const id = entrada.clientePruebaId;
    const esperado = entrada.esperado;

    if (
      typeof id !== "string" ||
      !ID_VALIDO.test(id) ||
      entrada.confirmacion !== "ELIMINAR" ||
      !esObjeto(esperado) ||
      ![
        esperado.mediciones,
        esperado.recordatorios,
        esperado.suscripciones,
      ].every(
        valor =>
          typeof valor === "number" &&
          Number.isSafeInteger(valor) &&
          valor >= 0
      )
    ) {
      return responder(400, {
        ok: false,
        mensaje: "Confirmación inválida.",
      });
    }

    const cantidades = esperado as {
      mediciones: number;
      recordatorios: number;
      suscripciones: number;
    };

    const { prisma } = await import("@/lib/prisma");

    try {
      await prisma.$transaction(
        async tx => {
          const cliente =
            await tx.clientePruebaAlimento.findUnique({
              where: { id },
              select: { id: true },
            });

          if (!cliente) throw new Error("NO_EXISTE");

          const [mediciones, recordatorios, suscripciones] =
            await Promise.all([
              tx.registroPruebaAlimento.count({
                where: { clienteId: id },
              }),
              tx.recordatorioPushPruebaAlimento.count({
                where: { registro: { clienteId: id } },
              }),
              tx.suscripcionPushPruebaAlimento.count({
                where: { clienteId: id },
              }),
            ]);

          if (
            mediciones !== cantidades.mediciones ||
            recordatorios !== cantidades.recordatorios ||
            suscripciones !== cantidades.suscripciones
          ) {
            throw new Error("CAMBIO");
          }

          const borradosRecordatorios =
            await tx.recordatorioPushPruebaAlimento.deleteMany({
              where: { registro: { clienteId: id } },
            });

          const borradasSuscripciones =
            await tx.suscripcionPushPruebaAlimento.deleteMany({
              where: { clienteId: id },
            });

          const borradasMediciones =
            await tx.registroPruebaAlimento.deleteMany({
              where: { clienteId: id },
            });

          if (
            borradosRecordatorios.count !== recordatorios ||
            borradasSuscripciones.count !== suscripciones ||
            borradasMediciones.count !== mediciones
          ) {
            throw new Error("CAMBIO");
          }

          await tx.clientePruebaAlimento.delete({
            where: { id },
          });
        },
        { isolationLevel: "Serializable" }
      );
    } catch (fallo) {
      if (fallo instanceof Error) {
        if (fallo.message === "NO_EXISTE") {
          return responder(404, {
            ok: false,
            mensaje: "El cliente ya no existe.",
          });
        }

        if (fallo.message === "CAMBIO") {
          return responder(409, {
            ok: false,
            mensaje: "Los registros cambiaron. Vuelve a revisarlos.",
          });
        }
      }

      const codigo =
        esObjeto(fallo) && typeof fallo.code === "string"
          ? fallo.code
          : "";

      if (codigo === "P2034" || codigo === "P2003") {
        return responder(409, {
          ok: false,
          mensaje: "Conflicto de datos. Vuelve a revisar.",
        });
      }

      if (codigo === "P2025") {
        return responder(404, {
          ok: false,
          mensaje: "El cliente ya no existe.",
        });
      }

      return responder(503, {
        ok: false,
        mensaje: "No se pudo completar la eliminación.",
      });
    }

    return responder(200, {
      ok: true,
      clientePruebaId: id,
      mensaje: "Cliente eliminado definitivamente.",
    });
  } catch {
    return responder(503, {
      ok: false,
      mensaje: "Operación temporalmente no disponible.",
    });
  }
}
