"use client";

import { useEffect, useState } from "react";

type Categoria = {
  id: string;
  nombre: string;
  slug: string;
  _count: { productos: number };
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function cargar() {
    const res = await fetch("/api/admin/categorias");
    const data = await res.json();
    setCategorias(data);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setLoading(true);

    if (editandoId) {
      await fetch(`/api/admin/categorias/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      });
    } else {
      await fetch("/api/admin/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      });
    }

    setNombre("");
    setEditandoId(null);
    setLoading(false);
    cargar();
  }

  function handleEditar(cat: Categoria) {
    setEditandoId(cat.id);
    setNombre(cat.nombre);
  }

  async function handleBorrar(id: string) {
    if (!confirm("¿Borrar esta categoría?")) return;
    await fetch(`/api/admin/categorias/${id}`, { method: "DELETE" });
    cargar();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Categorías</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6 max-w-md">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la categoría"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {editandoId ? "Guardar" : "Agregar"}
        </button>
        {editandoId && (
          <button
            type="button"
            onClick={() => {
              setEditandoId(null);
              setNombre("");
            }}
            className="border px-4 py-2 rounded"
          >
            Cancelar
          </button>
        )}
      </form>

      <div className="bg-white rounded-lg shadow max-w-md">
        {categorias.length === 0 && (
          <p className="p-4 text-gray-500 text-sm">No hay categorías aún.</p>
        )}
        {categorias.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between border-b last:border-b-0 px-4 py-3"
          >
            <div>
              <p className="font-medium">{cat.nombre}</p>
              <p className="text-xs text-gray-500">
                {cat._count.productos} producto(s)
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                onClick={() => handleEditar(cat)}
                className="text-blue-600 hover:underline"
              >
                Editar
              </button>
              <button
                onClick={() => handleBorrar(cat.id)}
                className="text-red-600 hover:underline"
              >
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
