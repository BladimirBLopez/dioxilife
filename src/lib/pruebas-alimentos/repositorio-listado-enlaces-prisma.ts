import { prisma } from "@/lib/prisma";

import type {
  DependenciasListadoAdmin,
} from "./listado-enlaces-admin";

/**
 * Solo lectura.
 *
 * Utiliza la conexión Prisma existente.
 * Nunca recupera tokenAccesoHash.
 */

export function obtenerListadoEnlacesPrisma():
  DependenciasListadoAdmin {
  return {
    async listar(limite) {
      return prisma.clientePruebaAlimento.findMany({
        take: limite,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          nombre: true,
          seguimientoId: true,
          tokenCreadoAt: true,
          tokenExpiraAt: true,
          tokenRevocadoAt: true,
        },
      });
    },
  };
}
