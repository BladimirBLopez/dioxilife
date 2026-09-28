"use client";

import { useEffect, useMemo, useState } from "react";
import Media from "./Media";
import Modal from "./Modal";
import ExperienciaForm from "./ExperienciaForm";
import { esVideo } from "@/lib/media";

type Aplicacion = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tratamiento: string | null;
  imagenUrl: string | null;
  protocolos: {
    protocolo: {
      id: string;
      titulo: string;
      contenido: string;
      imagenUrl: string | null;
      videoUrl: string | null;
    };
  }[];
  resenas: {
    id: string;
    nombreCliente: string;
    calificacion: number | null;
    comentario: string;
    imagenUrl: string | null;
    tiempoUso: string | null;
    producto: {
      nombre: string;
      slug: string;
    } | null;
  }[];
};

export default function AplicacionesCdsGrid({
  aplicaciones,
  productos,
  aplicacionInicialId,
}: {
  aplicaciones: Aplicacion[];
  productos: {
    id: string;
    nombre: string;
  }[];
  aplicacionInicialId?: string;
}) {
  const [seleccionada, setSeleccionada] = useState<Aplicacion | null>(null);
  const [expandido, setExpandido] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [soloConProtocolo, setSoloConProtocolo] = useState(false);
  const [letra, setLetra] = useState("");
  const [mostrarFormularioExperiencia, setMostrarFormularioExperiencia] =
    useState(false);

  useEffect(() => {
    if (!aplicacionInicialId) return;

    const aplicacion = aplicaciones.find(
      (item) => item.id === aplicacionInicialId
    );

    if (aplicacion) {
      setSeleccionada(aplicacion);
      setExpandido(false);
    }
  }, [aplicacionInicialId, aplicaciones]);

  const aplicacionesFiltradas = useMemo(() => {
    const normalizar = (texto: string) =>
      texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const termino = normalizar(busqueda);

    return [...aplicaciones]
      .filter((a) => {
        const coincideBusqueda =
          !termino ||
          normalizar(a.nombre).includes(termino);

        const coincideProtocolo =
          !soloConProtocolo || a.protocolos.length > 0;

        const coincideLetra =
          !letra ||
          normalizar(a.nombre).startsWith(normalizar(letra));

        return coincideBusqueda && coincideProtocolo && coincideLetra;
      })
      .sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
      );
  }, [aplicaciones, busqueda, soloConProtocolo, letra]);

  function abrir(a: Aplicacion) {
    setSeleccionada(a);
    setExpandido(false);
    setMostrarFormularioExperiencia(false);
  }

  const esLarga = (seleccionada?.descripcion?.length || 0) > 220;

  return (
    <>
      <div className="mb-5 space-y-3">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>

          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar dolencia..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-[#1F1B24] outline-none transition focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/10"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoloConProtocolo(false)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              !soloConProtocolo
                ? "bg-brand-pink text-white"
                : "border border-gray-200 bg-white text-brand-gray"
            }`}
          >
            Todas
          </button>

          <button
            type="button"
            onClick={() => setSoloConProtocolo(true)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              soloConProtocolo
                ? "bg-brand-pink text-white"
                : "border border-gray-200 bg-white text-brand-gray"
            }`}
          >
            Con protocolo
          </button>

          <span className="ml-auto text-xs text-brand-gray">
            {aplicacionesFiltradas.length} resultado(s)
          </span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setLetra("")}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              !letra
                ? "bg-brand-blue text-white"
                : "border border-gray-200 bg-white text-brand-gray"
            }`}
          >
            Todas
          </button>

          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLetra(l)}
              className={`h-8 w-8 shrink-0 rounded-lg text-xs font-semibold transition ${
                letra === l
                  ? "bg-brand-blue text-white"
                  : "border border-gray-200 bg-white text-brand-gray"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {aplicacionesFiltradas.length === 0 ? (
        <div className="rounded-xl bg-white px-4 py-10 text-center shadow-sm">
          <p className="text-sm font-medium text-[#1F1B24]">
            No encontramos esa dolencia
          </p>
          <p className="mt-1 text-xs text-brand-gray">
            Prueba con otro nombre o cambia el filtro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {aplicacionesFiltradas.map((a) => (
            <button
              key={a.id}
              onClick={() => abrir(a)}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-[0_3px_14px_rgba(0,0,0,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.06)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {a.imagenUrl ? (
                  <Media
                    src={a.imagenUrl}
                    alt={a.nombre}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    variant="thumb"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-pink/10 text-brand-pink">
                      +
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#1F1B24]">
                      {a.nombre}
                    </h3>

                    {a.protocolos.length > 0 && (
                      <span className="mt-2 inline-flex rounded-full bg-brand-pink/10 px-2 py-1 text-[10px] font-semibold text-brand-pink">
                        Con protocolo
                      </span>
                    )}
                  </div>

                  <span className="shrink-0 text-lg text-brand-gray/50 transition group-hover:translate-x-0.5 group-hover:text-brand-pink">
                    ›
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

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

          {seleccionada.protocolos.length > 0 && (
            <div className="mt-5 border-t pt-4">
              <h4 className="text-sm font-semibold text-[#1F1B24] mb-3">
                Protocolos relacionados
              </h4>

              <div className="space-y-2">
                {seleccionada.protocolos.map(({ protocolo }) => (
                  <a
                    key={protocolo.id}
                    href={`/protocolos?protocolo=${protocolo.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-[#1F1B24] hover:border-brand-pink hover:bg-brand-pink/5 transition-colors"
                  >
                    <span>{protocolo.titulo}</span>
                    <span className="text-xs font-semibold text-brand-pink whitespace-nowrap">
                      Ver protocolo
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {seleccionada.resenas.length > 0 && (
            <div className="mt-5 border-t pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-[#1F1B24]">
                  Testimonios relacionados
                </h4>
                <span className="rounded-full bg-brand-pink/10 px-2 py-1 text-[10px] font-bold text-brand-pink">
                  {seleccionada.resenas.length}
                </span>
              </div>

              <div className="space-y-3">
                {seleccionada.resenas.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-[#E9E4F2] bg-[#FAF9FC] p-4"
                  >
                    <div className="flex items-center gap-3">
                      {r.imagenUrl ? (
                        <img
                          src={r.imagenUrl}
                          alt={r.nombreCliente}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-pink/10 text-sm font-bold text-brand-pink">
                          {r.nombreCliente.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1F1B24]">
                          {r.nombreCliente}
                        </p>
                        <p className="text-xs text-yellow-500">
                          {r.calificacion !== null
                            ? "★".repeat(r.calificacion)
                            : null}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-brand-gray">
                      “{r.comentario}”
                    </p>

                    {r.producto && (
                      <a
                        href={`/producto/${r.producto.slug}`}
                        className="mt-3 inline-flex text-xs font-semibold text-brand-pink"
                      >
                        Producto relacionado: {r.producto.nombre} →
                      </a>
                    )}

                    <p className="mt-2 text-[10px] text-[#8A8790]">
                      Experiencia personal compartida por un cliente.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 border-t border-[#EEEAF5] pt-4">
            {!mostrarFormularioExperiencia ? (
              <div className="rounded-2xl border border-[#E9E4F2] bg-gradient-to-br from-[#FFF7FC] to-[#F8F6FF] p-4 text-center">
                <p className="text-sm font-bold text-[#1F1B24]">
                  ¿También quieres compartir tu experiencia?
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-brand-gray">
                  Tu experiencia puede ayudar a otras personas a conocer
                  diferentes vivencias de nuestra comunidad.
                </p>

                <button
                  type="button"
                  onClick={() => setMostrarFormularioExperiencia(true)}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-brand-pink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto"
                >
                  Compartir mi experiencia
                </button>
              </div>
            ) : (
              <ExperienciaForm
                aplicacionId={seleccionada.id}
                aplicacionNombre={seleccionada.nombre}
                productos={productos}
                onCancelar={() => setMostrarFormularioExperiencia(false)}
              />
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
