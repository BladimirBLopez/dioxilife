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

export async function PUT(
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

  const existente = await prisma.categoria.findFirst({
    where: {
      slug,
      NOT: {
        id,
      },
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

  const categoria = await prisma.categoria.update({
    where: {
      id,
    },
    data: {
      nombre,
      slug,
    },
  });

  return NextResponse.json(categoria);
}

export async function DELETE(
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

  const productos = await prisma.producto.count({
    where: {
      categoriaId: id,
    },
  });

  if (productos > 0) {
    return NextResponse.json(
      {
        error:
          "No se puede eliminar una categoría que tiene productos.",
      },
      { status: 409 }
    );
  }

  await prisma.categoria.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}
