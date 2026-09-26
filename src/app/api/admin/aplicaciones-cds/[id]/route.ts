import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

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
  const { nombre, descripcion, tratamiento, imagenUrl, activo } = await req.json();

  const aplicacion = await prisma.aplicacionCds.update({
    where: { id },
    data: {
      nombre,
      descripcion: descripcion || null,
      tratamiento: tratamiento || null,
      imagenUrl: imagenUrl || null,
      activo,
    },
  });

  return NextResponse.json(aplicacion);
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
  await prisma.aplicacionCds.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
