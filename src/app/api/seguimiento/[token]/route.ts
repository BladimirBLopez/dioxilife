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

const MS_DIA =
  24 * 60 * 60 * 1000;

function diaGrupoEnFecha({
  fechaInicio,
  fechaReferencia,
  duracionDias,
}: {
  fechaInicio: Date;
  fechaReferencia: Date;
  duracionDias: number;
}) {
  const inicio =
    Date.UTC(
      fechaInicio.getUTCFullYear(),
      fechaInicio.getUTCMonth(),
      fechaInicio.getUTCDate()
    );

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
      fechaReferencia
    );

  const valor = (
    tipo: string
  ) =>
    partes.find(
      (parte) =>
        parte.type === tipo
    )?.value || "";

  const referencia =
    Date.UTC(
      Number(valor("year")),
      Number(valor("month")) - 1,
      Number(valor("day"))
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


function diaGrupoEnFechaDateOnly({
  fechaInicio,
  fechaReferencia,
  duracionDias,
}: {
  fechaInicio: Date;
  fechaReferencia: Date;
  duracionDias: number;
}) {
  const inicio =
    Date.UTC(
      fechaInicio.getUTCFullYear(),
      fechaInicio.getUTCMonth(),
      fechaInicio.getUTCDate()
    );

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
  const { token } =
    await params;

  if (
    !tokenSeguimientoValido(
      token
    )
  ) {
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

  const tokenAccesoHash =
    hashTokenSeguimiento(
      token
    );

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        tokenAccesoHash,
      },

      select: {
        id: true,

        nombreCliente:
          true,

        nombrePlan:
          true,

        duracionDias:
          true,

        estado:
          true,

        fechaInicioPrevista:
          true,

        fechaInicio:
          true,

        fechaFinalizado:
          true,

        miembroGrupo: {
          select: {
            estado: true,
            diaIngreso: true,
            fechaRetiro: true,

            grupo: {
              select: {
                id: true,
                nombre: true,
                estado: true,
                fechaInicio: true,
                duracionDias: true,
                fechaFinalizado: true,
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

        actividades: {
          where: {
            activo: true,
          },

          orderBy: [
            {
              diaInicio:
                "asc",
            },
            {
              orden:
                "asc",
            },
            {
              createdAt:
                "asc",
            },
          ],

          select: {
            id: true,
            tipo: true,
            recordatorio: true,
            seccion: true,
            titulo: true,
            descripcion: true,
            momento: true,
            hora: true,
            diaInicio: true,
            diaFin: true,
            orden: true,

            indicaciones: {
              where: {
                activo: true,
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

                progresos: {
                  select: {
                    diaPlan: true,
                    completado: true,
                    completadoAt: true,
                  },
                },
              },
            },

            progresos: {
              select: {
                diaPlan:
                  true,
                completado:
                  true,
                completadoAt:
                  true,
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
          "El enlace de seguimiento no es válido o fue reemplazado.",
      },
      {
        status: 404,
      }
    );
  }

  await prisma.seguimientoCliente.update({
    where: {
      id:
        seguimiento.id,
    },

    data: {
      ultimoAccesoAt:
        new Date(),
    },
  });

  const miembroGrupo =
    seguimiento.miembroGrupo;

  /*
   * Un seguimiento individual deja de
   * ser accesible desde el día siguiente
   * al último día configurado.
   */
  if (
    !miembroGrupo
  ) {
    if (
      seguimiento.estado ===
        "COMPLETADO"
    ) {
      return NextResponse.json(
        {
          error:
            "Este seguimiento ha finalizado.",
        },
        {
          status: 410,
        }
      );
    }

    if (
      seguimiento.estado ===
        "CANCELADO"
    ) {
      return NextResponse.json(
        {
          error:
            "Este seguimiento fue cancelado.",
        },
        {
          status: 410,
        }
      );
    }

    if (
      seguimiento.estado ===
        "ACTIVO" &&
      seguimientoIndividualVencido(
        seguimiento.fechaInicio,
        seguimiento.duracionDias
      )
    ) {
      const ahora =
        new Date();

      await prisma.seguimientoCliente.updateMany({
        where: {
          id:
            seguimiento.id,

          estado:
            "ACTIVO",
        },

        data: {
          estado:
            "COMPLETADO",

          fechaFinalizado:
            ahora,

          pausadoAt:
            null,
        },
      });

      return NextResponse.json(
        {
          error:
            "Este seguimiento ha finalizado.",
        },
        {
          status: 410,
        }
      );
    }
  }

  let diaActual:
    number | null = null;

  let grupoProgramado =
    false;

  /*
   * Si pertenece a un grupo, la jornada
   * oficial siempre sale de la fecha
   * del grupo.
   */
  if (miembroGrupo) {
    const grupo =
      miembroGrupo.grupo;

    if (
      grupo.estado ===
      "ACTIVO"
    ) {
      const diaCalculado =
        obtenerDiaSeguimientoFechaCalendario(
          grupo.fechaInicio
        );

      if (
        diaCalculado <
        1
      ) {
        grupoProgramado =
          true;

        diaActual =
          null;
      } else if (
        diaCalculado <=
        grupo.duracionDias
      ) {
        const diaRetiro =
          miembroGrupo.estado ===
              "RETIRADO" &&
            miembroGrupo.fechaRetiro
            ? diaGrupoEnFechaDateOnly({
                fechaInicio:
                  grupo.fechaInicio,

                fechaReferencia:
                  miembroGrupo.fechaRetiro,

                duracionDias:
                  grupo.duracionDias,
              })
            : null;

        diaActual =
          Math.max(
            miembroGrupo.diaIngreso,
            diaRetiro !== null
              ? Math.min(
                  diaCalculado,
                  diaRetiro
                )
              : diaCalculado
          );
      }
    } else if (
      grupo.estado ===
      "FINALIZADO"
    ) {
      const diaFinal =
        grupo.fechaFinalizado
          ? diaGrupoEnFecha({
              fechaInicio:
                grupo.fechaInicio,

              fechaReferencia:
                grupo.fechaFinalizado,

              duracionDias:
                grupo.duracionDias,
            })
          : grupo.duracionDias;

      const diaRetiro =
        miembroGrupo.estado ===
            "RETIRADO" &&
          miembroGrupo.fechaRetiro
          ? diaGrupoEnFecha({
              fechaInicio:
                grupo.fechaInicio,

              fechaReferencia:
                miembroGrupo.fechaRetiro,

              duracionDias:
                grupo.duracionDias,
            })
          : null;

      diaActual =
        Math.max(
          miembroGrupo.diaIngreso,
          diaRetiro !== null
            ? Math.min(
                diaFinal,
                diaRetiro
              )
            : diaFinal
        );
    }
  } else if (
    seguimiento.fechaInicio
  ) {
    const diaCalculado =
      obtenerDiaSeguimiento(
        seguimiento.fechaInicio
      );

    if (
      diaCalculado >=
      1
    ) {
      diaActual =
        Math.min(
          diaCalculado,
          seguimiento.duracionDias
        );
    }
  }

  const glucosasNuevas =
    seguimiento.medicionesGlucosa.map(
      (medicion) => ({
        diaPlan:
          medicion.diaPlan,

        numero:
          medicion.numero,

        valor:
          Number(
            medicion.valor
          ),

        hora:
          medicion.hora,

        momento:
          medicion.momento,
      })
    );

  const diasConGlucosaNueva =
    new Set(
      glucosasNuevas.map(
        (medicion) =>
          medicion.diaPlan
      )
    );

  const glucosasLegacy =
    seguimiento.registrosDiarios
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

          numero:
            1,

          valor:
            Number(
              registro.glucemiaAyunas
            ),

          hora:
            null as string | null,

          momento:
            null as string | null,
        })
      );

  const glucosas = [
    ...glucosasNuevas,
    ...glucosasLegacy,
  ].sort(
    (a, b) =>
      a.diaPlan -
        b.diaPlan ||
      a.numero -
        b.numero
  );


  return NextResponse.json({
    seguimiento: {
      nombreCliente:
        seguimiento.nombreCliente,

      nombrePlan:
        seguimiento.nombrePlan,

      duracionDias:
        seguimiento.duracionDias,

      estado:
        seguimiento.estado,

      fechaInicioPrevista:
        seguimiento.fechaInicioPrevista,

      fechaInicio:
        seguimiento.fechaInicio,

      fechaFinalizado:
        seguimiento.fechaFinalizado,

      diaActual,

      grupo:
        miembroGrupo
          ? {
              id:
                miembroGrupo
                  .grupo.id,

              nombre:
                miembroGrupo
                  .grupo.nombre,

              estado:
                miembroGrupo
                  .grupo.estado,

              estadoMiembro:
                miembroGrupo
                  .estado,

              fechaInicio:
                miembroGrupo
                  .grupo.fechaInicio,

              fechaFinalizado:
                miembroGrupo
                  .grupo.fechaFinalizado,

              duracionDias:
                miembroGrupo
                  .grupo.duracionDias,

              diaIngreso:
                miembroGrupo
                  .diaIngreso,

              programado:
                grupoProgramado,
            }
          : null,

      pesos:
        seguimiento.registrosDiarios
          .filter(
            (registro) =>
              registro.peso !==
              null
          )
          .map(
            (registro) => ({
              diaPlan:
                registro.diaPlan,

              peso:
                Number(
                  registro.peso
                ),
            })
          ),

      cinturas:
        seguimiento.registrosDiarios
          .filter(
            (registro) =>
              registro.cinturaCm !==
              null
          )
          .map(
            (registro) => ({
              diaPlan:
                registro.diaPlan,

              cinturaCm:
                Number(
                  registro.cinturaCm
                ),
            })
          ),

      glucosas,

      actividades:
        seguimiento.actividades,
    },
  });
}
