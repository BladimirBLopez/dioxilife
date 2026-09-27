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

  const {
    titulo,
    contenido,
    imagenUrl,
    videoUrl,
    productoId,
    productoIds,
    activo,
  } = await req.json();

  if (!titulo || !contenido) {
    return NextResponse.json(
      { error: "Título y contenido son requeridos" },
      { status: 400 }
    );
  }

  const idsRelacionados = Array.isArray(productoIds)
    ? [...new Set(
        productoIds.filter(
          (productoId): productoId is string =>
            typeof productoId === "string" &&
            productoId.trim().length > 0
        )
      )]
    : [];

  const protocolo = await prisma.protocolo.update({
    where: { id },
    data: {
      titulo,
      contenido,
      imagenUrl: imagenUrl || null,
      videoUrl: videoUrl || null,

      // Se mantiene por ahora para compatibilidad.
      productoId: productoId || null,

      activo,

      productosRelacionados: {
        deleteMany: {},
        create: idsRelacionados.map((productoId, index) => ({
          productoId,
          orden: index,
        })),
      },
    },
    include: {
      producto: true,
      productosRelacionados: {
        orderBy: { orden: "asc" },
        include: {
          producto: true,
        },
      },
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

  await prisma.protocolo.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
