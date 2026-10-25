/**
 * Protección adicional contra solicitudes
 * administrativas originadas en sitios ajenos.
 *
 * No sustituye autenticación, autorización
 * ni límites de solicitudes.
 *
 * Si falta Origin o el origen es diferente,
 * se rechaza la operación.
 */

export function origenAdministrativoValido(
  request: Pick<Request, "url" | "headers">
): boolean {
  const origen = request.headers.get("origin");

  if (!origen || origen === "null") {
    return false;
  }

  let origenRecibido: URL;
  let destino: URL;

  try {
    origenRecibido = new URL(origen);
    destino = new URL(request.url);
  } catch {
    return false;
  }

  if (
    !["https:", "http:"].includes(
      origenRecibido.protocol
    )
  ) {
    return false;
  }

  if (
    !["https:", "http:"].includes(
      destino.protocol
    )
  ) {
    return false;
  }

  // Origin debe contener únicamente esquema,
  // dominio y puerto, sin ruta ni credenciales.
  if (
    origen !== origenRecibido.origin ||
    origenRecibido.username ||
    origenRecibido.password
  ) {
    return false;
  }

  if (
    origenRecibido.origin !== destino.origin
  ) {
    return false;
  }

  // Protección adicional para navegadores
  // que envían metadatos Fetch.
  const sitio = request.headers.get(
    "sec-fetch-site"
  );

  if (
    sitio !== null &&
    sitio !== "same-origin" &&
    sitio !== "none"
  ) {
    return false;
  }

  return true;
}
