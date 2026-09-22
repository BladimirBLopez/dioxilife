import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

const TIPOS_VALIDOS = [
  "BENEFICIO",
  "VIDEO",
  "INGREDIENTE",
  "FAQ",
  "DOCUMENTO",
] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const informaciones = await prisma.informacionProducto.findMany({
    where: {
      productoId: id,
    },
    orderBy: {
      orden: "asc",
    },
  });

  return NextResponse.json(informaciones);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const tipo = String(body.tipo || "").trim();
  const titulo = String(body.titulo || "").trim();
  const contenido = String(body.contenido || "").trim();
  const imagenUrl = String(body.imagenUrl || "").trim();
  const videoUrl = String(body.videoUrl || "").trim();

  if (!TIPOS_VALIDOS.includes(tipo as (typeof TIPOS_VALIDOS)[number])) {
    return NextResponse.json(
      { error: "Tipo de información no válido" },
      { status: 400 }
    );
  }

  if (!titulo) {
    return NextResponse.json(
      { error: "El título es obligatorio" },
      { status: 400 }
    );
  }

  if (titulo.length > 150) {
    return NextResponse.json(
      { error: "El título es demasiado largo" },
      { status: 400 }
    );
  }

  const producto = await prisma.producto.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!producto) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  }

  const ultima = await prisma.informacionProducto.findFirst({
    where: {
      productoId: id,
    },
    orderBy: {
      orden: "desc",
    },
    select: {
      orden: true,
    },
  });

  const informacion = await prisma.informacionProducto.create({
    data: {
      productoId: id,
      tipo: tipo as (typeof TIPOS_VALIDOS)[number],
      titulo,
      contenido: contenido || null,
      imagenUrl: imagenUrl || null,
      videoUrl: videoUrl || null,
      orden: ultima ? ultima.orden + 1 : 0,
    },
  });

  return NextResponse.json(informacion, { status: 201 });
}
