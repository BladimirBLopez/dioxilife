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

export async function GET() {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const actividades =
    await prisma.actividadBase.findMany({
      orderBy: [
        {
          activo: "desc",
        },
        {
          titulo: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

  return NextResponse.json(actividades);
}

export async function POST(req: NextRequest) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
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
      : "TAREA";

  const recordatorioSolicitado =
    typeof body.recordatorio === "string"
      ? body.recordatorio
      : "NINGUNO";

  const tipo: TipoActividad =
    TIPOS.includes(
      tipoSolicitado as TipoActividad
    )
      ? (tipoSolicitado as TipoActividad)
      : "TAREA";

  const recordatorio: RecordatorioActividad =
    RECORDATORIOS.includes(
      recordatorioSolicitado as RecordatorioActividad
    )
      ? (recordatorioSolicitado as RecordatorioActividad)
      : "NINGUNO";

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
    await prisma.actividadBase.create({
      data: {
        titulo,
        descripcion,
        tipo,
        recordatorio,
        momento,
        hora,
        activo: true,
      },
    });

  return NextResponse.json(
    actividad,
    {
      status: 201,
    }
  );
}
