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
  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { productos: true } } },
  });
  return NextResponse.json(categorias);
}

export async function POST(req: NextRequest) {
  const { nombre } = await req.json();

  if (!nombre) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const categoria = await prisma.categoria.create({
    data: { nombre, slug: slugify(nombre) },
  });

  return NextResponse.json(categoria);
}
