import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const aplicaciones = await prisma.aplicacionCds.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(aplicaciones);
}

export async function POST(req: NextRequest) {
  const { nombre, descripcion, imagenUrl } = await req.json();

  if (!nombre) {
    return NextResponse.json(
      { error: "El nombre es requerido" },
      { status: 400 }
    );
  }

  const aplicacion = await prisma.aplicacionCds.create({
    data: {
      nombre,
      descripcion: descripcion || null,
      imagenUrl: imagenUrl || null,
    },
  });

  return NextResponse.json(aplicacion);
}
