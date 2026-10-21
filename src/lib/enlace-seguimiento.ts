/**
 * Genera una URL pública más corta sin cambiar
 * el token original ni su hash almacenado.
 *
 * 64 caracteres hexadecimales (256 bits)
 * se convierten en 43 caracteres Base64URL.
 */
export function enlaceCortoSeguimiento(
  origen: string,
  token: string
): string {
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    throw new Error(
      "Token de seguimiento inválido"
    );
  }

  let bytes = "";

  for (let i = 0; i < token.length; i += 2) {
    bytes += String.fromCharCode(
      parseInt(token.slice(i, i + 2), 16)
    );
  }

  const codigo = btoa(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return (
    origen.replace(/\/+$/, "") +
    "/s/" +
    codigo
  );
}
