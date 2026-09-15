import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

function obtenerIpHash(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "desconocida";
  return createHash("sha256").update(ip).digest("hex");
}

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

  const ipHash = obtenerIpHash(req);

  const yaExiste = await prisma.resena.findFirst({
    where: { ipHash },
    select: { id: true },
  });

  if (yaExiste) {
    return NextResponse.json(
      { error: "Ya registramos una reseña enviada desde este dispositivo. ¡Gracias por tu opinión!" },
      { status: 409 }
    );
  }

  await prisma.resena.create({
    data: {
      nombreCliente: nombre,
      comentario: texto,
      calificacion: estrellas,
      productoId: productoId || null,
      ipHash,
      aprobado: false,
    },
  });

  return NextResponse.json({ ok: true });
}
