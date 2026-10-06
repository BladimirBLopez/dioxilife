import type {
  Prisma,
} from "@prisma/client";

type OpcionesSincronizacion = {
  seguimientoId: string;
  planId: string;

  /*
   * Para participantes que ingresan tarde
   * podemos ignorar versiones que ya
   * terminaron antes de su ingreso.
   */
  desdeDia?: number;

  /*
   * Durante la activación de un grupo
   * borrador reemplazamos cualquier copia
   * previa que pudiera existir.
   */
  reemplazar?: boolean;
};

export async function sincronizarProtocoloSeguimientoDesdePlan(
  tx: Prisma.TransactionClient,
  {
    seguimientoId,
    planId,
    desdeDia = 1,
    reemplazar = false,
  }: OpcionesSincronizacion
) {
  const actividades =
    await tx.actividadPlan.findMany({
      where: {
        planId,
        activo: true,

        OR: [
          {
            diaFin: null,
          },
          {
            diaFin: {
              gte:
                desdeDia,
            },
          },
        ],
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
          hora: {
            sort:
              "asc",
            nulls:
              "last",
          },
        },
        {
          createdAt:
            "asc",
        },
      ],

      include: {
        indicaciones: {
          where: {
            activo:
              true,
          },

          orderBy: [
            {
              hora:
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
        },
      },
    });

  if (reemplazar) {
    await tx.actividadSeguimiento.deleteMany({
      where: {
        seguimientoId,
      },
    });
  }

  for (
    const actividad of
    actividades
  ) {
    await tx.actividadSeguimiento.create({
      data: {
        seguimientoId,

        /*
         * Esta referencia permite saber
         * exactamente qué actividad del
         * protocolo grupal originó esta
         * copia del participante.
         */
        actividadPlanOrigenId:
          actividad.id,

        tipo:
          actividad.tipo,

        recordatorio:
          actividad.recordatorio,

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
          actividad.indicaciones.length >
          0
            ? {
                create:
                  actividad.indicaciones.map(
                    (
                      indicacion
                    ) => ({
                      hora:
                        indicacion.hora,

                      texto:
                        indicacion.texto,

                      orden:
                        indicacion.orden,

                      activo:
                        indicacion.activo,
                    })
                  ),
              }
            : undefined,
      },
    });
  }

  return {
    cantidad:
      actividades.length,
  };
}
