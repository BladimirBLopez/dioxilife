import {
  createHash,
  randomBytes,
} from "crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function hashToken(
  token: string
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function horaValida(
  hora: string | null
) {
  return Boolean(
    hora &&
      /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
        hora
      )
  );
}

export async function POST(
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
        error: "No autorizado",
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
        preparadoAt: true,

        actividades: {
          where: {
            activo: true,
          },

          select: {
            id: true,
            titulo: true,
            seccion: true,
            hora: true,

            indicaciones: {
              where: {
                activo: true,
              },

              select: {
                id: true,
                hora: true,
                texto: true,
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

  if (
    seguimiento.estado !==
    "PENDIENTE"
  ) {
    return NextResponse.json(
      {
        error:
          "Solo se puede finalizar la preparación de un seguimiento pendiente.",
      },
      {
        status: 409,
      }
    );
  }

  if (
    seguimiento.preparadoAt
  ) {
    return NextResponse.json(
      {
        error:
          "Este seguimiento ya fue preparado. Si necesitas cambiar el acceso, utiliza la opción para regenerar el enlace.",
      },
      {
        status: 409,
      }
    );
  }

  if (
    seguimiento.actividades.length ===
    0
  ) {
    return NextResponse.json(
      {
        error:
          "El seguimiento debe tener al menos una actividad antes de finalizar la preparación.",
      },
      {
        status: 409,
      }
    );
  }

  for (
    const actividad of
    seguimiento.actividades
  ) {
    for (
      const indicacion of
      actividad.indicaciones
    ) {
      if (
        !horaValida(
          indicacion.hora
        )
      ) {
        return NextResponse.json(
          {
            error:
              `La actividad "${actividad.titulo}" tiene una indicación sin horario válido.`,
          },
          {
            status: 409,
          }
        );
      }

      if (
        !indicacion.texto.trim()
      ) {
        return NextResponse.json(
          {
            error:
              `La actividad "${actividad.titulo}" tiene una indicación vacía.`,
          },
          {
            status: 409,
          }
        );
      }
    }

    if (
      actividad.seccion ===
        "ADICIONAL" &&
      !horaValida(
        actividad.hora
      )
    ) {
      return NextResponse.json(
        {
          error:
            `El protocolo adicional "${actividad.titulo}" debe tener un horario válido.`,
        },
        {
          status: 409,
        }
      );
    }
  }

  const token =
    randomBytes(32).toString(
      "hex"
    );

  const ahora =
    new Date();

  await prisma.seguimientoCliente.update({
    where: {
      id,
    },

    data: {
      tokenAccesoHash:
        hashToken(token),

      tokenCreadoAt:
        ahora,

      preparadoAt:
        ahora,
    },
  });

  return NextResponse.json({
    ok: true,
    token,
    preparadoAt:
      ahora,
  });
}
