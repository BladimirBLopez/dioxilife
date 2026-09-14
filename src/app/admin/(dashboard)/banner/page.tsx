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
    return <p className="text-sm text-[#8A8790]">Cargando...</p>;
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-[#1F1B24]">
          Banner principal
        </h1>
        <label className="flex items-center gap-2 text-sm text-[#1F1B24]">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => setForm({ ...form, activo: e.target.checked })}
          />
          Activo
        </label>
      </div>

      <form onSubmit={handleSubmit} className="admin-card p-5 space-y-4">
        <div>
          <label className="admin-label">Título</label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="admin-input"
            required
          />
        </div>

        <div>
          <label className="admin-label">Subtítulo (opcional)</label>
          <input
            type="text"
            value={form.subtitulo}
            onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
            className="admin-input"
          />
        </div>

        <div>
          <label className="admin-label">Imagen de fondo</label>
          <CloudinaryUpload
            value={form.imagenUrl}
            onChange={(url) => setForm({ ...form, imagenUrl: url })}
          />
        </div>

        <div>
          <label className="admin-label">Texto del botón (opcional)</label>
          <input
            type="text"
            value={form.textoBoton}
            onChange={(e) => setForm({ ...form, textoBoton: e.target.value })}
            className="admin-input"
            placeholder="Ej: Ver productos"
          />
        </div>

        <div>
          <label className="admin-label mb-2">El botón debe llevar a:</label>
          <div className="flex gap-4 mb-3 text-sm text-[#1F1B24]">
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
              className="admin-input"
              placeholder="/?categoria=slug o https://..."
            />
          ) : (
            <textarea
              value={form.mensajeWhatsapp}
              onChange={(e) =>
                setForm({ ...form, mensajeWhatsapp: e.target.value })
              }
              className="admin-input"
              rows={2}
              placeholder="Mensaje que se enviará por WhatsApp"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="admin-btn-primary w-full"
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
