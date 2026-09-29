import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  hashTokenSeguimiento,
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
    seguimiento.estado ===
      "CANCELADO" ||
    seguimiento.estado ===
      "COMPLETADO"
  ) {
    return NextResponse.json(
      {
        error:
          "Este seguimiento ya no acepta nuevos recordatorios.",
      },
      {
        status: 409,
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
