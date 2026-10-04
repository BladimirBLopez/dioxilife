import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";
import { obtenerDiaSeguimiento } from "@/lib/seguimiento-publico";

function horaValida(
  valor: string
) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
    valor
  );
}

function diaDelCambio({
  fechaInicio,
  duracionDias,
  diaInicio,
}: {
  fechaInicio: Date | null;
  duracionDias: number;
  diaInicio: number;
}) {
  if (!fechaInicio) {
    return diaInicio;
  }

  return Math.min(
    Math.max(
      obtenerDiaSeguimiento(
        fechaInicio
      ),
      1
    ),
    duracionDias
  );
}

async function obtenerContexto({
  seguimientoId,
  actividadId,
  indicacionId,
}: {
  seguimientoId: string;
  actividadId: string;
  indicacionId: string;
}) {
  const seguimiento =
    await prisma.seguimientoCliente.findFirst({
      where: {
        id:
          seguimientoId,

        actividades: {
          some: {
            id:
              actividadId,
          },
        },
      },

      select: {
        id: true,
        estado: true,
        preparadoAt: true,
        fechaInicio: true,
        duracionDias: true,

        actividades: {
          where: {
            id:
              actividadId,
          },

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
            activo: true,

            indicaciones: {
              where: {
                activo: true,
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

              select: {
                id: true,
                hora: true,
                texto: true,
                orden: true,
                activo: true,
              },
            },
          },

          take: 1,
        },
      },
    });

  if (
    !seguimiento ||
    seguimiento.actividades.length ===
      0
  ) {
    return {
      error:
        "Actividad no encontrada.",
      status: 404,
    } as const;
  }

  const actividad =
    seguimiento.actividades[0];

  const indicacion =
    actividad.indicaciones.find(
      (item) =>
        item.id ===
        indicacionId
    );

  if (!indicacion) {
    return {
      error:
        "Indicación no encontrada.",
      status: 404,
    } as const;
  }

  if (
    seguimiento.estado ===
      "COMPLETADO" ||
    seguimiento.estado ===
      "CANCELADO"
  ) {
    return {
      error:
        "No se puede modificar un seguimiento finalizado.",
      status: 409,
    } as const;
  }

  const enPreparacion =
    seguimiento.estado ===
      "PENDIENTE" &&
    !seguimiento.preparadoAt;

  if (
    !enPreparacion &&
    actividad.seccion !==
      "ADICIONAL"
  ) {
    return {
      error:
        "Las indicaciones del protocolo principal solo pueden modificarse durante la preparación.",
      status: 409,
    } as const;
  }

  if (!actividad.activo) {
    return {
      error:
        "Esta actividad ya no está activa.",
      status: 409,
    } as const;
  }

  return {
    seguimiento,
    actividad,
    indicacion,
    enPreparacion,
  };
}

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      actividadId: string;
      indicacionId: string;
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
    actividadId,
    indicacionId,
  } = await params;

  const contexto =
    await obtenerContexto({
      seguimientoId:
        id,

      actividadId,

      indicacionId,
    });

  if ("error" in contexto) {
    return NextResponse.json(
      {
        error:
          contexto.error,
      },
      {
        status:
          contexto.status,
      }
    );
  }

  const body =
    await req
      .json()
      .catch(() => null);

  const hora =
    typeof body?.hora ===
    "string"
      ? body.hora.trim()
      : "";

  const texto =
    typeof body?.texto ===
    "string"
      ? body.texto
          .trim()
          .slice(
            0,
            5000
          )
      : "";

  if (!horaValida(hora)) {
    return NextResponse.json(
      {
        error:
          "Selecciona un horario válido.",
      },
      {
        status: 400,
      }
    );
  }

  if (!texto) {
    return NextResponse.json(
      {
        error:
          "La indicación es obligatoria.",
      },
      {
        status: 400,
      }
    );
  }

  const ordenSolicitado =
    Number(
      body?.orden
    );

  const nuevoOrden =
    Number.isInteger(
      ordenSolicitado
    )
      ? ordenSolicitado
      : contexto
          .indicacion
          .orden;

  /*
   * Preparación o protocolo adicional
   * todavía sin historial.
   */
  if (
    contexto.enPreparacion ||
    !contexto.seguimiento
      .fechaInicio
  ) {
    const indicacion =
      await prisma.indicacionActividadSeguimiento.update({
        where: {
          id:
            indicacionId,
        },

        data: {
          hora,
          texto,
          orden:
            nuevoOrden,
        },
      });

    return NextResponse.json(
      indicacion
    );
  }

  const diaCambio =
    diaDelCambio({
      fechaInicio:
        contexto.seguimiento
          .fechaInicio,

      duracionDias:
        contexto.seguimiento
          .duracionDias,

      diaInicio:
        contexto.actividad
          .diaInicio,
    });

  const ultimoDia =
    contexto.actividad
      .diaFin ??
    contexto.seguimiento
      .duracionDias;

  if (
    diaCambio >
    ultimoDia
  ) {
    return NextResponse.json(
      {
        error:
          "Esta versión del protocolo adicional ya terminó.",
      },
      {
        status: 409,
      }
    );
  }

  if (
    diaCambio <=
    contexto.actividad
      .diaInicio
  ) {
    const indicacion =
      await prisma.indicacionActividadSeguimiento.update({
        where: {
          id:
            indicacionId,
        },

        data: {
          hora,
          texto,
          orden:
            nuevoOrden,
        },
      });

    return NextResponse.json(
      indicacion
    );
  }

  const nuevaActividad =
    await prisma.$transaction(
      async (tx) => {
        await tx.actividadSeguimiento.update({
          where: {
            id:
              contexto.actividad
                .id,
          },

          data: {
            diaFin:
              diaCambio - 1,

            activo:
              true,
          },
        });

        return tx.actividadSeguimiento.create({
          data: {
            seguimientoId:
              contexto.seguimiento
                .id,

            tipo:
              contexto.actividad
                .tipo,

            recordatorio:
              contexto.actividad
                .recordatorio,

            seccion:
              "ADICIONAL",

            titulo:
              contexto.actividad
                .titulo,

            descripcion:
              contexto.actividad
                .descripcion,

            momento:
              contexto.actividad
                .momento,

            hora:
              contexto.actividad
                .hora,

            diaInicio:
              diaCambio,

            diaFin:
              contexto.actividad
                .diaFin,

            orden:
              contexto.actividad
                .orden,

            activo:
              true,

            indicaciones: {
              create:
                contexto.actividad
                  .indicaciones.map(
                    (
                      indicacion
                    ) => ({
                      hora:
                        indicacion.id ===
                        indicacionId
                          ? hora
                          : indicacion.hora,

                      texto:
                        indicacion.id ===
                        indicacionId
                          ? texto
                          : indicacion.texto,

                      orden:
                        indicacion.id ===
                        indicacionId
                          ? nuevoOrden
                          : indicacion.orden,

                      activo:
                        true,
                    })
                  ),
            },
          },
        });
      }
    );

  return NextResponse.json({
    ok: true,
    versionada: true,
    actividadId:
      nuevaActividad.id,
  });
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      actividadId: string;
      indicacionId: string;
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
    actividadId,
    indicacionId,
  } = await params;

  const contexto =
    await obtenerContexto({
      seguimientoId:
        id,

      actividadId,

      indicacionId,
    });

  if ("error" in contexto) {
    return NextResponse.json(
      {
        error:
          contexto.error,
      },
      {
        status:
          contexto.status,
      }
    );
  }

  if (
    contexto.enPreparacion ||
    !contexto.seguimiento
      .fechaInicio
  ) {
    await prisma.indicacionActividadSeguimiento.delete({
      where: {
        id:
          indicacionId,
      },
    });

    return NextResponse.json({
      ok: true,
    });
  }

  const diaCambio =
    diaDelCambio({
      fechaInicio:
        contexto.seguimiento
          .fechaInicio,

      duracionDias:
        contexto.seguimiento
          .duracionDias,

      diaInicio:
        contexto.actividad
          .diaInicio,
    });

  const ultimoDia =
    contexto.actividad
      .diaFin ??
    contexto.seguimiento
      .duracionDias;

  if (
    diaCambio >
    ultimoDia
  ) {
    return NextResponse.json(
      {
        error:
          "Esta versión del protocolo adicional ya terminó.",
      },
      {
        status: 409,
      }
    );
  }

  if (
    diaCambio <=
    contexto.actividad
      .diaInicio
  ) {
    await prisma.indicacionActividadSeguimiento.delete({
      where: {
        id:
          indicacionId,
      },
    });

    return NextResponse.json({
      ok: true,
    });
  }

  const indicacionesRestantes =
    contexto.actividad
      .indicaciones.filter(
        (indicacion) =>
          indicacion.id !==
          indicacionId
      );

  const nuevaActividad =
    await prisma.$transaction(
      async (tx) => {
        await tx.actividadSeguimiento.update({
          where: {
            id:
              contexto.actividad
                .id,
          },

          data: {
            diaFin:
              diaCambio - 1,

            activo:
              true,
          },
        });

        return tx.actividadSeguimiento.create({
          data: {
            seguimientoId:
              contexto.seguimiento
                .id,

            tipo:
              contexto.actividad
                .tipo,

            recordatorio:
              contexto.actividad
                .recordatorio,

            seccion:
              "ADICIONAL",

            titulo:
              contexto.actividad
                .titulo,

            descripcion:
              contexto.actividad
                .descripcion,

            momento:
              contexto.actividad
                .momento,

            hora:
              contexto.actividad
                .hora,

            diaInicio:
              diaCambio,

            diaFin:
              contexto.actividad
                .diaFin,

            orden:
              contexto.actividad
                .orden,

            activo:
              true,

            indicaciones:
              indicacionesRestantes.length >
              0
                ? {
                    create:
                      indicacionesRestantes.map(
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
                            true,
                        })
                      ),
                  }
                : undefined,
          },
        });
      }
    );

  return NextResponse.json({
    ok: true,
    versionada: true,
    actividadId:
      nuevaActividad.id,
  });
}
