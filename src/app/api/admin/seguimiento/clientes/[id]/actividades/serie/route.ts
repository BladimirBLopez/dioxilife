import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

const RECORDATORIOS = [
  "NINGUNO",
  "A_LA_HORA",
  "MIN_15_ANTES",
  "MIN_30_ANTES",
  "MIN_60_ANTES",
] as const;

function minutosDeHora(
  valor: string
) {
  const match =
    /^([01]\d|2[0-3]):([0-5]\d)$/.exec(
      valor
    );

  if (!match) {
    return null;
  }

  return (
    Number(match[1]) * 60 +
    Number(match[2])
  );
}

function horaDeMinutos(
  total: number
) {
  const hora =
    Math.floor(total / 60);

  const minuto =
    total % 60;

  return `${String(hora).padStart(
    2,
    "0"
  )}:${String(minuto).padStart(
    2,
    "0"
  )}`;
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

  const { id } =
    await params;

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        estado: true,
        preparadoAt: true,
        duracionDias: true,

        actividades: {
          where: {
            seccion:
              "PRINCIPAL",
          },

          orderBy: {
            orden: "desc",
          },

          select: {
            orden: true,
          },

          take: 1,
        },
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
    seguimiento.estado !==
      "PENDIENTE" ||
    seguimiento.preparadoAt
  ) {
    return NextResponse.json(
      {
        error:
          "Las series de preparación solo pueden generarse antes de finalizar la preparación.",
      },
      {
        status: 409,
      }
    );
  }

  const body =
    await req
      .json()
      .catch(() => null);

  const nombreBase =
    typeof body?.nombreBase ===
    "string"
      ? body.nombreBase
          .trim()
          .slice(0, 180)
      : "";

  const descripcion =
    typeof body?.descripcion ===
    "string"
      ? body.descripcion
          .trim()
          .slice(0, 5000)
      : "";

  const horaInicio =
    typeof body?.horaInicio ===
    "string"
      ? body.horaInicio
      : "";

  const intervalo =
    Number(
      body?.intervalo
    );

  const cantidad =
    Number(
      body?.cantidad
    );

  const diaInicio =
    Number(
      body?.diaInicio
    );

  const diaFin =
    body?.diaFin === null ||
    body?.diaFin === undefined ||
    body?.diaFin === ""
      ? null
      : Number(
          body.diaFin
        );

  const recordatorio =
    RECORDATORIOS.includes(
      body?.recordatorio
    )
      ? body.recordatorio
      : "NINGUNO";

  if (!nombreBase) {
    return NextResponse.json(
      {
        error:
          "El nombre de la serie es obligatorio.",
      },
      {
        status: 400,
      }
    );
  }

  const inicioMinutos =
    minutosDeHora(
      horaInicio
    );

  if (
    inicioMinutos === null
  ) {
    return NextResponse.json(
      {
        error:
          "La hora inicial no es válida.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !Number.isInteger(
      intervalo
    ) ||
    intervalo < 1 ||
    intervalo > 360
  ) {
    return NextResponse.json(
      {
        error:
          "El intervalo debe estar entre 1 y 360 minutos.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !Number.isInteger(
      cantidad
    ) ||
    cantidad < 2 ||
    cantidad > 48
  ) {
    return NextResponse.json(
      {
        error:
          "La cantidad debe estar entre 2 y 48 actividades.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !Number.isInteger(
      diaInicio
    ) ||
    diaInicio < 1 ||
    diaInicio >
      seguimiento.duracionDias
  ) {
    return NextResponse.json(
      {
        error:
          `El día inicial debe estar entre 1 y ${seguimiento.duracionDias}.`,
      },
      {
        status: 400,
      }
    );
  }

  if (
    diaFin !== null &&
    (
      !Number.isInteger(
        diaFin
      ) ||
      diaFin <
        diaInicio ||
      diaFin >
        seguimiento.duracionDias
    )
  ) {
    return NextResponse.json(
      {
        error:
          "El día final no es válido.",
      },
      {
        status: 400,
      }
    );
  }

  const ultimoMinuto =
    inicioMinutos +
    intervalo *
      (cantidad - 1);

  if (
    ultimoMinuto >
    1439
  ) {
    return NextResponse.json(
      {
        error:
          "La serie supera las 23:59. Reduce la cantidad o el intervalo.",
      },
      {
        status: 400,
      }
    );
  }

  const ordenInicial =
    (
      seguimiento
        .actividades[0]
        ?.orden || 0
    ) + 1;

  const actividades =
    Array.from(
      {
        length:
          cantidad,
      },
      (_, indice) => ({
        seguimientoId:
          seguimiento.id,

        tipo:
          "TAREA" as const,

        seccion:
          "PRINCIPAL" as const,

        recordatorio,

        titulo:
          `${nombreBase} ${indice + 1}`,

        descripcion:
          descripcion ||
          null,

        momento:
          null,

        hora:
          horaDeMinutos(
            inicioMinutos +
              intervalo *
                indice
          ),

        diaInicio,

        diaFin,

        orden:
          ordenInicial +
          indice,

        activo:
          true,
      })
    );

  const resultado =
    await prisma.actividadSeguimiento.createMany({
      data:
        actividades,
    });

  return NextResponse.json({
    ok: true,

    cantidad:
      resultado.count,

    horarios:
      actividades.map(
        (actividad) => ({
          titulo:
            actividad.titulo,

          hora:
            actividad.hora,
        })
      ),
  });
}
