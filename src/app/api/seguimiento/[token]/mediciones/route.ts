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

import {
  resolverDiaRegistroPublico,
} from "@/lib/seguimiento-publico-grupo";

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

      miembroGrupo: {
        select: {
          estado: true,
          diaIngreso: true,
          fechaRetiro: true,

          grupo: {
            select: {
              estado: true,
              fechaInicio: true,
              duracionDias: true,
            },
          },
        },
      },
    },
  });
}

function resolverConsultaMediciones(
  seguimiento: {
    estado: string;
    fechaInicio: Date | null;
    duracionDias: number;

    miembroGrupo:
      | {
          estado: string;
          diaIngreso: number;
          fechaRetiro: Date | null;

          grupo: {
            estado: string;
            fechaInicio: Date;
            duracionDias: number;
          };
        }
      | null;
  }
) {
  if (
    seguimiento.miembroGrupo
  ) {
    const miembro =
      seguimiento.miembroGrupo;

    const grupo =
      miembro.grupo;

    const diaActualGrupo =
      obtenerDiaSeguimiento(
        grupo.fechaInicio
      );

    const diaRetiro =
      miembro.estado ===
          "RETIRADO" &&
        miembro.fechaRetiro
        ? Math.floor(
            (
              Date.UTC(
                miembro.fechaRetiro
                  .getUTCFullYear(),
                miembro.fechaRetiro
                  .getUTCMonth(),
                miembro.fechaRetiro
                  .getUTCDate()
              ) -
              Date.UTC(
                grupo.fechaInicio
                  .getUTCFullYear(),
                grupo.fechaInicio
                  .getUTCMonth(),
                grupo.fechaInicio
                  .getUTCDate()
              )
            ) /
              86400000
          ) + 1
        : null;

    const diaCalculado =
      diaRetiro !== null
        ? Math.min(
            diaActualGrupo,
            diaRetiro
          )
        : diaActualGrupo;

    if (
      diaCalculado < 1
    ) {
      return {
        diaActual:
          null as number | null,

        editable:
          false,
      };
    }

    const diaActual =
      Math.max(
        miembro.diaIngreso,
        Math.min(
          diaCalculado,
          grupo.duracionDias
        )
      );

    const editable =
      seguimiento.estado ===
        "ACTIVO" &&
      miembro.estado ===
        "ACTIVO" &&
      grupo.estado ===
        "ACTIVO" &&
      diaCalculado >=
        miembro.diaIngreso &&
      diaCalculado <=
        grupo.duracionDias;

    return {
      diaActual,
      editable,
    };
  }

  if (
    !seguimiento.fechaInicio
  ) {
    return {
      diaActual:
        null as number | null,

      editable:
        false,
    };
  }

  const diaCalculado =
    obtenerDiaSeguimiento(
      seguimiento.fechaInicio
    );

  if (
    diaCalculado < 1
  ) {
    return {
      diaActual:
        null as number | null,

      editable:
        false,
    };
  }

  return {
    diaActual:
      Math.min(
        diaCalculado,
        seguimiento.duracionDias
      ),

    editable:
      seguimiento.estado ===
        "ACTIVO" &&
      diaCalculado <=
        seguimiento.duracionDias,
  };
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

  const consulta =
    resolverConsultaMediciones(
      seguimiento
    );

  if (!consulta.diaActual) {
    return NextResponse.json({
      diaActual: null,
      editable: false,
      registro: null,
    });
  }

  const registro =
    consulta.editable
      ? await prisma.registroDiaSeguimiento.findUnique({
          where: {
            seguimientoId_diaPlan: {
              seguimientoId:
                seguimiento.id,

              diaPlan:
                consulta.diaActual,
            },
          },

          select: {
            diaPlan: true,
            peso: true,
            cinturaCm: true,
            glucemiaAyunas: true,
          },
        })
      : await prisma.registroDiaSeguimiento.findFirst({
          where: {
            seguimientoId:
              seguimiento.id,

            diaPlan: {
              lte:
                consulta.diaActual,

              ...(seguimiento
                .miembroGrupo
                ? {
                    gte:
                      seguimiento
                        .miembroGrupo
                        .diaIngreso,
                  }
                : {}),
            },
          },

          orderBy: {
            diaPlan:
              "desc",
          },

          select: {
            diaPlan: true,
            peso: true,
            cinturaCm: true,
            glucemiaAyunas: true,
          },
        });

  const diaMostrado =
    registro?.diaPlan ??
    consulta.diaActual;

  return NextResponse.json({
    diaActual:
      diaMostrado,

    editable:
      consulta.editable,

    registro: {
      diaPlan:
        diaMostrado,

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

  const resolucionDia =
    resolverDiaRegistroPublico({
      estado:
        seguimiento.estado,

      fechaInicio:
        seguimiento.fechaInicio,

      duracionDias:
        seguimiento.duracionDias,

      miembroGrupo:
        seguimiento.miembroGrupo,
    });

  if (
    !resolucionDia.ok
  ) {
    return NextResponse.json(
      {
        error:
          resolucionDia.error,
      },
      {
        status:
          resolucionDia.status,
      }
    );
  }

  const diaActual =
    resolucionDia.diaPlan;


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
