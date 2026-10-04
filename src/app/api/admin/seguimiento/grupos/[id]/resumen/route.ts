import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

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

function diaActualGrupo(
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

function redondear2(
  valor: number
) {
  return (
    Math.round(
      valor * 100
    ) / 100
  );
}

function porcentaje(
  completados: number,
  total: number
) {
  return total > 0
    ? Math.round(
        (
          completados /
          total
        ) * 100
      )
    : 0;
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
  dia: number,
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
    dia >=
      actividad.diaInicio &&
    dia <= ultimoDia
  );
}

function cumplimientoRango(
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

  let total = 0;
  let completados = 0;

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
        )
      ) {
        continue;
      }

      if (
        actividad.tipo !==
        "TAREA"
      ) {
        continue;
      }

      /*
       * El título principal
       * cuenta como un check.
       */
      total++;

      const progreso =
        actividad.progresos.find(
          (item) =>
            item.diaPlan ===
              dia &&
            item.completado
        );

      if (progreso) {
        completados++;
      }

      /*
       * Cada indicación visible
       * cuenta como otro check
       * independiente.
       */
      for (
        const indicacion of
        actividad.indicaciones
      ) {
        if (!indicacion.activo) {
          continue;
        }

        total++;

        const progresoIndicacion =
          indicacion.progresos.find(
            (item) =>
              item.diaPlan ===
                dia &&
              item.completado
          );

        if (
          progresoIndicacion
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
      porcentaje(
        completados,
        total
      ),
  };
}

type Medicion = {
  diaPlan: number;
  valor: number;
};

function resumenMedicion(
  mediciones: Medicion[]
) {
  if (
    mediciones.length === 0
  ) {
    return {
      cantidad: 0,
      inicial: null,
      ultima: null,
      promedio: null,
      cambio: null,
    };
  }

  const inicial =
    mediciones[0];

  const ultima =
    mediciones[
      mediciones.length - 1
    ];

  const promedio =
    redondear2(
      mediciones.reduce(
        (
          suma,
          medicion
        ) =>
          suma +
          medicion.valor,
        0
      ) /
        mediciones.length
    );

  return {
    cantidad:
      mediciones.length,

    inicial,

    ultima,

    promedio,

    cambio:
      redondear2(
        ultima.valor -
        inicial.valor
      ),
  };
}

