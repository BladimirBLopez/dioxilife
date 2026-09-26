"use client";

import { useEffect, useState } from "react";
import Media from "./Media";
import Modal from "./Modal";
import { esVideo } from "@/lib/media";

type Protocolo = {
  id: string;
  titulo: string;
  contenido: string;
  imagenUrl: string | null;
  videoUrl: string | null;
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
