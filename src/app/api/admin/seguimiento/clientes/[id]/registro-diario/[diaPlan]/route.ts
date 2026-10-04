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

function obtenerCintura(
  valor: unknown
):
  | {
      ok: true;
      cinturaCm: number | null;
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
      cinturaCm: null,
    };
  }

  const cinturaCm =
    typeof valor === "number"
      ? valor
      : Number(
          String(valor)
            .replace(",", ".")
            .trim()
        );

  if (
    !Number.isFinite(cinturaCm) ||
    cinturaCm <= 0 ||
    cinturaCm > 9999.99
  ) {
    return {
      ok: false,
      error:
        "La medida de cintura debe ser un número válido mayor que 0.",
    };
  }

  return {
    ok: true,
    cinturaCm:
      Math.round(
        cinturaCm * 100
      ) / 100,
  };
}

function obtenerGlucemia(
  valor: unknown
):
  | {
      ok: true;
      glucemiaAyunas: number | null;
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
      glucemiaAyunas: null,
    };
  }

  const glucemiaAyunas =
    typeof valor === "number"
      ? valor
      : Number(
          String(valor)
            .replace(",", ".")
            .trim()
        );

  if (
    !Number.isFinite(glucemiaAyunas) ||
    glucemiaAyunas <= 0 ||
    glucemiaAyunas > 99999.99
  ) {
    return {
      ok: false,
      error:
        "La glucemia debe ser un número válido mayor que 0.",
    };
  }

  return {
    ok: true,
    glucemiaAyunas:
      Math.round(
        glucemiaAyunas * 100
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
        cinturaCm: true,
        glucemiaAyunas: true,
        observacion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  const pesosRegistrados =
    await prisma.registroDiaSeguimiento.findMany({
      where: {
        seguimientoId: id,
        peso: {
          not: null,
        },
      },

      orderBy: {
        diaPlan: "asc",
      },

      select: {
        diaPlan: true,
        peso: true,
      },
    });

  const pesos =
    pesosRegistrados.map(
      (registro) => ({
        diaPlan:
          registro.diaPlan,

        peso:
          Number(
            registro.peso
          ),
      })
    );

  const pesoInicial =
    pesos.length > 0
      ? pesos[0]
      : null;

  const ultimoPeso =
    pesos.length > 0
      ? pesos[
          pesos.length - 1
        ]
      : null;

  const pesoPromedio =
    pesos.length > 0
      ? Math.round(
          (
            pesos.reduce(
              (
                acumulado,
                registro
              ) =>
                acumulado +
                registro.peso,
              0
            ) /
            pesos.length
          ) *
            100
        ) / 100
      : null;

  const cambioPeso =
    pesoInicial &&
    ultimoPeso
      ? Math.round(
          (
            ultimoPeso.peso -
            pesoInicial.peso
          ) *
            100
        ) / 100
      : null;

  const actividades =
    await prisma.actividadSeguimiento.findMany({
      where: {
        seguimientoId: id,
      },

      select: {
        id: true,
        tipo: true,
        seccion: true,
        titulo: true,
        descripcion: true,
        momento: true,
        hora: true,
        diaInicio: true,
        diaFin: true,
        orden: true,
        activo: true,
        createdAt: true,

        progresos: {
          where: {
            diaPlan,
          },

          select: {
            completado: true,
            completadoAt: true,
          },

          take: 1,
        },
      },
    });

  const actividadesDia =
    actividades
      .filter(
        (actividad) => {
          const ultimoDia =
            actividad.diaFin ??
            (
              actividad.seccion ===
                "ADICIONAL"
                ? seguimiento.duracionDias
                : actividad.diaInicio
            );

          const tieneProgreso =
            actividad.progresos.length >
            0;

          return (
            diaPlan >=
              actividad.diaInicio &&
            diaPlan <=
              ultimoDia &&
            (
              actividad.activo ||
              tieneProgreso
            )
          );
        }
      )
      .sort(
        (a, b) => {
          const seccionA =
            a.seccion ===
            "PRINCIPAL"
              ? 0
              : 1;

          const seccionB =
            b.seccion ===
            "PRINCIPAL"
              ? 0
              : 1;

          if (
            seccionA !==
            seccionB
          ) {
            return (
              seccionA -
              seccionB
            );
          }

          if (
            a.hora &&
            b.hora
          ) {
            const comparacionHora =
              a.hora.localeCompare(
                b.hora
              );

            if (
              comparacionHora !==
              0
            ) {
              return comparacionHora;
            }
          } else if (
            a.hora &&
            !b.hora
          ) {
            return -1;
          } else if (
            !a.hora &&
            b.hora
          ) {
            return 1;
          }

          if (
            a.orden !==
            b.orden
          ) {
            return (
              a.orden -
              b.orden
            );
          }

          return (
            a.createdAt.getTime() -
            b.createdAt.getTime()
          );
        }
      )
      .map(
        (actividad) => {
          const progreso =
            actividad.progresos[0] ??
            null;

          return {
            id:
              actividad.id,

            tipo:
              actividad.tipo,

            seccion:
              actividad.seccion,

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
              actividad.activo,

            completado:
              actividad.tipo ===
              "TAREA"
                ? progreso
                    ?.completado ??
                  false
                : null,

            completadoAt:
              progreso
                ?.completadoAt ??
              null,
          };
        }
      );

  const tareasDia =
    actividadesDia.filter(
      (actividad) =>
        actividad.tipo ===
        "TAREA"
    );

  const realizadas =
    tareasDia.filter(
      (actividad) =>
        actividad.completado ===
        true
    ).length;

  const total =
    tareasDia.length;

  const porcentaje =
    total > 0
      ? Math.round(
          (
            realizadas /
            total
          ) * 100
        )
      : 0;

  return NextResponse.json({
    seguimiento,

    registro: registro
      ? {
          ...registro,

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
        }
      : {
          id: null,
          diaPlan,
          peso: null,
          cinturaCm: null,
          glucemiaAyunas: null,
          observacion: null,
          createdAt: null,
          updatedAt: null,
        },

    actividades:
      actividadesDia,

    resumenPeso: {
      cantidadRegistros:
        pesos.length,

      pesoInicial,

      ultimoPeso,

      pesoPromedio,

      cambio:
        cambioPeso,

      esPesoFinal:
        seguimiento.estado ===
        "COMPLETADO",
    },

    resumen: {
      realizadas,
      pendientes:
        total -
        realizadas,
      total,
      porcentaje,
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

  const resultadoCintura =
    obtenerCintura(
      datos.cinturaCm
    );

  if (!resultadoCintura.ok) {
    return NextResponse.json(
      {
        error:
          resultadoCintura.error,
      },
      {
        status: 400,
      }
    );
  }

  const resultadoGlucemia =
    obtenerGlucemia(
      datos.glucemiaAyunas
    );

  if (!resultadoGlucemia.ok) {
    return NextResponse.json(
      {
        error:
          resultadoGlucemia.error,
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

        cinturaCm:
          resultadoCintura.cinturaCm,

        glucemiaAyunas:
          resultadoGlucemia.glucemiaAyunas,

        observacion,
      },

      update: {
        peso:
          resultadoPeso.peso,

        cinturaCm:
          resultadoCintura.cinturaCm,

        glucemiaAyunas:
          resultadoGlucemia.glucemiaAyunas,

        observacion,
      },

      select: {
        id: true,
        diaPlan: true,
        peso: true,
        cinturaCm: true,
        glucemiaAyunas: true,
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

      cinturaCm:
        registro.cinturaCm !== null
          ? Number(
              registro.cinturaCm
            )
          : null,

      glucemiaAyunas:
        registro.glucemiaAyunas !== null
          ? Number(
              registro.glucemiaAyunas
            )
          : null,
    },
  });
}
