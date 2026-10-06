import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  hashTokenSeguimiento,
  tokenSeguimientoValido,
} from "@/lib/seguimiento-publico";

import {
  resolverDiaRegistroPublico,
} from "@/lib/seguimiento-publico-grupo";

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      token: string;
      actividadId: string;
      indicacionId: string;
    }>;
  }
) {
  const {
    token,
    actividadId,
    indicacionId,
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

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
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

  if (!seguimiento) {
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

  const diaPlan =
    resolucionDia.diaPlan;

  const duracionAplicable =
    resolucionDia.duracionDias;

  const actividad =
    await prisma.actividadSeguimiento.findFirst({
      where: {
        id:
          actividadId,

        seguimientoId:
          seguimiento.id,

        activo:
          true,
      },

      select: {
        id: true,
        tipo: true,
        seccion: true,
        diaInicio: true,
        diaFin: true,

        indicaciones: {
          where: {
            activo: true,
          },

          select: {
            id: true,
          },
        },
      },
    });

  if (!actividad) {
    return NextResponse.json(
      {
        error:
          "Actividad no encontrada.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    actividad.tipo !==
    "TAREA"
  ) {
    return NextResponse.json(
      {
        error:
          "Esta actividad no se puede marcar como realizada.",
      },
      {
        status: 409,
      }
    );
  }

  const ultimoDia =
    actividad.diaFin ??
    (
      actividad.seccion ===
        "ADICIONAL"
        ? duracionAplicable
        : actividad.diaInicio
    );

  if (
    diaPlan <
      actividad.diaInicio ||
    diaPlan >
      ultimoDia
  ) {
    return NextResponse.json(
      {
        error:
          "Esta actividad no corresponde al día de hoy.",
      },
      {
        status: 409,
      }
    );
  }

  const indicacionExiste =
    actividad.indicaciones.some(
      (indicacion) =>
        indicacion.id ===
        indicacionId
    );

  if (!indicacionExiste) {
    return NextResponse.json(
      {
        error:
          "Indicación no encontrada.",
      },
      {
        status: 404,
      }
    );
  }

  const body =
    await req.json();

  const completado =
    body?.completado ===
    true;

  const resultado =
    await prisma.$transaction(
      async (tx) => {

        const progresoIndicacion =
          await tx.progresoIndicacion.upsert({
            where: {
              indicacionActividadSeguimientoId_diaPlan:
                {
                  indicacionActividadSeguimientoId:
                    indicacionId,

                  diaPlan,
                },
            },

            create: {
              indicacionActividadSeguimientoId:
                indicacionId,

              diaPlan,

              completado,

              completadoAt:
                completado
                  ? new Date()
                  : null,
            },

            update: {
              completado,

              completadoAt:
                completado
                  ? new Date()
                  : null,
            },

            select: {
              diaPlan: true,
              completado: true,
              completadoAt: true,
            },
          });


        await tx.seguimientoCliente.update({
          where: {
            id:
              seguimiento.id,
          },

          data: {
            ultimoAccesoAt:
              new Date(),
          },
        });


        return {
          progresoIndicacion,
        };
      }
    );


  return NextResponse.json({
    completado:
      resultado
        .progresoIndicacion
        .completado,

    completadoAt:
      resultado
        .progresoIndicacion
        .completadoAt,
  });
}
