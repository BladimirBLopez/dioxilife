"use client";

import { useEffect, useState } from "react";
import CloudinaryUpload from "@/components/CloudinaryUpload";

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
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo || !form.contenido || !form.productoId) {
      alert("Título, contenido y producto son obligatorios");
      return;
    }
    setLoading(true);

    const body = {
      ...form,
      activo: true,
    };

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

    setForm(vacio);
    setEditandoId(null);
    setMostrarForm(false);
    setLoading(false);
    cargar();
  }

  function handleEditar(p: Protocolo) {
    setEditandoId(p.id);
    setForm({
      titulo: p.titulo,
      contenido: p.contenido,
      imagenUrl: p.imagenUrl || "",
      productoId: p.productoId,
    });
    setMostrarForm(true);
  }

  async function handleBorrar(id: string) {
    if (!confirm("¿Borrar este protocolo?")) return;
    await fetch(`/api/admin/protocolos/${id}`, { method: "DELETE" });
    cargar();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Protocolos</h1>
        <button
          onClick={() => {
            setMostrarForm(!mostrarForm);
            setEditandoId(null);
            setForm(vacio);
          }}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {mostrarForm ? "Cerrar" : "+ Nuevo protocolo"}
        </button>
      </div>

      {mostrarForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-4 mb-6 max-w-md space-y-3"
        >
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
            <label className="block text-sm mb-1">Contenido</label>
            <textarea
              value={form.contenido}
              onChange={(e) =>
                setForm({ ...form, contenido: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Producto</label>
            <select
              value={form.productoId}
              onChange={(e) =>
                setForm({ ...form, productoId: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
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
            <label className="block text-sm mb-1">Imagen</label>
            <CloudinaryUpload
              value={form.imagenUrl}
              onChange={(url) => setForm({ ...form, imagenUrl: url })}
            />
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
              : "Crear protocolo"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {protocolos.length === 0 && (
          <p className="text-gray-500 text-sm">No hay protocolos aún.</p>
        )}
        {protocolos.map((p) => (
          <div key={p.id} className="bg-white rounded-lg shadow p-4 flex gap-3">
            {p.imagenUrl && (
              <img
                src={p.imagenUrl}
                alt={p.titulo}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <p className="font-medium">{p.titulo}</p>
              <p className="text-xs text-gray-500">{p.producto.nombre}</p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {p.contenido}
              </p>
              <div className="flex gap-3 text-sm mt-1">
                <button
                  onClick={() => handleEditar(p)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleBorrar(p.id)}
                  className="text-red-600 hover:underline"
                >
                  Borrar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
