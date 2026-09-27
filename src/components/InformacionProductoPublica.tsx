"use client";

import { useState } from "react";

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
  const [faqAbierta, setFaqAbierta] = useState<string | null>(null);

  if (informaciones.length === 0) {
    return null;
  }

  const destacadas = informaciones.filter(
    (info) => info.tipo === "BENEFICIO"
  );

  const ingredientes = informaciones.filter(
    (info) => info.tipo === "INGREDIENTE"
  );

  const preguntas = informaciones.filter(
    (info) => info.tipo === "FAQ"
  );

  const videos = informaciones.filter(
    (info) => info.tipo === "VIDEO"
  );

  const documentos = informaciones.filter(
    (info) => info.tipo === "DOCUMENTO"
  );

  return (
    <div className="mt-8 space-y-6">
      {destacadas.length > 0 && (
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.035)] sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
            Información destacada
          </p>

          <div className="mt-4 space-y-3">
            {destacadas.map((info) => (
              <div
                key={info.id}
                className="flex items-start gap-3"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-pink text-[11px] font-bold text-white">
                  ✓
                </span>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[#1F1B24]">
                    {info.titulo}
                  </h3>

                  {info.contenido && (
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-brand-gray">
                      {info.contenido}
                    </p>
                  )}

                  {info.imagenUrl && (
                    <img
                      src={info.imagenUrl}
                      alt={info.titulo}
                      className="mt-3 max-h-56 w-full rounded-xl bg-gray-50 object-contain"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {ingredientes.length > 0 && (
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.035)] sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
            Composición e ingredientes
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ingredientes.map((info) => (
              <div
                key={info.id}
                className="rounded-2xl bg-gray-50 p-4"
              >
                <h3 className="text-sm font-semibold text-[#1F1B24]">
                  {info.titulo}
                </h3>

                {info.contenido && (
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-brand-gray">
                    {info.contenido}
                  </p>
                )}

                {info.imagenUrl && (
                  <img
                    src={info.imagenUrl}
                    alt={info.titulo}
                    className="mt-3 max-h-44 w-full rounded-xl bg-white object-contain"
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {preguntas.length > 0 && (
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.035)] sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
            Preguntas frecuentes
          </p>

          <div className="mt-4 space-y-2">
            {preguntas.map((info) => {
              const abierta = faqAbierta === info.id;

              return (
                <div
                  key={info.id}
                  className="overflow-hidden rounded-xl border border-gray-100"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setFaqAbierta(abierta ? null : info.id)
                    }
                    className="flex w-full items-center justify-between gap-3 bg-white px-4 py-3 text-left"
                  >
                    <span className="text-sm font-semibold text-[#1F1B24]">
                      {info.titulo}
                    </span>

                    <span
                      className={`text-xl leading-none text-brand-pink transition-transform ${
                        abierta ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>

                  {abierta && info.contenido && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="whitespace-pre-line text-sm leading-6 text-brand-gray">
                        {info.contenido}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.035)] sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
            Videos
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {videos.map((info) => {
              const youtube = info.videoUrl
                ? obtenerYoutubeEmbed(info.videoUrl)
                : null;

              return (
                <div
                  key={info.id}
                  className="overflow-hidden rounded-2xl border border-gray-100"
                >
                  {youtube ? (
                    <div className="aspect-video bg-black">
                      <iframe
                        src={youtube}
                        title={`${info.titulo} - ${nombreProducto}`}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : info.imagenUrl ? (
                    <img
                      src={info.imagenUrl}
                      alt={info.titulo}
                      className="aspect-video w-full bg-gray-50 object-contain"
                    />
                  ) : null}

                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-[#1F1B24]">
                      {info.titulo}
                    </h3>

                    {info.contenido && (
                      <p className="mt-1 text-sm leading-6 text-brand-gray">
                        {info.contenido}
                      </p>
                    )}

                    {info.videoUrl && !youtube && (
                      <a
                        href={info.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm font-semibold text-brand-pink"
                      >
                        Ver video →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {documentos.length > 0 && (
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.035)] sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
            Documentación
          </p>

          <div className="mt-4 space-y-3">
            {documentos.map((info) => (
              <div
                key={info.id}
                className="rounded-2xl bg-gray-50 p-4"
              >
                <h3 className="text-sm font-semibold text-[#1F1B24]">
                  {info.titulo}
                </h3>

                {info.contenido && (
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-brand-gray">
                    {info.contenido}
                  </p>
                )}

                {info.imagenUrl && (
                  <img
                    src={info.imagenUrl}
                    alt={info.titulo}
                    className="mt-3 max-h-56 w-full rounded-xl bg-white object-contain"
                  />
                )}

                {info.videoUrl && (
                  <a
                    href={info.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-brand-pink"
                  >
                    Ver documento →
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
