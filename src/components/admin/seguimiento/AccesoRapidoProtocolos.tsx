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
    <section className="rounded-xl border border-purple-100 bg-white p-3 shadow-sm sm:p-4">
      <button
        type="button"
        onClick={abrirEditor}
        aria-label="Gestionar agenda del seguimiento"
        className="flex w-full items-center gap-3 rounded-lg p-1 text-left transition hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
          <Settings2 size={19} aria-hidden="true" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-gray-900">
            Gestionar agenda
          </span>
          <span className="mt-1 block text-xs leading-5 text-gray-500">
            Actividades, horarios y protocolos
          </span>
        </span>

        <Pencil
          size={18}
          className="shrink-0 text-purple-700"
          aria-hidden="true"
        />
      </button>
    </section>
  );
}
