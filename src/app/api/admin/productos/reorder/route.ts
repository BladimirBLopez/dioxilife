import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function PUT(req: NextRequest) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { orden } = await req.json();

  if (!Array.isArray(orden) || orden.length === 0) {
    return NextResponse.json(
      { error: "Se requiere un arreglo de productos con su nuevo orden" },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(
      orden.map((item: { id: string; orden: number }) =>
        prisma.producto.update({
          where: { id: item.id },
          data: { orden: item.orden },
        })
      )
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo guardar el nuevo orden" },
      { status: 500 }
    );
  }
}
