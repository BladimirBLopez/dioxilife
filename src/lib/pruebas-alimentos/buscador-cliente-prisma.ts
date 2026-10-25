import { prisma } from "@/lib/prisma";

import type {
  DependenciasPuertaPublica,
} from "./puerta-publica";

/**
 * Consulta de acceso privado por hash.
 *
 * Nunca recibe un token sin procesar.
 * Nunca busca por nombre o teléfono.
 * No crea una nueva conexión Prisma.
 *
 * La validación del vencimiento y revocación
 * corresponde a la puerta pública segura.
 */

const HASH_VALIDO = /^[0-9a-f]{64}$/;

export const buscarClientePorHash: NonNullable<
  DependenciasPuertaPublica["buscarPorHash"]
> = async (hash) => {
  if (!HASH_VALIDO.test(hash)) {
    return null;
  }

  return prisma.clientePruebaAlimento.findUnique({
    where: {
      tokenAccesoHash: hash,
    },
  });
};
