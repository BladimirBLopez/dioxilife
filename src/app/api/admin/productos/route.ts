import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function slugify(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const productos = await prisma.producto.findMany({
    orderBy: { createdAt: "desc" },
    include: { categoria: true },
  });
  return NextResponse.json(productos);
}

export async function POST(req: NextRequest) {
  const { nombre, descripcion, precio, mostrarPrecio, imagenUrl, categoriaId } =
    await req.json();

  if (!nombre || !precio || !categoriaId) {
    return NextResponse.json(
      { error: "Nombre, precio y categoría son requeridos" },
      { status: 400 }
    );
  }

  const producto = await prisma.producto.create({
    data: {
      nombre,
      slug: slugify(nombre) + "-" + Date.now().toString(36),
      descripcion: descripcion || null,
      precio,
      mostrarPrecio: mostrarPrecio ?? false,
      imagenUrl: imagenUrl || null,
      categoriaId,
    },
  });

  return NextResponse.json(producto);
}
