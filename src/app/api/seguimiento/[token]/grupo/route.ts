import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  hashTokenSeguimiento,
  tokenSeguimientoValido,
} from "@/lib/seguimiento-publico";

const MS_DIA =
  24 * 60 * 60 * 1000;

function hoyBoliviaUtc() {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/La_Paz",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const valor = (
    tipo: string
  ) =>
    partes.find(
      (parte) =>
        parte.type === tipo
    )?.value || "";

  return Date.UTC(
    Number(valor("year")),
    Number(valor("month")) - 1,
    Number(valor("day"))
  );
}

function obtenerDiaGrupo(
  fechaInicio: Date,
  duracionDias: number,
  finalizado: boolean
) {
  if (finalizado) {
    return duracionDias;
  }

  const inicio =
    Date.UTC(
      fechaInicio.getUTCFullYear(),
      fechaInicio.getUTCMonth(),
      fechaInicio.getUTCDate()
    );

  const diferencia =
    Math.floor(
      (
        hoyBoliviaUtc() -
        inicio
      ) / MS_DIA
    ) + 1;

  if (diferencia < 1) {
    return 0;
  }

  return Math.min(
    diferencia,
    duracionDias
  );
}

type Progreso = {
  diaPlan: number;
  completado: boolean;
};

type Indicacion = {
  activo: boolean;
  progresos: Progreso[];
};

type Actividad = {
  tipo:
    | "TAREA"
    | "INFORMACION"
    | "CONTROL";

  seccion:
    | "PRINCIPAL"
    | "ADICIONAL";

  diaInicio: number;
  diaFin: number | null;
  activo: boolean;

  progresos: Progreso[];
  indicaciones: Indicacion[];
};

function actividadEnDia(
  actividad: Actividad,
  diaPlan: number,
  duracionDias: number
) {
  if (!actividad.activo) {
    return false;
  }

  const ultimoDia =
    actividad.diaFin ??
    (
      actividad.seccion ===
        "ADICIONAL"
        ? duracionDias
        : actividad.diaInicio
    );

  return (
    diaPlan >=
      actividad.diaInicio &&
    diaPlan <=
      ultimoDia
  );
}

function calcularCumplimiento(
  actividades: Actividad[],
  desde: number,
  hasta: number,
  duracionDias: number
) {
  if (
    hasta < desde ||
    hasta < 1
  ) {
    return {
      completados: 0,
      total: 0,
      porcentaje: 0,
    };
  }

  let completados = 0;
  let total = 0;

  for (
    let dia = desde;
    dia <= hasta;
    dia++
  ) {
    for (
      const actividad of
      actividades
    ) {
      if (
        !actividadEnDia(
          actividad,
          dia,
          duracionDias
        ) ||
        actividad.tipo !==
          "TAREA"
      ) {
        continue;
      }

      total++;

      if (
        actividad.progresos.some(
          (progreso) =>
            progreso.diaPlan ===
              dia &&
            progreso.completado
        )
      ) {
        completados++;
      }

      for (
        const indicacion of
        actividad.indicaciones
      ) {
        if (!indicacion.activo) {
          continue;
        }

        total++;

        if (
          indicacion.progresos.some(
            (progreso) =>
              progreso.diaPlan ===
                dia &&
              progreso.completado
          )
        ) {
          completados++;
        }
      }
    }
  }

  return {
    completados,
    total,

    porcentaje:
      total > 0
        ? Math.round(
            (
              completados /
              total
            ) * 100
          )
        : 0,
  };
}

