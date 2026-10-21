import { createHash } from "crypto";
import { enlaceCortoSeguimiento } from "@/lib/enlace-seguimiento";

const PATRON_URL = /https?:\/\/[^\s<>"']+/g;

function sinPuntuacion(texto: string) {
  return texto.replace(/[)\],.;!?]+$/g, "");
}

function transformarEnlace(
  texto: string,
  hashVigente: string
): string | null {
  if (!/^[a-f0-9]{64}$/i.test(hashVigente)) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(texto);
  } catch {
    return null;
  }

  if (
    (url.protocol !== "https:" &&
      url.protocol !== "http:") ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    return null;
  }

  let token: string | null = null;

  const antiguo = /^\/seguimiento\/([a-f0-9]{64})\/?$/i.exec(
    url.pathname
  );

  const corto = /^\/s\/([A-Za-z0-9_-]{43})\/?$/.exec(
    url.pathname
  );

  if (antiguo) {
    token = antiguo[1];
  } else if (corto) {
    try {
      const bytes = Buffer.from(
        corto[1],
        "base64url"
      );

      if (
        bytes.length !== 32 ||
        bytes.toString("base64url") !== corto[1]
      ) {
        return null;
      }

      token = bytes.toString("hex");
    } catch {
      return null;
    }
  }

  if (!token) {
    return null;
  }

  const calculado = createHash("sha256")
    .update(token)
    .digest("hex");

  if (calculado !== hashVigente) {
    return null;
  }

  return enlaceCortoSeguimiento(
    url.origin,
    token
  );
}

export function extraerEnlaceCortoVigente(
  mensaje: string,
  hashVigente: string
): string | null {
  for (const coincidencia of mensaje.matchAll(
    PATRON_URL
  )) {
    const texto = sinPuntuacion(
      coincidencia[0]
    );

    const resultado = transformarEnlace(
      texto,
      hashVigente
    );

    if (resultado) {
      return resultado;
    }
  }

  return null;
}

export function acortarEnlacesVigentesEnMensaje(
  mensaje: string,
  hashVigente: string
): string {
  return mensaje.replace(
    PATRON_URL,
    (original) => {
      const limpio = sinPuntuacion(
        original
      );

      const convertido = transformarEnlace(
        limpio,
        hashVigente
      );

      if (!convertido) {
        return original;
      }

      return (
        convertido +
        original.slice(limpio.length)
      );
    }
  );
}
