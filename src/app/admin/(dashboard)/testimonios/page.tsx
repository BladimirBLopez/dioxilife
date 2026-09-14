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
  const [imagenSubiendo, setImagenSubiendo] = useState(false);
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
    if (imagenSubiendo) {
      alert("Espera a que termine de subir la imagen antes de guardar");
      return;
    }
    setLoading(true);

    const body = {
      ...form,
      calificacion: parseInt(form.calificacion || "5", 10),
      activo: true,
    };

    try {
      const res = editandoId
        ? await fetch(`/api/admin/testimonios/${editandoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/testimonios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Ocurrió un error al guardar el testimonio");
        setLoading(false);
        return;
      }

      setModalAbierto(false);
      setForm(vacio);
      setEditandoId(null);
      await cargar();
    } catch {
      alert("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  async function confirmarBorrar() {
    if (!borrarId) return;
    const res = await fetch(`/api/admin/testimonios/${borrarId}`, {
      method: "DELETE",
    });
    setBorrarId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error || "No se pudo borrar el testimonio");
      return;
    }

    cargar();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-[#1F1B24]">Testimonios</h1>
        <button onClick={abrirNuevo} className="admin-btn-primary">
          + Nuevo testimonio
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {testimonios.length === 0 && (
          <p className="text-sm text-[#8A8790]">No hay testimonios aún.</p>
        )}
        {testimonios.map((t) => (
          <div key={t.id} className="admin-card p-4 flex gap-3">
            {t.imagenUrl ? (
              <img
                src={t.imagenUrl}
                alt={t.nombreCliente}
                className="w-14 h-14 object-cover rounded-full shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-brand-pink/10 text-brand-pink flex items-center justify-center font-semibold shrink-0">
                {t.nombreCliente.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm text-[#1F1B24]">
                  {t.nombreCliente}
                </p>
                {t.destacado && (
                  <span className="text-[11px] bg-brand-pink/10 text-brand-pink font-medium px-2 py-0.5 rounded-full">
                    Destacado
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-500 mt-0.5">
                {"⭐".repeat(t.calificacion)}
              </p>
              <p className="text-sm text-[#6B6870] line-clamp-2 mt-1">
                {t.contenido}
              </p>
              <div className="flex gap-4 text-sm mt-2">
                <button
                  onClick={() => abrirEditar(t)}
                  className="text-brand-blue font-medium hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => setBorrarId(t.id)}
                  className="text-red-600 font-medium hover:underline"
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="admin-label">Nombre del cliente</label>
              <input
                type="text"
                value={form.nombreCliente}
                onChange={(e) =>
                  setForm({ ...form, nombreCliente: e.target.value })
                }
                className="admin-input"
                required
              />
            </div>

            <div>
              <label className="admin-label">Contenido</label>
              <textarea
                value={form.contenido}
                onChange={(e) =>
                  setForm({ ...form, contenido: e.target.value })
                }
                className="admin-input"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="admin-label">Calificación (1-5)</label>
              <select
                value={form.calificacion}
                onChange={(e) =>
                  setForm({ ...form, calificacion: e.target.value })
                }
                className="admin-input"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>

            <div>
              <label className="admin-label">Foto (opcional)</label>
              <CloudinaryUpload
                value={form.imagenUrl}
                onChange={(url) => setForm({ ...form, imagenUrl: url })}
                onUploadingChange={setImagenSubiendo}
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
              <label htmlFor="destacado" className="text-sm text-[#1F1B24]">
                Destacado (aparece en la tienda pública)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || imagenSubiendo}
              className="admin-btn-primary w-full"
            >
              {imagenSubiendo
                ? "Esperando imagen..."
                : loading
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
