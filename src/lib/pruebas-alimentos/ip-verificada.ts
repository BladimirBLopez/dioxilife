import { isIP } from "node:net";

/**
 * Identificación conservadora de IP en Vercel.
 *
 * Requiere que la aplicación esté desplegada
 * directamente en Vercel Production y que ambas
 * cabeceras de Vercel coincidan.
 *
 * Si existe otro proxy delante de Vercel,
 * su configuración deberá revisarse primero.
 *
 * Esta función no accede a redes ni registra IP.
 */

export function obtenerIpVerificadaVercel(
  request: Pick<Request, "headers">
): string | null {
  if (
    process.env.VERCEL !== "1" ||
    process.env.VERCEL_ENV !== "production"
  ) {
    return null;
  }

  const ipPrincipal = request.headers.get(
    "x-forwarded-for"
  );

  const ipVercel = request.headers.get(
    "x-vercel-forwarded-for"
  );

  if (
    !ipPrincipal ||
    !ipVercel ||
    ipPrincipal !== ipVercel
  ) {
    return null;
  }

  // No aceptar cadenas de múltiples proxies,
  // puertos, zonas IPv6 ni direcciones ambiguas.
  if (
    ipPrincipal !== ipPrincipal.trim() ||
    ipPrincipal.length > 45 ||
    ipPrincipal.includes(",") ||
    ipPrincipal.includes(";") ||
    ipPrincipal.includes("%") ||
    ipPrincipal.includes("[") ||
    ipPrincipal.includes("]") ||
    /\s/.test(ipPrincipal)
  ) {
    return null;
  }

  if (isIP(ipPrincipal) === 0) {
    return null;
  }

  return ipPrincipal;
}
