import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  hashTokenSeguimiento,
  obtenerDiaSeguimiento,
  tokenSeguimientoValido,
} from "@/lib/seguimiento-publico";

function numeroOpcional(
  valor: unknown,
  nombre: string,
  maximo: number
):
  | {
      ok: true;
      valor: number | null;
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
      valor: null,
    };
  }

  const numero =
    typeof valor === "number"
      ? valor
      : Number(
          String(valor)
            .replace(",", ".")
            .trim()
        );

  if (
    !Number.isFinite(numero) ||
    numero <= 0 ||
    numero > maximo
  ) {
    return {
      ok: false,
      error:
        `${nombre} debe ser un número válido mayor que 0.`,
    };
  }

  return {
    ok: true,
    valor:
      Math.round(
        numero * 100
      ) / 100,
  };
}

async function obtenerSeguimiento(
  token: string
) {
  if (
    !tokenSeguimientoValido(
      token
    )
  ) {
    return null;
  }

  return prisma.seguimientoCliente.findUnique({
    where: {
      tokenAccesoHash:
        hashTokenSeguimiento(
          token
        ),
    },

    select: {
      id: true,
      estado: true,
      fechaInicio: true,
      duracionDias: true,
    },
  });
}

function obtenerDiaActual(
  seguimiento: {
    fechaInicio: Date | null;
    duracionDias: number;
  }
) {
  if (
    !seguimiento.fechaInicio
  ) {
    return null;
  }

  return Math.max(
    1,
    Math.min(
      obtenerDiaSeguimiento(
        seguimiento.fechaInicio
      ),
      seguimiento.duracionDias
    )
  );
}

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      token: string;
    }>;
  }
) {
  const {
    token,
  } = await params;

  const seguimiento =
    await obtenerSeguimiento(
      token
    );

  if (!seguimiento) {
    return NextResponse.json(
      {
        error:
          "El enlace de seguimiento no es válido.",
      },
      {
        status: 404,
      }
    );
  }

  const diaActual =
    obtenerDiaActual(
      seguimiento
    );

  if (!diaActual) {
    return NextResponse.json({
      diaActual: null,
      registro: null,
    });
  }

  const registro =
    await prisma.registroDiaSeguimiento.findUnique({
      where: {
        seguimientoId_diaPlan: {
          seguimientoId:
            seguimiento.id,

          diaPlan:
            diaActual,
        },
      },

      select: {
        diaPlan: true,
        peso: true,
        cinturaCm: true,
        glucemiaAyunas: true,
      },
    });

  return NextResponse.json({
    diaActual,

    editable:
      seguimiento.estado ===
      "ACTIVO",

    registro: {
      diaPlan:
        diaActual,

      peso:
        registro?.peso !==
          null &&
        registro?.peso !==
          undefined
          ? Number(
              registro.peso
            )
          : null,

      cinturaCm:
        registro?.cinturaCm !==
          null &&
        registro?.cinturaCm !==
          undefined
          ? Number(
              registro.cinturaCm
            )
          : null,

      glucemiaAyunas:
        registro?.glucemiaAyunas !==
          null &&
        registro?.glucemiaAyunas !==
          undefined
          ? Number(
              registro.glucemiaAyunas
            )
          : null,
    },
  });
}

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      token: string;
    }>;
  }
) {
  const {
    token,
  } = await params;

  const seguimiento =
    await obtenerSeguimiento(
      token
    );

  if (!seguimiento) {
    return NextResponse.json(
      {
        error:
          "El enlace de seguimiento no es válido.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    seguimiento.estado !==
    "ACTIVO"
  ) {
    return NextResponse.json(
      {
        error:
          "Las mediciones solo pueden registrarse mientras el seguimiento está activo.",
      },
      {
        status: 409,
      }
    );
  }

  const diaActual =
    obtenerDiaActual(
      seguimiento
    );

  if (!diaActual) {
    return NextResponse.json(
      {
        error:
          "El seguimiento todavía no tiene una fecha de inicio.",
      },
      {
        status: 409,
      }
    );
  }

  const body: unknown =
    await req
      .json()
      .catch(() => null);

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

  const peso =
    numeroOpcional(
      datos.peso,
      "El peso",
      9999.99
    );

  if (!peso.ok) {
    return NextResponse.json(
      {
        error:
          peso.error,
      },
      {
        status: 400,
      }
    );
  }

  const cintura =
    numeroOpcional(
      datos.cinturaCm,
      "La medida de cintura",
      9999.99
    );

  if (!cintura.ok) {
    return NextResponse.json(
      {
        error:
          cintura.error,
      },
      {
        status: 400,
      }
    );
  }

  const glucemia =
    numeroOpcional(
      datos.glucemiaAyunas,
      "La glucemia",
      99999.99
    );

  if (!glucemia.ok) {
    return NextResponse.json(
      {
        error:
          glucemia.error,
      },
      {
        status: 400,
      }
    );
  }

  const registro =
    await prisma.registroDiaSeguimiento.upsert({
      where: {
        seguimientoId_diaPlan: {
          seguimientoId:
            seguimiento.id,

          diaPlan:
            diaActual,
        },
      },

      create: {
        seguimientoId:
          seguimiento.id,

        diaPlan:
          diaActual,

        peso:
          peso.valor,

        cinturaCm:
          cintura.valor,

        glucemiaAyunas:
          glucemia.valor,
      },

      update: {
        peso:
          peso.valor,

        cinturaCm:
          cintura.valor,

        glucemiaAyunas:
          glucemia.valor,
      },

      select: {
        diaPlan: true,
        peso: true,
        cinturaCm: true,
        glucemiaAyunas: true,
      },
    });

  return NextResponse.json({
    ok: true,

    registro: {
      diaPlan:
        registro.diaPlan,

      peso:
        registro.peso !==
        null
          ? Number(
              registro.peso
            )
          : null,

      cinturaCm:
        registro.cinturaCm !==
        null
          ? Number(
              registro.cinturaCm
            )
          : null,

      glucemiaAyunas:
        registro.glucemiaAyunas !==
        null
          ? Number(
              registro.glucemiaAyunas
            )
          : null,
    },
  });
}
