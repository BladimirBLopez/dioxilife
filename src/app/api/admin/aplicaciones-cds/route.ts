import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function GET() {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const aplicaciones = await prisma.aplicacionCds.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      protocolos: {
        orderBy: { orden: "asc" },
        include: {
          protocolo: {
            select: {
              id: true,
              titulo: true,
              activo: true,
            },
          },
        },
      },
    },
  });
  return NextResponse.json(aplicaciones);
}

export async function POST(req: NextRequest) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const {
    nombre,
    descripcion,
    tratamiento,
    imagenUrl,
    protocoloIds = [],
  } = await req.json();

  const ids = Array.isArray(protocoloIds)
    ? [
        ...new Set(
          protocoloIds.filter(
            (id: unknown): id is string =>
              typeof id === "string" && id.trim().length > 0
          )
        ),
      ]
    : [];

  if (!nombre) {
    return NextResponse.json(
      { error: "El nombre es requerido" },
      { status: 400 }
    );
  }

  const aplicacion = await prisma.aplicacionCds.create({
    data: {
      nombre,
      descripcion: descripcion || null,
      tratamiento: tratamiento || null,
      imagenUrl: imagenUrl || null,
      protocolos: {
        create: ids.map((protocoloId, orden) => ({
          protocoloId,
          orden,
        })),
      },
    },
  });

  return NextResponse.json(aplicacion);
}
