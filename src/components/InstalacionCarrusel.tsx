"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const pasos = [
  {
    imagen: "/instalacion/pasos/paso-1-abrir-enlace.png",
    titulo: "Abre el enlace",
    descripcion: "Abre en Chrome el enlace que recibiste por WhatsApp.",
  },
  {
    imagen: "/instalacion/pasos/paso-2-instalar.png",
    titulo: "Toca Instalar",
    descripcion: "Usa el botón de instalación si tu navegador lo muestra.",
  },
  {
    imagen: "/instalacion/pasos/paso-3-confirmar.png",
    titulo: "Confirma",
    descripcion: "Acepta la solicitud oficial de instalación de Android.",
  },
  {
    imagen: "/instalacion/pasos/paso-4-abrir-app.png",
    titulo: "Abre DioxiLife",
    descripcion: "Encuentra el ícono de DioxiLife en tu celular.",
  },
] as const;

export default function InstalacionCarrusel() {
  const [actual, setActual] = useState(0);
  const contenedor = useRef<HTMLOListElement>(null);

  const irA = (indice: number) => {
    const destino = Math.max(0, Math.min(pasos.length - 1, indice));
    const elemento = contenedor.current;
    if (!elemento) return;
    elemento.scrollTo({ left: destino * elemento.clientWidth, behavior: "smooth" });
    setActual(destino);
  };

  return (
    <section
      aria-labelledby="titulo-carrusel-instalacion"
      className="mt-6 overflow-hidden rounded-3xl border border-fuchsia-100 bg-gradient-to-b from-fuchsia-50 to-white p-4 shadow-sm sm:p-5"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-700">
        Guía visual · Android
      </p>
      <h2
        id="titulo-carrusel-instalacion"
        className="mt-2 text-xl font-bold text-slate-900"
      >
        Aprende a instalar DioxiLife
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Desliza las imágenes o usa las flechas para ver los cuatro pasos.
      </p>

      <ol
        ref={contenedor}
        onScroll={(evento) => {
          const elemento = evento.currentTarget;
          const paso = Math.round(
            elemento.scrollLeft / Math.max(1, elemento.clientWidth)
          );
          setActual(Math.max(0, Math.min(pasos.length - 1, paso)));
        }}
        className="mt-4 flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl"
        aria-label="Pasos para instalar DioxiLife en Android"
      >
        {pasos.map((paso, indice) => (
          <li key={paso.imagen} className="w-full shrink-0 snap-start">
            <figure className="w-full overflow-hidden rounded-2xl border border-fuchsia-100 bg-white">
              <Image
                src={paso.imagen}
                alt={`Paso ${indice + 1}: ${paso.titulo}. ${paso.descripcion}`}
                width={1080}
                height={1350}
                sizes="(max-width: 640px) 90vw, 460px"
                loading="lazy"
                className="h-auto w-full"
              />
            </figure>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => irA(actual - 1)}
          disabled={actual === 0}
          className="rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-sm font-semibold text-fuchsia-800 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Paso anterior"
        >
          ← Anterior
        </button>
        <div className="flex items-center gap-2" aria-label="Elegir paso">
          {pasos.map((paso, indice) => (
            <button
              key={paso.imagen}
              type="button"
              onClick={() => irA(indice)}
              aria-label={`Ir al paso ${indice + 1}: ${paso.titulo}`}
              aria-current={actual === indice ? "step" : undefined}
              className={`h-2.5 rounded-full transition-all ${
                actual === indice ? "w-7 bg-fuchsia-700" : "w-2.5 bg-fuchsia-200"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => irA(actual + 1)}
          disabled={actual === pasos.length - 1}
          className="rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-sm font-semibold text-fuchsia-800 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Paso siguiente"
        >
          Siguiente →
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-slate-500" aria-live="polite">
        Paso {actual + 1} de {pasos.length} · Pantallas ilustrativas
      </p>
    </section>
  );
}
