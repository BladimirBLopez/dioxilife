import { createHash, timingSafeEqual } from "node:crypto";
import type { Prisma } from "@prisma/client";

/**
 * Datos utilizados para comprobar si una etapa
 * cambio despues de haber sido revisada.
 *
 * Incluye actividades e indicaciones inactivas.
 */
export const seleccionRevisionEtapa = {
  id: true,
  seguimientoId: true,
  nombre: true,
  orden: true,
  diaInicio: true,
  diaFin: true,
  estado: true,
  modoPublicacion: true,
  publicadaAt: true,

  actividades: {
    orderBy: {
      id: "asc",
    },

    select: {
      id: true,
      activo: true,
      titulo: true,
      descripcion: true,
      momento: true,
      hora: true,
      tipo: true,
      seccion: true,
      recordatorio: true,
      diaInicio: true,
      diaFin: true,
      orden: true,

      indicaciones: {
        orderBy: {
          id: "asc",
        },

        select: {
          id: true,
          activo: true,
          hora: true,
          texto: true,
          orden: true,
        },
      },
    },
  },
} satisfies Prisma.EtapaSeguimientoSelect;

export type EtapaParaRevision =
  Prisma.EtapaSeguimientoGetPayload<{
    select: typeof seleccionRevisionEtapa;
  }>;

function compararIds(
  a: { id: string },
  b: { id: string }
) {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

/**
 * Calcula una huella del contenido de la etapa.
 *
 * El contenido original mantiene su huella.
 * Si el contenido cambia, la huella cambia.
 *
 * Esta funcion no aprueba ni publica etapas.
 */
export function crearHuellaRevisionEtapa(
  etapa: EtapaParaRevision
): string {
  const actividades = etapa.actividades
    .map((actividad) => ({
      id: actividad.id,
      activo: actividad.activo,
      titulo: actividad.titulo,
      descripcion: actividad.descripcion,
      momento: actividad.momento,
      hora: actividad.hora,
      tipo: actividad.tipo,
      seccion: actividad.seccion,
      recordatorio: actividad.recordatorio,
      diaInicio: actividad.diaInicio,
      diaFin: actividad.diaFin,
      orden: actividad.orden,

      indicaciones: actividad.indicaciones
        .map((indicacion) => ({
          id: indicacion.id,
          activo: indicacion.activo,
          hora: indicacion.hora,
          texto: indicacion.texto,
          orden: indicacion.orden,
        }))
        .sort(compararIds),
    }))
    .sort(compararIds);

  const contenido = {
    version: 1,

    etapa: {
      id: etapa.id,
      seguimientoId: etapa.seguimientoId,
      nombre: etapa.nombre,
      orden: etapa.orden,
      diaInicio: etapa.diaInicio,
      diaFin: etapa.diaFin,
      // El estado de publicacion no forma parte
      // del contenido que aprueba el administrador.
      // Asi, programar o publicar no invalida
      // una aprobacion que sigue siendo correcta.
    },

    actividades,
  };

  return createHash("sha256")
    .update(JSON.stringify(contenido))
    .digest("hex");
}


/**
 * Resultado de la comprobacion de aprobacion.
 */
export type ResultadoVerificacionAprobacion =
  | { valida: true }
  | {
      valida: false;
      motivo: string;
    };

type RegistroAprobacionEtapa = {
  aprobadaAt: Date | null;
  aprobadaPorAdminId: string | null;
  aprobadaPorUsuario: string | null;
  huellaAprobada: string | null;
};

function huellasCoinciden(
  aprobada: string,
  actual: string
): boolean {
  if (
    !/^[a-f0-9]{64}$/.test(aprobada) ||
    !/^[a-f0-9]{64}$/.test(actual)
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(aprobada, "hex"),
    Buffer.from(actual, "hex")
  );
}

/**
 * Comprueba si la etapa mantiene una aprobacion
 * administrativa valida para su contenido actual.
 *
 * Debe llamarse dentro de la misma transaccion
 * que publicara o programara la etapa.
 *
 * La operacion que llama esta funcion debe haber
 * bloqueado previamente el seguimiento para
 * coordinar las modificaciones concurrentes.
 *
 * Esta funcion no guarda, programa ni publica.
 */
export async function verificarAprobacionEtapa(
  tx: Prisma.TransactionClient,
  seguimientoId: string,
  etapaId: string
): Promise<ResultadoVerificacionAprobacion> {
  const etapa =
    await tx.etapaSeguimiento.findFirst({
      where: {
        id: etapaId,
        seguimientoId,
      },
      select: seleccionRevisionEtapa,
    });

  if (!etapa) {
    return {
      valida: false,
      motivo: "Etapa no encontrada.",
    };
  }

  /*
   * Consulta parametrizada.
   *
   * Los campos nuevos deben existir en Neon
   * antes de utilizar esta funcion en produccion.
   *
   * No se ejecuta durante las pruebas locales.
   */
  const registros =
    await tx.$queryRaw<RegistroAprobacionEtapa[]>`
      SELECT
        "aprobadaAt",
        "aprobadaPorAdminId",
        "aprobadaPorUsuario",
        "huellaAprobada"
      FROM "EtapaSeguimiento"
      WHERE
        "id" = ${etapaId}
        AND "seguimientoId" = ${seguimientoId}
      LIMIT 1
    `;

  if (registros.length !== 1) {
    return {
      valida: false,
      motivo: "No se encontro la aprobacion.",
    };
  }

  const aprobacion = registros[0];

  if (
    !aprobacion.aprobadaAt ||
    !aprobacion.aprobadaPorAdminId ||
    !aprobacion.aprobadaPorUsuario ||
    !aprobacion.huellaAprobada
  ) {
    return {
      valida: false,
      motivo:
        "Esta etapa necesita aprobacion antes de publicarse.",
    };
  }

  const huellaActual =
    crearHuellaRevisionEtapa(etapa);

  if (
    !huellasCoinciden(
      aprobacion.huellaAprobada,
      huellaActual
    )
  ) {
    return {
      valida: false,
      motivo:
        "El contenido cambio despues de la aprobacion. Revisa y aprueba nuevamente la etapa.",
    };
  }

  return {
    valida: true,
  };
}
