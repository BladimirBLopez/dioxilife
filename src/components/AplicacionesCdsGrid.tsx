"use client";

import { useState } from "react";
import Image from "next/image";
import Modal from "./Modal";

type Aplicacion = {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagenUrl: string | null;
};

export default function AplicacionesCdsGrid({
  aplicaciones,
}: {
  aplicaciones: Aplicacion[];
}) {
  const [seleccionada, setSeleccionada] = useState<Aplicacion | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {aplicaciones.map((a) => {
          const esLarga = (a.descripcion?.length || 0) > 90;
          return (
            <div
              key={a.id}
              className="bg-white rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                {a.imagenUrl ? (
                  <Image
                    src={a.imagenUrl}
                    alt={a.nombre}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-gray-300">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
                      <path d="m21 15-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[11px]">Sin imagen</span>
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h3 className="text-sm font-semibold text-[#1F1B24]">
                  {a.nombre}
                </h3>
                {a.descripcion && (
                  <p className="text-xs text-brand-gray mt-1 line-clamp-3">
                    {a.descripcion}
                  </p>
                )}
                {esLarga && (
                  <button
                    onClick={() => setSeleccionada(a)}
                    className="text-xs font-semibold text-brand-pink mt-1.5 text-left hover:underline"
                  >
                    Ver más
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {seleccionada && (
        <Modal title={seleccionada.nombre} onClose={() => setSeleccionada(null)}>
          {seleccionada.imagenUrl && (
            <div className="aspect-video relative rounded-lg overflow-hidden mb-4 bg-gray-50">
              <Image
                src={seleccionada.imagenUrl}
                alt={seleccionada.nombre}
                fill
                className="object-cover"
              />
            </div>
          )}
          <p className="text-sm text-brand-gray whitespace-pre-line">
            {seleccionada.descripcion}
          </p>
        </Modal>
      )}
    </>
  );
}
