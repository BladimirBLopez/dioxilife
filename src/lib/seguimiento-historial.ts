import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function hayProgresoEnIndicaciones(
  actividadIds: string[]
): Promise<boolean> {
  if (actividadIds.length === 0) {
    return false;
  }

  const cantidad =
    await prisma.progresoIndicacion.count({
      where: {
        indicacionActividadSeguimiento: {
          is: {
            actividadSeguimientoId: {
              in: actividadIds,
            },
          },
        },
      },
    });

  return cantidad > 0;
}

export async function hayProgresoEnIndicacionesPorIds(
  indicacionIds: string[]
): Promise<boolean> {
  if (indicacionIds.length === 0) {
    return false;
  }

  const cantidad =
    await prisma.progresoIndicacion.count({
      where: {
        indicacionActividadSeguimientoId: {
          in: indicacionIds,
        },
      },
    });

  return cantidad > 0;
}

export async function hayHistorialSeguimiento(
  tx: Prisma.TransactionClient,
  seguimientoId: string
): Promise<boolean> {
  const [
    registros,
    glucosas,
    actividades,
    indicaciones,
  ] = await Promise.all([
    tx.registroDiaSeguimiento.count({
      where: { seguimientoId },
    }),
    tx.medicionGlucosaSeguimiento.count({
      where: { seguimientoId },
    }),
    tx.progresoActividad.count({
      where: { seguimientoId },
    }),
    tx.progresoIndicacion.count({
      where: {
        indicacionActividadSeguimiento: {
          actividadSeguimiento: {
            seguimientoId,
          },
        },
      },
    }),
  ]);

  return (
    registros +
    glucosas +
    actividades +
    indicaciones
  ) > 0;
}
