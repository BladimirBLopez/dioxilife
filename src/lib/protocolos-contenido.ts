/**
 * Formato de contenido organizado para protocolos.
 * Compatible con registros antiguos.
 *
 * No ejecuta consultas ni modifica la base de datos.
 */

export const FORMATO_PROTOCOLO =
  "dioxilife-protocolo-v1" as const;

export type SeccionProtocolo = {
  titulo: string;
  contenido: string;
};

export type DocumentoProtocolo = {
  formato: typeof FORMATO_PROTOCOLO;
  resumen: string;
  secciones: SeccionProtocolo[];
  seguridad: string;
  textoOriginal?: string;
};

export type ContenidoLeido =
  | {
      tipo: "anterior";
      texto: string;
    }
  | {
      tipo: "organizado";
      documento: DocumentoProtocolo;
    };

export function leerContenidoProtocolo(
  valor: string
): ContenidoLeido {
  const anterior: ContenidoLeido = {
    tipo: "anterior",
    texto: valor,
  };

  try {
    const datos: unknown = JSON.parse(valor);

    if (
      typeof datos !== "object" ||
      datos === null ||
      Array.isArray(datos)
    ) {
      return anterior;
    }

    const obj = datos as Record<string, unknown>;

    if (
      obj.formato !== FORMATO_PROTOCOLO ||
      typeof obj.resumen !== "string" ||
      typeof obj.seguridad !== "string" ||
      !Array.isArray(obj.secciones)
    ) {
      return anterior;
    }

    if (
      obj.secciones.length > 40 ||
      !obj.secciones.every(
        (item): item is SeccionProtocolo =>
          typeof item === "object" &&
          item !== null &&
          typeof item.titulo === "string" &&
          typeof item.contenido === "string"
      )
    ) {
      return anterior;
    }

    return {
      tipo: "organizado",
      documento: {
        formato: FORMATO_PROTOCOLO,
        resumen: obj.resumen,
        seguridad: obj.seguridad,
        secciones: obj.secciones,
        textoOriginal:
          typeof obj.textoOriginal === "string"
            ? obj.textoOriginal
            : undefined,
      },
    };
  } catch {
    return anterior;
  }
}

export function guardarContenidoProtocolo(
  documento: DocumentoProtocolo
): string {
  if (
    documento.formato !== FORMATO_PROTOCOLO ||
    documento.secciones.length > 40
  ) {
    throw new Error("Formato de protocolo invalido");
  }

  return JSON.stringify(documento);
}


/**
 * Prepara la informacion para visitantes.
 * No incluye textoOriginal ni apartados heredados
 * llamados "Contenido original".
 * No modifica la informacion guardada.
 */
export function prepararContenidoPublico(
  valor: string
): string {
  const lectura = leerContenidoProtocolo(valor);

  if (lectura.tipo === "anterior") {
    return valor;
  }

  const documento = lectura.documento;

  return guardarContenidoProtocolo({
    formato: FORMATO_PROTOCOLO,
    resumen: documento.resumen,
    seguridad: documento.seguridad,
    secciones: documento.secciones
      .filter(
        (seccion) =>
          seccion.titulo.trim().toLowerCase() !==
          "contenido original"
      )
      .map((seccion) => ({
        titulo: seccion.titulo,
        contenido: seccion.contenido,
      })),
  });
}


export function validarContenidoPublicable(
  valor: string
): string | null {
  const lectura = leerContenidoProtocolo(valor);

  if (lectura.tipo !== "organizado") {
    return "Organiza el contenido antes de publicarlo.";
  }

  const doc = lectura.documento;

  if (!doc.resumen.trim()) {
    return "Completa el resumen antes de publicar.";
  }

  if (!doc.seguridad.trim()) {
    return "Completa seguridad y evidencia antes de publicar.";
  }

  if (!doc.secciones.length) {
    return "Agrega al menos un apartado antes de publicar.";
  }

  if (doc.secciones.some(
    (s) => !s.titulo.trim() || !s.contenido.trim()
  )) {
    return "Completa todos los apartados antes de publicar.";
  }

  if (doc.secciones.some(
    (s) => s.titulo.trim().toLowerCase() ===
      "contenido original"
  )) {
    return "Revisa o retira el apartado Contenido original.";
  }

  return null;
}