export async function GET(
  _req: NextRequest,
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

  const {
    id,
  } = await params;

  const grupo =
    await prisma.grupoSeguimiento.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        nombre: true,
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
            id: true,
            diaIngreso: true,
            fechaIngreso: true,

            seguimiento: {
              select: {
                id: true,
                nombreCliente: true,
                telefonoCliente: true,
                estado: true,

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

                registrosDiarios: {
                  orderBy: {
                    diaPlan:
                      "asc",
                  },

                  select: {
                    diaPlan:
                      true,
                    peso:
                      true,
                    cinturaCm:
                      true,
                    glucemiaAyunas:
                      true,
                    updatedAt:
                      true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!grupo) {
    return NextResponse.json(
      {
        error:
          "Grupo no encontrado.",
      },
      {
        status: 404,
      }
    );
  }

  const diaActual =
    diaActualGrupo(
      grupo.fechaInicio,
      grupo.duracionDias,
      grupo.estado ===
        "FINALIZADO"
    );

  const participantes =
    grupo.miembros.map(
      (miembro) => {
        const seguimiento =
          miembro.seguimiento;

        const desde =
          Math.max(
            1,
            miembro.diaIngreso
          );

        const hasta =
          Math.max(
            0,
            diaActual
          );

        const cumplimientoHoy =
          hasta >= desde
            ? cumplimientoRango(
                seguimiento.actividades,
                hasta,
                hasta,
                grupo.duracionDias
              )
            : {
                completados: 0,
                total: 0,
                porcentaje: 0,
              };

        const cumplimientoAcumulado =
          cumplimientoRango(
            seguimiento.actividades,
            desde,
            hasta,
            grupo.duracionDias
          );

        const registrosValidos =
          seguimiento.registrosDiarios.filter(
            (registro) =>
              registro.diaPlan >=
                desde &&
              registro.diaPlan <=
                hasta
          );

        const pesos =
          registrosValidos
            .filter(
              (registro) =>
                registro.peso !==
                null
            )
            .map(
              (registro) => ({
                diaPlan:
                  registro.diaPlan,

                valor:
                  Number(
                    registro.peso
                  ),
              })
            );

        const cinturas =
          registrosValidos
            .filter(
              (registro) =>
                registro.cinturaCm !==
                null
            )
            .map(
              (registro) => ({
                diaPlan:
                  registro.diaPlan,

                valor:
                  Number(
                    registro.cinturaCm
                  ),
              })
            );

        const glucemias =
          registrosValidos
            .filter(
              (registro) =>
                registro.glucemiaAyunas !==
                null
            )
            .map(
              (registro) => ({
                diaPlan:
                  registro.diaPlan,

                valor:
                  Number(
                    registro.glucemiaAyunas
                  ),
              })
            );

        const peso =
          resumenMedicion(
            pesos
          );

        const cintura =
          resumenMedicion(
            cinturas
          );

        const glucemia =
          resumenMedicion(
            glucemias
          );

        let perdidaPesoKg:
          number | null = null;

        let perdidaPesoPorcentaje:
          number | null = null;

        if (
          peso.inicial &&
          peso.promedio !==
            null &&
          peso.inicial.valor >
            0
        ) {
          perdidaPesoKg =
            redondear2(
              peso.inicial.valor -
              peso.promedio
            );

          perdidaPesoPorcentaje =
            redondear2(
              (
                perdidaPesoKg /
                peso.inicial.valor
              ) * 100
            );
        }

        const ultimoRegistro =
          registrosValidos.length >
          0
            ? registrosValidos[
                registrosValidos.length -
                  1
              ].diaPlan
            : null;

        return {
          miembroId:
            miembro.id,

          seguimientoId:
            seguimiento.id,

          nombre:
            seguimiento.nombreCliente ||
            "Cliente sin nombre",

          telefono:
            seguimiento.telefonoCliente,

          estadoSeguimiento:
            seguimiento.estado,

          diaIngreso:
            miembro.diaIngreso,

          fechaIngreso:
            miembro.fechaIngreso,

          ultimoRegistro,

          cumplimientoHoy,

          cumplimientoAcumulado,

          peso: {
            ...peso,
            perdidaKg:
              perdidaPesoKg,

            perdidaPorcentaje:
              perdidaPesoPorcentaje,
          },

          cintura,

          glucemia,
        };
      }
    );

  const rankingHoy =
    [...participantes]
      .sort(
        (a, b) =>
          b.cumplimientoHoy
            .porcentaje -
          a.cumplimientoHoy
            .porcentaje
      )
      .map(
        (
          participante,
          indice
        ) => ({
          puesto:
            indice + 1,

          seguimientoId:
            participante
              .seguimientoId,

          nombre:
            participante.nombre,

          porcentaje:
            participante
              .cumplimientoHoy
              .porcentaje,

          completados:
            participante
              .cumplimientoHoy
              .completados,

          total:
            participante
              .cumplimientoHoy
              .total,
        })
      );

  const rankingAcumulado =
    [...participantes]
      .sort(
        (a, b) =>
          b.cumplimientoAcumulado
            .porcentaje -
          a.cumplimientoAcumulado
            .porcentaje
      )
      .map(
        (
          participante,
          indice
        ) => ({
          puesto:
            indice + 1,

          seguimientoId:
            participante
              .seguimientoId,

          nombre:
            participante.nombre,

          porcentaje:
            participante
              .cumplimientoAcumulado
              .porcentaje,

          completados:
            participante
              .cumplimientoAcumulado
              .completados,

          total:
            participante
              .cumplimientoAcumulado
              .total,
        })
      );

  const rankingPeso =
    participantes
      .filter(
        (participante) =>
          participante.peso
            .perdidaPorcentaje !==
          null
      )
      .sort(
        (a, b) =>
          (
            b.peso
              .perdidaPorcentaje ??
            0
          ) -
          (
            a.peso
              .perdidaPorcentaje ??
            0
          )
      )
      .map(
        (
          participante,
          indice
        ) => ({
          puesto:
            indice + 1,

          seguimientoId:
            participante
              .seguimientoId,

          nombre:
            participante.nombre,

          inicial:
            participante.peso
              .inicial?.valor ??
            null,

          promedio:
            participante.peso
              .promedio,

          perdidaKg:
            participante.peso
              .perdidaKg,

          perdidaPorcentaje:
            participante.peso
              .perdidaPorcentaje,
        })
      );

  const graficaCumplimiento = [];

  const graficaPeso = [];

  const graficaCintura = [];

  const graficaGlucemia = [];

  for (
    let dia = 1;
    dia <= diaActual;
    dia++
  ) {
    let checksCompletados = 0;
    let checksTotales = 0;

    const pesosDia: number[] = [];
    const cinturasDia: number[] = [];
    const glucemiasDia: number[] = [];

    let participantesDia = 0;

    for (
      const miembro of
      grupo.miembros
    ) {
      if (
        miembro.diaIngreso >
        dia
      ) {
        continue;
      }

      participantesDia++;

      const seguimiento =
        miembro.seguimiento;

      const cumplimiento =
        cumplimientoRango(
          seguimiento.actividades,
          dia,
          dia,
          grupo.duracionDias
        );

      checksCompletados +=
        cumplimiento.completados;

      checksTotales +=
        cumplimiento.total;

      const registroDia =
        seguimiento.registrosDiarios.find(
          (registro) =>
            registro.diaPlan ===
            dia
        );

      if (
        registroDia?.peso !==
        null &&
        registroDia?.peso !==
        undefined
      ) {
        pesosDia.push(
          Number(
            registroDia.peso
          )
        );
      }

      if (
        registroDia?.cinturaCm !==
        null &&
        registroDia?.cinturaCm !==
        undefined
      ) {
        cinturasDia.push(
          Number(
            registroDia.cinturaCm
          )
        );
      }

      if (
        registroDia?.glucemiaAyunas !==
        null &&
        registroDia?.glucemiaAyunas !==
        undefined
      ) {
        glucemiasDia.push(
          Number(
            registroDia.glucemiaAyunas
          )
        );
      }
    }

    graficaCumplimiento.push({
      diaPlan:
        dia,

      porcentaje:
        porcentaje(
          checksCompletados,
          checksTotales
        ),

      completados:
        checksCompletados,

      total:
        checksTotales,

      participantes:
        participantesDia,
    });

    if (
      pesosDia.length >
      0
    ) {
      graficaPeso.push({
        diaPlan:
          dia,

        promedio:
          redondear2(
            pesosDia.reduce(
              (
                suma,
                valor
              ) =>
                suma +
                valor,
              0
            ) /
              pesosDia.length
          ),

        registros:
          pesosDia.length,
      });
    }

    if (
      cinturasDia.length >
      0
    ) {
      graficaCintura.push({
        diaPlan:
          dia,

        promedio:
          redondear2(
            cinturasDia.reduce(
              (
                suma,
                valor
              ) =>
                suma +
                valor,
              0
            ) /
              cinturasDia.length
          ),

        registros:
          cinturasDia.length,
      });
    }

    if (
      glucemiasDia.length >
      0
    ) {
      graficaGlucemia.push({
        diaPlan:
          dia,

        promedio:
          redondear2(
            glucemiasDia.reduce(
              (
                suma,
                valor
              ) =>
                suma +
                valor,
              0
            ) /
              glucemiasDia.length
          ),

        registros:
          glucemiasDia.length,
      });
    }
  }


  const promedioHoy =
    participantes.length >
    0
      ? Math.round(
          participantes.reduce(
            (
              suma,
              participante
            ) =>
              suma +
              participante
                .cumplimientoHoy
                .porcentaje,
            0
          ) /
            participantes.length
        )
      : 0;

  const promedioAcumulado =
    participantes.length >
    0
      ? Math.round(
          participantes.reduce(
            (
              suma,
              participante
            ) =>
              suma +
              participante
                .cumplimientoAcumulado
                .porcentaje,
            0
          ) /
            participantes.length
        )
      : 0;

  return NextResponse.json({
    grupo: {
      id:
        grupo.id,

      nombre:
        grupo.nombre,

      estado:
        grupo.estado,

      diaActual,

      duracionDias:
        grupo.duracionDias,

      participantes:
        participantes.length,

      promedioHoy,

      promedioAcumulado,
    },

    participantes,

    rankings: {
      cumplimientoHoy:
        rankingHoy,

      cumplimientoAcumulado:
        rankingAcumulado,

      peso:
        rankingPeso,
    },

    graficas: {
      cumplimiento:
        graficaCumplimiento,

      peso:
        graficaPeso,

      cintura:
        graficaCintura,

      glucemia:
        graficaGlucemia,
    },
  });
}
