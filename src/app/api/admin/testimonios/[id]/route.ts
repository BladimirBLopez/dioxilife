import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { nombreCliente, contenido, calificacion, imagenUrl, destacado, activo } =
    await req.json();

  const testimonio = await prisma.testimonio.update({
    where: { id },
    data: {
      nombreCliente,
      contenido,
      calificacion,
      imagenUrl: imagenUrl || null,
      destacado,
      activo,
    },
  });

  return NextResponse.json(testimonio);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.testimonio.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
