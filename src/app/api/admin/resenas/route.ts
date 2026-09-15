import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

async function sesionValida(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  const payload = await verificarSesion(token);
  return !!payload;
}

export async function GET(req: NextRequest) {
  if (!(await sesionValida(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resenas = await prisma.resena.findMany({
    include: { producto: { select: { nombre: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(resenas);
}

export async function POST(req: NextRequest) {
  if (!(await sesionValida(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { nombreCliente, calificacion, comentario, imagenUrl, productoId } =
    await req.json();

  if (!nombreCliente || !comentario) {
    return NextResponse.json(
      { error: "Nombre y comentario son requeridos" },
      { status: 400 }
    );
  }

  const resena = await prisma.resena.create({
    data: {
      nombreCliente,
      calificacion: Number(calificacion) || 5,
      comentario,
      imagenUrl: imagenUrl || null,
      productoId: productoId || null,
      aprobado: true, // lo agrega el admin, ya está revisado
    },
  });

  return NextResponse.json(resena);
}
