import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function GET() {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const protocolos = await prisma.protocolo.findMany({
    orderBy: { createdAt: "desc" },
    include: { producto: true },
  });
  return NextResponse.json(protocolos);
}

export async function POST(req: NextRequest) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { titulo, contenido, imagenUrl, videoUrl, productoId } = await req.json();

  if (!titulo || !contenido) {
    return NextResponse.json(
      { error: "Título y contenido son requeridos" },
      { status: 400 }
    );
  }

  const protocolo = await prisma.protocolo.create({
    data: {
      titulo,
      contenido,
      imagenUrl: imagenUrl || null,
      videoUrl: videoUrl || null,
      productoId: productoId || null,
    },
  });

  return NextResponse.json(protocolo);
}
