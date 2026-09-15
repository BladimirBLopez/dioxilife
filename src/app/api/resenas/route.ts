import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { nombreCliente, calificacion, comentario, productoId, sitioWeb } =
    await req.json();

  // Campo trampa: si viene lleno, es un bot. Respondemos "éxito" sin guardar nada.
  if (sitioWeb) {
    return NextResponse.json({ ok: true });
  }

  const nombre = String(nombreCliente || "").trim().slice(0, 80);
  const texto = String(comentario || "").trim().slice(0, 1000);
  const estrellas = Number(calificacion);

  if (!nombre || nombre.length < 2) {
    return NextResponse.json(
      { error: "Ingresa tu nombre" },
      { status: 400 }
    );
  }
  if (!texto || texto.length < 5) {
    return NextResponse.json(
      { error: "Escribe un comentario un poco más largo" },
      { status: 400 }
    );
  }
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    return NextResponse.json(
      { error: "La calificación debe ser de 1 a 5 estrellas" },
      { status: 400 }
    );
  }

  if (productoId) {
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
      select: { id: true },
    });
    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }
  }

  await prisma.resena.create({
    data: {
      nombreCliente: nombre,
      comentario: texto,
      calificacion: estrellas,
      productoId: productoId || null,
      aprobado: false,
    },
  });

  return NextResponse.json({ ok: true });
}
