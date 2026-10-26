/**
 * Interruptor privado de Pruebas de alimentos.
 * Apagado por defecto.
 * Solo se habilita con autorización explícita
 * y las tres credenciales de seguridad.
 */
export function pruebasAlimentosHabilitadas(): boolean {
  if (process.env.PRUEBAS_ALIMENTOS_ACTIVADO !== "true") {
    return false;
  }

  const secreto =
    process.env.PRUEBAS_ALIMENTOS_HMAC_SECRET ?? "";
  const redisUrl =
    process.env.UPSTASH_REDIS_REST_URL ?? "";
  const redisToken =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

  if (
    !/^[0-9a-f]{64}$/i.test(secreto) ||
    !redisToken.trim()
  ) {
    return false;
  }

  try {
    const url = new URL(redisUrl);
    return (
      url.protocol === "https:" &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
