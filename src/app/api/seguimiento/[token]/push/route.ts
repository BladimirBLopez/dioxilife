import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  hashTokenSeguimiento,
  obtenerDiaSeguimientoFechaCalendario,
  seguimientoIndividualVencido,
  tokenSeguimientoValido,
} from "@/lib/seguimiento-publico";


function textoSeguro(
  valor: unknown,
  max: number
) {
  if (
    typeof valor !== "string"
  ) {
    return "";
  }

  return valor
    .trim()
    .slice(0, max);
}


export async function POST(
  req: NextRequest,
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
          "El enlace de seguimiento no es válido.",
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
          "El enlace de seguimiento no es válido o fue reemplazado.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    !seguimiento.miembroGrupo &&
    seguimiento.estado ===
      "ACTIVO" &&
    seguimientoIndividualVencido(
      seguimiento.fechaInicio,
      seguimiento.duracionDias
    )
  ) {
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
          new Date(),

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

  if (
    seguimiento.estado !==
    "ACTIVO"
  ) {
    return NextResponse.json(
      {
        error:
          "Este seguimiento no permite activar recordatorios en este momento.",
      },
      {
        status: 409,
      }
    );
  }


  if (
    seguimiento.miembroGrupo
  ) {
    const miembro =
      seguimiento.miembroGrupo;

    const grupo =
      miembro.grupo;

    if (
      miembro.estado !==
        "ACTIVO" ||
      grupo.estado !==
        "ACTIVO"
    ) {
      return NextResponse.json(
        {
          error:
            "Los recordatorios de este grupo ya no están disponibles.",
        },
        {
          status: 409,
        }
      );
    }


    const diaGrupo =
      obtenerDiaSeguimientoFechaCalendario(
        grupo.fechaInicio,
        new Date()
      );


    if (
      diaGrupo < 1 ||
      diaGrupo >
        grupo.duracionDias ||
      diaGrupo <
        miembro.diaIngreso
    ) {
      return NextResponse.json(
        {
          error:
            "Los recordatorios de este grupo todavía no están disponibles.",
        },
        {
          status: 409,
        }
      );
    }
  }


  const body =
    await req
      .json()
      .catch(() => null);

  const endpoint =
    textoSeguro(
      body?.endpoint,
      5000
    );

  const p256dh =
    textoSeguro(
      body?.keys?.p256dh,
      1000
    );

  const auth =
    textoSeguro(
      body?.keys?.auth,
      1000
    );

  if (
    !endpoint ||
    !p256dh ||
    !auth
  ) {
    return NextResponse.json(
      {
        error:
          "La suscripción del dispositivo no es válida.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !endpoint.startsWith(
      "https://"
    )
  ) {
    return NextResponse.json(
      {
        error:
          "El endpoint de notificaciones no es válido.",
      },
      {
        status: 400,
      }
    );
  }

  const suscripcion =
    await prisma.suscripcionPush.upsert({
      where: {
        seguimientoId_endpoint: {
          seguimientoId:
            seguimiento.id,

          endpoint,
        },
      },

      create: {
        seguimientoId:
          seguimiento.id,

        endpoint,
        p256dh,
        auth,
        activa:
          true,
      },

      update: {
        p256dh,
        auth,
        activa:
          true,

        ultimoErrorAt:
          null,
      },

      select: {
        id: true,
        activa: true,
        createdAt: true,
        updatedAt: true,
      },
    });

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

  return NextResponse.json({
    ok: true,
    suscripcion,
  });
}


export async function DELETE(
  req: NextRequest,
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
          "El enlace de seguimiento no es válido.",
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

  const body =
    await req
      .json()
      .catch(() => null);

  const endpoint =
    textoSeguro(
      body?.endpoint,
      5000
    );

  if (!endpoint) {
    return NextResponse.json(
      {
        error:
          "El endpoint es obligatorio.",
      },
      {
        status: 400,
      }
    );
  }

  await prisma.suscripcionPush.updateMany({
    where: {
      seguimientoId:
        seguimiento.id,

      endpoint,
    },

    data: {
      activa:
        false,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}
