"use client";

import { useState } from "react";

type ProductoOpcion = {
  id: string;
  nombre: string;
};

export default function ExperienciaForm({
  aplicacionId,
  aplicacionNombre,
  productos,
  onCancelar,
}: {
  aplicacionId: string;
  aplicacionNombre: string;
  productos: ProductoOpcion[];
  onCancelar?: () => void;
}) {
  const [nombreCliente, setNombreCliente] = useState("");
  const [comentario, setComentario] = useState("");
  const [tiempoUso, setTiempoUso] = useState("");
  const [productoId, setProductoId] = useState("");
  const [sitioWeb, setSitioWeb] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (nombreCliente.trim().length < 2) {
      setError("Ingresa tu nombre.");
      return;
    }

    if (comentario.trim().length < 5) {
      setError("Cuéntanos un poco más sobre tu experiencia.");
      return;
    }

    setEnviando(true);

    try {
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "EXPERIENCIA",
          nombreCliente,
          comentario,
          tiempoUso,
          productoId: productoId || null,
          aplicacionId,
          sitioWeb,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "No se pudo enviar tu experiencia.");
        return;
      }

      setEnviado(true);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-5 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
          ✓
        </div>

        <p className="mt-3 text-sm font-semibold text-green-900">
          Gracias por compartir tu experiencia
        </p>

        <p className="mt-1 text-xs leading-5 text-green-700">
          La revisaremos antes de publicarla.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#E9E4F2] bg-[#FAF9FC] p-4"
    >
      <input
        type="text"
        value={sitioWeb}
        onChange={(e) => setSitioWeb(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] h-px w-px opacity-0"
        aria-hidden="true"
      />

      <div className="mb-4">
        <p className="text-base font-bold text-[#1F1B24]">
          Comparte tu experiencia
        </p>
        <p className="mt-1 text-xs leading-5 text-brand-gray">
          Tu experiencia será revisada antes de publicarse.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-violet-700">
          ✓
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500">
            Experiencia relacionada con
          </p>
          <p className="truncate text-sm font-semibold text-violet-800">
            {aplicacionNombre}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#1F1B24]">
            Tu nombre
          </label>
          <input
            type="text"
            value={nombreCliente}
            onChange={(e) => setNombreCliente(e.target.value)}
            maxLength={80}
            placeholder="Ej. María"
            className="w-full rounded-xl border border-[#DDD8E8] bg-white px-3 py-2.5 text-sm text-[#1F1B24] outline-none transition focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/10"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[#1F1B24]">
            Producto utilizado
            <span className="ml-1 font-normal text-brand-gray">(opcional)</span>
          </label>

          <select
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
            className="w-full rounded-xl border border-[#DDD8E8] bg-white px-3 py-2.5 text-sm text-[#1F1B24] outline-none transition focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/10"
          >
            <option value="">Prefiero no indicar</option>
            {productos.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[#1F1B24]">
            Tiempo de uso
            <span className="ml-1 font-normal text-brand-gray">(opcional)</span>
          </label>

          <select
            value={tiempoUso}
            onChange={(e) => setTiempoUso(e.target.value)}
            className="w-full rounded-xl border border-[#DDD8E8] bg-white px-3 py-2.5 text-sm text-[#1F1B24] outline-none transition focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/10"
          >
            <option value="">Seleccionar...</option>
            <option value="Menos de 1 mes">Menos de 1 mes</option>
            <option value="1 a 3 meses">1 a 3 meses</option>
            <option value="Más de 3 meses">Más de 3 meses</option>
          </select>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-[#1F1B24]">
              Tu experiencia
            </label>
            <span className="text-[10px] text-[#8A8790]">
              {comentario.length}/1000
            </span>
          </div>

          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Cuéntanos tu experiencia con tus propias palabras..."
            className="w-full resize-none rounded-xl border border-[#DDD8E8] bg-white px-3 py-2.5 text-sm leading-6 text-[#1F1B24] outline-none transition focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/10"
          />
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-5 text-[#8A8790]">
        Comparte únicamente tu experiencia personal. La información será
        revisada antes de aparecer públicamente.
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={enviando}
            className="flex-1 rounded-xl border border-[#DDD8E8] bg-white px-4 py-2.5 text-sm font-semibold text-[#6B6870] transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="flex-[1.4] rounded-xl bg-brand-pink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Enviar para revisión"}
        </button>
      </div>
    </form>
  );
}
