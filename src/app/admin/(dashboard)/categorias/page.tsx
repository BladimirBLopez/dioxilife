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
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-[#1F1B24] mb-5">
        Categorías
      </h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-5">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la categoría"
          className="admin-input flex-1"
        />
        <button
          type="submit"
          disabled={loading}
          className="admin-btn-primary shrink-0"
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
            className="admin-btn-secondary shrink-0"
          >
            Cancelar
          </button>
        )}
      </form>

      <div className="admin-card">
        {categorias.length === 0 && (
          <p className="p-4 text-sm text-[#8A8790]">No hay categorías aún.</p>
        )}
        {categorias.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between border-b border-[#E5E4E7] last:border-b-0 px-4 py-3"
          >
            <div>
              <p className="font-medium text-sm text-[#1F1B24]">
                {cat.nombre}
              </p>
              <p className="text-xs text-[#8A8790]">
                {cat._count.productos} producto(s)
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <button
                onClick={() => handleEditar(cat)}
                className="text-brand-blue font-medium hover:underline"
              >
                Editar
              </button>
              <button
                onClick={() => handleBorrar(cat.id)}
                className="text-red-600 font-medium hover:underline"
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
