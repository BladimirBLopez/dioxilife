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
  const { nombre } = await req.json();

  const categoria = await prisma.categoria.update({
    where: { id },
    data: { nombre, slug: slugify(nombre) },
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

  const productos =
    await prisma.producto.count({
      where: {
        categoriaId: id,
      },
    });

  if (productos > 0) {
    return NextResponse.json(
      {
        error:
          `No se puede eliminar esta categoría porque tiene ${productos} producto(s) asociado(s).`,
      },
      { status: 409 }
    );
  }

  await prisma.categoria.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({ ok: true });
}
