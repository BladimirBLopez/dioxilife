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

  const existente = await prisma.planSeguimiento.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      duracionDias: true,
      estado: true,
      _count: {
        select: {
          seguimientos: true,
        },
      },
    },
  });

  if (!existente) {
    return NextResponse.json(
      { error: "Plan no encontrado" },
      { status: 404 }
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
    estado === "ACTIVO" ||
    estado === "INACTIVO" ||
    estado === "BORRADOR"
      ? estado
      : "BORRADOR";

  const descripcionLimpia = descripcion
    ? String(descripcion).trim().slice(0, 1500)
    : null;

  if (existente._count.seguimientos > 0) {
    const cambioContenido =
      nombreLimpio !== existente.nombre ||
      descripcionLimpia !== existente.descripcion ||
      dias !== existente.duracionDias;

    if (cambioContenido) {
      return NextResponse.json(
        {
          error:
            "Este plan ya fue asignado a clientes. Su contenido no puede modificarse; crea una nueva versión del plan.",
        },
        { status: 409 }
      );
    }
  }

  const plan = await prisma.planSeguimiento.update({
    where: {
      id,
    },
    data: {
      nombre: nombreLimpio,
      descripcion: descripcionLimpia,
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

  const plan = await prisma.planSeguimiento.findUnique({
    where: {
      id,
    },
    select: {
      _count: {
        select: {
          seguimientos: true,
        },
      },
    },
  });

  if (!plan) {
    return NextResponse.json(
      { error: "Plan no encontrado" },
      { status: 404 }
    );
  }

  if (plan._count.seguimientos > 0) {
    return NextResponse.json(
      {
        error:
          "Este plan ya fue asignado a clientes y no puede eliminarse. Puedes cambiarlo a INACTIVO.",
      },
      { status: 409 }
    );
  }

  await prisma.planSeguimiento.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}
