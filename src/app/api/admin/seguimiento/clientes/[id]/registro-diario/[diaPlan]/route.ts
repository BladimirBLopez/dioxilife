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

type MedicionGlucosaEntrada = {
  numero: number;
  valor: number | null;
  hora: string | null;
  momento: string | null;
};

function obtenerMedicionesGlucosa(
  valor: unknown
):
  | {
      ok: true;
      mediciones: MedicionGlucosaEntrada[];
    }
  | {
      ok: false;
      error: string;
    } {
  if (!Array.isArray(valor)) {
    return {
      ok: false,
      error:
        "Las mediciones de glucosa no son válidas.",
    };
  }

  if (valor.length > 4) {
    return {
      ok: false,
      error:
        "Solo se permiten hasta 4 mediciones de glucosa por día.",
    };
  }

  const numeros =
    new Set<number>();

  const horasRegistradas =
    new Set<string>();

  const mediciones:
    MedicionGlucosaEntrada[] = [];

  for (
    const entrada of
      valor
  ) {
    if (
      typeof entrada !==
        "object" ||
      entrada === null ||
      Array.isArray(entrada)
    ) {
      return {
        ok: false,
        error:
          "Una de las mediciones de glucosa no es válida.",
      };
    }

    const datos =
      entrada as Record<
        string,
        unknown
      >;

    const numero =
      Number(
        datos.numero
      );

    if (
      !Number.isInteger(
        numero
      ) ||
      numero < 1 ||
      numero > 4
    ) {
      return {
        ok: false,
        error:
          "El número de medición debe estar entre 1 y 4.",
      };
    }

    if (
      numeros.has(
        numero
      )
    ) {
      return {
        ok: false,
        error:
          `La medición ${numero} está repetida.`,
      };
    }

    numeros.add(
      numero
    );

    const resultadoValor =
      numeroOpcionalAdmin(
        datos.valor,
        `La glucosa de la medición ${numero}`,
        99999.99
      );

    if (
      !resultadoValor.ok
    ) {
      return {
        ok: false,
        error:
          resultadoValor.error,
      };
    }

    const hora =
      typeof datos.hora ===
        "string"
        ? datos.hora.trim()
        : "";

    if (
      hora &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(
        hora
      )
    ) {
      return {
        ok: false,
        error:
          `La hora de la medición ${numero} no es válida.`,
      };
    }

    if (
      resultadoValor.valor !==
        null &&
      !hora
    ) {
      return {
        ok: false,
        error:
          `La hora es obligatoria en la medición ${numero} cuando registras un valor de glucosa.`,
      };
    }

    if (
      resultadoValor.valor !==
        null
    ) {
      if (
        horasRegistradas.has(
          hora
        )
      ) {
        return {
          ok: false,
          error:
            `Las mediciones de glucosa deben tener horarios diferentes. La hora ${hora} está repetida.`,
        };
      }

      horasRegistradas.add(
        hora
      );
    }

    const momento =
      typeof datos.momento ===
        "string"
        ? datos.momento.trim()
        : "";

    if (
      momento.length >
      120
    ) {
      return {
        ok: false,
        error:
          `El momento de la medición ${numero} es demasiado largo.`,
      };
    }

    mediciones.push({
      numero,

      valor:
        resultadoValor.valor,

      hora:
        hora || null,

      momento:
        momento || null,
    });
  }

  mediciones.sort(
    (a, b) =>
      a.numero -
      b.numero
  );

  return {
    ok: true,
    mediciones,
  };
}

