"use client";

import { useEffect, useState } from "react";
import CloudinaryUpload from "@/components/CloudinaryUpload";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";

type Producto = { id: string; nombre: string };
type Protocolo = {
  id: string;
  titulo: string;
  contenido: string;
  imagenUrl: string | null;
  productoId: string;
  producto: Producto;
  activo: boolean;
};

const vacio = {
  titulo: "",
  contenido: "",
  imagenUrl: "",
  productoId: "",
};

export default function ProtocolosPage() {
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState(vacio);
  const [formInicial, setFormInicial] = useState(vacio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [confirmarSalir, setConfirmarSalir] = useState(false);
  const [borrarId, setBorrarId] = useState<string | null>(null);

  async function cargar() {
    const [resProt, resProd] = await Promise.all([
      fetch("/api/admin/protocolos"),
      fetch("/api/admin/productos"),
    ]);
    setProtocolos(await resProt.json());
    setProductos(await resProd.json());
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

  function abrirEditar(p: Protocolo) {
    const datos = {
      titulo: p.titulo,
      contenido: p.contenido,
      imagenUrl: p.imagenUrl || "",
      productoId: p.productoId,
    };
    setEditandoId(p.id);
    setForm(datos);
    setFormInicial(datos);
    setModalAbierto(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo || !form.contenido || !form.productoId) {
      alert("Título, contenido y producto son obligatorios");
      return;
    }
    setLoading(true);

    const body = { ...form, activo: true };

    if (editandoId) {
      await fetch(`/api/admin/protocolos/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/admin/protocolos", {
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
    await fetch(`/api/admin/protocolos/${borrarId}`, { method: "DELETE" });
    setBorrarId(null);
    cargar();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-[#1F1B24]">Protocolos</h1>
        <button onClick={abrirNuevo} className="admin-btn-primary">
          + Nuevo protocolo
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {protocolos.length === 0 && (
          <p className="text-sm text-[#8A8790]">No hay protocolos aún.</p>
        )}
        {protocolos.map((p) => (
          <div key={p.id} className="admin-card p-4 flex gap-3">
            {p.imagenUrl ? (
              <img
                src={p.imagenUrl}
                alt={p.titulo}
                className="w-16 h-16 object-cover rounded-lg shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-[#F7F7F9] shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-[#1F1B24]">{p.titulo}</p>
              <p className="text-xs text-brand-pink font-medium mt-0.5">
                {p.producto.nombre}
              </p>
              <p className="text-sm text-[#6B6870] line-clamp-2 mt-1">
                {p.contenido}
              </p>
              <div className="flex gap-4 text-sm mt-2">
                <button
                  onClick={() => abrirEditar(p)}
                  className="text-brand-blue font-medium hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => setBorrarId(p.id)}
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
          title={editandoId ? "Editar protocolo" : "Nuevo protocolo"}
          onClose={pedirCerrarModal}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="admin-label">Contenido</label>
              <textarea
                value={form.contenido}
                onChange={(e) =>
                  setForm({ ...form, contenido: e.target.value })
                }
                className="admin-input"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="admin-label">Producto</label>
              <select
                value={form.productoId}
                onChange={(e) =>
                  setForm({ ...form, productoId: e.target.value })
                }
                className="admin-input"
                required
              >
                <option value="">Seleccionar...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="admin-label">Imagen</label>
              <CloudinaryUpload
                value={form.imagenUrl}
                onChange={(url) => setForm({ ...form, imagenUrl: url })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="admin-btn-primary w-full"
            >
              {loading
                ? "Guardando..."
                : editandoId
                ? "Guardar cambios"
                : "Crear protocolo"}
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
          title="Borrar protocolo"
          message="¿Seguro que quieres borrar este protocolo? Esta acción no se puede deshacer."
          onConfirm={confirmarBorrar}
          onCancel={() => setBorrarId(null)}
        />
      )}
    </div>
  );
}
