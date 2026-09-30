import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

const TIPOS = [
  "TAREA",
  "INFORMACION",
  "CONTROL",
] as const;

const RECORDATORIOS = [
  "NINGUNO",
  "A_LA_HORA",
  "MIN_15_ANTES",
  "MIN_30_ANTES",
  "MIN_60_ANTES",
] as const;

type TipoActividad = (typeof TIPOS)[number];
type RecordatorioActividad = (typeof RECORDATORIOS)[number];

function horaValida(hora: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora);
}

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
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

  const { id } = await params;

  const existente =
    await prisma.actividadBase.findUnique({
      where: {
        id,
      },
    });

  if (!existente) {
    return NextResponse.json(
      {
        error:
          "Actividad de biblioteca no encontrada.",
      },
      { status: 404 }
    );
  }

  const body = await req.json();

  const titulo =
    typeof body.titulo === "string"
      ? body.titulo.trim()
      : "";

  const descripcion =
    typeof body.descripcion === "string" &&
    body.descripcion.trim()
      ? body.descripcion.trim().slice(0, 5000)
      : null;

  const momento =
    typeof body.momento === "string" &&
    body.momento.trim()
      ? body.momento.trim().slice(0, 60)
      : null;

  const hora =
    typeof body.hora === "string" &&
    body.hora.trim()
      ? body.hora.trim()
      : null;

  const tipoSolicitado =
    typeof body.tipo === "string"
      ? body.tipo
      : existente.tipo;

  const recordatorioSolicitado =
    typeof body.recordatorio === "string"
      ? body.recordatorio
      : existente.recordatorio;

  const tipo: TipoActividad =
    TIPOS.includes(
      tipoSolicitado as TipoActividad
    )
      ? (tipoSolicitado as TipoActividad)
      : existente.tipo;

  const recordatorio: RecordatorioActividad =
    RECORDATORIOS.includes(
      recordatorioSolicitado as RecordatorioActividad
    )
      ? (recordatorioSolicitado as RecordatorioActividad)
      : existente.recordatorio;

  if (!titulo) {
    return NextResponse.json(
      {
        error:
          "El nombre de la actividad es obligatorio.",
      },
      { status: 400 }
    );
  }

  if (titulo.length > 200) {
    return NextResponse.json(
      {
        error:
          "El nombre de la actividad no puede superar los 200 caracteres.",
      },
      { status: 400 }
    );
  }

  if (
    hora &&
    !horaValida(hora)
  ) {
    return NextResponse.json(
      {
        error:
          "La hora debe tener un formato válido HH:MM.",
      },
      { status: 400 }
    );
  }

  const actividad =
    await prisma.actividadBase.update({
      where: {
        id,
      },

      data: {
        titulo,
        descripcion,
        tipo,
        recordatorio,
        momento,
        hora,

        activo:
          typeof body.activo === "boolean"
            ? body.activo
            : existente.activo,
      },
    });

  return NextResponse.json(
    actividad
  );
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
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

  const { id } = await params;

  const existente =
    await prisma.actividadBase.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
      },
    });

  if (!existente) {
    return NextResponse.json(
      {
        error:
          "Actividad de biblioteca no encontrada.",
      },
      { status: 404 }
    );
  }

  await prisma.actividadBase.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}
