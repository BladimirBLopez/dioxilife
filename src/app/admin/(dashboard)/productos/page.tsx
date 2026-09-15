"use client";

import { useEffect, useState } from "react";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { useSortable, isSortable } from "@dnd-kit/react/sortable";
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
  enPromocion: boolean;
  precioPromocion: string | null;
  imagenUrl: string | null;
  categoriaId: string;
  categoria: Categoria;
  activo: boolean;
  orden: number;
};

const vacio = {
  nombre: "",
  descripcion: "",
  precio: "",
  mostrarPrecio: false,
  enPromocion: false,
  precioPromocion: "",
  imagenUrl: "",
  categoriaId: "",
};

function TarjetaProducto({
  producto,
  index,
  onEditar,
  onBorrar,
}: {
  producto: Producto;
  index: number;
  onEditar: (p: Producto) => void;
  onBorrar: (id: string) => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: producto.id,
    index,
  });

  return (
    <div
      ref={ref}
      className={`admin-card p-4 flex gap-3 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <button
        ref={handleRef}
        aria-label="Arrastrar para reordenar"
        className="cursor-grab active:cursor-grabbing text-[#C7C4CC] px-1 self-center touch-none"
      >
        ⋮⋮
      </button>

      {producto.imagenUrl ? (
        <img
          src={producto.imagenUrl}
          alt={producto.nombre}
          className="w-16 h-16 object-cover rounded-lg shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-[#F7F7F9] shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm text-[#1F1B24]">{producto.nombre}</p>
          {producto.enPromocion && (
            <span className="text-[10px] font-bold text-white bg-brand-pink px-1.5 py-0.5 rounded-full shrink-0">
              OFERTA
            </span>
          )}
        </div>
        <p className="text-xs text-brand-pink font-medium mt-0.5">
          {producto.categoria.nombre}
        </p>
        {producto.mostrarPrecio ? (
          producto.enPromocion && producto.precioPromocion ? (
            <p className="text-sm mt-1">
              <span className="line-through text-[#8A8790] mr-1">
                Bs. {producto.precio}
              </span>
              <span className="text-brand-pink font-semibold">
                Bs. {producto.precioPromocion}
              </span>
            </p>
          ) : (
            <p className="text-sm text-[#6B6870] mt-1">Bs. {producto.precio}</p>
          )
        ) : (
          <p className="text-sm text-[#6B6870] mt-1">
            Precio a consultar por WhatsApp
          </p>
        )}
        <div className="flex gap-4 text-sm mt-2">
          <button
            onClick={() => onEditar(producto)}
            className="text-brand-blue font-medium hover:underline"
          >
            Editar
          </button>
          <button
            onClick={() => onBorrar(producto.id)}
            className="text-red-600 font-medium hover:underline"
          >
            Borrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState(vacio);
  const [formInicial, setFormInicial] = useState(vacio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagenSubiendo, setImagenSubiendo] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [confirmarSalir, setConfirmarSalir] = useState(false);
  const [borrarId, setBorrarId] = useState<string | null>(null);
  const [guardandoOrden, setGuardandoOrden] = useState(false);

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

  function abrirEditar(p: Producto) {
    const datos = {
      nombre: p.nombre,
      descripcion: p.descripcion || "",
      precio: String(p.precio),
      mostrarPrecio: p.mostrarPrecio,
      enPromocion: p.enPromocion,
      precioPromocion: p.precioPromocion ? String(p.precioPromocion) : "",
      imagenUrl: p.imagenUrl || "",
      categoriaId: p.categoriaId,
    };
    setEditandoId(p.id);
    setForm(datos);
    setFormInicial(datos);
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
    if (
      form.enPromocion &&
      form.precioPromocion &&
      form.mostrarPrecio &&
      parseFloat(form.precioPromocion) >= parseFloat(form.precio || "0")
    ) {
      alert("El precio de promoción debe ser menor al precio normal");
      return;
    }
    if (imagenSubiendo) {
      alert("Espera a que termine de subir la imagen antes de guardar");
      return;
    }
    setLoading(true);

    const body = {
      ...form,
      precio: parseFloat(form.precio || "0"),
      precioPromocion: form.precioPromocion
        ? parseFloat(form.precioPromocion)
        : null,
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
    const res = await fetch(`/api/admin/productos/${borrarId}`, {
      method: "DELETE",
    });
    setBorrarId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error || "No se pudo borrar el producto");
      return;
    }

    cargar();
  }

  async function guardarOrden(lista: Producto[]) {
    setGuardandoOrden(true);
    try {
      const res = await fetch("/api/admin/productos/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orden: lista.map((p, i) => ({ id: p.id, orden: i })),
        }),
      });
      if (!res.ok) {
        alert("No se pudo guardar el nuevo orden, refrescando la lista");
        await cargar();
      }
    } catch {
      alert("No se pudo conectar con el servidor para guardar el orden");
      await cargar();
    } finally {
      setGuardandoOrden(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    if (event.canceled) return;
    const { source } = event.operation;
    if (!isSortable(source)) return;

    const { initialIndex, index } = source;
    if (initialIndex === index) return;

    setProductos((prev) => {
      const nuevos = [...prev];
      const [movido] = nuevos.splice(initialIndex, 1);
      nuevos.splice(index, 0, movido);
      guardarOrden(nuevos);
      return nuevos;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-[#1F1B24]">Productos</h1>
          {guardandoOrden && (
            <span className="text-xs text-[#8A8790]">Guardando orden...</span>
          )}
        </div>
        <button onClick={abrirNuevo} className="admin-btn-primary">
          + Nuevo producto
        </button>
      </div>

      <p className="text-xs text-[#8A8790] mb-3">
        Arrastrá del ícono ⋮⋮ para cambiar el orden en que se muestran en la tienda.
      </p>

      <DragDropProvider onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {productos.length === 0 && (
            <p className="text-sm text-[#8A8790]">No hay productos aún.</p>
          )}
          {productos.map((p, i) => (
            <TarjetaProducto
              key={p.id}
              producto={p}
              index={i}
              onEditar={abrirEditar}
              onBorrar={setBorrarId}
            />
          ))}
        </div>
      </DragDropProvider>

      {modalAbierto && (
        <Modal
          title={editandoId ? "Editar producto" : "Nuevo producto"}
          onClose={pedirCerrarModal}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="admin-label">Nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="admin-input"
                required
              />
            </div>

            <div>
              <label className="admin-label">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
                className="admin-input"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between admin-card px-3 py-2">
              <div>
                <p className="text-sm font-medium text-[#1F1B24]">
                  Mostrar precio
                </p>
                <p className="text-xs text-[#8A8790]">
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
                <label className="admin-label">Precio (Bs.)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.precio}
                  onChange={(e) =>
                    setForm({ ...form, precio: e.target.value })
                  }
                  className="admin-input"
                  required
                />
              </div>
            )}

            <div className="flex items-center justify-between admin-card px-3 py-2">
              <div>
                <p className="text-sm font-medium text-[#1F1B24]">
                  En promoción
                </p>
                <p className="text-xs text-[#8A8790]">
                  Muestra un cartel &quot;OFERTA&quot; y aparece en la pestaña
                  Promociones
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, enPromocion: !form.enPromocion })
                }
                className={`shrink-0 w-12 h-7 rounded-full relative transition-colors ${
                  form.enPromocion ? "bg-brand-pink" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    form.enPromocion ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            {form.enPromocion && form.mostrarPrecio && (
              <div>
                <label className="admin-label">
                  Precio de promoción (Bs.) — opcional
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.precioPromocion}
                  onChange={(e) =>
                    setForm({ ...form, precioPromocion: e.target.value })
                  }
                  className="admin-input"
                  placeholder="Dejalo vacío para mostrar solo el cartel OFERTA"
                />
              </div>
            )}

            {form.enPromocion && !form.mostrarPrecio && (
              <p className="text-xs text-[#8A8790] -mt-2">
                Como el precio está oculto, solo se va a ver el cartel
                &quot;OFERTA&quot;, sin precio tachado.
              </p>
            )}

            <div>
              <label className="admin-label">Categoría</label>
              <select
                value={form.categoriaId}
                onChange={(e) =>
                  setForm({ ...form, categoriaId: e.target.value })
                }
                className="admin-input"
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
              <label className="admin-label">Imagen</label>
              <CloudinaryUpload
                value={form.imagenUrl}
                onChange={(url) => setForm({ ...form, imagenUrl: url })}
                onUploadingChange={setImagenSubiendo}
              />
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
                : "Crear producto"}
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
          title="Borrar producto"
          message="¿Seguro que quieres borrar este producto? Esta acción no se puede deshacer."
          onConfirm={confirmarBorrar}
          onCancel={() => setBorrarId(null)}
        />
      )}
    </div>
  );
}
