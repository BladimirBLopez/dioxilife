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

type TipoActividad =
  (typeof TIPOS)[number];

type RecordatorioActividad =
  (typeof RECORDATORIOS)[number];

type ActividadPreparada = {
  tipo: TipoActividad;
  recordatorio: RecordatorioActividad;
  titulo: string;
  descripcion: string | null;
  momento: string | null;
  hora: string | null;
  diaInicio: number;
  diaFin: number | null;
  orden: number;
};

function esRegistro(
  valor: unknown
): valor is Record<string, unknown> {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor)
  );
}

function horaValida(
  hora: string
) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
    hora
  );
}

function normalizarActividad(
  valor: unknown,
  duracionDias: number,
  indice: number
):
  | {
      ok: true;
      actividad: ActividadPreparada;
    }
  | {
      ok: false;
      error: string;
    } {
  if (!esRegistro(valor)) {
    return {
      ok: false,
      error:
        `La actividad ${indice + 1} no tiene un formato válido.`,
    };
  }

  const titulo =
    typeof valor.titulo === "string"
      ? valor.titulo.trim()
      : "";

  if (!titulo) {
    return {
      ok: false,
      error:
        `La actividad ${indice + 1} necesita un título.`,
    };
  }

  if (titulo.length > 200) {
    return {
      ok: false,
      error:
        `El título de la actividad ${indice + 1} no puede superar los 200 caracteres.`,
    };
  }

  const descripcion =
    typeof valor.descripcion === "string" &&
    valor.descripcion.trim()
      ? valor.descripcion
          .trim()
          .slice(0, 1500)
      : null;

  const momento =
    typeof valor.momento === "string" &&
    valor.momento.trim()
      ? valor.momento
          .trim()
          .slice(0, 60)
      : null;

  const hora =
    typeof valor.hora === "string" &&
    valor.hora.trim()
      ? valor.hora.trim()
      : null;

  if (
    hora &&
    !horaValida(hora)
  ) {
    return {
      ok: false,
      error:
        `La hora de "${titulo}" debe tener formato HH:MM.`,
    };
  }

  const tipoSolicitado =
    typeof valor.tipo === "string"
      ? valor.tipo
      : "TAREA";

  const tipo: TipoActividad =
    TIPOS.includes(
      tipoSolicitado as TipoActividad
    )
      ? (tipoSolicitado as TipoActividad)
      : "TAREA";

  const recordatorioSolicitado =
    typeof valor.recordatorio === "string"
      ? valor.recordatorio
      : "NINGUNO";

  const recordatorio: RecordatorioActividad =
    RECORDATORIOS.includes(
      recordatorioSolicitado as RecordatorioActividad
    )
      ? (recordatorioSolicitado as RecordatorioActividad)
      : "NINGUNO";

  if (
    recordatorio !== "NINGUNO" &&
    !hora
  ) {
    return {
      ok: false,
      error:
        `"${titulo}" necesita una hora para utilizar recordatorio.`,
    };
  }

  const diaInicio =
    Number(valor.diaInicio);

  if (
    !Number.isInteger(diaInicio) ||
    diaInicio < 1 ||
    diaInicio > duracionDias
  ) {
    return {
      ok: false,
      error:
        `El día inicial de "${titulo}" debe estar entre 1 y ${duracionDias}.`,
    };
  }

  const diaFin =
    valor.diaFin === null ||
    valor.diaFin === undefined ||
    valor.diaFin === ""
      ? null
      : Number(valor.diaFin);

  if (
    diaFin !== null &&
    (
      !Number.isInteger(diaFin) ||
      diaFin < diaInicio ||
      diaFin > duracionDias
    )
  ) {
    return {
      ok: false,
      error:
        `El día final de "${titulo}" debe estar entre el día inicial y ${duracionDias}.`,
    };
  }

  const ordenSolicitado =
    Number(valor.orden);

  const orden =
    Number.isFinite(
      ordenSolicitado
    )
      ? Math.trunc(
          ordenSolicitado
        )
      : indice + 1;

  return {
    ok: true,

    actividad: {
      tipo,
      recordatorio,
      titulo,
      descripcion,
      momento,
      hora,
      diaInicio,
      diaFin,
      orden,
    },
  };
}

export async function GET() {
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

  const planes =
    await prisma.planSeguimiento.findMany({
      orderBy: {
        createdAt: "desc",
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

  return NextResponse.json(
    planes
  );
}

export async function POST(
  req: NextRequest
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

  const body: unknown =
    await req.json();

  if (!esRegistro(body)) {
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

  const nombre =
    typeof body.nombre === "string"
      ? body.nombre.trim()
      : "";

  const descripcion =
    typeof body.descripcion === "string" &&
    body.descripcion.trim()
      ? body.descripcion
          .trim()
          .slice(0, 1500)
      : null;

  const duracionDias =
    Number(
      body.duracionDias
    );

  const estadoSolicitado =
    typeof body.estado === "string"
      ? body.estado
      : "BORRADOR";

  if (!nombre) {
    return NextResponse.json(
      {
        error:
          "El nombre de la plantilla es obligatorio.",
      },
      {
        status: 400,
      }
    );
  }

  if (nombre.length > 200) {
    return NextResponse.json(
      {
        error:
          "El nombre de la plantilla no puede superar los 200 caracteres.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !Number.isInteger(
      duracionDias
    ) ||
    duracionDias < 1 ||
    duracionDias > 365
  ) {
    return NextResponse.json(
      {
        error:
          "La duración debe estar entre 1 y 365 días.",
      },
      {
        status: 400,
      }
    );
  }

  const estado =
    estadoSolicitado ===
      "ACTIVO" ||
    estadoSolicitado ===
      "INACTIVO"
      ? estadoSolicitado
      : "BORRADOR";

  const actividadesRecibidas =
    Array.isArray(
      body.actividades
    )
      ? body.actividades
      : [];

  if (
    actividadesRecibidas.length >
    100
  ) {
    return NextResponse.json(
      {
        error:
          "Una plantilla no puede recibir más de 100 actividades de una sola vez.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    estado === "ACTIVO" &&
    actividadesRecibidas.length === 0
  ) {
    return NextResponse.json(
      {
        error:
          "Agrega al menos una actividad antes de activar la plantilla.",
      },
      {
        status: 400,
      }
    );
  }

  const actividades:
    ActividadPreparada[] = [];

  for (
    let indice = 0;
    indice <
    actividadesRecibidas.length;
    indice++
  ) {
    const resultado =
      normalizarActividad(
        actividadesRecibidas[
          indice
        ],
        duracionDias,
        indice
      );

    if (!resultado.ok) {
      return NextResponse.json(
        {
          error:
            resultado.error,
        },
        {
          status: 400,
        }
      );
    }

    actividades.push(
      resultado.actividad
    );
  }

  const plan =
    await prisma.planSeguimiento.create({
      data: {
        nombre,
        descripcion,
        duracionDias,
        estado,

        actividades:
          actividades.length > 0
            ? {
                create:
                  actividades.map(
                    (
                      actividad
                    ) => ({
                      tipo:
                        actividad.tipo,

                      recordatorio:
                        actividad.recordatorio,

                      titulo:
                        actividad.titulo,

                      descripcion:
                        actividad.descripcion,

                      momento:
                        actividad.momento,

                      hora:
                        actividad.hora,

                      diaInicio:
                        actividad.diaInicio,

                      diaFin:
                        actividad.diaFin,

                      orden:
                        actividad.orden,

                      activo:
                        true,
                    })
                  ),
              }
            : undefined,
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

  return NextResponse.json(
    plan,
    {
      status: 201,
    }
  );
}