function numeroOpcionalAdmin(
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

  const glucosasGuardadas =
    await prisma.medicionGlucosaSeguimiento.findMany({
      where: {
        seguimientoId:
          id,

        diaPlan,
      },

      orderBy: {
        numero:
          "asc",
      },

      select: {
        numero: true,
        valor: true,
        hora: true,
        momento: true,
      },
    });

  const medicionesGlucosa =
    Array.from(
      {
        length: 4,
      },
      (_, indice) => {
        const numero =
          indice + 1;

        const medicion =
          glucosasGuardadas.find(
            (item) =>
              item.numero ===
              numero
          );

        return {
          numero,

          valor:
            medicion
              ? Number(
                  medicion.valor
                )
              : null,

          hora:
            medicion?.hora ??
            null,

          momento:
            medicion?.momento ??
            null,
        };
      }
    );


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

        indicaciones: {
          where: {
            OR: [
              {
                activo: true,
              },
              {
                progresos: {
                  some: {
                    diaPlan,
                  },
                },
              },
            ],
          },

          orderBy: [
            {
              hora: "asc",
            },
            {
              orden: "asc",
            },
            {
              createdAt: "asc",
            },
          ],

          select: {
            id: true,
            hora: true,
            texto: true,
            orden: true,
            activo: true,

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
        },

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

            indicaciones:
              actividad.tipo ===
              "TAREA"
                ? actividad.indicaciones.map(
                    (indicacion) => {
                      const progresoIndicacion =
                        indicacion.progresos[0] ??
                        null;

                      return {
                        id:
                          indicacion.id,

                        hora:
                          indicacion.hora,

                        texto:
                          indicacion.texto,

                        orden:
                          indicacion.orden,

                        activo:
                          indicacion.activo,

                        completado:
                          progresoIndicacion
                            ?.completado ??
                          false,

                        completadoAt:
                          progresoIndicacion
                            ?.completadoAt ??
                          null,
                      };
                    }
                  )
                : [],

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

  const actividadesRealizadas =
    tareasDia.filter(
      (actividad) =>
        actividad.completado ===
        true
    ).length;

  const actividadesTotal =
    tareasDia.length;

  const indicacionesTotal =
    tareasDia.reduce(
      (
        total,
        actividad
      ) =>
        total +
        actividad.indicaciones.length,
      0
    );

  const indicacionesRealizadas =
    tareasDia.reduce(
      (
        total,
        actividad
      ) =>
        total +
        actividad.indicaciones.filter(
          (indicacion) =>
            indicacion.completado ===
            true
        ).length,
      0
    );

  const realizadas =
    actividadesRealizadas +
    indicacionesRealizadas;

  const total =
    actividadesTotal +
    indicacionesTotal;

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

    medicionesGlucosa,

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

      actividadesRealizadas,
      actividadesTotal,

      indicacionesRealizadas,
      indicacionesTotal,
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

  const resultadoGlucosa =
    obtenerMedicionesGlucosa(
      datos.medicionesGlucosa
    );

  if (
    !resultadoGlucosa.ok
  ) {
    return NextResponse.json(
      {
        error:
          resultadoGlucosa.error,
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

  const resultado =
    await prisma.$transaction(
      async (tx) => {
        const registro =
          await tx.registroDiaSeguimiento.upsert({
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

              observacion,
            },

            update: {
              peso:
                resultadoPeso.peso,

              cinturaCm:
                resultadoCintura.cinturaCm,

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

        for (
          const medicion of
            resultadoGlucosa.mediciones
        ) {
          if (
            medicion.valor ===
            null
          ) {
            await tx.medicionGlucosaSeguimiento.deleteMany({
              where: {
                seguimientoId:
                  id,

                diaPlan,

                numero:
                  medicion.numero,
              },
            });

            continue;
          }

          await tx.medicionGlucosaSeguimiento.upsert({
            where: {
              seguimientoId_diaPlan_numero: {
                seguimientoId:
                  id,

                diaPlan,

                numero:
                  medicion.numero,
              },
            },

            create: {
              seguimientoId:
                id,

              diaPlan,

              numero:
                medicion.numero,

              valor:
                medicion.valor,

              hora:
                medicion.hora,

              momento:
                medicion.momento,
            },

            update: {
              valor:
                medicion.valor,

              hora:
                medicion.hora,

              momento:
                medicion.momento,
            },
          });
        }

        const glucosas =
          await tx.medicionGlucosaSeguimiento.findMany({
            where: {
              seguimientoId:
                id,

              diaPlan,
            },

            orderBy: {
              numero:
                "asc",
            },

            select: {
              numero: true,
              valor: true,
              hora: true,
              momento: true,
            },
          });

        return {
          registro,
          glucosas,
        };
      }
    );

  const registro =
    resultado.registro;

  const medicionesGlucosa =
    Array.from(
      {
        length: 4,
      },
      (_, indice) => {
        const numero =
          indice + 1;

        const medicion =
          resultado.glucosas.find(
            (item) =>
              item.numero ===
              numero
          );

        return {
          numero,

          valor:
            medicion
              ? Number(
                  medicion.valor
                )
              : null,

          hora:
            medicion?.hora ??
            null,

          momento:
            medicion?.momento ??
            null,
        };
      }
    );


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

    medicionesGlucosa,
  });
}
