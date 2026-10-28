import "server-only";

/**
 * Sin cliente piloto configurado,
 * no se permiten envios.
 *
 * Nunca imprimir este identificador
 * en respuestas o registros publicos.
 */
export function obtenerClientePilotoPush(): string | null {
  const id =
    process.env.PRUEBAS_ALIMENTOS_PUSH_CLIENTE_PILOTO_ID
      ?.trim() ?? "";

  return /^[A-Za-z0-9_-]{8,128}$/.test(id)
    ? id
    : null;
}
