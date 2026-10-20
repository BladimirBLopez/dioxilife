import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { obtenerAdminActual } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  crearHuellaRevisionEtapa,
  seleccionRevisionEtapa,
} from "@/lib/seguimiento-aprobacion-etapa";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Contexto = {
  params: Promise<{
    id: string;
    etapaId: string;
  }>;
};

function responderError(
  mensaje: string,
  status: number
) {
  return NextResponse.json(
    { error: mensaje },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}

function huellasIguales(
  primera: string,
  segunda: string
): boolean {
  if (
    !/^[a-f0-9]{64}$/.test(primera) ||
    !/^[a-f0-9]{64}$/.test(segunda)
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(primera, "hex"),
    Buffer.from(segunda, "hex")
  );
}

/**
 * Registra la aprobacion administrativa de
 * una etapa revisada.
 *
 * IMPORTANTE:
 * No conectar ni desplegar este endpoint hasta
 * haber actualizado de forma segura la base
 * de datos y protegido tambien las rutas de
 * publicacion manual y automatica.
 */
export async function POST(
  req: Request,
  { params }: Contexto
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return responderError(
      "No autorizado.",
      401
    );
  }

  const { id, etapaId } = await params;

  if (!id || !etapaId) {
    return responderError(
      "Identificadores invalidos.",
      400
    );
  }

  let recibido: unknown;

  try {
    recibido = await req.json();
  } catch {
    return responderError(
      "Solicitud invalida.",
      400
    );
  }

  if (
    !recibido ||
    typeof recibido !== "object" ||
    Array.isArray(recibido)
  ) {
    return responderError(
      "Datos invalidos.",
      400
    );
  }

  const datos = recibido as Record<string, unknown>;
  const huellaRevisada = datos.huellaRevision;

  if (
    typeof huellaRevisada !== "string" ||
    !/^[a-f0-9]{64}$/.test(huellaRevisada)
  ) {
    return responderError(
      "Primero debes revisar la vista previa actual.",
      400
    );
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        // Mismo bloqueo usado por las operaciones
        // administrativas sobre el seguimiento.
        const bloqueo =
          await tx.$queryRaw<Array<{ id: string }>>`
            SELECT "id"
            FROM "SeguimientoCliente"
            WHERE "id" = ${id}
            FOR UPDATE
          `;

        if (bloqueo.length === 0) {
          return responderError(
            "Seguimiento no encontrado.",
            404
          );
        }

        const etapa =
          await tx.etapaSeguimiento.findFirst({
            where: {
              id: etapaId,
              seguimientoId: id,
            },
            select: seleccionRevisionEtapa,
          });

        if (!etapa) {
          return responderError(
            "Etapa no encontrada.",
            404
          );
        }

        if (
          etapa.estado !== "BORRADOR" ||
          etapa.publicadaAt !== null ||
          etapa.modoPublicacion !== "MANUAL"
        ) {
          return responderError(
            "Solo pueden aprobarse etapas en borrador.",
            409
          );
        }

        const actividadesActivas =
          etapa.actividades.filter(
            actividad => actividad.activo
          );

        if (actividadesActivas.length === 0) {
          return responderError(
            "Agrega actividades antes de aprobar.",
            409
          );
        }

        if (
          actividadesActivas.some(
            actividad => !actividad.titulo.trim()
          )
        ) {
          return responderError(
            "Hay actividades sin titulo.",
            409
          );
        }

        const huellaActual =
          crearHuellaRevisionEtapa(etapa);

        if (
          !huellasIguales(
            huellaRevisada,
            huellaActual
          )
        ) {
          return responderError(
            "La etapa cambio desde la ultima revision. Abre nuevamente la vista previa.",
            409
          );
        }

        /*
         * Guardado preparado para PostgreSQL.
         *
         * Se usa una consulta parametrizada porque
         * los campos nuevos aun no forman parte
         * del cliente Prisma generado localmente.
         *
         * NO ejecutar hasta actualizar Neon
         * mediante el procedimiento controlado.
         */
        const actualizadas =
          await tx.$executeRaw`
            UPDATE "EtapaSeguimiento"
            SET
              "aprobadaAt" = CURRENT_TIMESTAMP,
              "aprobadaPorAdminId" = ${admin.id},
              "aprobadaPorUsuario" = ${admin.usuario},
              "huellaAprobada" = ${huellaActual},
              "updatedAt" = CURRENT_TIMESTAMP
            WHERE
              "id" = ${etapaId}
              AND "seguimientoId" = ${id}
          `;

        if (actualizadas !== 1) {
          throw new Error(
            "No se pudo guardar la aprobacion."
          );
        }

        return NextResponse.json(
          {
            aprobada: true,
            etapaId: etapa.id,
            mensaje:
              "Etapa aprobada correctamente.",
          },
          {
            headers: {
              "Cache-Control": "private, no-store",
            },
          }
        );
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return responderError(
        "La etapa se modifico al mismo tiempo. Intenta nuevamente.",
        409
      );
    }

    console.error(
      "No se pudo registrar la aprobacion de etapa.",
      error
    );

    return responderError(
      "No se pudo aprobar la etapa.",
      500
    );
  }
}
