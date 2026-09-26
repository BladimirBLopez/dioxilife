import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      imagenId: string;
    }>;
  }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id, imagenId } = await params;

  const imagen = await prisma.imagenProducto.findFirst({
    where: {
      id: imagenId,
      productoId: id,
    },
    select: {
      id: true,
    },
  });

  if (!imagen) {
    return NextResponse.json(
      { error: "Imagen no encontrada" },
      { status: 404 }
    );
  }

  await prisma.imagenProducto.delete({
    where: {
      id: imagen.id,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}
