import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  hashTokenSeguimiento,
  tokenSeguimientoValido,
} from "@/lib/seguimiento-publico";

export async function POST(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      token: string;
    }>;
  }
) {
  const {
    token,
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

        miembroGrupo: {
          select: {
            estado: true,

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

  if (
    seguimiento.estado ===
      "COMPLETADO" ||
    seguimiento.estado ===
      "CANCELADO"
  ) {
    return NextResponse.json(
      {
        error:
          "Este seguimiento ya está finalizado.",
      },
      {
        status: 409,
      }
    );
  }

  if (
    seguimiento.estado ===
    "PAUSADO"
  ) {
    return NextResponse.json(
      {
        error:
          "Este seguimiento se encuentra pausado. Contacta con DioxiLife.",
      },
      {
        status: 409,
      }
    );
  }

  const miembroGrupo =
    seguimiento.miembroGrupo;

  if (miembroGrupo) {
    if (
      miembroGrupo.estado !==
      "ACTIVO"
    ) {
      return NextResponse.json(
        {
          error:
            "Ya no formas parte de este grupo.",
        },
        {
          status: 409,
        }
      );
    }

    const grupo =
      miembroGrupo.grupo;

    if (
      grupo.estado ===
      "BORRADOR"
    ) {
      return NextResponse.json(
        {
          error:
            "El grupo todavía no ha sido iniciado por el administrador.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      grupo.estado ===
      "CANCELADO"
    ) {
      return NextResponse.json(
        {
          error:
            "Este grupo fue cancelado.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      grupo.estado ===
      "FINALIZADO"
    ) {
      return NextResponse.json(
        {
          error:
            "Este grupo ya finalizó.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      seguimiento.estado ===
      "ACTIVO"
    ) {
      return NextResponse.json({
        estado:
          "ACTIVO",

        fechaInicio:
          seguimiento.fechaInicio,
      });
    }

    const ahora =
      new Date();

    const actualizado =
      await prisma.seguimientoCliente.update({
        where: {
          id:
            seguimiento.id,
        },

        data: {
          estado:
            "ACTIVO",

          fechaInicio:
            grupo.fechaInicio,

          fechaInicioPrevista:
            grupo.fechaInicio,

          duracionDias:
            grupo.duracionDias,

          ultimoAccesoAt:
            ahora,
        },

        select: {
          estado:
            true,

          fechaInicio:
            true,
        },
      });

    return NextResponse.json(
      actualizado
    );
  }

  /*
   * Seguimientos individuales:
   * conservan el comportamiento
   * original.
   */
  if (
    seguimiento.estado ===
    "ACTIVO"
  ) {
    return NextResponse.json({
      estado:
        seguimiento.estado,

      fechaInicio:
        seguimiento.fechaInicio,
    });
  }

  const ahora =
    new Date();

  const actualizado =
    await prisma.seguimientoCliente.update({
      where: {
        id:
          seguimiento.id,
      },

      data: {
        estado:
          "ACTIVO",

        fechaInicio:
          seguimiento.fechaInicio ||
          ahora,

        ultimoAccesoAt:
          ahora,
      },

      select: {
        estado:
          true,

        fechaInicio:
          true,
      },
    });

  return NextResponse.json(
    actualizado
  );
}
