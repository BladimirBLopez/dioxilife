import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  hashTokenSeguimiento,
  obtenerDiaSeguimiento,
  obtenerDiaSeguimientoFechaCalendario,
  tokenSeguimientoValido,
  seguimientoIndividualVencido,
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

const ESTADOS_ANIMO_VALIDOS = [
  "BIEN",
  "REGULAR",
  "MAL",
] as const;

function estadoAnimoOpcional(
  valor: unknown
):
  | { ok: true; valor: (typeof ESTADOS_ANIMO_VALIDOS)[number] | null }
  | { ok: false; error: string } {
  if (valor === null || valor === undefined || valor === "") {
    return { ok: true, valor: null };
  }

  if (
    typeof valor !== "string" ||
    !ESTADOS_ANIMO_VALIDOS.includes(
      valor as (typeof ESTADOS_ANIMO_VALIDOS)[number]
    )
  ) {
    return {
      ok: false,
      error: "El estado de ánimo no es válido.",
    };
  }

  return { ok: true, valor: valor as (typeof ESTADOS_ANIMO_VALIDOS)[number] };
}

function textoOpcional(
  valor: unknown,
  nombre: string,
  maximo: number
):
  | { ok: true; valor: string | null }
  | { ok: false; error: string } {
  if (valor === null || valor === undefined || valor === "") {
    return { ok: true, valor: null };
  }

  if (typeof valor !== "string") {
    return {
      ok: false,
      error: `${nombre} no es válida.`,
    };
  }

  const texto = valor.trim();

  if (texto.length > maximo) {
    return {
      ok: false,
      error: `${nombre} es demasiado larga (máximo ${maximo} caracteres).`,
    };
  }

  return { ok: true, valor: texto || null };
}

type MedicionGlucosaEntrada = {
  numero: number;
  valor: number | null;
  hora: string | null;
  momento: string | null;
};

function normalizarMedicionesGlucosa(
  valor: unknown
):
  | {
      ok: true;
      presente: boolean;
      mediciones: MedicionGlucosaEntrada[];
    }
  | {
      ok: false;
      error: string;
    } {
  if (
    valor === undefined
  ) {
    return {
      ok: true,
      presente: false,
      mediciones: [],
    };
  }

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
      numeroOpcional(
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

    const horaCruda =
      typeof datos.hora ===
        "string"
        ? datos.hora.trim()
        : "";

    if (
      horaCruda &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(
        horaCruda
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
      !horaCruda
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
          horaCruda
        )
      ) {
        return {
          ok: false,
          error:
            `Las mediciones de glucosa deben tener horarios diferentes. La hora ${horaCruda} está repetida.`,
        };
      }

      horasRegistradas.add(
        horaCruda
      );
    }

    const momentoCrudo =
      typeof datos.momento ===
        "string"
        ? datos.momento.trim()
        : "";

    if (
      momentoCrudo.length >
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
        horaCruda ||
        null,

      momento:
        momentoCrudo ||
        null,
    });
  }

  mediciones.sort(
    (a, b) =>
      a.numero -
      b.numero
  );

  return {
    ok: true,
    presente: true,
    mediciones,
  };
}


