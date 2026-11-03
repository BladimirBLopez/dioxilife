import { validarContenidoPublicable } from "@/lib/protocolos-contenido";
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
      relacionesOrigen: {
        orderBy: { orden: "asc" },
        select: { relacionadoId: true },
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
    protocoloIds,
    activo,
  } = await req.json();

  if (!titulo || !contenido) {
    return NextResponse.json(
      { error: "Título y contenido son requeridos" },
      { status: 400 }
    );
  }

  if (activo === true) {
    const problema = validarContenidoPublicable(contenido);

    if (problema) {
      return NextResponse.json(
        { error: problema },
        { status: 400 }
      );
    }
  }

  const idsRelacionados = Array.isArray(productoIds)
    ? [...new Set(
        productoIds.filter(
          (id): id is string => typeof id === "string" && id.trim().length > 0
        )
      )]
    : [];

  if (
    protocoloIds !== undefined &&
    (!Array.isArray(protocoloIds) ||
      !protocoloIds.every(
        (valor: unknown) =>
          typeof valor === "string" &&
          valor.trim().length > 0
      ))
  ) {
    return NextResponse.json(
      { error: "Lista de protocolos inválida" },
      { status: 400 }
    );
  }

  const idsProtocolos: string[] = Array.isArray(protocoloIds)
    ? [...new Set(protocoloIds as string[])]
    : [];

  if (idsProtocolos.length > 0) {
    const encontrados = await prisma.protocolo.count({
      where: { id: { in: idsProtocolos } },
    });

    if (encontrados !== idsProtocolos.length) {
      return NextResponse.json(
        { error: "Uno o más protocolos no existen" },
        { status: 400 }
      );
    }
  }

  const protocolo = await prisma.protocolo.create({
    data: {
      titulo,
      contenido,
      activo: activo === true,
      imagenUrl: imagenUrl || null,
      fotoPerfilUrl: imagenUrl || null,
      videoUrl: videoUrl || null,

      // Se conserva temporalmente la relación antigua.
      productoId: productoId || null,

      productosRelacionados: {
        create: idsRelacionados.map((id, index) => ({
          productoId: id,
          orden: index,
        })),
      },
      relacionesOrigen: {
        create: idsProtocolos.map((relacionadoId, orden) => ({
          relacionadoId,
          orden,
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
