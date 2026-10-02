import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function obtenerDia(
  valor: string
) {
  const dia = Number(valor);

  return Number.isInteger(dia)
    ? dia
    : null;
}

function obtenerPeso(
  valor: unknown
):
  | {
      ok: true;
      peso: number | null;
    }
  | {
      ok: false;
      error: string;
    } {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return {
      ok: true,
      peso: null,
    };
  }

  const peso =
    typeof valor === "number"
      ? valor
      : Number(
          String(valor)
            .replace(",", ".")
            .trim()
        );

  if (
    !Number.isFinite(peso) ||
    peso <= 0 ||
    peso > 9999.99
  ) {
    return {
      ok: false,
      error:
        "El peso debe ser un número válido mayor que 0.",
    };
  }

  return {
    ok: true,
    peso:
      Math.round(
        peso * 100
      ) / 100,
  };
}

async function obtenerSeguimiento(
  id: string
) {
  return prisma.seguimientoCliente.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      nombreCliente: true,
      nombrePlan: true,
      duracionDias: true,
      estado: true,
    },
  });
}

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      diaPlan: string;
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
      diaPlanTexto,
  } = await params;

  const diaPlan =
    obtenerDia(
      diaPlanTexto
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
    await obtenerSeguimiento(
      id
    );

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

  const registro =
    await prisma.registroDiaSeguimiento.findUnique({
      where: {
        seguimientoId_diaPlan: {
          seguimientoId:
            id,
          diaPlan,
        },
      },

      select: {
        id: true,
        diaPlan: true,
        peso: true,
        observacion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  return NextResponse.json({
    seguimiento,
    registro: registro
      ? {
          ...registro,
          peso:
            registro.peso !== null
              ? Number(
                  registro.peso
                )
              : null,
        }
      : {
          id: null,
          diaPlan,
          peso: null,
          observacion: null,
          createdAt: null,
          updatedAt: null,
        },
  });
}

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      diaPlan: string;
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
      diaPlanTexto,
  } = await params;

  const diaPlan =
    obtenerDia(
      diaPlanTexto
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
    await obtenerSeguimiento(
      id
    );

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

  const body: unknown =
    await req.json();

  if (
    typeof body !== "object" ||
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

  const resultadoPeso =
    obtenerPeso(
      datos.peso
    );

  if (!resultadoPeso.ok) {
    return NextResponse.json(
      {
        error:
          resultadoPeso.error,
      },
      {
        status: 400,
      }
    );
  }

  const observacion =
    typeof datos.observacion ===
      "string" &&
    datos.observacion.trim()
      ? datos.observacion
          .trim()
          .slice(0, 5000)
      : null;

  const registro =
    await prisma.registroDiaSeguimiento.upsert({
      where: {
        seguimientoId_diaPlan: {
          seguimientoId:
            id,
          diaPlan,
        },
      },

      create: {
        seguimientoId:
          id,
        diaPlan,
        peso:
          resultadoPeso.peso,
        observacion,
      },

      update: {
        peso:
          resultadoPeso.peso,
        observacion,
      },

      select: {
        id: true,
        diaPlan: true,
        peso: true,
        observacion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  return NextResponse.json({
    ok: true,

    registro: {
      ...registro,

      peso:
        registro.peso !== null
          ? Number(
              registro.peso
            )
          : null,
    },
  });
}
