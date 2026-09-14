"use client";

import { useEffect, useState } from "react";
import CloudinaryUpload from "@/components/CloudinaryUpload";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";

type Categoria = { id: string; nombre: string };
type Producto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: string;
  mostrarPrecio: boolean;
  imagenUrl: string | null;
  categoriaId: string;
  categoria: Categoria;
  activo: boolean;
};

const vacio = {
  nombre: "",
  descripcion: "",
  precio: "",
  mostrarPrecio: false,
  imagenUrl: "",
  categoriaId: "",
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState(vacio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [borrarId, setBorrarId] = useState<string | null>(null);

  async function cargar() {
    const [resProd, resCat] = await Promise.all([
      fetch("/api/admin/productos"),
      fetch("/api/admin/categorias"),
    ]);
    setProductos(await resProd.json());
    setCategorias(await resCat.json());
  }

  useEffect(() => {
    cargar();
  }, []);

  function abrirNuevo() {
    setEditandoId(null);
    setForm(vacio);
    setModalAbierto(true);
  }

  function abrirEditar(p: Producto) {
    setEditandoId(p.id);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || "",
      precio: String(p.precio),
      mostrarPrecio: p.mostrarPrecio,
      imagenUrl: p.imagenUrl || "",
      categoriaId: p.categoriaId,
    });
    setModalAbierto(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.categoriaId) {
      alert("Nombre y categoría son obligatorios");
      return;
    }
    if (form.mostrarPrecio && !form.precio) {
      alert("Ingresa el precio o desactiva 'Mostrar precio'");
      return;
    }
    setLoading(true);

    const body = {
      ...form,
      precio: parseFloat(form.precio || "0"),
      activo: true,
    };

    try {
      const res = editandoId
        ? await fetch(`/api/admin/productos/${editandoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/productos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Ocurrió un error al guardar el producto");
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
    await fetch(`/api/admin/productos/${borrarId}`, { method: "DELETE" });
    setBorrarId(null);
    cargar();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <button
          onClick={abrirNuevo}
          className="bg-black text-white px-4 py-2 rounded"
        >
          + Nuevo producto
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {productos.length === 0 && (
          <p className="text-gray-500 text-sm">No hay productos aún.</p>
        )}
        {productos.map((p) => (
          <div key={p.id} className="bg-white rounded-lg shadow p-4 flex gap-3">
            {p.imagenUrl && (
              <img
                src={p.imagenUrl}
                alt={p.nombre}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <p className="font-medium">{p.nombre}</p>
              <p className="text-xs text-gray-500">{p.categoria.nombre}</p>
              <p className="text-sm">
                {p.mostrarPrecio
                  ? `Bs. ${p.precio}`
                  : "Precio a consultar por WhatsApp"}
              </p>
              <div className="flex gap-3 text-sm mt-1">
                <button
                  onClick={() => abrirEditar(p)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => setBorrarId(p.id)}
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
          title={editandoId ? "Editar producto" : "Nuevo producto"}
          onClose={() => setModalAbierto(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between border rounded px-3 py-2">
              <div>
                <p className="text-sm font-medium">Mostrar precio</p>
                <p className="text-xs text-gray-500">
                  Si está apagado, se verá &quot;Precio a consultar por
                  WhatsApp&quot;
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, mostrarPrecio: !form.mostrarPrecio })
                }
                className={`shrink-0 w-12 h-7 rounded-full relative transition-colors ${
                  form.mostrarPrecio ? "bg-brand-pink" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    form.mostrarPrecio ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            {form.mostrarPrecio && (
              <div>
                <label className="block text-sm mb-1">Precio (Bs.)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.precio}
                  onChange={(e) =>
                    setForm({ ...form, precio: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm mb-1">Categoría</label>
              <select
                value={form.categoriaId}
                onChange={(e) =>
                  setForm({ ...form, categoriaId: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Seleccionar...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
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
                : "Crear producto"}
            </button>
          </form>
        </Modal>
      )}

      {borrarId && (
        <ConfirmDialog
          title="Borrar producto"
          message="¿Seguro que quieres borrar este producto? Esta acción no se puede deshacer."
          onConfirm={confirmarBorrar}
          onCancel={() => setBorrarId(null)}
        />
      )}
    </div>
  );
}
