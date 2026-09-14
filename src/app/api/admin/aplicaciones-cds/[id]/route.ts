import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { nombre, descripcion, imagenUrl, activo } = await req.json();

  const aplicacion = await prisma.aplicacionCds.update({
    where: { id },
    data: {
      nombre,
      descripcion: descripcion || null,
      imagenUrl: imagenUrl || null,
      activo,
    },
  });

  return NextResponse.json(aplicacion);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.aplicacionCds.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
