"use client";

import { useState } from "react";
import Media from "./Media";
import Modal from "./Modal";
import { esVideo } from "@/lib/media";

type Aplicacion = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tratamiento: string | null;
  imagenUrl: string | null;
};

export default function AplicacionesCdsGrid({
  aplicaciones,
}: {
  aplicaciones: Aplicacion[];
}) {
  const [seleccionada, setSeleccionada] = useState<Aplicacion | null>(null);
  const [expandido, setExpandido] = useState(false);

  function abrir(a: Aplicacion) {
    setSeleccionada(a);
    setExpandido(false);
  }

  const esLarga = (seleccionada?.descripcion?.length || 0) > 220;

  return (
    <>
      <div className="space-y-2">
        {aplicaciones.map((a) => (
          <button
            key={a.id}
            onClick={() => abrir(a)}
            className="w-full flex items-center gap-3 bg-white rounded-xl shadow-sm p-2.5 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="w-14 h-14 shrink-0 relative rounded-lg overflow-hidden bg-gray-100">
              {a.imagenUrl && (
                <Media
                  src={a.imagenUrl}
                  alt={a.nombre}
                  fill
                  className="object-cover"
                  variant="thumb"
                />
              )}
            </div>
            <h3 className="flex-1 text-sm font-medium text-[#1F1B24]">
              {a.nombre}
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

      {seleccionada && (
        <Modal title={seleccionada.nombre} onClose={() => setSeleccionada(null)}>
          {seleccionada.imagenUrl && (
            <div
              className={`bg-gray-100 relative rounded-lg overflow-hidden mb-4 ${
                esVideo(seleccionada.imagenUrl)
                  ? "aspect-[9/16] max-w-[240px] mx-auto"
                  : "aspect-video"
              }`}
            >
              <Media
                src={seleccionada.imagenUrl}
                alt={seleccionada.nombre}
                fill
                className="object-cover"
                variant="full"
              />
            </div>
          )}
          {seleccionada.descripcion && (
            <>
              <p
                className={`text-sm text-brand-gray whitespace-pre-line ${
                  !expandido && esLarga ? "line-clamp-4" : ""
                }`}
              >
                {seleccionada.descripcion}
              </p>
              {esLarga && (
                <button
                  onClick={() => setExpandido(!expandido)}
                  className="text-xs font-semibold text-brand-pink mt-2"
                >
                  {expandido ? "Ver menos" : "Ver más"}
                </button>
              )}
            </>
          )}

          {seleccionada.tratamiento && (
            <div className="mt-5 border-t pt-4">
              <h4 className="text-sm font-semibold text-[#1F1B24] mb-2">
                Tratamiento
              </h4>
              <p className="text-sm text-brand-gray whitespace-pre-line">
                {seleccionada.tratamiento}
              </p>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
