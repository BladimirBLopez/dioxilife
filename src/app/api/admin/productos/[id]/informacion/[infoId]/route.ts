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

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; infoId: string }>;
  }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id, infoId } = await params;
  const body = await req.json();

  const existente = await prisma.informacionProducto.findFirst({
    where: {
      id: infoId,
      productoId: id,
    },
  });

  if (!existente) {
    return NextResponse.json(
      { error: "Información no encontrada" },
      { status: 404 }
    );
  }

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

  const actualizado = await prisma.informacionProducto.update({
    where: {
      id: infoId,
    },
    data: {
      tipo: tipo as (typeof TIPOS_VALIDOS)[number],
      titulo,
      contenido: contenido || null,
      imagenUrl: imagenUrl || null,
      videoUrl: videoUrl || null,
    },
  });

  return NextResponse.json(actualizado);
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; infoId: string }>;
  }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id, infoId } = await params;

  const resultado = await prisma.informacionProducto.deleteMany({
    where: {
      id: infoId,
      productoId: id,
    },
  });

  if (resultado.count === 0) {
    return NextResponse.json(
      { error: "Información no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
