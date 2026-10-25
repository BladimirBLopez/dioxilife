import {
  hashTokenPruebaAlimento,
  verificarAccesoPruebaAlimento,
} from "./token";

/**
 * Comprobación de acceso independiente del módulo.
 *
 * No consulta Neon por sí misma:
 * la futura API deberá aportar una función
 * que busque únicamente por el hash del token.
 *
 * No almacenar ni registrar en logs el token original.
 */

const FORMATO_TOKEN = /^[0-9a-f]{64}$/;

export type RegistroAccesoPrueba = {
  id: string;
  nombre: string;
  tokenAccesoHash: string;
  tokenExpiraAt: Date;
  tokenRevocadoAt: Date | null;
};

export type BuscarAccesoPorHash = (
  tokenHash: string
) => Promise<RegistroAccesoPrueba | null>;

export type ClientePruebaAutorizado = {
  id: string;
  nombre: string;
};

export async function resolverClientePruebaPorToken(
  token: string,
  buscarPorHash: BuscarAccesoPorHash,
  ahora: Date = new Date()
): Promise<ClientePruebaAutorizado | null> {
  // Evita consultas para tokens mal formados.
  if (!FORMATO_TOKEN.test(token)) {
    return null;
  }

  // El valor original no se envía al buscador.
  const tokenHash = hashTokenPruebaAlimento(token);

  const registro = await buscarPorHash(tokenHash);

  if (!registro) {
    return null;
  }

  // Comprueba coincidencia, vencimiento y revocación.
  const permitido = verificarAccesoPruebaAlimento(
    token,
    registro,
    ahora
  );

  if (!permitido) {
    return null;
  }

  if (
    typeof registro.id !== "string" ||
    !registro.id.trim() ||
    typeof registro.nombre !== "string" ||
    !registro.nombre.trim()
  ) {
    return null;
  }

  // Devolver solo lo necesario para identificar
  // al cliente una vez autorizado.
  return {
    id: registro.id,
    nombre: registro.nombre,
  };
}
