import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function GET(
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
    where: { id },
    include: {
      actividades: {
        orderBy: [
          { diaInicio: "asc" },
          { orden: "asc" },
          { createdAt: "asc" },
        ],
      },
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

  return NextResponse.json(plan);
}

export async function POST(
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

  const plan = await prisma.planSeguimiento.findUnique({
    where: { id },
    select: {
      id: true,
      duracionDias: true,
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
          "Este plan ya fue asignado a clientes. No se pueden agregar actividades; crea una nueva versión del plan.",
      },
      { status: 409 }
    );
  }

  const {
    titulo,
    descripcion,
    momento,
    hora,
    diaInicio,
    diaFin,
    orden,
  } = await req.json();

  const tituloLimpio = String(titulo || "").trim();
  const inicio = Number(diaInicio);
  const fin =
    diaFin === null ||
    diaFin === undefined ||
    diaFin === ""
      ? null
      : Number(diaFin);

  const ordenNumero = Number(orden || 0);

  if (!tituloLimpio) {
    return NextResponse.json(
      { error: "El título es obligatorio" },
      { status: 400 }
    );
  }

  if (
    !Number.isInteger(inicio) ||
    inicio < 1 ||
    inicio > plan.duracionDias
  ) {
    return NextResponse.json(
      {
        error: `El día inicial debe estar entre 1 y ${plan.duracionDias}`,
      },
      { status: 400 }
    );
  }

  if (
    fin !== null &&
    (
      !Number.isInteger(fin) ||
      fin < inicio ||
      fin > plan.duracionDias
    )
  ) {
    return NextResponse.json(
      {
        error:
          "El día final debe ser igual o mayor al día inicial y no superar la duración del plan",
      },
      { status: 400 }
    );
  }

  const actividad = await prisma.actividadPlan.create({
    data: {
      planId: id,
      titulo: tituloLimpio,
      descripcion: descripcion
        ? String(descripcion).trim().slice(0, 1500)
        : null,
      momento: momento
        ? String(momento).trim().slice(0, 60)
        : null,
      hora: hora
        ? String(hora).trim().slice(0, 20)
        : null,
      diaInicio: inicio,
      diaFin: fin,
      orden: Number.isFinite(ordenNumero)
        ? Math.trunc(ordenNumero)
        : 0,
      activo: true,
    },
  });

  return NextResponse.json(actividad);
}
