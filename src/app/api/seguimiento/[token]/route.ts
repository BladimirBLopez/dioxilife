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

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      token: string;
    }>;
  }
) {
  const { token } =
    await params;

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

  const tokenAccesoHash =
    hashTokenSeguimiento(
      token
    );

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        tokenAccesoHash,
      },

      select: {
        id: true,

        nombreCliente:
          true,

        nombrePlan:
          true,

        duracionDias:
          true,

        estado:
          true,

        fechaInicioPrevista:
          true,

        fechaInicio:
          true,

        fechaFinalizado:
          true,

        actividades: {
          where: {
            activo: true,
          },

          orderBy: [
            {
              diaInicio:
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
            tipo: true,
            recordatorio: true,
            titulo: true,
            descripcion: true,
            momento: true,
            hora: true,
            diaInicio: true,
            diaFin: true,
            orden: true,

            progresos: {
              select: {
                diaPlan:
                  true,
                completado:
                  true,
                completadoAt:
                  true,
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

  let diaActual:
    number | null = null;

  if (
    seguimiento.fechaInicio
  ) {
    diaActual =
      obtenerDiaSeguimiento(
        seguimiento.fechaInicio
      );

    diaActual =
      Math.max(
        1,
        Math.min(
          diaActual,
          seguimiento.duracionDias
        )
      );
  }

  return NextResponse.json({
    seguimiento: {
      nombreCliente:
        seguimiento.nombreCliente,

      nombrePlan:
        seguimiento.nombrePlan,

      duracionDias:
        seguimiento.duracionDias,

      estado:
        seguimiento.estado,

      fechaInicioPrevista:
        seguimiento.fechaInicioPrevista,

      fechaInicio:
        seguimiento.fechaInicio,

      fechaFinalizado:
        seguimiento.fechaFinalizado,

      diaActual,

      actividades:
        seguimiento.actividades,
    },
  });
}
