import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function slugify(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { productos: true } } },
  });
  return NextResponse.json(categorias);
}

export async function POST(req: NextRequest) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { nombre } = await req.json();

  const nombreLimpio =
    String(nombre || "").trim();

  if (!nombreLimpio) {
    return NextResponse.json(
      { error: "Nombre requerido" },
      { status: 400 }
    );
  }

  const categoria = await prisma.categoria.create({
    data: {
      nombre: nombreLimpio,
      slug: slugify(nombreLimpio),
    },
  });

  return NextResponse.json(categoria);
}
