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

function fechaHoraBoliviaUtc(
  fecha: Date
) {
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
      fecha
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

function diaDesdeFechaDate(
  fechaInicio: Date,
  fechaReferencia: Date,
  duracionDias: number
) {
  const inicio =
    Date.UTC(
      fechaInicio.getUTCFullYear(),
      fechaInicio.getUTCMonth(),
      fechaInicio.getUTCDate()
    );

  /*
   * fechaInicio y fechaRetiro son DATE
   * en PostgreSQL. Se leen por UTC para
   * no desplazarlos un día por zona horaria.
   */
  const referencia =
    Date.UTC(
      fechaReferencia.getUTCFullYear(),
      fechaReferencia.getUTCMonth(),
      fechaReferencia.getUTCDate()
    );

  const dia =
    Math.floor(
      (
        referencia -
        inicio
      ) / MS_DIA
    ) + 1;

  return Math.max(
    0,
    Math.min(
      dia,
      duracionDias
    )
  );
}

function diaActualGrupo(
  fechaInicio: Date,
  duracionDias: number,
  fechaFinalizado: Date | null
) {
  const inicio =
    Date.UTC(
      fechaInicio.getUTCFullYear(),
      fechaInicio.getUTCMonth(),
      fechaInicio.getUTCDate()
    );

  const referencia =
    fechaFinalizado
      ? fechaHoraBoliviaUtc(
          fechaFinalizado
        )
      : hoyBoliviaUtc();

  const diferencia =
    Math.floor(
      (
        referencia -
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
        objetivo: true,
        descripcion: true,
        estado: true,
        fechaInicio: true,
        fechaFinalizado: true,
        duracionDias: true,

        plan: {
          select: {
            nombre: true,
          },
        },

        miembros: {
          orderBy: {
            createdAt:
              "asc",
          },

          select: {
            id: true,
            diaIngreso: true,
            fechaIngreso: true,
            fechaRetiro: true,
            estado: true,

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

                medicionesGlucosa: {
                  orderBy: [
                    {
                      diaPlan:
                        "asc",
                    },
                    {
                      numero:
                        "asc",
                    },
                  ],

                  select: {
                    diaPlan:
                      true,
                    numero:
                      true,
                    valor:
                      true,
                    hora:
                      true,
                    momento:
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
        ? grupo.fechaFinalizado
        : null
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

        const diaRetiro =
          miembro.estado ===
              "RETIRADO" &&
            miembro.fechaRetiro
            ? diaDesdeFechaDate(
                grupo.fechaInicio,
                miembro.fechaRetiro,
                grupo.duracionDias
              )
            : null;

        const hasta =
          Math.max(
            0,
            Math.min(
              diaActual,
              diaRetiro ??
                diaActual
            )
          );

        const participaHoy =
          miembro.estado ===
            "ACTIVO" &&
          diaActual >=
            desde &&
          diaActual <=
            grupo.duracionDias;

        const cumplimientoHoy =
          participaHoy
            ? cumplimientoRango(
                seguimiento.actividades,
                diaActual,
                diaActual,
                grupo.duracionDias
              )
            : {
                completados: 0,
                total: 0,
                porcentaje: 0,
              };

        const cumplimientoAcumulado =
          hasta >= desde
            ? cumplimientoRango(
                seguimiento.actividades,
                desde,
                hasta,
                grupo.duracionDias
              )
            : {
                completados: 0,
                total: 0,
                porcentaje: 0,
              };

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

        const glucemiasNuevas =
          seguimiento.medicionesGlucosa
            .filter(
              (medicion) =>
                medicion.diaPlan >=
                  desde &&
                medicion.diaPlan <=
                  hasta
            )
            .map(
              (medicion) => ({
                diaPlan:
                  medicion.diaPlan,

                valor:
                  Number(
                    medicion.valor
                  ),
              })
            );

        const diasConGlucosaNueva =
          new Set(
            glucemiasNuevas.map(
              (medicion) =>
                medicion.diaPlan
            )
          );

        const glucemiasLegacy =
          registrosValidos
            .filter(
              (registro) =>
                registro.glucemiaAyunas !==
                  null &&
                !diasConGlucosaNueva.has(
                  registro.diaPlan
                )
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

        const glucemias = [
          ...glucemiasNuevas,
          ...glucemiasLegacy,
        ].sort(
          (a, b) =>
            a.diaPlan -
            b.diaPlan
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

          estadoMiembro:
            miembro.estado,

          diaIngreso:
            miembro.diaIngreso,

          fechaIngreso:
            miembro.fechaIngreso,

          fechaRetiro:
            miembro.fechaRetiro,

          diaRetiro,

          hastaDia:
            hasta,

          participaHoy,

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

  function rankingCumplimiento(
    fuente:
      typeof participantes,

    tipo:
      | "cumplimientoHoy"
      | "cumplimientoAcumulado"
  ) {
    const ordenados =
      [...fuente].sort(
        (a, b) => {
          const diferenciaPorcentaje =
            b[tipo].porcentaje -
            a[tipo].porcentaje;

          if (
            diferenciaPorcentaje !==
            0
          ) {
            return diferenciaPorcentaje;
          }

          const diferenciaChecks =
            b[tipo].completados -
            a[tipo].completados;

          if (
            diferenciaChecks !==
            0
          ) {
            return diferenciaChecks;
          }

          return a.nombre.localeCompare(
            b.nombre,
            "es"
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
        const resultado =
          participante[tipo];

        const empate =
          porcentajeAnterior ===
          resultado.porcentaje;

        const puesto =
          empate
            ? puestoAnterior
            : indice + 1;

        puestoAnterior =
          puesto;

        porcentajeAnterior =
          resultado.porcentaje;

        return {
          puesto,

          seguimientoId:
            participante
              .seguimientoId,

          nombre:
            participante.nombre,

          porcentaje:
            resultado.porcentaje,

          completados:
            resultado.completados,

          total:
            resultado.total,
        };
      }
    );
  }

  const participantesHoy =
    participantes.filter(
      (participante) =>
        participante.participaHoy
    );

  const rankingHoy =
    rankingCumplimiento(
      participantesHoy,
      "cumplimientoHoy"
    );

  const rankingAcumulado =
    rankingCumplimiento(
      participantes,
      "cumplimientoAcumulado"
    );

  const participantesPeso =
    participantes
      .filter(
        (participante) =>
          participante.peso
            .perdidaPorcentaje !==
          null
      )
      .sort(
        (a, b) => {
          const porcentajeA =
            a.peso
              .perdidaPorcentaje ??
            0;

          const porcentajeB =
            b.peso
              .perdidaPorcentaje ??
            0;

          if (
            porcentajeB !==
            porcentajeA
          ) {
            return (
              porcentajeB -
              porcentajeA
            );
          }

          return a.nombre.localeCompare(
            b.nombre,
            "es"
          );
        }
      );

  let puestoPesoAnterior = 0;

  let porcentajePesoAnterior:
    number | null = null;

  const rankingPeso =
    participantesPeso.map(
      (
        participante,
        indice
      ) => {
        const valor =
          participante.peso
            .perdidaPorcentaje;

        const puesto =
          porcentajePesoAnterior ===
            valor
            ? puestoPesoAnterior
            : indice + 1;

        puestoPesoAnterior =
          puesto;

        porcentajePesoAnterior =
          valor;

        return {
          puesto,

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
            valor,
        };
      }
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

    let acumuladosCompletados = 0;
    let acumuladosTotales = 0;

    const pesosDia: number[] = [];
    const cinturasDia: number[] = [];
    const glucemiasDia: number[] = [];

    let participantesDia = 0;

    for (
      const miembro of
      grupo.miembros
    ) {
      const desde =
        Math.max(
          1,
          miembro.diaIngreso
        );

      if (
        dia < desde
      ) {
        continue;
      }

      const diaRetiro =
        miembro.estado ===
            "RETIRADO" &&
          miembro.fechaRetiro
          ? diaDesdeFechaDate(
              grupo.fechaInicio,
              miembro.fechaRetiro,
              grupo.duracionDias
            )
          : null;

      const hastaAcumulado =
        Math.min(
          dia,
          diaRetiro ??
            dia
        );

      if (
        hastaAcumulado >=
        desde
      ) {
        const acumulado =
          cumplimientoRango(
            miembro.seguimiento
              .actividades,
            desde,
            hastaAcumulado,
            grupo.duracionDias
          );

        acumuladosCompletados +=
          acumulado.completados;

        acumuladosTotales +=
          acumulado.total;
      }

      const activoEseDia =
        diaRetiro === null ||
        dia <= diaRetiro;

      if (!activoEseDia) {
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

      const glucosasParticipanteDia =
        seguimiento.medicionesGlucosa
          .filter(
            (medicion) =>
              medicion.diaPlan ===
              dia
          )
          .map(
            (medicion) =>
              Number(
                medicion.valor
              )
          );

      if (
        glucosasParticipanteDia.length >
        0
      ) {
        glucemiasDia.push(
          redondear2(
            glucosasParticipanteDia.reduce(
              (
                total,
                valor
              ) =>
                total +
                valor,
              0
            ) /
              glucosasParticipanteDia.length
          )
        );
      } else if (
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

      acumulado:
        porcentaje(
          acumuladosCompletados,
          acumuladosTotales
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
    participantesHoy.length >
    0
      ? Math.round(
          participantesHoy.reduce(
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
            participantesHoy.length
        )
      : 0;

  const participantesConAcumulado =
    participantes.filter(
      (participante) =>
        participante
          .cumplimientoAcumulado
          .total >
        0
    );

  const promedioAcumulado =
    participantesConAcumulado.length >
    0
      ? Math.round(
          participantesConAcumulado.reduce(
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
            participantesConAcumulado.length
        )
      : 0;

  const activos =
    participantes.filter(
      (participante) =>
        participante
          .estadoMiembro ===
        "ACTIVO"
    ).length;

  const retirados =
    participantes.filter(
      (participante) =>
        participante
          .estadoMiembro ===
        "RETIRADO"
    ).length;

  return NextResponse.json({
    generadoAt:
      new Date().toISOString(),

    grupo: {
      id:
        grupo.id,

      nombre:
        grupo.nombre,

      objetivo:
        grupo.objetivo,

      descripcion:
        grupo.descripcion,

      protocolo:
        grupo.plan.nombre,

      estado:
        grupo.estado,

      fechaInicio:
        grupo.fechaInicio,

      fechaFinalizado:
        grupo.fechaFinalizado,

      diaActual,

      duracionDias:
        grupo.duracionDias,

      participantes:
        participantes.length,

      activos,

      retirados,

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
