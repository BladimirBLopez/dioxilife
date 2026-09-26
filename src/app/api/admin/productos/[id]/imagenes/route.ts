import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;

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

  const imagenes = await prisma.imagenProducto.findMany({
    where: {
      productoId: id,
    },
    orderBy: [
      { orden: "asc" },
      { createdAt: "asc" },
    ],
  });

  return NextResponse.json(imagenes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await req.json();

  const url = String(body.url || "").trim();

  if (!url) {
    return NextResponse.json(
      { error: "La imagen es requerida" },
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

  const existente = await prisma.imagenProducto.findFirst({
    where: {
      productoId: id,
      url,
    },
    select: {
      id: true,
    },
  });

  if (existente) {
    return NextResponse.json(
      { error: "Esta imagen ya fue agregada al producto" },
      { status: 409 }
    );
  }

  const ultima = await prisma.imagenProducto.findFirst({
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

  const imagen = await prisma.imagenProducto.create({
    data: {
      productoId: id,
      url,
      orden: ultima ? ultima.orden + 1 : 0,
    },
  });

  return NextResponse.json(imagen, {
    status: 201,
  });
}
