"use client";

import { Pencil, Settings2 } from "lucide-react";

export default function AccesoRapidoProtocolos() {
  function abrirEditor() {
    const panel =
      document.getElementById("agenda-individual");

    if (!(panel instanceof HTMLDetailsElement)) {
      return;
    }

    panel.open = true;

    window.requestAnimationFrame(() => {
      panel.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <section className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2">
        <Settings2
          size={20}
          className="text-purple-700"
        />

        <h2 className="text-base font-bold text-gray-900">
          Administrar protocolos
        </h2>
      </div>

      <p className="mt-2 text-sm leading-6 text-gray-600">
        Edita actividades, horarios e instrucciones
        del protocolo principal y los adicionales.
        También puedes ajustar los días permitidos
        de los protocolos adicionales.
      </p>

      <button
        type="button"
        onClick={abrirEditor}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 py-3 text-sm font-bold text-white hover:bg-purple-800 sm:w-auto"
      >
        <Pencil size={16} />
        Editar protocolos
      </button>
    </section>
  );
}
