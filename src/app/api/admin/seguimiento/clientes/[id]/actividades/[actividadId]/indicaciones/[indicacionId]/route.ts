import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { hayProgresoEnIndicacionesPorIds } from "@/lib/seguimiento-historial";
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
            etapaId: true,

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
      "ADICIONAL" &&
    actividad.etapaId === null
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
   * EDITAR INDICACION DE ETAPA EN BORRADOR.
   * La logica tradicional permanece intacta.
   */
  if (contexto.actividad.etapaId !== null) {
    return await prisma.$transaction(async (tx) => {
      const bloqueo =
        await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "SeguimientoCliente"
          WHERE "id" = ${id}
          FOR UPDATE
        `;

      if (bloqueo.length === 0) {
        return NextResponse.json(
          { error: "Seguimiento no encontrado." },
          { status: 404 }
        );
      }

      const seguimientoActual =
        await tx.seguimientoCliente.findUnique({
          where: { id },
          select: { estado: true },
        });

      if (
        !seguimientoActual ||
        seguimientoActual.estado === "COMPLETADO" ||
        seguimientoActual.estado === "CANCELADO"
      ) {
        return NextResponse.json(
          {
            error:
              "El seguimiento ya no permite modificaciones.",
          },
          { status: 409 }
        );
      }

      const actividadActual =
        await tx.actividadSeguimiento.findFirst({
          where: {
            id: actividadId,
            seguimientoId: id,
            etapaId: contexto.actividad.etapaId,
            activo: true,
          },
          select: {
            id: true,
            etapa: {
              select: {
                estado: true,
              },
            },
          },
        });

      if (!actividadActual) {
        return NextResponse.json(
          {
            error:
              "La actividad ya no pertenece a esta etapa.",
          },
          { status: 409 }
        );
      }

      if (
        actividadActual.etapa?.estado !== "BORRADOR"
      ) {
        return NextResponse.json(
          {
            error:
              "Solo se pueden editar indicaciones de etapas en borrador.",
          },
          { status: 409 }
        );
      }

      const indicacionActual =
        await tx.indicacionActividadSeguimiento.findFirst({
          where: {
            id: indicacionId,
            actividadSeguimientoId: actividadActual.id,
            activo: true,
          },
          select: {
            id: true,
          },
        });

      if (!indicacionActual) {
        return NextResponse.json(
          {
            error:
              "La indicación ya no existe en esta actividad.",
          },
          { status: 404 }
        );
      }

      const progresosActividad =
        await tx.progresoActividad.count({
          where: {
            actividadSeguimientoId: actividadId,
          },
        });

      const progresosIndicaciones =
        await tx.progresoIndicacion.count({
          where: {
            indicacionActividadSeguimiento: {
              is: {
                actividadSeguimientoId: actividadId,
              },
            },
          },
        });

      if (
        progresosActividad > 0 ||
        progresosIndicaciones > 0
      ) {
        return NextResponse.json(
          {
            error:
              "Esta actividad tiene historial. No se pueden sobrescribir sus indicaciones.",
          },
          { status: 409 }
        );
      }

      const actualizada =
        await tx.indicacionActividadSeguimiento.update({
          where: {
            id: indicacionActual.id,
          },
          data: {
            hora,
            texto,
            orden: nuevoOrden,
          },
        });

      return NextResponse.json(actualizada);
    });
  }

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

  if (contexto.actividad.etapaId !== null) {
    return await prisma.$transaction(async (tx) => {
      const bloqueo =
        await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "SeguimientoCliente"
          WHERE "id" = ${id}
          FOR UPDATE
        `;

      if (bloqueo.length === 0) {
        return NextResponse.json(
          { error: "Seguimiento no encontrado." },
          { status: 404 }
        );
      }

      const seguimientoActual =
        await tx.seguimientoCliente.findUnique({
          where: { id },
          select: {
            estado: true,
            duracionDias: true,
          },
        });

      if (
        !seguimientoActual ||
        seguimientoActual.estado === "COMPLETADO" ||
        seguimientoActual.estado === "CANCELADO"
      ) {
        return NextResponse.json(
          {
            error:
              "El seguimiento no permite eliminar indicaciones.",
          },
          { status: 409 }
        );
      }

      const actividadActual =
        await tx.actividadSeguimiento.findFirst({
          where: {
            id: actividadId,
            seguimientoId: id,
            etapaId: contexto.actividad.etapaId,
            activo: true,
          },
          select: {
            id: true,
            diaInicio: true,
            diaFin: true,
            etapa: {
              select: {
                estado: true,
                diaInicio: true,
                diaFin: true,
              },
            },
            _count: {
              select: {
                progresos: true,
              },
            },
          },
        });

      if (!actividadActual || !actividadActual.etapa) {
        return NextResponse.json(
          {
            error:
              "La actividad ya no pertenece a esta etapa.",
          },
          { status: 409 }
        );
      }

      if (actividadActual.etapa.estado !== "BORRADOR") {
        return NextResponse.json(
          {
            error:
              "Solo se pueden eliminar indicaciones de etapas en borrador.",
          },
          { status: 409 }
        );
      }

      if (
        actividadActual.diaInicio <
          actividadActual.etapa.diaInicio ||
        actividadActual.diaInicio >
          actividadActual.etapa.diaFin ||
        actividadActual.diaInicio >
          seguimientoActual.duracionDias ||
        (
          actividadActual.diaFin !== null &&
          (
            actividadActual.diaFin <
              actividadActual.diaInicio ||
            actividadActual.diaFin >
              actividadActual.etapa.diaFin ||
            actividadActual.diaFin >
              seguimientoActual.duracionDias
          )
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Los días de la actividad no corresponden a su etapa.",
          },
          { status: 409 }
        );
      }

      const indicacionActual =
        await tx.indicacionActividadSeguimiento.findFirst({
          where: {
            id: indicacionId,
            actividadSeguimientoId: actividadActual.id,
            activo: true,
          },
          select: {
            id: true,
          },
        });

      if (!indicacionActual) {
        return NextResponse.json(
          {
            error:
              "Indicación no encontrada en esta actividad.",
          },
          { status: 404 }
        );
      }

      const progresosIndicaciones =
        await tx.progresoIndicacion.count({
          where: {
            indicacionActividadSeguimiento: {
              is: {
                actividadSeguimientoId: actividadActual.id,
              },
            },
          },
        });

      if (
        actividadActual._count.progresos > 0 ||
        progresosIndicaciones > 0
      ) {
        return NextResponse.json(
          {
            error:
              "Esta actividad tiene historial registrado. No se pueden eliminar sus indicaciones.",
          },
          { status: 409 }
        );
      }

      await tx.indicacionActividadSeguimiento.delete({
        where: {
          id: indicacionActual.id,
        },
      });

      return NextResponse.json({ ok: true });
    });
  }

  if (
    contexto.enPreparacion ||
    !contexto.seguimiento
      .fechaInicio
  ) {

    if (
      await hayProgresoEnIndicacionesPorIds([indicacionId])
    ) {
      return NextResponse.json(
        {
          error:
            "Esta indicación tiene historial registrado. No se puede eliminar.",
        },
        {
          status: 409,
        }
      );
    }

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

    if (
      await hayProgresoEnIndicacionesPorIds([indicacionId])
    ) {
      return NextResponse.json(
        {
          error:
            "Esta indicación tiene historial registrado. No se puede eliminar.",
        },
        {
          status: 409,
        }
      );
    }

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
