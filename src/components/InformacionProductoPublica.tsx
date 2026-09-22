"use client";

import Modal from "@/components/Modal";

type TipoInformacion =
  | "BENEFICIO"
  | "VIDEO"
  | "INGREDIENTE"
  | "FAQ"
  | "DOCUMENTO";

type Informacion = {
  id: string;
  tipo: TipoInformacion;
  titulo: string;
  contenido: string | null;
  imagenUrl: string | null;
  videoUrl: string | null;
};

type Props = {
  nombreProducto: string;
  informaciones: Informacion[];
};

import { useState } from "react";

function nombreTipo(tipo: TipoInformacion) {
  switch (tipo) {
    case "BENEFICIO":
      return "Beneficios";
    case "VIDEO":
      return "Videos";
    case "INGREDIENTE":
      return "Ingredientes";
    case "FAQ":
      return "Preguntas frecuentes";
    case "DOCUMENTO":
      return "Información adicional";
  }
}

function obtenerYoutubeEmbed(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (
      parsed.hostname.includes("youtube.com") ||
      parsed.hostname.includes("youtube-nocookie.com")
    ) {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export default function InformacionProductoPublica({
  nombreProducto,
  informaciones,
}: Props) {
  const [abierto, setAbierto] = useState(false);

  if (informaciones.length === 0) {
    return null;
  }

  const tipos: TipoInformacion[] = [
    "BENEFICIO",
    "INGREDIENTE",
    "VIDEO",
    "FAQ",
    "DOCUMENTO",
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="w-full mt-3 rounded-xl border-2 border-brand-blue text-brand-blue font-semibold py-3 px-4 hover:bg-brand-blue/5 transition-colors"
      >
        Conoce más del producto
      </button>

      {abierto && (
        <Modal
          title={`Conoce más: ${nombreProducto}`}
          onClose={() => setAbierto(false)}
        >
          <div className="space-y-6">
            {tipos.map((tipo) => {
              const items = informaciones.filter(
                (info) => info.tipo === tipo
              );

              if (items.length === 0) return null;

              return (
                <section key={tipo}>
                  <h3 className="text-base font-bold text-brand-blue mb-3">
                    {nombreTipo(tipo)}
                  </h3>

                  <div className="space-y-3">
                    {items.map((info) => {
                      const youtube =
                        info.videoUrl && tipo === "VIDEO"
                          ? obtenerYoutubeEmbed(info.videoUrl)
                          : null;

                      return (
                        <div
                          key={info.id}
                          className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                        >
                          <h4 className="font-semibold text-[#1F1B24]">
                            {info.titulo}
                          </h4>

                          {info.contenido && (
                            <p className="text-sm text-brand-gray mt-2 whitespace-pre-line">
                              {info.contenido}
                            </p>
                          )}

                          {info.imagenUrl && (
                            <img
                              src={info.imagenUrl}
                              alt={info.titulo}
                              className="w-full max-h-56 object-contain rounded-xl mt-3 bg-white"
                            />
                          )}

                          {youtube && (
                            <div className="mt-3 aspect-video rounded-xl overflow-hidden bg-black">
                              <iframe
                                src={youtube}
                                title={info.titulo}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          )}

                          {info.videoUrl && !youtube && (
                            <a
                              href={info.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-3 text-sm text-brand-pink font-semibold hover:underline"
                            >
                              Ver video
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </Modal>
      )}
    </>
  );
}
