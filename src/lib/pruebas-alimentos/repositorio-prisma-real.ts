import { prisma } from "@/lib/prisma";

import {
  crearRepositorioPruebaAlimentosPrisma,
} from "./repositorio-prisma-registros";

import type {
  RepositorioPruebaAlimentos,
} from "./servicio-registros";

/**
 * Reutiliza la instancia Prisma existente de DioxiLife.
 *
 * No crea otra instancia.
 * No realiza migraciones.
 * No consulta la base de datos al construir el
 * repositorio.
 *
 * Las consultas solamente podrán ejecutarse
 * cuando un servicio autorizado invoque
 * expresamente las operaciones del repositorio.
 */
export function obtenerRepositorioPruebaAlimentos():
  RepositorioPruebaAlimentos {

  return crearRepositorioPruebaAlimentosPrisma(
    prisma.registroPruebaAlimento
  );
}
