import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function obtenerDia(
  valor: string
) {
  const dia =
    Number(valor);

  return Number.isInteger(
    dia
  )
    ? dia
    : null;
}

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      diaPlan: string;
      actividadId: string;
      indicacionId: string;
    }>;
  }
) {
  const admin =
    await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      {
        error:
          "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  const {
    id,
    diaPlan:
      diaTexto,
    actividadId,
    indicacionId,
  } = await params;

  const diaPlan =
    obtenerDia(
      diaTexto
    );

  if (!diaPlan) {
    return NextResponse.json(
      {
        error:
          "El día del seguimiento no es válido.",
      },
      {
        status: 400,
      }
    );
  }

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
      {
        error:
          "Seguimiento no encontrado.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    diaPlan < 1 ||
    diaPlan >
      seguimiento.duracionDias
  ) {
    return NextResponse.json(
      {
        error:
          `El día debe estar entre 1 y ${seguimiento.duracionDias}.`,
      },
      {
        status: 400,
      }
    );
  }

  if (
    seguimiento.estado ===
    "CANCELADO"
  ) {
    return NextResponse.json(
      {
        error:
          "No se puede modificar un seguimiento cancelado.",
      },
      {
        status: 409,
      }
    );
  }

  const actividad =
    await prisma.actividadSeguimiento.findFirst({
      where: {
        id:
          actividadId,

        seguimientoId:
          id,
      },

      select: {
        id: true,
        tipo: true,
        seccion: true,
        diaInicio: true,
        diaFin: true,

        indicaciones: {
          where: {
            id:
              indicacionId,
          },

          select: {
            id: true,
          },

          take: 1,
        },
      },
    });

  if (!actividad) {
    return NextResponse.json(
      {
        error:
          "Actividad no encontrada.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    actividad.tipo !==
    "TAREA"
  ) {
    return NextResponse.json(
      {
        error:
          "Las indicaciones solo pueden marcarse dentro de actividades de tipo tarea.",
      },
      {
        status: 409,
      }
    );
  }

  const ultimoDia =
    actividad.diaFin ??
    (
      actividad.seccion ===
        "ADICIONAL"
        ? seguimiento.duracionDias
        : actividad.diaInicio
    );

  if (
    diaPlan <
      actividad.diaInicio ||
    diaPlan >
      ultimoDia
  ) {
    return NextResponse.json(
      {
        error:
          "Esta actividad no corresponde al día seleccionado.",
      },
      {
        status: 409,
      }
    );
  }

  if (
    actividad.indicaciones.length ===
    0
  ) {
    return NextResponse.json(
      {
        error:
          "Indicación no encontrada.",
      },
      {
        status: 404,
      }
    );
  }

  const body: unknown =
    await req.json();

  if (
    typeof body !==
      "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      {
        error:
          "Los datos enviados no son válidos.",
      },
      {
        status: 400,
      }
    );
  }

  const datos =
    body as Record<
      string,
      unknown
    >;

  if (
    typeof datos.completado !==
    "boolean"
  ) {
    return NextResponse.json(
      {
        error:
          "El estado completado debe ser verdadero o falso.",
      },
      {
        status: 400,
      }
    );
  }

  const completado =
    datos.completado;

  const progreso =
    await prisma.progresoIndicacion.upsert({
      where: {
        indicacionActividadSeguimientoId_diaPlan:
          {
            indicacionActividadSeguimientoId:
              indicacionId,

            diaPlan,
          },
      },

      create: {
        indicacionActividadSeguimientoId:
          indicacionId,

        diaPlan,

        completado,

        completadoAt:
          completado
            ? new Date()
            : null,
      },

      update: {
        completado,

        completadoAt:
          completado
            ? new Date()
            : null,
      },

      select: {
        indicacionActividadSeguimientoId:
          true,

        diaPlan: true,
        completado: true,
        completadoAt: true,
      },
    });

  return NextResponse.json({
    ok: true,
    progreso,
  });
}
