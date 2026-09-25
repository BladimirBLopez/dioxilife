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
    orderBy: {
      nombre: "asc",
    },
    select: {
      id: true,
      nombre: true,
      slug: true,
      _count: {
        select: {
          productos: true,
        },
      },
    },
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

  const body = await req.json();

  const nombre =
    typeof body.nombre === "string"
      ? body.nombre.trim()
      : "";

  if (nombre.length < 2) {
    return NextResponse.json(
      { error: "Ingresa un nombre válido" },
      { status: 400 }
    );
  }

  const slug = slugify(nombre);

  const existente = await prisma.categoria.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
    },
  });

  if (existente) {
    return NextResponse.json(
      { error: "Ya existe una categoría con ese nombre" },
      { status: 409 }
    );
  }

  const categoria = await prisma.categoria.create({
    data: {
      nombre,
      slug,
    },
  });

  return NextResponse.json(categoria);
}
