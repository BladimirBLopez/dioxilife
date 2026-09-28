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

  const resenas = await prisma.resena.findMany({
    include: {
      producto: {
        select: {
          nombre: true,
        },
      },
      aplicacion: {
        select: {
          nombre: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(resenas);
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
    tipo: tipoRecibido,
    nombreCliente,
    calificacion,
    comentario,
    imagenUrl,
    productoId,
    aplicacionId,
  } = await req.json();

  if (!nombreCliente || !comentario) {
    return NextResponse.json(
      {
        error:
          "Nombre y comentario son requeridos",
      },
      { status: 400 }
    );
  }

  const tipo =
    tipoRecibido === "EXPERIENCIA" ? "EXPERIENCIA" : "PRODUCTO";

  if (tipo === "EXPERIENCIA" && !aplicacionId) {
    return NextResponse.json(
      { error: "La Aplicación CDS es requerida para una experiencia" },
      { status: 400 }
    );
  }

  const resena =
    await prisma.resena.create({
      data: {
        tipo,
        nombreCliente,
        calificacion:
          tipo === "PRODUCTO" ? Number(calificacion) || 5 : null,
        comentario,
        imagenUrl:
          imagenUrl || null,
        productoId:
          productoId || null,
        aplicacionId:
          tipo === "EXPERIENCIA" ? aplicacionId || null : null,
        aprobado: true,
      },
    });

  return NextResponse.json(resena);
}
