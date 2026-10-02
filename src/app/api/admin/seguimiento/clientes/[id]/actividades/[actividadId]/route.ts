import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";
import { obtenerDiaSeguimiento } from "@/lib/seguimiento-publico";

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

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      actividadId: string;
    }>;
  }
) {
  const admin =
    await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      {
        error: "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  const {
    id,
    actividadId,
  } = await params;

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        id,
      },

      select: {
        duracionDias: true,
        estado: true,
        fechaInicio: true,
      },
    });

  if (!seguimiento) {
    return NextResponse.json(
      {
        error:
          "Seguimiento no encontrado",
      },
      {
        status: 404,
      }
    );
  }

  if (
    seguimiento.estado ===
      "COMPLETADO" ||
    seguimiento.estado ===
      "CANCELADO"
  ) {
    return NextResponse.json(
      {
        error:
          "No se puede modificar la agenda de un seguimiento finalizado.",
      },
      {
        status: 409,
      }
    );
  }

  const actividad =
    await prisma.actividadSeguimiento.findFirst({
      where: {
        id: actividadId,
        seguimientoId: id,
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
      },
    });

  if (!actividad) {
    return NextResponse.json(
      {
        error:
          "Actividad no encontrada",
      },
      {
        status: 404,
      }
    );
  }

  const body: unknown =
    await req.json();

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      {
        error:
          "Los datos enviados no son válidos.",
      },
      {
        status: 400,
      }
    );
  }

  const datos =
    body as Record<
      string,
      unknown
    >;

  /*
   * QUITAR PROTOCOLO ADICIONAL
   *
   * No se borra.
   * Su vigencia termina el día anterior
   * al día actual.
   */
  if (
    datos.quitar === true
  ) {
    if (
      actividad.seccion !==
      "ADICIONAL"
    ) {
      return NextResponse.json(
        {
          error:
            "Esta acción solo corresponde a protocolos adicionales.",
        },
        {
          status: 400,
        }
      );
    }

    const diaCambio =
      diaDelCambio({
        fechaInicio:
          seguimiento.fechaInicio,
        duracionDias:
          seguimiento.duracionDias,
        diaInicio:
          actividad.diaInicio,
      });

    const ultimoDia =
      actividad.diaFin ??
      seguimiento.duracionDias;

    if (
      diaCambio >
      ultimoDia
    ) {
      return NextResponse.json(
        {
          error:
            "Este protocolo ya había finalizado.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Si todavía no comenzó, simplemente
     * queda inactivo porque no existe
     * historial anterior que preservar.
     */
    if (
      !seguimiento.fechaInicio ||
      diaCambio <=
        actividad.diaInicio
    ) {
      const resultado =
        await prisma.actividadSeguimiento.update({
          where: {
            id: actividad.id,
          },

          data: {
            activo: false,
          },
        });

      return NextResponse.json(
        resultado
      );
    }

    const resultado =
      await prisma.actividadSeguimiento.update({
        where: {
          id: actividad.id,
        },

        data: {
          diaFin:
            diaCambio - 1,

          /*
           * Se mantiene activo para que
           * siga existiendo al consultar
           * sus días históricos.
           */
          activo: true,
        },
      });

    return NextResponse.json(
      resultado
    );
  }

  const tipoSolicitado =
    datos.tipo;

  const tipoActividad =
    tipoSolicitado ===
      "INFORMACION" ||
    tipoSolicitado ===
      "CONTROL"
      ? tipoSolicitado
      : "TAREA";

  const recordatorioSolicitado =
    datos.recordatorio;

  const recordatorioActividad =
    recordatorioSolicitado ===
      "A_LA_HORA" ||
    recordatorioSolicitado ===
      "MIN_15_ANTES" ||
    recordatorioSolicitado ===
      "MIN_30_ANTES" ||
    recordatorioSolicitado ===
      "MIN_60_ANTES"
      ? recordatorioSolicitado
      : "NINGUNO";

  const seccionSolicitada =
    datos.seccion;

  const seccionActividad =
    seccionSolicitada ===
      "PRINCIPAL" ||
    seccionSolicitada ===
      "ADICIONAL"
      ? seccionSolicitada
      : actividad.seccion;

  const tituloLimpio =
    String(
      datos.titulo || ""
    ).trim();

  const descripcion =
    datos.descripcion
      ? String(
          datos.descripcion
        )
          .trim()
          .slice(
            0,
            5000
          )
      : null;

  const momento =
    datos.momento
      ? String(
          datos.momento
        )
          .trim()
          .slice(
            0,
            60
          )
      : null;

  const hora =
    datos.hora
      ? String(
          datos.hora
        )
          .trim()
          .slice(
            0,
            20
          )
      : null;

  const inicio =
    Number(
      datos.diaInicio
    );

  const fin =
    datos.diaFin === null ||
    datos.diaFin === undefined ||
    datos.diaFin === ""
      ? null
      : Number(
          datos.diaFin
        );

  const orden =
    Number.isFinite(
      Number(
        datos.orden
      )
    )
      ? Math.trunc(
          Number(
            datos.orden
          )
        )
      : 0;

  const activo =
    typeof datos.activo ===
      "boolean"
      ? datos.activo
      : actividad.activo;

  if (!tituloLimpio) {
    return NextResponse.json(
      {
        error:
          "El título es obligatorio",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !Number.isInteger(
      inicio
    ) ||
    inicio < 1 ||
    inicio >
      seguimiento.duracionDias
  ) {
    return NextResponse.json(
      {
        error:
          `El día inicial debe estar entre 1 y ${seguimiento.duracionDias}`,
      },
      {
        status: 400,
      }
    );
  }

  if (
    fin !== null &&
    (
      !Number.isInteger(
        fin
      ) ||
      fin <
        inicio ||
      fin >
        seguimiento.duracionDias
    )
  ) {
    return NextResponse.json(
      {
        error:
          "El día final debe ser igual o mayor al día inicial y no superar la duración del seguimiento",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * PROTOCOLO ADICIONAL
   *
   * Si ya tuvo días anteriores y se
   * modifica, no sobrescribimos la
   * versión histórica.
   */
  if (
    actividad.seccion ===
      "ADICIONAL" &&
    seguimiento.fechaInicio
  ) {
    const diaCambio =
      diaDelCambio({
        fechaInicio:
          seguimiento.fechaInicio,
        duracionDias:
          seguimiento.duracionDias,
        diaInicio:
          actividad.diaInicio,
      });

    const ultimoDia =
      actividad.diaFin ??
      seguimiento.duracionDias;

    /*
     * Una versión histórica que ya
     * terminó no debe editarse.
     */
    if (
      diaCambio >
      ultimoDia
    ) {
      return NextResponse.json(
        {
          error:
            "Esta versión del protocolo ya terminó. Modifica la versión vigente.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Si el protocolo ya existía antes
     * de hoy, primero comprobamos que
     * realmente haya algún cambio.
     */
    if (
      diaCambio >
      actividad.diaInicio
    ) {
      if (
        seccionActividad !==
        "ADICIONAL"
      ) {
        return NextResponse.json(
          {
            error:
              "Un protocolo adicional que ya tiene historial no puede convertirse en actividad principal.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        fin !== null &&
        fin < diaCambio
      ) {
        return NextResponse.json(
          {
            error:
              `El día final no puede ser anterior al día ${diaCambio}. Si deseas quitar el protocolo, usa "Quitar desde hoy".`,
          },
          {
            status: 400,
          }
        );
      }

      const hayCambios =
        tipoActividad !==
          actividad.tipo ||
        recordatorioActividad !==
          actividad.recordatorio ||
        tituloLimpio !==
          actividad.titulo ||
        descripcion !==
          actividad.descripcion ||
        momento !==
          actividad.momento ||
        hora !==
          actividad.hora ||
        fin !==
          actividad.diaFin ||
        orden !==
          actividad.orden;

      /*
       * Si el administrador abrió el
       * formulario y guardó sin cambiar
       * nada, no creamos otra versión.
       */
      if (!hayCambios) {
        return NextResponse.json(
          actividad
        );
      }

      const [
        ,
        nuevaActividad,
      ] =
        await prisma.$transaction([
          prisma.actividadSeguimiento.update({
            where: {
              id:
                actividad.id,
            },

            data: {
              diaFin:
                diaCambio -
                1,

              activo:
                true,
            },
          }),

          prisma.actividadSeguimiento.create({
            data: {
              seguimientoId:
                id,

              tipo:
                tipoActividad,

              recordatorio:
                recordatorioActividad,

              /*
               * Sigue siendo protocolo
               * adicional.
               */
              seccion:
                "ADICIONAL",

              titulo:
                tituloLimpio,

              descripcion,

              momento,

              hora,

              diaInicio:
                diaCambio,

              /*
               * El nuevo período puede
               * conservar o modificar
               * su día final.
               */
              diaFin:
                fin,

              orden,

              activo:
                true,
            },
          }),
        ]);

      return NextResponse.json(
        nuevaActividad
      );
    }
  }

  /*
   * Actividades principales o protocolos
   * que todavía no tienen historial.
   */
  const resultado =
    await prisma.actividadSeguimiento.update({
      where: {
        id:
          actividadId,
      },

      data: {
        tipo:
          tipoActividad,

        recordatorio:
          recordatorioActividad,

        seccion:
          seccionActividad,

        titulo:
          tituloLimpio,

        descripcion,

        momento,

        hora,

        diaInicio:
          inicio,

        diaFin:
          fin,

        orden,

        activo,
      },
    });

  return NextResponse.json(
    resultado
  );
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      actividadId: string;
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
  } = await params;

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        id,
      },

      select: {
        estado: true,
      },
    });

  if (!seguimiento) {
    return NextResponse.json(
      {
        error:
          "Seguimiento no encontrado",
      },
      {
        status: 404,
      }
    );
  }

  if (
    seguimiento.estado ===
      "COMPLETADO" ||
    seguimiento.estado ===
      "CANCELADO"
  ) {
    return NextResponse.json(
      {
        error:
          "No se puede modificar la agenda de un seguimiento finalizado.",
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
          id,
      },

      select: {
        id: true,
        seccion: true,

        _count: {
          select: {
            progresos:
              true,
          },
        },
      },
    });

  if (!actividad) {
    return NextResponse.json(
      {
        error:
          "Actividad no encontrada",
      },
      {
        status: 404,
      }
    );
  }

  /*
   * Los protocolos adicionales nunca
   * se eliminan directamente porque
   * debemos conservar su historial.
   */
  if (
    actividad.seccion ===
    "ADICIONAL"
  ) {
    return NextResponse.json(
      {
        error:
          "Los protocolos adicionales deben quitarse desde la agenda para conservar los días anteriores.",
      },
      {
        status: 409,
      }
    );
  }

  if (
    actividad._count
      .progresos > 0
  ) {
    return NextResponse.json(
      {
        error:
          "Esta actividad ya tiene progreso registrado. Puedes desactivarla, pero no eliminarla.",
      },
      {
        status: 409,
      }
    );
  }

  await prisma.actividadSeguimiento.delete({
    where: {
      id:
        actividadId,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}
