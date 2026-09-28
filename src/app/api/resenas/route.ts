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
  const {
    nombreCliente,
    calificacion,
    tiempoUso,
    comentario,
    productoId,
    aplicacionId,
    tipo: tipoRecibido,
    sitioWeb,
  } = await req.json();

  // Campo trampa: si viene lleno, es un bot. Respondemos "éxito" sin guardar nada.
  if (sitioWeb) {
    return NextResponse.json({ ok: true });
  }

  const nombre = String(nombreCliente || "").trim().slice(0, 80);
  const texto = String(comentario || "").trim().slice(0, 1000);
  const uso = tiempoUso ? String(tiempoUso).trim().slice(0, 50) : null;
  const tipo =
    tipoRecibido === "EXPERIENCIA" ? "EXPERIENCIA" : "PRODUCTO";

  const estrellas =
    tipo === "PRODUCTO" ? Number(calificacion) : null;

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
  if (
    tipo === "PRODUCTO" &&
    (!Number.isInteger(estrellas) || estrellas! < 1 || estrellas! > 5)
  ) {
    return NextResponse.json(
      { error: "La calificación debe ser de 1 a 5 estrellas" },
      { status: 400 }
    );
  }

  if (tipo === "EXPERIENCIA" && !aplicacionId) {
    return NextResponse.json(
      { error: "Selecciona la aplicación relacionada con tu experiencia" },
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

  if (aplicacionId) {
    const aplicacion = await prisma.aplicacionCds.findUnique({
      where: { id: aplicacionId },
      select: {
        id: true,
        activo: true,
      },
    });

    if (!aplicacion || !aplicacion.activo) {
      return NextResponse.json(
        { error: "Aplicación CDS no encontrada" },
        { status: 404 }
      );
    }
  }

  const ipHash = obtenerIpHash(req);
  const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const yaExiste = await prisma.resena.findFirst({
    where:
      tipo === "EXPERIENCIA"
        ? {
            ipHash,
            tipo: "EXPERIENCIA",
            aplicacionId,
            createdAt: {
              gte: hace24Horas,
            },
          }
        : {
            ipHash,
            tipo: "PRODUCTO",
            productoId: productoId || null,
            createdAt: {
              gte: hace24Horas,
            },
          },
    select: {
      id: true,
    },
  });

  if (yaExiste) {
    return NextResponse.json(
      {
        error:
          tipo === "EXPERIENCIA"
            ? "Ya recibimos una experiencia para esta aplicación durante las últimas 24 horas. Gracias por compartirla."
            : "Ya recibimos una reseña para este producto durante las últimas 24 horas. Gracias por tu opinión.",
      },
      { status: 409 }
    );
  }

  await prisma.resena.create({
    data: {
      tipo,
      nombreCliente: nombre,
      comentario: texto,
      calificacion: estrellas,
      tiempoUso: uso,
      productoId: productoId || null,
      aplicacionId:
        tipo === "EXPERIENCIA" ? aplicacionId || null : null,
      ipHash,
      aprobado: false,
    },
  });

  return NextResponse.json({ ok: true });
}
