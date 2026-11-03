"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Media from "./Media";
import Modal from "./Modal";
import { leerContenidoProtocolo } from "@/lib/protocolos-contenido";

type Protocolo = {
  id: string;
  titulo: string;
  contenido: string;
  imagenUrl: string | null;
  fotoPerfilUrl?: string | null;
  videoUrl: string | null;
  productosRelacionados: {
    producto: {
      id: string;
      nombre: string;
      slug: string;
      imagenUrl: string | null;
    };
  }[];
  aplicaciones: {
    aplicacion: {
      id: string;
      nombre: string;
      imagenUrl: string | null;
    };
  }[];
};


function IconoDetalle({ titulo }: { titulo: string }) {
  const t = titulo.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  let tipo = "documento";

  if (t.includes("producto")) tipo = "producto";
  else if (t.includes("relacionad") && t.includes("aplicacion")) tipo = "relacion";
  else if (t.includes("objetivo")) tipo = "objetivo";
  else if (t.includes("dosis")) tipo = "gota";
  else if (t.includes("aplicacion")) tipo = "aplicacion";
  else if (t.includes("consideracion")) tipo = "alerta";
  else if (t.includes("recomendacion")) tipo = "estrella";
  else if (t.includes("combinacion")) tipo = "enlace";
  else if (t.includes("duracion")) tipo = "calendario";

  const rutas: Record<string, string> = {
    gota: "M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12Z",
    aplicacion: "M8 4h8M7 6H5v15h14V6h-2M9 11h6M9 15h6",
    alerta: "M12 3 2 21h20L12 3Zm0 6v5m0 3h.01",
    estrella: "m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L7 14.2l-5-4.9 6.9-1L12 2Z",
    enlace: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2",
    calendario: "M3 7h18v14H3V7ZM7 3v7M17 3v7M3 11h18M8 15h2m4 0h2",
    producto: "m12 2 9 5-9 5-9-5 9-5ZM3 7v10l9 5 9-5V7M12 12v10",
    relacion: "m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5",
    documento: "M7 3h8l4 4v14H7V3ZM15 3v4h4M9 12h6M9 16h6",
  };

  const rosa = [
    "objetivo", "aplicacion", "estrella", "producto"
  ].includes(tipo);

  return (
    <span
      aria-hidden="true"
      className={
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " +
        (rosa
          ? "bg-pink-50 text-pink-600"
          : "bg-sky-50 text-sky-600")
      }
    >
      <svg
        viewBox="0 0 24 24"
        width="21"
        height="21"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {tipo === "objetivo" ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1.5" />
          </>
        ) : (
          <path d={rutas[tipo] || rutas.documento} />
        )}
      </svg>
    </span>
  );
}

function textoSinTitulo(titulo: string, contenido: string) {
  const texto = contenido.trim();
  const posicion = texto.indexOf(":");

  if (posicion < 1 || posicion > 70) return contenido;

  const normalizar = (s: string) =>
    s.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  return normalizar(texto.slice(0, posicion)) === normalizar(titulo)
    ? texto.slice(posicion + 1).trim()
    : contenido;
}


