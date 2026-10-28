import { NextRequest, NextResponse } from "next/server";
import { pruebasAlimentosHabilitadas } from "@/lib/pruebas-alimentos/activacion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cabeceras = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
};

function responder(status: number, datos: object) {
  return NextResponse.json(datos, {
    status,
    headers: cabeceras,
  });
}

export async function GET(req: NextRequest) {
  if (!pruebasAlimentosHabilitadas()) {
    return responder(503, {
      ok: false,
      mensaje: "Modulo no habilitado.",
    });
  }

  try {
    const { obtenerAdminActual } =
      await import("@/lib/admin-auth");

    const admin = await obtenerAdminActual();

    if (
      !admin ||
      (admin.rol !== "ADMIN" &&
       admin.rol !== "SUPER_ADMIN")
    ) {
      return responder(401, {
        ok: false,
        mensaje: "No autorizado.",
      });
    }

    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

    if (q.length > 80) {
      return responder(400, {
        ok: false,
        mensaje: "Busqueda demasiado larga.",
      });
    }

    if (q.length === 1) {
      return responder(200, {
        ok: true,
        clientes: [],
      });
    }

    const { prisma } = await import("@/lib/prisma");

    const clientes = await prisma.seguimientoCliente.findMany({
      where: {
        estado: { in: ["ACTIVO", "PAUSADO"] },
        nombreCliente: q
          ? { contains: q, mode: "insensitive" }
          : { not: null },
      },
      select: {
        id: true,
        nombreCliente: true,
        nombrePlan: true,
        estado: true,
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      take: 20,
    });

    return responder(200, {
      ok: true,
      clientes: clientes
        .filter(c => Boolean(c.nombreCliente?.trim()))
        .map(c => ({
          id: c.id,
          nombre: c.nombreCliente,
          programa: c.nombrePlan,
          estado: c.estado,
        })),
    });
  } catch {
    return responder(503, {
      ok: false,
      mensaje: "Consulta temporalmente no disponible.",
    });
  }
}
