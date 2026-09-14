"use client";

import { useEffect, useState } from "react";
import CloudinaryUpload from "@/components/CloudinaryUpload";

const vacio = {
  id: "",
  titulo: "",
  subtitulo: "",
  textoBoton: "",
  tipoBoton: "LINK",
  linkBoton: "",
  mensajeWhatsapp: "",
  imagenUrl: "",
  activo: true,
};

export default function BannerPage() {
  const [form, setForm] = useState(vacio);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  async function cargar() {
    const res = await fetch("/api/admin/banner");
    const data = await res.json();
    if (data) {
      setForm({
        id: data.id,
        titulo: data.titulo || "",
        subtitulo: data.subtitulo || "",
        textoBoton: data.textoBoton || "",
        tipoBoton: data.tipoBoton || "LINK",
        linkBoton: data.linkBoton || "",
        mensajeWhatsapp: data.mensajeWhatsapp || "",
        imagenUrl: data.imagenUrl || "",
        activo: data.activo,
      });
    }
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo) {
      alert("El título es obligatorio");
      return;
    }
    setGuardando(true);
    setGuardado(false);

    const res = await fetch("/api/admin/banner", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setForm((f) => ({ ...f, id: data.id }));
    setGuardando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  }

  if (cargando) {
    return <p className="text-gray-500 text-sm">Cargando...</p>;
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Banner principal</h1>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => setForm({ ...form, activo: e.target.checked })}
          />
          Activo
        </label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg shadow p-4">
        <div>
          <label className="block text-sm mb-1">Título</label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Subtítulo (opcional)</label>
          <input
            type="text"
            value={form.subtitulo}
            onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Imagen de fondo</label>
          <CloudinaryUpload
            value={form.imagenUrl}
            onChange={(url) => setForm({ ...form, imagenUrl: url })}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Texto del botón (opcional)</label>
          <input
            type="text"
            value={form.textoBoton}
            onChange={(e) => setForm({ ...form, textoBoton: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="Ej: Ver productos"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">El botón debe llevar a:</label>
          <div className="flex gap-4 mb-3 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="tipoBoton"
                checked={form.tipoBoton === "LINK"}
                onChange={() => setForm({ ...form, tipoBoton: "LINK" })}
              />
              Un link
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="tipoBoton"
                checked={form.tipoBoton === "WHATSAPP"}
                onChange={() => setForm({ ...form, tipoBoton: "WHATSAPP" })}
              />
              WhatsApp
            </label>
          </div>

          {form.tipoBoton === "LINK" ? (
            <input
              type="text"
              value={form.linkBoton}
              onChange={(e) => setForm({ ...form, linkBoton: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="/?categoria=slug o https://..."
            />
          ) : (
            <textarea
              value={form.mensajeWhatsapp}
              onChange={(e) =>
                setForm({ ...form, mensajeWhatsapp: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              rows={2}
              placeholder="Mensaje que se enviará por WhatsApp"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar banner"}
        </button>

        {guardado && (
          <p className="text-green-600 text-sm text-center">
            Banner guardado correctamente
          </p>
        )}
      </form>
    </div>
  );
}
