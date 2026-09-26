import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const { titulo, contenido, imagenUrl, videoUrl, productoId, activo } =
    await req.json();

  const protocolo = await prisma.protocolo.update({
    where: { id },
    data: {
      titulo,
      contenido,
      imagenUrl: imagenUrl || null,
      videoUrl: videoUrl || null,
      productoId: productoId || null,
      activo,
    },
  });

  return NextResponse.json(protocolo);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;
  await prisma.protocolo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
