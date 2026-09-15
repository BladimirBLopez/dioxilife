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
  const { aprobado } = await req.json();

  const resena = await prisma.resena.update({
    where: { id },
    data: { aprobado: !!aprobado },
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
