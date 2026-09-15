import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

async function sesionValida(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  const payload = await verificarSesion(token);
  return !!payload;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await sesionValida(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Toggle simple de aprobado (usado por los botones Aprobar/Ocultar)
  if (Object.keys(body).length === 1 && "aprobado" in body) {
    const resena = await prisma.resena.update({
      where: { id },
      data: { aprobado: !!body.aprobado },
    });
    return NextResponse.json(resena);
  }

  // Edición completa (usada por el modal de editar)
  const { nombreCliente, calificacion, comentario, imagenUrl, productoId, aprobado } =
    body;

  const resena = await prisma.resena.update({
    where: { id },
    data: {
      nombreCliente,
      calificacion: Number(calificacion) || 5,
      comentario,
      imagenUrl: imagenUrl || null,
      productoId: productoId || null,
      aprobado: !!aprobado,
    },
  });

  return NextResponse.json(resena);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await sesionValida(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.resena.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
