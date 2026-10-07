import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";
import { obtenerDiaSeguimiento } from "@/lib/seguimiento-publico";

const MS_DIA =
  86_400_000;

export async function PATCH(
  req: NextRequest,
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

  const { id } =
    await params;

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        estado: true,
        fechaInicio: true,
        fechaFinalizado: true,
        pausadoAt: true,

        miembroGrupo: {
          select: {
            id: true,
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

  const body: unknown =
    await req
      .json()
      .catch(() => null);

  if (
    typeof body !==
      "object" ||
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

  const accion =
    typeof datos.accion ===
      "string"
      ? datos.accion
      : "";

  /*
   * EDITAR DATOS ADMINISTRATIVOS
   */
  if (
    accion ===
    "EDITAR"
  ) {
    const nombreCliente =
      typeof datos.nombreCliente ===
        "string"
        ? datos.nombreCliente
            .trim()
            .slice(
              0,
              120
            )
        : "";

    const telefonoCliente =
      typeof datos.telefonoCliente ===
        "string"
        ? datos.telefonoCliente
            .replace(
              /\D/g,
              ""
            )
        : "";

    const nombrePlan =
      typeof datos.nombrePlan ===
        "string"
        ? datos.nombrePlan
            .trim()
            .slice(
              0,
              200
            )
        : "";

    const referenciaCompra =
      typeof datos.referenciaCompra ===
        "string"
        ? datos.referenciaCompra
            .trim()
            .slice(
              0,
              500
            )
        : "";

    const observacionInterna =
      typeof datos.observacionInterna ===
        "string"
        ? datos.observacionInterna
            .trim()
            .slice(
              0,
              1500
            )
        : "";

    if (
      telefonoCliente &&
      !/^[0-9]{8}$/.test(
        telefonoCliente
      )
    ) {
      return NextResponse.json(
        {
          error:
            "El WhatsApp debe contener exactamente 8 números.",
        },
        {
          status: 400,
        }
      );
    }

    if (!nombrePlan) {
      return NextResponse.json(
        {
          error:
            "El nombre del protocolo es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    const actualizado =
      await prisma.seguimientoCliente.update({
        where: {
          id,
        },

        data: {
          nombreCliente:
            nombreCliente ||
            null,

          telefonoCliente:
            telefonoCliente ||
            null,

          nombrePlan,

          referenciaCompra:
            referenciaCompra ||
            null,

          observacionInterna:
            observacionInterna ||
            null,
        },
      });

    return NextResponse.json(
      actualizado
    );
  }


  /*
   * Los miembros de grupo siguen el
   * calendario común del grupo.
   *
   * No deben pausarse, reanudarse o
   * cancelarse individualmente desde
   * esta ruta.
   */
  if (
    seguimiento.miembroGrupo &&
    (
      accion ===
        "PAUSAR" ||
      accion ===
        "REANUDAR" ||
      accion ===
        "CANCELAR"
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Este cliente pertenece a un grupo. Para detener su participación utiliza la opción de retirar miembro desde el grupo.",
      },
      {
        status: 409,
      }
    );
  }


  /*
   * PAUSAR
   */
  if (
    accion ===
    "PAUSAR"
  ) {
    if (
      seguimiento.estado !==
        "ACTIVO"
    ) {
      return NextResponse.json(
        {
          error:
            "Solo un seguimiento activo puede pausarse.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      !seguimiento.fechaInicio
    ) {
      return NextResponse.json(
        {
          error:
            "Este seguimiento todavía no tiene una fecha de inicio válida.",
        },
        {
          status: 409,
        }
      );
    }

    const ahora =
      new Date();

    const actualizado =
      await prisma.seguimientoCliente.update({
        where: {
          id,
        },

        data: {
          estado:
            "PAUSADO",

          pausadoAt:
            ahora,
        },
      });

    return NextResponse.json(
      actualizado
    );
  }


  /*
   * REANUDAR
   *
   * Desplazamos fechaInicio por la
   * cantidad de días calendario que
   * permaneció pausado.
   *
   * De este modo continúa en el mismo
   * día del protocolo donde se detuvo.
   */
  if (
    accion ===
    "REANUDAR"
  ) {
    if (
      seguimiento.estado !==
        "PAUSADO"
    ) {
      return NextResponse.json(
        {
          error:
            "Este seguimiento no se encuentra pausado.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      !seguimiento.fechaInicio ||
      !seguimiento.pausadoAt
    ) {
      return NextResponse.json(
        {
          error:
            "No se pudo determinar desde cuándo está pausado este seguimiento.",
        },
        {
          status: 409,
        }
      );
    }

    const ahora =
      new Date();

    const diasPausa =
      Math.max(
        obtenerDiaSeguimiento(
          seguimiento.pausadoAt,
          ahora
        ) - 1,
        0
      );

    const nuevaFechaInicio =
      new Date(
        seguimiento.fechaInicio.getTime() +
          diasPausa *
            MS_DIA
      );

    const actualizado =
      await prisma.seguimientoCliente.update({
        where: {
          id,
        },

        data: {
          estado:
            "ACTIVO",

          fechaInicio:
            nuevaFechaInicio,

          pausadoAt:
            null,
        },
      });

    return NextResponse.json(
      actualizado
    );
  }


  /*
   * CANCELAR
   *
   * Conserva actividades, registros,
   * mediciones, progreso e historial.
   */
  if (
    accion ===
    "CANCELAR"
  ) {
    if (
      seguimiento.estado ===
        "CANCELADO"
    ) {
      return NextResponse.json(
        {
          error:
            "Este seguimiento ya está cancelado.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      seguimiento.estado ===
        "COMPLETADO"
    ) {
      return NextResponse.json(
        {
          error:
            "Un seguimiento completado no puede cancelarse.",
        },
        {
          status: 409,
        }
      );
    }

    const ahora =
      new Date();

    const actualizado =
      await prisma.seguimientoCliente.update({
        where: {
          id,
        },

        data: {
          estado:
            "CANCELADO",

          fechaFinalizado:
            ahora,

          pausadoAt:
            null,
        },
      });

    return NextResponse.json(
      actualizado
    );
  }


  return NextResponse.json(
    {
      error:
        "Acción no válida.",
    },
    {
      status: 400,
    }
  );
}


export async function DELETE(
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

  const { id } =
    await params;

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        nombreCliente: true,

        miembroGrupo: {
          select: {
            id: true,

            grupo: {
              select: {
                nombre: true,
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

  /*
   * El dueño solicitó eliminación real.
   *
   * Las relaciones dependientes de
   * SeguimientoCliente están definidas
   * para eliminarse junto al seguimiento.
   *
   * El pedido original y la plantilla
   * maestra NO se eliminan.
   */
  await prisma.seguimientoCliente.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    ok: true,

    nombreCliente:
      seguimiento.nombreCliente,

    eliminadoDeGrupo:
      Boolean(
        seguimiento.miembroGrupo
      ),

    grupo:
      seguimiento
        .miembroGrupo
        ?.grupo.nombre ??
      null,
  });
}
