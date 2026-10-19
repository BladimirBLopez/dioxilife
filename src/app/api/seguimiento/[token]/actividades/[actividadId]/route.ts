import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import { validarRegistroEtapaBajoBloqueo }
  from "@/lib/seguimiento-etapa-registro";

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
    }>;
  }
) {
  const {
    token,
    actividadId,
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

        OR: [
          {
            // Actividades tradicionales:
            // conservar su comportamiento.
            etapaId: null,
          },
          {
            // Las nuevas actividades
            // requieren una etapa publicada
            // y dentro de su período.
            etapa: {
              is: {
                estado: "PUBLICADA",
                diaInicio: {
                  lte: diaPlan,
                },
                diaFin: {
                  gte: diaPlan,
                },
              },
            },
          },
        ],
      },

      select: {
        id: true,
        etapaId: true,
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
    (actividad.seccion === "ADICIONAL"
      ? duracionAplicable
      : actividad.diaInicio);

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

  const body =
    await req.json();

  const completado =
    body?.completado ===
    true;


  const progreso =
    await prisma.$transaction(
      async (tx) => {

        // Para etapas nuevas, coordinar con
        // el cierre automático antes de escribir.
        // Las actividades tradicionales conservan
        // su comportamiento anterior.
        if (actividad.etapaId !== null) {
          const permitido =
            await validarRegistroEtapaBajoBloqueo(
              tx,
              {
            seguimientoId: seguimiento.id,
            actividadId: actividad.id,
            diaPlan,
              }
            );

          if (!permitido) {
            return null;
          }
        }

        const progresoActividad =
          await tx.progresoActividad.upsert({
            where: {
              seguimientoId_actividadSeguimientoId_diaPlan:
                {
                  seguimientoId:
                    seguimiento.id,

                  actividadSeguimientoId:
                    actividad.id,

                  diaPlan,
                },
            },

            create: {
              seguimientoId:
                seguimiento.id,

              actividadSeguimientoId:
                actividad.id,

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


        return progresoActividad;
      }
    );


  if (progreso === null) {
    return NextResponse.json(
      {
        error:
          "La etapa ya no permite registrar este cumplimiento. Actualiza la página.",
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    progreso
  );
}
