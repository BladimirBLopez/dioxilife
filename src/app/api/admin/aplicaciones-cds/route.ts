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

  const { nombre, descripcion, tratamiento, imagenUrl } = await req.json();

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
    },
  });

  return NextResponse.json(aplicacion);
}
