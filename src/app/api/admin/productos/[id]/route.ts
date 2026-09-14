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

  const protocolosAsociados = await prisma.protocolo.count({
    where: { productoId: id },
  });

  if (protocolosAsociados > 0) {
    return NextResponse.json(
      {
        error: `No se puede borrar este producto porque tiene ${protocolosAsociados} protocolo(s) asociado(s). Borra primero ese(s) protocolo(s) desde la sección Protocolos.`,
      },
      { status: 409 }
    );
  }

  await prisma.producto.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
