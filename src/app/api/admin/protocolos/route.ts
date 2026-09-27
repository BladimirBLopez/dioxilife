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
    include: {
      producto: true,
      productosRelacionados: {
        orderBy: { orden: "asc" },
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
              activo: true,
            },
          },
        },
      },
    },
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

  const {
    titulo,
    contenido,
    imagenUrl,
    videoUrl,
    productoId,
    productoIds,
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
          (id): id is string => typeof id === "string" && id.trim().length > 0
        )
      )]
    : [];

  const protocolo = await prisma.protocolo.create({
    data: {
      titulo,
      contenido,
      imagenUrl: imagenUrl || null,
      videoUrl: videoUrl || null,

      // Se conserva temporalmente la relación antigua.
      productoId: productoId || null,

      productosRelacionados: {
        create: idsRelacionados.map((id, index) => ({
          productoId: id,
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
