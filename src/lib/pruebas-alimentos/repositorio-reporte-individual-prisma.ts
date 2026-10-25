import { prisma } from "@/lib/prisma";

import type {
  RepositorioReporteAdmin,
} from "./reporte-individual-admin";

/**
 * Consultas administrativas de solo lectura.
 * No selecciona tokens privados ni hashes.
 */

export function obtenerRepositorioReporteAdminPrisma():
  RepositorioReporteAdmin {
  return {
    async buscarCliente(id) {
      return prisma.clientePruebaAlimento.findUnique({
        where: {id},
        select: {
          id: true,
          nombre: true,
        },
      });
    },

    async listarRegistros(clienteId, limite) {
      const filas =
        await prisma.registroPruebaAlimento.findMany({
          where: {
            clienteId,
          },
          select: {
            alimento: true,
            glucosaAntes: true,
            glucosaDespues: true,
            horaMedicionDespues: true,
          },
          orderBy: [
            {createdAt: "desc"},
            {id: "desc"},
          ],
          take: limite,
        });

      return filas.map(fila => ({
        alimento: fila.alimento,
        glucosaAntes: Number(
          fila.glucosaAntes
        ),
        glucosaDespues:
          fila.glucosaDespues === null
            ? null
            : Number(fila.glucosaDespues),
        horaMedicionDespues:
          fila.horaMedicionDespues,
      }));
    },
  };
}
