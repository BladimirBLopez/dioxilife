import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const testimonios = await prisma.testimonio.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(testimonios);
}

export async function POST(req: NextRequest) {
  const { nombreCliente, contenido, calificacion, imagenUrl, destacado } =
    await req.json();

  if (!nombreCliente || !contenido) {
    return NextResponse.json(
      { error: "Nombre y contenido son requeridos" },
      { status: 400 }
    );
  }

  const testimonio = await prisma.testimonio.create({
    data: {
      nombreCliente,
      contenido,
      calificacion: calificacion ?? 5,
      imagenUrl: imagenUrl || null,
      destacado: destacado ?? false,
    },
  });

  return NextResponse.json(testimonio);
}