function normalizarFotos(
  valor: unknown
):
  | { ok: true; fotos: string[] }
  | { ok: false; error: string } {
  if (valor === undefined || valor === null) {
    return { ok: true, fotos: [] };
  }

  if (!Array.isArray(valor)) {
    return {
      ok: false,
      error: "Las fotos no son válidas.",
    };
  }

  if (valor.length > 6) {
    return {
      ok: false,
      error:
        "Solo se permiten hasta 6 fotos por día.",
    };
  }

  const fotos: string[] = [];

  for (const item of valor) {
    if (
      typeof item !== "string" ||
      !item.startsWith("https://") ||
      item.length > 500
    ) {
      return {
        ok: false,
        error: "Una de las fotos no es válida.",
      };
    }

    fotos.push(item);
  }

  return { ok: true, fotos };
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
      obtenerDiaSeguimientoFechaCalendario(
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
    !seguimiento.miembroGrupo &&
    seguimiento.estado === "CANCELADO"
  ) {
    return NextResponse.json(
      { error: "Este seguimiento fue cancelado." },
      { status: 410 }
    );
  }

  if (
    !seguimiento.miembroGrupo &&
    seguimiento.estado === "ACTIVO" &&
    seguimientoIndividualVencido(
      seguimiento.fechaInicio,
      seguimiento.duracionDias
    )
  ) {
    await prisma.seguimientoCliente.updateMany({
      where: {
        id: seguimiento.id,
        estado: "ACTIVO",
      },
      data: {
        estado: "COMPLETADO",
        fechaFinalizado: new Date(),
        pausadoAt: null,
      },
    });
  }

  const consulta =
    resolverConsultaMediciones(
      seguimiento
    );

const parametroDia = new URL(req.url).searchParams.get("dia");
let diaHistorico: number | null = null;

if (parametroDia !== null) {
  const dia = Number(parametroDia);
  const diaMinimo = seguimiento.miembroGrupo?.diaIngreso ?? 1;

  if (
    seguimiento.estado !== "COMPLETADO" ||
    !/^[1-9][0-9]*$/.test(parametroDia) ||
    !Number.isSafeInteger(dia) ||
    !consulta.diaActual ||
    dia < diaMinimo ||
    dia > consulta.diaActual
  ) {
    return NextResponse.json(
      { error: "Dia historico no permitido." },
      { status: 400 }
    );
  }

  diaHistorico = dia;
}


  if (!consulta.diaActual) {
    return NextResponse.json({
      diaActual: null,
      editable: false,
      registro: null,
    });
  }

  const registro =
    (consulta.editable || diaHistorico !== null) ? await prisma.registroDiaSeguimiento.findUnique({
          where: {
            seguimientoId_diaPlan: {
              seguimientoId:
                seguimiento.id,

              diaPlan: diaHistorico ?? consulta.diaActual,
            },
          },

          select: {
            diaPlan: true,
            peso: true,
            cinturaCm: true,
            glucemiaAyunas: true,
            estadoAnimo: true,
            observacion: true,
            fotos: {
              orderBy: { orden: "asc" as const },
              select: { url: true },
            },
          },
        }) : await prisma.registroDiaSeguimiento.findFirst({
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
            estadoAnimo: true,
            observacion: true,
            fotos: {
              orderBy: { orden: "asc" as const },
              select: { url: true },
            },
          },
        });

  const diaMostrado =
    registro?.diaPlan ?? (diaHistorico ?? consulta.diaActual);

  const glucosasGuardadas =
    await prisma.medicionGlucosaSeguimiento.findMany({
      where: {
        seguimientoId:
          seguimiento.id,

        diaPlan:
          diaMostrado,
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

  return NextResponse.json({
      diaMinimo: seguimiento.miembroGrupo?.diaIngreso ?? 1,
      diaMaximo: consulta.diaActual,
      historialDisponible: seguimiento.estado === "COMPLETADO",

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

      estadoAnimo:
        registro?.estadoAnimo ?? null,

      observacion:
        registro?.observacion ?? null,
    },

    medicionesGlucosa,

    fotos: (registro?.fotos ?? []).map(
      (f) => f.url
    ),
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

  const estadoAnimo =
    estadoAnimoOpcional(
      datos.estadoAnimo
    );

  if (!estadoAnimo.ok) {
    return NextResponse.json(
      { error: estadoAnimo.error },
      { status: 400 }
    );
  }

  const observacionResultado =
    textoOpcional(
      datos.observacion,
      "La observación",
      500
    );

  if (!observacionResultado.ok) {
    return NextResponse.json(
      { error: observacionResultado.error },
      { status: 400 }
    );
  }

  const tieneGlucemiaLegacy =
    Object.prototype.hasOwnProperty.call(
      datos,
      "glucemiaAyunas"
    );

  const glucemiaLegacy =
    numeroOpcional(
      datos.glucemiaAyunas,
      "La glucemia",
      99999.99
    );

  if (
    !glucemiaLegacy.ok
  ) {
    return NextResponse.json(
      {
        error:
          glucemiaLegacy.error,
      },
      {
        status: 400,
      }
    );
  }

  const resultadoGlucosa =
    normalizarMedicionesGlucosa(
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

  const fotosResultado = normalizarFotos(
    datos.fotos
  );

  if (!fotosResultado.ok) {
    return NextResponse.json(
      { error: fotosResultado.error },
      { status: 400 }
    );
  }

  const resultado =
    await prisma.$transaction(
      async (tx) => {
        const registro =
          await tx.registroDiaSeguimiento.upsert({
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
          tieneGlucemiaLegacy
            ? glucemiaLegacy.valor
            : null,

        estadoAnimo:
          estadoAnimo.valor,

        observacion:
          observacionResultado.valor,
      },

      update: {
        peso:
          peso.valor,

        cinturaCm:
          cintura.valor,

        estadoAnimo:
          estadoAnimo.valor,

        observacion:
          observacionResultado.valor,

        ...(tieneGlucemiaLegacy
          ? {
              glucemiaAyunas:
                glucemiaLegacy.valor,
            }
          : {}),
      },

      select: {
        id: true,
        diaPlan: true,
        peso: true,
        cinturaCm: true,
        glucemiaAyunas: true,
        estadoAnimo: true,
        observacion: true,
      },
    });

        if (
          resultadoGlucosa.presente
        ) {
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
                    seguimiento.id,

                  diaPlan:
                    diaActual,

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
                    seguimiento.id,

                  diaPlan:
                    diaActual,

                  numero:
                    medicion.numero,
                },
              },

              create: {
                seguimientoId:
                  seguimiento.id,

                diaPlan:
                  diaActual,

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
        }

        await tx.fotoRegistroDiaSeguimiento.deleteMany({
          where: {
            registroId: registro.id,
          },
        });

        if (fotosResultado.fotos.length > 0) {
          await tx.fotoRegistroDiaSeguimiento.createMany({
            data: fotosResultado.fotos.map(
              (url, indice) => ({
                registroId: registro.id,
                url,
                orden: indice,
              })
            ),
          });
        }

        const glucosas =
          await tx.medicionGlucosaSeguimiento.findMany({
            where: {
              seguimientoId:
                seguimiento.id,

              diaPlan:
                diaActual,
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
          fotos: fotosResultado.fotos,
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

      estadoAnimo:
        registro.estadoAnimo ?? null,

      observacion:
        registro.observacion ?? null,
    },

    medicionesGlucosa,

    fotos: resultado.fotos,
  });
}
