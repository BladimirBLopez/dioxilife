import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  hashTokenSeguimiento,
  obtenerDiaSeguimiento,
  tokenSeguimientoValido,
} from "@/lib/seguimiento-publico";

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

  if (
    seguimiento.estado !==
      "ACTIVO" ||
    !seguimiento.fechaInicio
  ) {
    return NextResponse.json(
      {
        error:
          "El seguimiento no está activo.",
      },
      {
        status: 409,
      }
    );
  }

  const diaPlan =
    obtenerDiaSeguimiento(
      seguimiento.fechaInicio
    );

  if (
    diaPlan < 1 ||
    diaPlan >
      seguimiento.duracionDias
  ) {
    return NextResponse.json(
      {
        error:
          "El día actual está fuera del periodo de seguimiento.",
      },
      {
        status: 409,
      }
    );
  }

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
        ? seguimiento.duracionDias
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

  const body =
    await req.json();

  const completado =
    body?.completado ===
    true;


  const progreso =
    await prisma.$transaction(
      async (tx) => {

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


  return NextResponse.json(
    progreso
  );
}
