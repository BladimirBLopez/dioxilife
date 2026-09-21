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
    nombreCliente,
    calificacion,
    comentario,
    imagenUrl,
    productoId,
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

  const resena =
    await prisma.resena.create({
      data: {
        nombreCliente,
        calificacion:
          Number(calificacion) || 5,
        comentario,
        imagenUrl:
          imagenUrl || null,
        productoId:
          productoId || null,
        aprobado: true,
      },
    });

  return NextResponse.json(resena);
}
