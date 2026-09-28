import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      actividadId: string;
    }>;
  }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id, actividadId } = await params;

  const plan = await prisma.planSeguimiento.findUnique({
    where: { id },
    select: {
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
          "Este plan ya fue asignado a clientes. Sus actividades no pueden modificarse; crea una nueva versión del plan.",
      },
      { status: 409 }
    );
  }

  const actividad = await prisma.actividadPlan.findFirst({
    where: {
      id: actividadId,
      planId: id,
    },
    select: {
      id: true,
    },
  });

  if (!actividad) {
    return NextResponse.json(
      { error: "Actividad no encontrada" },
      { status: 404 }
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
    activo,
  } = await req.json();

  const tituloLimpio = String(titulo || "").trim();
  const inicio = Number(diaInicio);
  const fin =
    diaFin === null ||
    diaFin === undefined ||
    diaFin === ""
      ? null
      : Number(diaFin);

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

  const resultado = await prisma.actividadPlan.update({
    where: {
      id: actividadId,
    },
    data: {
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
      orden: Number.isFinite(Number(orden))
        ? Math.trunc(Number(orden))
        : 0,
      activo: Boolean(activo),
    },
  });

  return NextResponse.json(resultado);
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      actividadId: string;
    }>;
  }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id, actividadId } = await params;

  const actividad = await prisma.actividadPlan.findFirst({
    where: {
      id: actividadId,
      planId: id,
    },
    select: {
      id: true,
      _count: {
        select: {
          progresos: true,
        },
      },
      plan: {
        select: {
          _count: {
            select: {
              seguimientos: true,
            },
          },
        },
      },
    },
  });

  if (!actividad) {
    return NextResponse.json(
      { error: "Actividad no encontrada" },
      { status: 404 }
    );
  }

  if (actividad.plan._count.seguimientos > 0) {
    return NextResponse.json(
      {
        error:
          "Este plan ya fue asignado a clientes. Sus actividades no pueden eliminarse; crea una nueva versión del plan.",
      },
      { status: 409 }
    );
  }

  if (actividad._count.progresos > 0) {
    return NextResponse.json(
      {
        error:
          "Esta actividad ya tiene progreso registrado y no puede eliminarse. Puedes desactivarla.",
      },
      { status: 409 }
    );
  }

  await prisma.actividadPlan.delete({
    where: {
      id: actividadId,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}
