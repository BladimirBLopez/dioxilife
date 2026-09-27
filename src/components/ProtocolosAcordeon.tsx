"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Media from "./Media";
import Modal from "./Modal";
import { esVideo } from "@/lib/media";

type Protocolo = {
  id: string;
  titulo: string;
  contenido: string;
  imagenUrl: string | null;
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

export default function ProtocolosAcordeon({
  protocolos,
  protocoloInicialId,
}: {
  protocolos: Protocolo[];
  protocoloInicialId?: string;
}) {
  const [seleccionado, setSeleccionado] = useState<Protocolo | null>(null);
  const [expandido, setExpandido] = useState(false);

  function abrir(p: Protocolo) {
    setSeleccionado(p);
    setExpandido(false);
  }

  useEffect(() => {
    if (!protocoloInicialId) return;

    const protocolo = protocolos.find((p) => p.id === protocoloInicialId);

    if (protocolo) {
      setSeleccionado(protocolo);
      setExpandido(false);
    }
  }, [protocoloInicialId, protocolos]);

  const esLargo = (seleccionado?.contenido.length || 0) > 220;

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
              {p.imagenUrl && (
                <Media
                  src={p.imagenUrl}
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
        <Modal title={seleccionado.titulo} onClose={() => setSeleccionado(null)}>
          {seleccionado.imagenUrl && (
            <div
              className={`bg-gray-100 relative rounded-lg overflow-hidden mb-4 ${
                esVideo(seleccionado.imagenUrl)
                  ? "aspect-[9/16] max-w-[240px] mx-auto"
                  : "aspect-video"
              }`}
            >
              <Media
                src={seleccionado.imagenUrl}
                alt={seleccionado.titulo}
                fill
                className="object-cover"
                variant="full"
              />
            </div>
          )}
          <p
            className={`text-sm text-brand-gray whitespace-pre-line ${
              !expandido && esLargo ? "line-clamp-4" : ""
            }`}
          >
            {seleccionado.contenido}
          </p>

          {esLargo && (
            <button
              onClick={() => setExpandido(!expandido)}
              className="text-xs font-semibold text-brand-pink mt-2"
            >
              {expandido ? "Ver menos" : "Ver más"}
            </button>
          )}

          {seleccionado.productosRelacionados.length > 0 && (
            <div className="mt-5 border-t pt-4">
              <div className="mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-pink">
                  Catálogo
                </p>
                <h4 className="mt-1 text-sm font-semibold text-[#1F1B24]">
                  Productos relacionados
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {seleccionado.productosRelacionados.map(({ producto }) => (
                  <Link
                    key={producto.id}
                    href={`/producto/${producto.slug}`}
                    className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-2.5 transition hover:bg-white hover:shadow-sm"
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
                  Aplicaciones CDS relacionadas
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {seleccionado.aplicaciones.map(({ aplicacion }) => (
                  <Link
                    key={aplicacion.id}
                    href={`/aplicaciones-cds?aplicacion=${aplicacion.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-2.5 transition hover:bg-white hover:shadow-sm"
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

          {seleccionado.videoUrl && (
            <div className="mt-5 border-t pt-4">
              <h4 className="text-sm font-semibold text-[#1F1B24] mb-2">
                Video
              </h4>

              <div className="bg-gray-100 relative rounded-lg overflow-hidden aspect-video">
                <Media
                  src={seleccionado.videoUrl}
                  alt={`Video de ${seleccionado.titulo}`}
                  fill
                  className="object-contain"
                  variant="full"
                />
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
