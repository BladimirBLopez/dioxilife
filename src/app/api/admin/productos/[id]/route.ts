import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { nombre, descripcion, precio, mostrarPrecio, imagenUrl, categoriaId, activo } =
    await req.json();

  const producto = await prisma.producto.update({
    where: { id },
    data: {
      nombre,
      descripcion: descripcion || null,
      precio,
      mostrarPrecio,
      imagenUrl: imagenUrl || null,
      categoriaId,
      activo,
    },
  });

  return NextResponse.json(producto);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.producto.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
