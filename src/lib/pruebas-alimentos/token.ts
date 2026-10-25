import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

/**
 * Utilidades exclusivas del servidor.
 * No importar desde componentes del navegador.
 */

const FORMATO_TOKEN = /^[0-9a-f]{64}$/;

type AccesoPruebaAlimento = {
  tokenAccesoHash: string;
  tokenExpiraAt: Date;
  tokenRevocadoAt: Date | null;
};

export function hashTokenPruebaAlimento(
  token: string
): string {
  if (!FORMATO_TOKEN.test(token)) {
    throw new Error("Formato de acceso no válido");
  }

  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}

export function crearCredencialesPruebaAlimento() {
  const token = randomBytes(32).toString("hex");

  return {
    token,
    tokenAccesoHash: hashTokenPruebaAlimento(token),
  };
}

export function verificarAccesoPruebaAlimento(
  token: string,
  acceso: AccesoPruebaAlimento | null,
  ahora: Date = new Date()
): boolean {
  if (
    !acceso ||
    !FORMATO_TOKEN.test(token) ||
    !FORMATO_TOKEN.test(acceso.tokenAccesoHash)
  ) {
    return false;
  }

  if (acceso.tokenRevocadoAt !== null) {
    return false;
  }

  const vencimiento = acceso.tokenExpiraAt.getTime();
  const momento = ahora.getTime();

  if (
    !Number.isFinite(vencimiento) ||
    !Number.isFinite(momento) ||
    momento >= vencimiento
  ) {
    return false;
  }

  const recibido = Buffer.from(
    hashTokenPruebaAlimento(token),
    "hex"
  );

  const esperado = Buffer.from(
    acceso.tokenAccesoHash,
    "hex"
  );

  return timingSafeEqual(recibido, esperado);
}
