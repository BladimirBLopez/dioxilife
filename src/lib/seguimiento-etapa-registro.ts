import type { Prisma } from "@prisma/client";

import {
  resolverDiaRegistroPublico,
} from "@/lib/seguimiento-publico-grupo";

type Opciones = {
  seguimientoId: string;
  actividadId: string;
  indicacionId?: string;
  diaPlan: number;
};

/**
 * Debe ejecutarse dentro de la misma transaccion
 * que guarda el progreso.
 *
 * Usa el bloqueo del seguimiento compartido
 * con el motor de publicacion y finalizacion.
 */
export async function validarRegistroEtapaBajoBloqueo(
  tx: Prisma.TransactionClient,
  {
    seguimientoId,
    actividadId,
    indicacionId,
    diaPlan,
  }: Opciones
): Promise<boolean> {
  const bloqueo =
    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "SeguimientoCliente"
      WHERE "id" = ${seguimientoId}
      FOR UPDATE
    `;

  if (bloqueo.length !== 1) {
    return false;
  }

  // Comprobar nuevamente el seguimiento
  // después de obtener el bloqueo.
  const seguimiento =
    await tx.seguimientoCliente.findUnique({
      where: {
        id: seguimientoId,
      },
      select: {
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
    return false;
  }

  // Volver a calcular el día real.
  // También respeta las reglas de grupos.
  const resolucion =
    resolverDiaRegistroPublico({
      estado: seguimiento.estado,
      fechaInicio: seguimiento.fechaInicio,
      duracionDias: seguimiento.duracionDias,
      miembroGrupo: seguimiento.miembroGrupo,
    });

  if (
    !resolucion.ok ||
    resolucion.diaPlan !== diaPlan
  ) {
    return false;
  }

  // Comprobar la actividad y su etapa
  // dentro de la transacción bloqueada.
  const actividad =
    await tx.actividadSeguimiento.findFirst({
      where: {
        id: actividadId,
        seguimientoId,
        activo: true,
        etapaId: {
          not: null,
        },
        etapa: {
          is: {
            estado: "PUBLICADA",
            diaInicio: {
              lte: diaPlan,
            },
            diaFin: {
              gte: diaPlan,
            },
          },
        },
      },
      select: {
        diaInicio: true,
        diaFin: true,

        etapa: {
          select: {
            diaInicio: true,
            diaFin: true,
          },
        },

        indicaciones: {
          where: {
            activo: true,
          },
          select: {
            id: true,
          },
        },
      },
    });

  if (!actividad?.etapa) {
    return false;
  }

  const inicio = Math.max(
    actividad.diaInicio,
    actividad.etapa.diaInicio
  );

  const fin = Math.min(
    actividad.diaFin ??
      actividad.etapa.diaFin,
    actividad.etapa.diaFin
  );

  if (
    diaPlan < inicio ||
    diaPlan > fin
  ) {
    return false;
  }

  // Una indicación desactivada o eliminada
  // tampoco debe registrar cumplimiento.
  if (
    indicacionId &&
    !actividad.indicaciones.some(
      (item) => item.id === indicacionId
    )
  ) {
    return false;
  }

  return true;
}
