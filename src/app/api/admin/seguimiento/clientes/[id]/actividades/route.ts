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
    etapaId,
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

  return await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT "id"
      FROM "SeguimientoCliente"
      WHERE "id" = ${id}
      FOR UPDATE
    `;

    const actual =
      await tx.seguimientoCliente.findUnique({
        where: { id },
        select: {
          duracionDias: true,
          estado: true,
        },
      });

    if (!actual) {
      return NextResponse.json(
        { error: "Seguimiento no encontrado." },
        { status: 404 }
      );
    }

    if (
      actual.estado === "COMPLETADO" ||
      actual.estado === "CANCELADO"
    ) {
      return NextResponse.json(
        {
          error:
            "No se pueden crear actividades en un seguimiento finalizado.",
        },
        { status: 409 }
      );
    }

    if (
      inicio > actual.duracionDias ||
      (fin !== null && fin > actual.duracionDias)
    ) {
      return NextResponse.json(
        {
          error:
            "La actividad supera la duración actual del seguimiento.",
        },
        { status: 400 }
      );
    }

    if (
      etapaId !== undefined &&
      etapaId !== null &&
      (
        typeof etapaId !== "string" ||
        !etapaId.trim() ||
        etapaId.trim().length > 256
      )
    ) {
      return NextResponse.json(
        { error: "El identificador de etapa no es válido." },
        { status: 400 }
      );
    }

    const etapaSeleccionada =
      typeof etapaId === "string"
        ? etapaId.trim()
        : null;

    if (etapaSeleccionada) {
      const etapa =
        await tx.etapaSeguimiento.findFirst({
          where: {
            id: etapaSeleccionada,
            seguimientoId: id,
          },
          select: {
            id: true,
            diaInicio: true,
            diaFin: true,
            estado: true,
          },
        });

      if (!etapa) {
        return NextResponse.json(
          { error: "La etapa no pertenece a este seguimiento." },
          { status: 404 }
        );
      }

      if (etapa.estado !== "BORRADOR") {
        return NextResponse.json(
          {
            error:
              "Solo se pueden agregar actividades a etapas en borrador.",
          },
          { status: 409 }
        );
      }

      if (
        inicio < etapa.diaInicio ||
        inicio > etapa.diaFin ||
        (fin !== null && fin > etapa.diaFin)
      ) {
        return NextResponse.json(
          {
            error:
              `La actividad debe estar entre los días ${etapa.diaInicio} y ${etapa.diaFin} de la etapa.`,
          },
          { status: 400 }
        );
      }
    } else {
      // Si ya existe una etapa, evitar que
      // una nueva actividad se guarde sin etapa
      // y sea visible como actividad tradicional.
      const existeEtapa =
        await tx.etapaSeguimiento.findFirst({
          where: { seguimientoId: id },
          select: { id: true },
        });

      if (existeEtapa) {
        return NextResponse.json(
          {
            error:
              "Este seguimiento utiliza etapas. Selecciona una etapa para la nueva actividad.",
          },
          { status: 409 }
        );
      }
    }

    const actividad =
      await tx.actividadSeguimiento.create({
      data: {
        seguimientoId: id,
        etapaId: etapaSeleccionada,

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
  });
}
