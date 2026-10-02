import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function GET(
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

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        duracionDias: true,

        actividades: {
          orderBy: [
            { diaInicio: "asc" },
            { orden: "asc" },
            {
              hora: {
                sort: "asc",
                nulls: "last",
              },
            },
            { createdAt: "asc" },
          ],

          select: {
            id: true,
            tipo: true,
            recordatorio: true,
            seccion: true,
            titulo: true,
            descripcion: true,
            momento: true,
            hora: true,
            diaInicio: true,
            diaFin: true,
            orden: true,
            activo: true,
          },
        },
      },
    });

  if (!seguimiento) {
    return NextResponse.json(
      { error: "Seguimiento no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(seguimiento);
}

export async function POST(
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

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
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

  const {
    tipo,
    recordatorio,
    seccion,
    titulo,
    descripcion,
    momento,
    hora,
    diaInicio,
    diaFin,
    orden,
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

  const seccionActividad =
    seccion === "ADICIONAL"
      ? "ADICIONAL"
      : "PRINCIPAL";

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

  const ordenNumero =
    Number(orden || 0);

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

  const actividad =
    await prisma.actividadSeguimiento.create({
      data: {
        seguimientoId: id,

        tipo: tipoActividad,

        recordatorio: recordatorioActividad,

        seccion: seccionActividad,

        titulo: tituloLimpio,

        descripcion:
          descripcion
            ? String(descripcion)
                .trim()
                .slice(0, 5000)
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
          Number.isFinite(ordenNumero)
            ? Math.trunc(ordenNumero)
            : 0,

        activo:
          true,
      },
    });

  return NextResponse.json(actividad);
}