function nombrePublico(
  nombre: string | null,
  esActual: boolean
) {
  if (esActual) {
    return "Tú";
  }

  if (!nombre?.trim()) {
    return "Participante";
  }

  const partes =
    nombre
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    partes.length ===
    1
  ) {
    return partes[0];
  }

  return `${partes[0]} ${partes[1][0].toUpperCase()}.`;
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

  if (
    !tokenSeguimientoValido(
      token
    )
  ) {
    return NextResponse.json(
      {
        error:
          "El enlace no es válido.",
      },
      {
        status: 404,
      }
    );
  }

  const seguimientoActual =
    await prisma.seguimientoCliente.findUnique({
      where: {
        tokenAccesoHash:
          hashTokenSeguimiento(
            token
          ),
      },

      select: {
        id: true,

        miembroGrupo: {
          select: {
            id: true,
            grupoId: true,
            estado: true,
          },
        },
      },
    });

  if (!seguimientoActual) {
    return NextResponse.json(
      {
        error:
          "El enlace no es válido o fue reemplazado.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    !seguimientoActual
      .miembroGrupo ||
    seguimientoActual
      .miembroGrupo
      .estado !==
      "ACTIVO"
  ) {
    return NextResponse.json({
      grupo: null,
    });
  }

  const grupo =
    await prisma.grupoSeguimiento.findUnique({
      where: {
        id:
          seguimientoActual
            .miembroGrupo
            .grupoId,
      },

      select: {
        id: true,
        nombre: true,
        objetivo: true,
        estado: true,
        fechaInicio: true,
        duracionDias: true,

        miembros: {
          where: {
            estado:
              "ACTIVO",
          },

          orderBy: {
            createdAt:
              "asc",
          },

          select: {
            seguimientoId: true,
            diaIngreso: true,

            seguimiento: {
              select: {
                nombreCliente:
                  true,

                actividades: {
                  select: {
                    tipo: true,
                    seccion: true,
                    diaInicio: true,
                    diaFin: true,
                    activo: true,

                    progresos: {
                      select: {
                        diaPlan:
                          true,
                        completado:
                          true,
                      },
                    },

                    indicaciones: {
                      where: {
                        activo:
                          true,
                      },

                      select: {
                        activo:
                          true,

                        progresos: {
                          select: {
                            diaPlan:
                              true,
                            completado:
                              true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!grupo) {
    return NextResponse.json({
      grupo: null,
    });
  }

  if (
    grupo.estado !==
      "ACTIVO" &&
    grupo.estado !==
      "FINALIZADO"
  ) {
    return NextResponse.json({
      grupo: null,
    });
  }

  const diaActual =
    obtenerDiaGrupo(
      grupo.fechaInicio,
      grupo.duracionDias,
      grupo.estado ===
        "FINALIZADO"
    );

  const participantes =
    grupo.miembros
      .filter(
        (miembro) =>
          miembro.diaIngreso <=
          diaActual
      )
      .map(
        (miembro) => {
          const esActual =
            miembro.seguimientoId ===
            seguimientoActual.id;

          const hoy =
            calcularCumplimiento(
              miembro.seguimiento
                .actividades,
              diaActual,
              diaActual,
              grupo.duracionDias
            );

          const acumulado =
            calcularCumplimiento(
              miembro.seguimiento
                .actividades,
              Math.max(
                1,
                miembro.diaIngreso
              ),
              diaActual,
              grupo.duracionDias
            );

          return {
            seguimientoId:
              miembro.seguimientoId,

            nombre:
              nombrePublico(
                miembro.seguimiento
                  .nombreCliente,
                esActual
              ),

            esActual,

            diaIngreso:
              miembro.diaIngreso,

            hoy,

            acumulado,
          };
        }
      );

  function crearRanking(
    tipo:
      | "hoy"
      | "acumulado"
  ) {
    const ordenados =
      [...participantes].sort(
        (a, b) => {
          const porcentajeA =
            a[tipo].porcentaje;

          const porcentajeB =
            b[tipo].porcentaje;

          if (
            porcentajeB !==
            porcentajeA
          ) {
            return (
              porcentajeB -
              porcentajeA
            );
          }

          return (
            b[tipo].completados -
            a[tipo].completados
          );
        }
      );

    let puestoAnterior = 0;
    let porcentajeAnterior:
      number | null = null;

    return ordenados.map(
      (
        participante,
        indice
      ) => {
        const porcentaje =
          participante[tipo]
            .porcentaje;

        const puesto =
          porcentajeAnterior ===
          porcentaje
            ? puestoAnterior
            : indice + 1;

        puestoAnterior =
          puesto;

        porcentajeAnterior =
          porcentaje;

        return {
          puesto,

          nombre:
            participante.nombre,

          esActual:
            participante.esActual,

          porcentaje,

          completados:
            participante[tipo]
              .completados,

          total:
            participante[tipo]
              .total,
        };
      }
    );
  }

  const rankingHoy =
    crearRanking(
      "hoy"
    );

  const rankingAcumulado =
    crearRanking(
      "acumulado"
    );

  const posicionHoy =
    rankingHoy.find(
      (item) =>
        item.esActual
    ) ?? null;

  const posicionAcumulada =
    rankingAcumulado.find(
      (item) =>
        item.esActual
    ) ?? null;

  return NextResponse.json({
    grupo: {
      id:
        grupo.id,

      nombre:
        grupo.nombre,

      objetivo:
        grupo.objetivo,

      diaActual,

      duracionDias:
        grupo.duracionDias,

      participantes:
        participantes.length,
    },

    posicion: {
      hoy:
        posicionHoy,

      acumulada:
        posicionAcumulada,
    },

    rankings: {
      hoy:
        rankingHoy,

      acumulado:
        rankingAcumulado,
    },
  });
}
