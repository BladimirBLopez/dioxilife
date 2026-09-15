"use client";

import { useState } from "react";

export default function ResenaForm({
  productoId,
}: {
  productoId?: string | null;
}) {
  const [nombreCliente, setNombreCliente] = useState("");
  const [calificacion, setCalificacion] = useState(0);
  const [calificacionHover, setCalificacionHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [sitioWeb, setSitioWeb] = useState(""); // honeypot
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nombreCliente.trim()) {
      setError("Ingresa tu nombre");
      return;
    }
    if (calificacion < 1) {
      setError("Selecciona una calificación");
      return;
    }
    if (comentario.trim().length < 5) {
      setError("Escribe un comentario un poco más largo");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCliente,
          calificacion,
          comentario,
          productoId: productoId || null,
          sitioWeb,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "No se pudo enviar tu reseña");
        setEnviando(false);
        return;
      }

      setEnviado(true);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-sm text-center">
        ¡Gracias por tu reseña! Se publicará apenas la revisemos.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 rounded-xl p-4 space-y-3"
    >
      {/* Campo trampa para bots — oculto visualmente, no quitar */}
      <input
        type="text"
        value={sitioWeb}
        onChange={(e) => setSitioWeb(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] w-px h-px opacity-0"
        aria-hidden="true"
      />

      <div>
        <label className="block text-sm font-medium text-[#1F1B24] mb-1">
          Tu nombre
        </label>
        <input
          type="text"
          value={nombreCliente}
          onChange={(e) => setNombreCliente(e.target.value)}
          maxLength={80}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Nombre"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1F1B24] mb-1">
          Calificación
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCalificacion(n)}
              onMouseEnter={() => setCalificacionHover(n)}
              onMouseLeave={() => setCalificacionHover(0)}
              aria-label={`${n} estrellas`}
              className="text-2xl leading-none"
            >
              {(calificacionHover || calificacion) >= n ? "⭐" : "☆"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1F1B24] mb-1">
          Tu comentario
        </label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={1000}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Cuéntanos tu experiencia..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-brand-pink text-white font-semibold text-sm rounded-lg py-2.5 disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Enviar reseña"}
      </button>
    </form>
  );
}
