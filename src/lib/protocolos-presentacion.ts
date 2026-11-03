import { leerContenidoProtocolo } from "@/lib/protocolos-contenido";

export function esCambioSoloPresentacion(
  anterior: string,
  siguiente: string
): boolean {
  if (anterior === siguiente) return true;

  const previo = leerContenidoProtocolo(anterior);
  const nuevo = leerContenidoProtocolo(siguiente);

  if (nuevo.tipo !== "organizado") return false;

  if (previo.tipo === "anterior") {
    const normalizar = (texto: string) =>
      texto.replace(/\s/g, "");

    return (
      nuevo.documento.textoOriginal === anterior &&
      nuevo.documento.resumen.trim() === "" &&
      nuevo.documento.seguridad.trim() === "" &&
      normalizar(anterior) === normalizar(
        nuevo.documento.secciones
          .map((s) => s.contenido)
          .join("")
      )
    );
  }

  const a = previo.documento;
  const b = nuevo.documento;

  const textos = (secciones: typeof a.secciones) =>
    secciones.map((s) => s.contenido).sort();

  return (
    a.resumen === b.resumen &&
    a.seguridad === b.seguridad &&
    a.textoOriginal === b.textoOriginal &&
    JSON.stringify(textos(a.secciones)) ===
      JSON.stringify(textos(b.secciones))
  );
}
