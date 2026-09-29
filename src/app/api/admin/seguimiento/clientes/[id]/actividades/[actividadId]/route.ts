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

  const {
    id,
    actividadId,
  } = await params;

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        id,
      },

      select: {
        duracionDias: true,
        estado: true,
      },
    });

  if (!seguimiento) {
    return NextResponse.json(
      { error: "Seguimiento no encontrado" },
      { status: 404 }
    );
  }

  if (
    seguimiento.estado === "COMPLETADO" ||
    seguimiento.estado === "CANCELADO"
  ) {
    return NextResponse.json(
      {
        error:
          "No se puede modificar la agenda de un seguimiento finalizado.",
      },
      { status: 409 }
    );
  }

  const actividad =
    await prisma.actividadSeguimiento.findFirst({
      where: {
        id: actividadId,
        seguimientoId: id,
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
    tipo,
    recordatorio,
    titulo,
    descripcion,
    momento,
    hora,
    diaInicio,
    diaFin,
    orden,
    activo,
  } = await req.json();

  const tipoActividad =
    tipo === "INFORMACION" ||
    tipo === "CONTROL"
      ? tipo
      : "TAREA";

  const recordatorioActividad =
    recordatorio === "A_LA_HORA" ||
    recordatorio === "MIN_15_ANTES" ||
    recordatorio === "MIN_30_ANTES" ||
    recordatorio === "MIN_60_ANTES"
      ? recordatorio
      : "NINGUNO";

  const tituloLimpio =
    String(titulo || "").trim();

  const inicio =
    Number(diaInicio);

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
    inicio > seguimiento.duracionDias
  ) {
    return NextResponse.json(
      {
        error:
          `El día inicial debe estar entre 1 y ${seguimiento.duracionDias}`,
      },
      { status: 400 }
    );
  }

  if (
    fin !== null &&
    (
      !Number.isInteger(fin) ||
      fin < inicio ||
      fin > seguimiento.duracionDias
    )
  ) {
    return NextResponse.json(
      {
        error:
          "El día final debe ser igual o mayor al día inicial y no superar la duración del seguimiento",
      },
      { status: 400 }
    );
  }

  const resultado =
    await prisma.actividadSeguimiento.update({
      where: {
        id: actividadId,
      },

      data: {
        tipo:
          tipoActividad,

        recordatorio:
          recordatorioActividad,

        titulo:
          tituloLimpio,

        descripcion:
          descripcion
            ? String(descripcion)
                .trim()
                .slice(0, 1500)
            : null,

        momento:
          momento
            ? String(momento)
                .trim()
                .slice(0, 60)
            : null,

        hora:
          hora
            ? String(hora)
                .trim()
                .slice(0, 20)
            : null,

        diaInicio:
          inicio,

        diaFin:
          fin,

        orden:
          Number.isFinite(Number(orden))
            ? Math.trunc(Number(orden))
            : 0,

        activo:
          Boolean(activo),
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

  const {
    id,
    actividadId,
  } = await params;

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        id,
      },

      select: {
        estado: true,
      },
    });

  if (!seguimiento) {
    return NextResponse.json(
      { error: "Seguimiento no encontrado" },
      { status: 404 }
    );
  }

  if (
    seguimiento.estado === "COMPLETADO" ||
    seguimiento.estado === "CANCELADO"
  ) {
    return NextResponse.json(
      {
        error:
          "No se puede modificar la agenda de un seguimiento finalizado.",
      },
      { status: 409 }
    );
  }

  const actividad =
    await prisma.actividadSeguimiento.findFirst({
      where: {
        id: actividadId,
        seguimientoId: id,
      },

      select: {
        id: true,

        _count: {
          select: {
            progresos: true,
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

  if (
    actividad._count.progresos > 0
  ) {
    return NextResponse.json(
      {
        error:
          "Esta actividad ya tiene progreso registrado. Puedes desactivarla, pero no eliminarla.",
      },
      { status: 409 }
    );
  }

  await prisma.actividadSeguimiento.delete({
    where: {
      id: actividadId,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}
