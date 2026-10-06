import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  prisma,
} from "@/lib/prisma";

import {
  obtenerAdminActual,
} from "@/lib/admin-auth";

import {
  obtenerDiaSeguimiento,
  obtenerDiaSeguimientoFechaCalendario,
  obtenerDiaEntreFechasCalendario
} from "@/lib/seguimiento-publico";

function aplicaEnDia(
  actividad: {
    diaInicio: number;
    diaFin: number | null;
    seccion:
      | "PRINCIPAL"
      | "ADICIONAL";
  },
  dia: number,
  duracionDias: number
) {
  const ultimoDia =
    actividad.diaFin ??
    (
      actividad.seccion ===
      "ADICIONAL"
        ? duracionDias
        : actividad.diaInicio
    );

  return (
    dia >= actividad.diaInicio &&
    dia <= ultimoDia
  );
}

function redondear(
  numero: number
) {
  return (
    Math.round(
      numero * 100
    ) / 100
  );
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
  } =
    await params;

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        nombreCliente: true,
        nombrePlan: true,
        duracionDias: true,
        estado: true,
        fechaInicio: true,

        miembroGrupo: {
          select: {
            estado: true,
            diaIngreso: true,
            fechaRetiro: true,

            grupo: {
              select: {
                estado: true,
                fechaInicio: true,
                fechaFinalizado: true,
                duracionDias: true,
              },
            },
          },
        },
        fechaFinalizado: true,

        registrosDiarios: {
          orderBy: {
            diaPlan:
              "asc",
          },

          select: {
            diaPlan: true,
            peso: true,
            observacion: true,
          },
        },

        actividades: {
          orderBy: [
            {
              diaInicio:
                "asc",
            },
            {
              hora: {
                sort:
                  "asc",
                nulls:
                  "last",
              },
            },
            {
              orden:
                "asc",
            },
          ],

          select: {
            id: true,
            tipo: true,
            seccion: true,
            titulo: true,
            hora: true,
            diaInicio: true,
            diaFin: true,
            activo: true,

            progresos: {
              select: {
                diaPlan: true,
                completado: true,
              },
            },

            indicaciones: {
              orderBy: [
                {
                  hora:
                    "asc",
                },
                {
                  orden:
                    "asc",
                },
              ],

              select: {
                id: true,
                hora: true,
                texto: true,
                activo: true,

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
    });

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
    seguimiento.estado ===
    "PENDIENTE"
  ) {
    return NextResponse.json(
      {
        error:
          "El seguimiento todavía no ha comenzado.",
      },
      {
        status: 409,
      }
    );
  }

  const ahora =
    new Date();

  let diaActual =
    0;

  if (
    seguimiento.miembroGrupo
  ) {
    const miembro =
      seguimiento.miembroGrupo;

    const grupo =
      miembro.grupo;

    let diaGrupo = 0;

    if (
      grupo.estado ===
      "FINALIZADO"
    ) {
      diaGrupo =
        grupo.fechaFinalizado
          ? obtenerDiaSeguimientoFechaCalendario(
              grupo.fechaInicio,
              grupo.fechaFinalizado
            )
          : grupo.duracionDias;
    } else if (
      grupo.estado ===
      "ACTIVO"
    ) {
      diaGrupo =
        obtenerDiaSeguimientoFechaCalendario(
          grupo.fechaInicio,
          ahora
        );
    }

    if (
      miembro.estado ===
        "RETIRADO" &&
      miembro.fechaRetiro
    ) {
      const diaRetiro =
        obtenerDiaEntreFechasCalendario(
          grupo.fechaInicio,
          miembro.fechaRetiro
        );

      diaGrupo =
        Math.min(
          diaGrupo,
          Math.max(
            miembro.diaIngreso,
            diaRetiro
          )
        );
    }

    if (
      diaGrupo >= 1
    ) {
      diaActual =
        Math.min(
          Math.max(
            diaGrupo,
            miembro.diaIngreso
          ),
          grupo.duracionDias
        );
    }
  } else if (
    seguimiento.estado ===
    "COMPLETADO"
  ) {
    diaActual =
      seguimiento.duracionDias;

  } else if (
    seguimiento.fechaInicio
  ) {
    diaActual =
      Math.min(
        Math.max(
          obtenerDiaSeguimiento(
            seguimiento.fechaInicio,
            ahora
          ),
          1
        ),
        seguimiento.duracionDias
      );
  }

  const registrosPorDia =
    new Map(
      seguimiento.registrosDiarios.map(
        (
          registro
        ) => [
          registro.diaPlan,
          registro,
        ]
      )
    );

  const dias: Array<{
    diaPlan: number;
    total: number;
    completadas: number;
    pendientes: number;
    porcentaje:
      | number
      | null;
    peso:
      | number
      | null;
    observacion:
      | string
      | null;
  }> = [];

  let totalAcumulado =
    0;

  let completadasAcumuladas =
    0;

  for (
    let dia = 1;
    dia <= diaActual;
    dia++
  ) {
    let total =
      0;

    let completadas =
      0;

    for (
      const actividad of
      seguimiento.actividades
    ) {
      if (
        !aplicaEnDia(
          actividad,
          dia,
          seguimiento.duracionDias
        )
      ) {
        continue;
      }

      const progresoActividad =
        actividad.progresos.find(
          (
            progreso
          ) =>
            progreso.diaPlan ===
            dia
        ) ??
        null;

      const tieneProgresoIndicacion =
        actividad.indicaciones.some(
          (
            indicacion
          ) =>
            indicacion.progresos.some(
              (
                progreso
              ) =>
                progreso.diaPlan ===
                dia
            )
        );

      if (
        !actividad.activo &&
        !progresoActividad &&
        !tieneProgresoIndicacion
      ) {
        continue;
      }

      /*
       * El check del título cuenta
       * cuando la actividad es TAREA.
       */
      if (
        actividad.tipo ===
        "TAREA"
      ) {
        total++;

        if (
          progresoActividad
            ?.completado ===
          true
        ) {
          completadas++;
        }
      }

      /*
       * Cada indicación visible tiene
       * su propio check y también cuenta.
       */
      for (
        const indicacion of
        actividad.indicaciones
      ) {
        const progresoIndicacion =
          indicacion.progresos.find(
            (
              progreso
            ) =>
              progreso.diaPlan ===
              dia
          ) ??
          null;

        if (
          !indicacion.activo &&
          !progresoIndicacion
        ) {
          continue;
        }

        total++;

        if (
          progresoIndicacion
            ?.completado ===
          true
        ) {
          completadas++;
        }
      }
    }

    totalAcumulado +=
      total;

    completadasAcumuladas +=
      completadas;

    const registro =
      registrosPorDia.get(
        dia
      ) ??
      null;

    dias.push({
      diaPlan:
        dia,

      total,

      completadas,

      pendientes:
        total -
        completadas,

      porcentaje:
        total > 0
          ? Math.round(
              (
                completadas /
                total
              ) *
                100
            )
          : null,

      peso:
        registro?.peso !==
          null &&
        registro?.peso !==
          undefined
          ? Number(
              registro.peso
            )
          : null,

      observacion:
        registro
          ?.observacion ??
        null,
    });
  }

  const pesos =
    seguimiento.registrosDiarios
      .filter(
        (
          registro
        ) =>
          registro.peso !==
            null
      )
      .map(
        (
          registro
        ) => ({
          diaPlan:
            registro.diaPlan,

          peso:
            Number(
              registro.peso
            ),
        })
      );

  const pesoInicial =
    pesos[0] ??
    null;

  const ultimoPeso =
    pesos.length > 0
      ? pesos[
          pesos.length -
            1
        ]
      : null;

  const pesoPromedio =
    pesos.length > 0
      ? redondear(
          pesos.reduce(
            (
              total,
              registro
            ) =>
              total +
              registro.peso,
            0
          ) /
            pesos.length
        )
      : null;

  const cambioPeso =
    pesoInicial &&
    ultimoPeso
      ? redondear(
          ultimoPeso.peso -
            pesoInicial.peso
        )
      : null;

  return NextResponse.json({
    generadoAt:
      ahora.toISOString(),

    seguimiento: {
      id:
        seguimiento.id,

      nombreCliente:
        seguimiento.nombreCliente,

      nombrePlan:
        seguimiento.nombrePlan,

      estado:
        seguimiento.estado,

      duracionDias:
        seguimiento.duracionDias,

      diaActual,

      fechaInicio:
        seguimiento.fechaInicio,

      fechaFinalizado:
        seguimiento.fechaFinalizado,
    },

    resumen: {
      total:
        totalAcumulado,

      completadas:
        completadasAcumuladas,

      pendientes:
        totalAcumulado -
        completadasAcumuladas,

      porcentaje:
        totalAcumulado > 0
          ? Math.round(
              (
                completadasAcumuladas /
                totalAcumulado
              ) *
                100
            )
          : null,

      cantidadPesajes:
        pesos.length,

      pesoInicial,

      ultimoPeso,

      pesoPromedio,

      cambioPeso,
    },

    dias,
  });
}
