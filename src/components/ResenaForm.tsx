"use client";

import { useEffect, useState } from "react";

const CLAVE_LOCALSTORAGE = "dioxilife_resena_enviada";

export default function ResenaForm({
  productoId,
}: {
  productoId?: string | null;
}) {
  const [nombreCliente, setNombreCliente] = useState("");
  const [calificacion, setCalificacion] = useState(0);
  const [calificacionHover, setCalificacionHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [tiempoUso, setTiempoUso] = useState("");
  const [sitioWeb, setSitioWeb] = useState(""); // honeypot
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [yaEnvioAntes, setYaEnvioAntes] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem(CLAVE_LOCALSTORAGE) === "1") {
        setYaEnvioAntes(true);
      }
    }
  }, []);

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
          tiempoUso,
          comentario,
          productoId: productoId || null,
          sitioWeb,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 409) {
          localStorage.setItem(CLAVE_LOCALSTORAGE, "1");
          setYaEnvioAntes(true);
        } else {
          setError(data?.error || "No se pudo enviar tu testimonio");
        }
        setEnviando(false);
        return;
      }

      localStorage.setItem(CLAVE_LOCALSTORAGE, "1");
      setEnviado(true);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setEnviando(false);
    }
  }

  if (yaEnvioAntes || enviado) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-sm text-center">
        {enviado
          ? "¡Gracias por tu testimonio! Se publicará apenas la revisemos."
          : "Ya registramos una testimonio tuya. ¡Gracias por compartir tu opinión!"}
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
          Tiempo usando el producto
        </label>

        <select
          value={tiempoUso}
          onChange={(e) => setTiempoUso(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Seleccionar...</option>
          <option value="Menos de 1 mes">Menos de 1 mes</option>
          <option value="1 a 3 meses">1 a 3 meses</option>
          <option value="Más de 3 meses">Más de 3 meses</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1F1B24] mb-1">
          Tu experiencia
        </label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={1000}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Comparte cómo ha sido tu experiencia con el producto..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-brand-pink text-white font-semibold text-sm rounded-lg py-2.5 disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Enviar testimonio"}
      </button>
    </form>
  );
}
