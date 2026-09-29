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

  const planes = await prisma.planSeguimiento.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          actividades: true,
          seguimientos: true,
        },
      },
    },
  });

  return NextResponse.json(planes);
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
    duracionDias,
    estado,
  } = await req.json();

  const nombreLimpio = String(nombre || "").trim();
  const dias = Number(duracionDias);

  if (!nombreLimpio) {
    return NextResponse.json(
      { error: "El nombre del plan es obligatorio" },
      { status: 400 }
    );
  }

  if (!Number.isInteger(dias) || dias < 1 || dias > 365) {
    return NextResponse.json(
      { error: "La duración debe estar entre 1 y 365 días" },
      { status: 400 }
    );
  }

  const estadoValido =
    estado === "ACTIVO" || estado === "INACTIVO"
      ? estado
      : "BORRADOR";

  const plan = await prisma.planSeguimiento.create({
    data: {
      nombre: nombreLimpio,
      descripcion: descripcion
        ? String(descripcion).trim().slice(0, 1500)
        : null,
      duracionDias: dias,
      estado: estadoValido,
    },
    include: {
      _count: {
        select: {
          actividades: true,
          seguimientos: true,
        },
      },
    },
  });

  return NextResponse.json(plan);
}
