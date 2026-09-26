"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type ImagenAdicional = {
  id: string;
  url: string;
};

export default function ProductoGaleria({
  nombre,
  imagenPrincipal,
  imagenes,
  enPromocion,
}: {
  nombre: string;
  imagenPrincipal: string | null;
  imagenes: ImagenAdicional[];
  enPromocion: boolean;
}) {
  const todasLasImagenes = useMemo(() => {
    const urls = [
      ...(imagenPrincipal ? [imagenPrincipal] : []),
      ...imagenes.map((imagen) => imagen.url),
    ];

    return [...new Set(urls)];
  }, [imagenPrincipal, imagenes]);

  const [seleccionada, setSeleccionada] = useState(
    todasLasImagenes[0] || null
  );

  return (
    <div className="md:w-1/2 md:border-r border-gray-100">
      <div className="relative aspect-square bg-[#FAFAFB]">
        {enPromocion && (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-brand-pink px-3 py-1.5 text-xs font-bold tracking-wide text-white shadow-sm">
            OFERTA
          </span>
        )}

        {seleccionada ? (
          <Image
            src={seleccionada}
            alt={nombre}
            fill
            className="object-contain p-6 sm:p-8"
            priority
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-[#A3A0A7]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm">
              <span className="text-3xl">◻</span>
            </div>

            <span className="text-sm">
              Imagen próximamente
            </span>
          </div>
        )}
      </div>

      {todasLasImagenes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-t border-gray-100 bg-white p-3">
          {todasLasImagenes.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setSeleccionada(url)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-[#FAFAFB] transition ${
                seleccionada === url
                  ? "border-brand-pink"
                  : "border-transparent"
              }`}
              aria-label={`Ver imagen ${index + 1}`}
            >
              <Image
                src={url}
                alt={`${nombre} - imagen ${index + 1}`}
                fill
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
