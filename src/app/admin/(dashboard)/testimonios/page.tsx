"use client";

import { useEffect, useState } from "react";
import CloudinaryUpload from "@/components/CloudinaryUpload";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";

type Testimonio = {
  id: string;
  nombreCliente: string;
  contenido: string;
  calificacion: number;
  imagenUrl: string | null;
  destacado: boolean;
  activo: boolean;
};

const vacio = {
  nombreCliente: "",
  contenido: "",
  calificacion: "5",
  imagenUrl: "",
  destacado: false,
};

export default function TestimoniosPage() {
  const [testimonios, setTestimonios] = useState<Testimonio[]>([]);
  const [form, setForm] = useState(vacio);
  const [formInicial, setFormInicial] = useState(vacio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [confirmarSalir, setConfirmarSalir] = useState(false);
  const [borrarId, setBorrarId] = useState<string | null>(null);

  async function cargar() {
    const res = await fetch("/api/admin/testimonios");
    setTestimonios(await res.json());
  }

  useEffect(() => {
    cargar();
  }, []);

  function hayCambiosSinGuardar() {
    return JSON.stringify(form) !== JSON.stringify(formInicial);
  }

  function pedirCerrarModal() {
    if (hayCambiosSinGuardar()) {
      setConfirmarSalir(true);
    } else {
      setModalAbierto(false);
    }
  }

  function cerrarSinGuardar() {
    setConfirmarSalir(false);
    setModalAbierto(false);
  }

  function abrirNuevo() {
    setEditandoId(null);
    setForm(vacio);
    setFormInicial(vacio);
    setModalAbierto(true);
  }

  function abrirEditar(t: Testimonio) {
    const datos = {
      nombreCliente: t.nombreCliente,
      contenido: t.contenido,
      calificacion: String(t.calificacion),
      imagenUrl: t.imagenUrl || "",
      destacado: t.destacado,
    };
    setEditandoId(t.id);
    setForm(datos);
    setFormInicial(datos);
    setModalAbierto(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombreCliente || !form.contenido) {
      alert("Nombre y contenido son obligatorios");
      return;
    }
    setLoading(true);

    const body = {
      ...form,
      calificacion: parseInt(form.calificacion || "5", 10),
      activo: true,
    };

    if (editandoId) {
      await fetch(`/api/admin/testimonios/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/admin/testimonios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setModalAbierto(false);
    setForm(vacio);
    setEditandoId(null);
    setLoading(false);
    cargar();
  }

  async function confirmarBorrar() {
    if (!borrarId) return;
    await fetch(`/api/admin/testimonios/${borrarId}`, { method: "DELETE" });
    setBorrarId(null);
    cargar();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Testimonios</h1>
        <button
          onClick={abrirNuevo}
          className="bg-black text-white px-4 py-2 rounded"
        >
          + Nuevo testimonio
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {testimonios.length === 0 && (
          <p className="text-gray-500 text-sm">No hay testimonios aún.</p>
        )}
        {testimonios.map((t) => (
          <div key={t.id} className="bg-white rounded-lg shadow p-4 flex gap-3">
            {t.imagenUrl && (
              <img
                src={t.imagenUrl}
                alt={t.nombreCliente}
                className="w-16 h-16 object-cover rounded-full"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{t.nombreCliente}</p>
                {t.destacado && (
                  <span className="text-xs bg-brand-pink text-white px-2 py-0.5 rounded">
                    Destacado
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {"⭐".repeat(t.calificacion)}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {t.contenido}
              </p>
              <div className="flex gap-3 text-sm mt-1">
                <button
                  onClick={() => abrirEditar(t)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => setBorrarId(t.id)}
                  className="text-red-600 hover:underline"
                >
                  Borrar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalAbierto && (
        <Modal
          title={editandoId ? "Editar testimonio" : "Nuevo testimonio"}
          onClose={pedirCerrarModal}
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Nombre del cliente</label>
              <input
                type="text"
                value={form.nombreCliente}
                onChange={(e) =>
                  setForm({ ...form, nombreCliente: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Contenido</label>
              <textarea
                value={form.contenido}
                onChange={(e) =>
                  setForm({ ...form, contenido: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Calificación (1-5)</label>
              <select
                value={form.calificacion}
                onChange={(e) =>
                  setForm({ ...form, calificacion: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Foto (opcional)</label>
              <CloudinaryUpload
                value={form.imagenUrl}
                onChange={(url) => setForm({ ...form, imagenUrl: url })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="destacado"
                checked={form.destacado}
                onChange={(e) =>
                  setForm({ ...form, destacado: e.target.checked })
                }
              />
              <label htmlFor="destacado" className="text-sm">
                Destacado (aparece en la tienda pública)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
            >
              {loading
                ? "Guardando..."
                : editandoId
                ? "Guardar cambios"
                : "Crear testimonio"}
            </button>
          </form>
        </Modal>
      )}

      {confirmarSalir && (
        <ConfirmDialog
          title="Cambios sin guardar"
          message="Tienes cambios sin guardar en este formulario. Si sales ahora se van a perder."
          confirmLabel="Descartar cambios"
          onConfirm={cerrarSinGuardar}
          onCancel={() => setConfirmarSalir(false)}
        />
      )}

      {borrarId && (
        <ConfirmDialog
          title="Borrar testimonio"
          message="¿Seguro que quieres borrar este testimonio? Esta acción no se puede deshacer."
          onConfirm={confirmarBorrar}
          onCancel={() => setBorrarId(null)}
        />
      )}
    </div>
  );
}
