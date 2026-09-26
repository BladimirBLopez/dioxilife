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
  const {
    nombre,
    descripcion,
    tratamiento,
    imagenUrl,
    activo,
    protocoloIds = [],
  } = await req.json();

  const ids = Array.isArray(protocoloIds)
    ? [
        ...new Set(
          protocoloIds.filter(
            (protocoloId: unknown): protocoloId is string =>
              typeof protocoloId === "string" &&
              protocoloId.trim().length > 0
          )
        ),
      ]
    : [];

  const aplicacion = await prisma.aplicacionCds.update({
    where: { id },
    data: {
      nombre,
      descripcion: descripcion || null,
      tratamiento: tratamiento || null,
      imagenUrl: imagenUrl || null,
      activo,
      protocolos: {
        deleteMany: {},
        create: ids.map((protocoloId, orden) => ({
          protocoloId,
          orden,
        })),
      },
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
