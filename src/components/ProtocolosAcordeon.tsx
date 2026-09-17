"use client";

import { useState } from "react";
import Media from "./Media";
import { esVideo } from "@/lib/media";

type Protocolo = {
  id: string;
  titulo: string;
  contenido: string;
  imagenUrl: string | null;
};

export default function ProtocolosAcordeon({
  protocolos,
}: {
  protocolos: Protocolo[];
}) {
  const [abiertoId, setAbiertoId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {protocolos.map((p) => {
        const abierto = abiertoId === p.id;
        return (
          <div
            key={p.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <button
              onClick={() => setAbiertoId(abierto ? null : p.id)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <h3 className="text-sm font-semibold text-[#1F1B24]">
                {p.titulo}
              </h3>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-5 h-5 shrink-0 text-brand-gray transition-transform duration-200 ${
                  abierto ? "rotate-180" : ""
                }`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {abierto && (
              <div className="px-4 pb-4">
                {p.imagenUrl && (
                  <div
                    className={`bg-gray-100 relative rounded-lg overflow-hidden mb-3 ${
                      esVideo(p.imagenUrl)
                        ? "aspect-[9/16] max-w-[240px] mx-auto"
                        : "aspect-video"
                    }`}
                  >
                    <Media
                      src={p.imagenUrl}
                      alt={p.titulo}
                      fill
                      className="object-cover"
                      variant="full"
                    />
                  </div>
                )}
                <p className="text-sm text-brand-gray whitespace-pre-line">
                  {p.contenido}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
