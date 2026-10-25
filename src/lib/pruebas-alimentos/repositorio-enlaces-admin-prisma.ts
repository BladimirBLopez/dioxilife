import { prisma } from "@/lib/prisma";

import type {
  DependenciasEnlacesAdmin,
} from "./servicio-enlaces-admin";

/**
 * Reutiliza el PrismaClient actual de DioxiLife.
 *
 * Construir estas funciones no ejecuta consultas.
 * Las consultas solo se realizarán al llamarlas
 * desde una API administrativa autenticada.
 *
 * No crea tablas, no realiza migraciones
 * ni elimina clientes o mediciones.
 */
export function obtenerDependenciasEnlacesPrisma():
  DependenciasEnlacesAdmin {
  return {
    buscarSeguimiento(seguimientoId) {
      return prisma.seguimientoCliente.findUnique({
        where: {
          id: seguimientoId,
        },
        select: {
          id: true,
          nombreCliente: true,
          telefonoCliente: true,
        },
      });
    },

    crearCliente(datos) {
      return prisma.clientePruebaAlimento.create({
        data: {
          nombre: datos.nombre,
          telefono: datos.telefono,
          seguimientoId: datos.seguimientoId,
          tokenAccesoHash: datos.tokenAccesoHash,
          tokenCreadoAt: datos.tokenCreadoAt,
          tokenExpiraAt: datos.tokenExpiraAt,
          tokenRevocadoAt: datos.tokenRevocadoAt,
        },
        select: {
          id: true,
        },
      });
    },

    async revocarCliente(id, fecha) {
      const resultado =
        await prisma.clientePruebaAlimento.updateMany({
          where: {
            id,
            tokenRevocadoAt: null,
          },
          data: {
            tokenRevocadoAt: fecha,
          },
        });

      return resultado.count;
    },
  };
}
