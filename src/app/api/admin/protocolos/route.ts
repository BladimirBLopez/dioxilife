import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const protocolos = await prisma.protocolo.findMany({
    orderBy: { createdAt: "desc" },
    include: { producto: true },
  });
  return NextResponse.json(protocolos);
}

export async function POST(req: NextRequest) {
  const { titulo, contenido, imagenUrl, productoId } = await req.json();

  if (!titulo || !contenido || !productoId) {
    return NextResponse.json(
      { error: "Título, contenido y producto son requeridos" },
      { status: 400 }
    );
  }

  const protocolo = await prisma.protocolo.create({
    data: {
      titulo,
      contenido,
      imagenUrl: imagenUrl || null,
      productoId,
    },
  });

  return NextResponse.json(protocolo);
}