function agruparContenidoOriginal(contenido: string) {
  const bloques = contenido
    .split(/\r?\n\s*\r?\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const secciones: { titulo: string; contenido: string }[] = [];

  for (const bloque of bloques) {
    const encontrado = bloque.match(
      /^([^:\n]{2,60}):\s*([\s\S]+)$/
    );

    if (encontrado) {
      secciones.push({
        titulo: encontrado[1].trim(),
        contenido: encontrado[2].trim()
      });
    } else {
      const anterior = secciones[secciones.length - 1];

      if (anterior?.titulo === "Descripción") {
        anterior.contenido += "\n\n" + bloque;
      } else {
        secciones.push({
          titulo: "Descripción",
          contenido: bloque
        });
      }
    }
  }

  return secciones;
}

export default function ProtocolosAcordeon({
  protocolos,
  protocoloInicialId,
}: {
  protocolos: Protocolo[];
  protocoloInicialId?: string;
}) {
  const [seleccionado, setSeleccionado] = useState<Protocolo | null>(null);

  function abrir(p: Protocolo) {
    setSeleccionado(p);
  }

  useEffect(() => {
    if (!protocoloInicialId) return;

    const protocolo = protocolos.find((p) => p.id === protocoloInicialId);

    if (protocolo) {
      setSeleccionado(protocolo);
    }
  }, [protocoloInicialId, protocolos]);

  const contenidoLeido = seleccionado
    ? leerContenidoProtocolo(seleccionado.contenido)
    : null;

  return (
    <>
      <div className="space-y-2">
        {protocolos.map((p) => (
          <button
            key={p.id}
            onClick={() => abrir(p)}
            className="w-full flex items-center gap-3 bg-white rounded-xl shadow-sm p-2.5 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="w-14 h-14 shrink-0 relative rounded-lg overflow-hidden bg-gray-100">
              {p.fotoPerfilUrl && (
                <Media
                  src={p.fotoPerfilUrl || ""}
                  alt={p.titulo}
                  fill
                  className="object-cover"
                  variant="thumb"
                />
              )}
            </div>
            <h3 className="flex-1 text-sm font-medium text-[#1F1B24]">
              {p.titulo}
            </h3>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 shrink-0 text-brand-gray"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        ))}
      </div>

      {seleccionado && (

        <Modal title={seleccionado.titulo} hideHeader onClose={() => setSeleccionado(null)}>
          <h2 className="mb-5 break-words pr-12 text-xl font-bold leading-snug text-[#25143C]">
            {seleccionado.titulo}
          </h2>



          {(seleccionado.videoUrl || seleccionado.imagenUrl) && (
            <div className="mb-4">


              <div className="bg-gray-100 relative rounded-lg overflow-hidden aspect-video">
                <Media
                  src={seleccionado.videoUrl || seleccionado.imagenUrl || ""}
                  alt={`Portada de ${seleccionado.titulo}`}
                  fill
                  className="object-contain"
                  variant="full"
                />
              </div>
            </div>
          )}

          {contenidoLeido?.tipo === "organizado" ? (
            <div className="space-y-5">





              {contenidoLeido.documento.secciones.length > 0 && (
                <section className="space-y-3">


                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {contenidoLeido.documento.secciones.map(
                      (seccion, indice) => (
                        <article
                          key={indice}
                          className="group min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="mb-3 flex items-start gap-3">
                            <IconoDetalle titulo={seccion.titulo} />
                            <h4 className="pt-1 text-sm font-bold leading-6 text-[#25143C]">
                              {seccion.titulo}
                            </h4>
                          </div>

                          <p className="whitespace-pre-line break-words text-sm leading-7 text-[#514B5C]">
                            {textoSinTitulo(seccion.titulo, seccion.contenido)}
                          </p>
                        </article>
                      )
                    )}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="space-y-4">





              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {agruparContenidoOriginal(seleccionado.contenido)
                  .map((seccion, indice) => (
                    <article
                      key={indice}
                      className="group min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <IconoDetalle titulo={seccion.titulo} />
                        <h4 className="min-w-0 text-sm font-semibold leading-6 text-[#25143C]">
                          {seccion.titulo}
                        </h4>
                      </div>

                      <p className="whitespace-pre-line break-words text-sm leading-7 text-[#514B5C]">
                        {textoSinTitulo(seccion.titulo, seccion.contenido)}
                      </p>
                    </article>
                  ))}
              </div>
            </div>
          )}

          {seleccionado.productosRelacionados.length > 0 && (
            <div className="mt-5 border-t pt-4">
              <div className="mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-pink">
                  Catálogo
                </p>
                <h4 className="mt-1 text-sm font-semibold text-[#1F1B24]">
                    <span className="inline-flex items-center gap-2">
                      <IconoDetalle titulo="Productos relacionados" />
                      Productos relacionados
                    </span>
                  </h4>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {seleccionado.productosRelacionados.map(({ producto }) => (
                  <Link
                    key={producto.id}
                    href={`/producto/${producto.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:border-pink-200 hover:shadow-md"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
                      {producto.imagenUrl ? (
                        <Media
                          src={producto.imagenUrl}
                          alt={producto.nombre}
                          fill
                          className="object-contain p-1"
                          variant="thumb"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-brand-gray">
                          Sin imagen
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-[#1F1B24]">
                        {producto.nombre}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-brand-pink">
                        Ver producto →
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {seleccionado.aplicaciones.length > 0 && (
            <div className="mt-5 border-t pt-4">
              <div className="mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-pink">
                  Información relacionada
                </p>
                <h4 className="mt-1 text-sm font-semibold text-[#1F1B24]">
                    <span className="inline-flex items-center gap-2">
                      <IconoDetalle titulo="Aplicaciones CDS relacionadas" />
                      Aplicaciones CDS relacionadas
                    </span>
                  </h4>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {seleccionado.aplicaciones.map(({ aplicacion }) => (
                  <Link
                    key={aplicacion.id}
                    href={`/aplicaciones-cds?aplicacion=${aplicacion.id}`}
                    className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:border-pink-200 hover:shadow-md"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
                      {aplicacion.imagenUrl ? (
                        <Media
                          src={aplicacion.imagenUrl}
                          alt={aplicacion.nombre}
                          fill
                          className="object-cover"
                          variant="thumb"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-5 w-5 text-brand-gray/50"
                          >
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 8v4M12 16h.01" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-[#1F1B24]">
                        {aplicacion.nombre}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-brand-pink">
                        Ver información →
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

                  <p className="mt-5 border-t border-gray-100 pt-3 text-xs leading-5 text-gray-500 whitespace-pre-line">
            {contenidoLeido?.tipo === "organizado"
              ? contenidoLeido.documento.seguridad.trim() ||
                "Aviso de salud: ingerir dióxido de cloro puede ser peligroso."
              : "Aviso de salud: ingerir dióxido de cloro puede ser peligroso."}
          </p>
        </Modal>
      )}
    </>
  );
}
