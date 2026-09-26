"use client";

import { useEffect, useState } from "react";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { useSortable, isSortable } from "@dnd-kit/react/sortable";
import CloudinaryUpload from "@/components/CloudinaryUpload";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";

type Categoria = { id: string; nombre: string };
type TipoInformacion =
  | "BENEFICIO"
  | "VIDEO"
  | "INGREDIENTE"
  | "FAQ"
  | "DOCUMENTO";

type InformacionProducto = {
  id: string;
  productoId: string;
  tipo: TipoInformacion;
  titulo: string;
  contenido: string | null;
  imagenUrl: string | null;
  videoUrl: string | null;
  orden: number;
  activo: boolean;
};

type ImagenProducto = {
  id: string;
  productoId: string;
  url: string;
  orden: number;
};

type Producto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: string;
  mostrarPrecio: boolean;
  enPromocion: boolean;
  precioPromocion: string | null;
  valorComisionable: string;
  puntosVolumen: string;
  generaComision: boolean;
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
  valorComisionable: "",
  puntosVolumen: "",
  generaComision: false,
  imagenUrl: "",
  categoriaId: "",
};

function TarjetaProducto({
  producto,
  index,
  onEditar,
  onInformacion,
  onGaleria,
  onCambiarEstado,
}: {
  producto: Producto;
  index: number;
  onEditar: (p: Producto) => void;
  onInformacion: (p: Producto) => void;
  onGaleria: (p: Producto) => void;
  onCambiarEstado: (p: Producto) => void;
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
          className="w-16 h-16 object-contain rounded-lg shrink-0 bg-[#F7F7F9] p-1"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-[#F7F7F9] shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm text-[#1F1B24]">
            {producto.nombre}
          </p>

          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              producto.activo
                ? "bg-green-50 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {producto.activo ? "ACTIVO" : "INACTIVO"}
          </span>
        </div>

        <p className="mt-0.5 text-xs font-medium text-brand-pink">
          {producto.categoria.nombre}
        </p>

        <div className="mt-1 flex items-center gap-2 text-sm">
          {producto.enPromocion && producto.precioPromocion ? (
            <>
              <span className="text-[#8A8790] line-through">
                Bs. {producto.precio}
              </span>

              <span className="font-semibold text-brand-pink">
                Bs. {producto.precioPromocion}
              </span>
            </>
          ) : (
            <span className="text-[#6B6870]">
              Bs. {producto.precio}
            </span>
          )}

          {producto.enPromocion && (
            <span className="rounded-full bg-brand-pink px-1.5 py-0.5 text-[9px] font-bold text-white">
              OFERTA
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <button
            type="button"
            onClick={() => onEditar(producto)}
            className="font-medium text-brand-blue hover:underline"
          >
            Editar
          </button>

          <button
            type="button"
            onClick={() => onInformacion(producto)}
            className="font-medium text-green-700 hover:underline"
          >
            Información
          </button>

          <button
            type="button"
            onClick={() => onGaleria(producto)}
            className="font-medium text-brand-pink hover:underline"
          >
            Galería
          </button>

          <button
            type="button"
            onClick={() => onCambiarEstado(producto)}
            className={
              producto.activo
                ? "font-medium text-red-600 hover:underline"
                : "font-medium text-green-700 hover:underline"
            }
          >
            {producto.activo ? "Desactivar" : "Activar"}
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

  const [productoInformacion, setProductoInformacion] =
    useState<Producto | null>(null);

  const [productoGaleria, setProductoGaleria] =
    useState<Producto | null>(null);

  const [imagenesGaleria, setImagenesGaleria] =
    useState<ImagenProducto[]>([]);

  const [nuevaImagenGaleria, setNuevaImagenGaleria] =
    useState("");

  const [cargandoGaleria, setCargandoGaleria] =
    useState(false);

  const [guardandoGaleria, setGuardandoGaleria] =
    useState(false);

  const [galeriaSubiendo, setGaleriaSubiendo] =
    useState(false);

  const [errorGaleria, setErrorGaleria] =
    useState("");

  const [informaciones, setInformaciones] =
    useState<InformacionProducto[]>([]);

  const [cargandoInformacion, setCargandoInformacion] =
    useState(false);

  const [guardandoInformacion, setGuardandoInformacion] =
    useState(false);

  const [errorInformacion, setErrorInformacion] = useState("");

  const [editandoInformacionId, setEditandoInformacionId] =
    useState<string | null>(null);

  const [nuevaInformacion, setNuevaInformacion] =
    useState({
      tipo: "BENEFICIO" as TipoInformacion,
      titulo: "",
      contenido: "",
      imagenUrl: "",
      videoUrl: "",
    });
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

  async function abrirGaleria(producto: Producto) {
    setProductoGaleria(producto);
    setNuevaImagenGaleria("");
    setErrorGaleria("");
    setCargandoGaleria(true);

    try {
      const res = await fetch(
        `/api/admin/productos/${producto.id}/imagenes`
      );

      const data = await res.json();

      if (!res.ok) {
        setImagenesGaleria([]);
        setErrorGaleria(
          data.error || "No se pudo cargar la galería."
        );
        return;
      }

      setImagenesGaleria(data);
    } catch {
      setImagenesGaleria([]);
      setErrorGaleria(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setCargandoGaleria(false);
    }
  }

  async function agregarImagenGaleria() {
    if (!productoGaleria) return;

    const url = nuevaImagenGaleria.trim();

    if (!url) {
      setErrorGaleria(
        "Primero sube una imagen."
      );
      return;
    }

    setGuardandoGaleria(true);
    setErrorGaleria("");

    try {
      const res = await fetch(
        `/api/admin/productos/${productoGaleria.id}/imagenes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setErrorGaleria(
          data.error || "No se pudo agregar la imagen."
        );
        return;
      }

      setImagenesGaleria((anteriores) => [
        ...anteriores,
        data,
      ]);

      setNuevaImagenGaleria("");
    } catch {
      setErrorGaleria(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setGuardandoGaleria(false);
    }
  }

  async function eliminarImagenGaleria(
    imagen: ImagenProducto
  ) {
    if (!productoGaleria) return;

    const confirmar = window.confirm(
      "¿Seguro que deseas quitar esta imagen de la galería?"
    );

    if (!confirmar) return;

    setErrorGaleria("");

    try {
      const res = await fetch(
        `/api/admin/productos/${productoGaleria.id}/imagenes/${imagen.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setErrorGaleria(
          data.error || "No se pudo eliminar la imagen."
        );
        return;
      }

      setImagenesGaleria((anteriores) =>
        anteriores.filter(
          (item) => item.id !== imagen.id
        )
      );
    } catch {
      setErrorGaleria(
        "No se pudo conectar con el servidor."
      );
    }
  }

  async function abrirInformacion(producto: Producto) {
    setProductoInformacion(producto);

    setCargandoInformacion(true);

    try {
      const res = await fetch(
        `/api/admin/productos/${producto.id}/informacion`
      );

      const data = await res.json();

      if (res.ok) {
        setInformaciones(data);
      } else {
        setInformaciones([]);
      }

    } catch {
      setInformaciones([]);
    } finally {
      setCargandoInformacion(false);
    }
  }

  async function guardarInformacion(e: React.FormEvent) {
    e.preventDefault();

    if (!productoInformacion) return;

    if (!nuevaInformacion.titulo.trim()) {
      setErrorInformacion("El título es obligatorio.");
      return;
    }

    setGuardandoInformacion(true);
    setErrorInformacion("");

    try {
      const url = editandoInformacionId
        ? `/api/admin/productos/${productoInformacion.id}/informacion/${editandoInformacionId}`
        : `/api/admin/productos/${productoInformacion.id}/informacion`;

      const res = await fetch(url, {
        method: editandoInformacionId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: nuevaInformacion.tipo,
          titulo: nuevaInformacion.titulo.trim(),
          contenido: nuevaInformacion.contenido.trim() || null,
          imagenUrl: nuevaInformacion.imagenUrl.trim() || null,
          videoUrl: nuevaInformacion.videoUrl.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorInformacion(
          data.error || "No se pudo guardar la información."
        );
        return;
      }

      if (editandoInformacionId) {
        setInformaciones((anteriores) =>
          anteriores.map((info) =>
            info.id === editandoInformacionId ? data : info
          )
        );
      } else {
        setInformaciones((anteriores) => [...anteriores, data]);
      }

      setEditandoInformacionId(null);

      setNuevaInformacion({
        tipo: "BENEFICIO",
        titulo: "",
        contenido: "",
        imagenUrl: "",
        videoUrl: "",
      });
    } catch {
      setErrorInformacion("No se pudo conectar con el servidor.");
    } finally {
      setGuardandoInformacion(false);
    }
  }

  function editarInformacion(info: InformacionProducto) {
    setEditandoInformacionId(info.id);
    setErrorInformacion("");

    setNuevaInformacion({
      tipo: info.tipo,
      titulo: info.titulo,
      contenido: info.contenido || "",
      imagenUrl: info.imagenUrl || "",
      videoUrl: info.videoUrl || "",
    });
  }

  function cancelarEdicionInformacion() {
    setEditandoInformacionId(null);
    setErrorInformacion("");

    setNuevaInformacion({
      tipo: "BENEFICIO",
      titulo: "",
      contenido: "",
      imagenUrl: "",
      videoUrl: "",
    });
  }

  async function eliminarInformacion(infoId: string) {
    if (!productoInformacion) return;

    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar esta información?"
    );

    if (!confirmar) return;

    setErrorInformacion("");

    try {
      const res = await fetch(
        `/api/admin/productos/${productoInformacion.id}/informacion/${infoId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setErrorInformacion(
          data.error || "No se pudo eliminar la información."
        );
        return;
      }

      setInformaciones((anteriores) =>
        anteriores.filter((info) => info.id !== infoId)
      );

      if (editandoInformacionId === infoId) {
        cancelarEdicionInformacion();
      }
    } catch {
      setErrorInformacion("No se pudo conectar con el servidor.");
    }
  }

  function abrirEditar(p: Producto) {
    const datos = {
      nombre: p.nombre,
      descripcion: p.descripcion || "",
      precio: String(p.precio),
      mostrarPrecio: p.mostrarPrecio,
      enPromocion: p.enPromocion,
      precioPromocion: p.precioPromocion ? String(p.precioPromocion) : "",
      valorComisionable: p.valorComisionable
        ? String(p.valorComisionable)
        : "",
      puntosVolumen: p.puntosVolumen
        ? String(p.puntosVolumen)
        : "",
      generaComision: p.generaComision,
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
    const precio = Number(form.precio);

    if (!Number.isFinite(precio) || precio <= 0) {
      alert("Ingresa un precio de venta válido");
      return;
    }
    if (
      form.enPromocion &&
      form.precioPromocion &&
      parseFloat(form.precioPromocion) >= parseFloat(form.precio || "0")
    ) {
      alert("El precio de promoción debe ser menor al precio normal");
      return;
    }
    if (form.generaComision) {
      const cv = parseFloat(form.valorComisionable || "0");
      const pv = parseFloat(form.puntosVolumen || "0");

      if (!Number.isFinite(cv) || cv <= 0) {
        alert("Ingresa un valor comisionable (CV) mayor a 0");
        return;
      }

      if (!Number.isFinite(pv) || pv <= 0) {
        alert("Ingresa puntos de volumen (PV) mayores a 0");
        return;
      }
    }

    if (imagenSubiendo) {
      alert("Espera a que termine de subir la imagen antes de guardar");
      return;
    }
    setLoading(true);

    const body = {
      ...form,
      precio: parseFloat(form.precio || "0"),
      precioPromocion:
        form.enPromocion && form.precioPromocion
          ? parseFloat(form.precioPromocion)
          : null,
      generaComision: form.generaComision,
      valorComisionable: form.generaComision
        ? parseFloat(form.valorComisionable || "0")
        : 0,
      puntosVolumen: form.generaComision
        ? parseFloat(form.puntosVolumen || "0")
        : 0,
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

  async function cambiarEstado(producto: Producto) {
    try {
      const res = await fetch(
        `/api/admin/productos/${producto.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            activo: !producto.activo,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(
          data?.error ||
            "No se pudo cambiar el estado del producto"
        );
        return;
      }

      await cargar();
    } catch {
      alert("No se pudo conectar con el servidor");
    }
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
              onInformacion={abrirInformacion}
              onGaleria={abrirGaleria}
              onCambiarEstado={cambiarEstado}
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

            <div>
              <label className="admin-label">
                Precio de venta (Bs.)
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.precio}
                onChange={(e) =>
                  setForm({
                    ...form,
                    precio: e.target.value,
                  })
                }
                className="admin-input"
                required
              />
            </div>

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

            <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-4">

              <div className="flex items-center justify-between gap-4">

                <div>
                  <p className="text-sm font-semibold text-[#1F1B24]">
                    Plan multinivel
                  </p>

                  <p className="mt-1 text-xs text-[#6B6870]">
                    Activa este producto para que genere volumen y comisiones.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      generaComision: !form.generaComision,
                      valorComisionable: form.generaComision
                        ? ""
                        : form.valorComisionable,
                      puntosVolumen: form.generaComision
                        ? ""
                        : form.puntosVolumen,
                    })
                  }
                  className={`shrink-0 w-12 h-7 rounded-full relative transition-colors ${
                    form.generaComision
                      ? "bg-green-600"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      form.generaComision
                        ? "translate-x-5"
                        : ""
                    }`}
                  />
                </button>

              </div>


              {form.generaComision && (

                <div className="grid gap-4 sm:grid-cols-2">

                  <div>
                    <label className="admin-label">
                      Valor comisionable — CV (Bs.)
                    </label>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.valorComisionable}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          valorComisionable: e.target.value,
                        })
                      }
                      className="admin-input"
                      placeholder="Ej.: 100"
                      required
                    />

                    <p className="mt-1 text-xs text-[#8A8790]">
                      Base utilizada para calcular las comisiones.
                    </p>
                  </div>


                  <div>
                    <label className="admin-label">
                      Puntos de volumen — PV
                    </label>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.puntosVolumen}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          puntosVolumen: e.target.value,
                        })
                      }
                      className="admin-input"
                      placeholder="Ej.: 100"
                      required
                    />

                    <p className="mt-1 text-xs text-[#8A8790]">
                      Puntos que aportará este producto al volumen del miembro.
                    </p>
                  </div>

                </div>

              )}

            </div>


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

      {productoGaleria && (
        <Modal
          title={`Galería: ${productoGaleria.nombre}`}
          onClose={() => {
            setProductoGaleria(null);
            setImagenesGaleria([]);
            setNuevaImagenGaleria("");
            setErrorGaleria("");
          }}
        >
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-[#1F1B24]">
                Imagen principal
              </p>

              <p className="mt-1 text-xs text-[#8A8790]">
                La imagen principal se administra desde Editar producto.
                Las imágenes que agregues aquí aparecerán como galería.
              </p>

              {productoGaleria.imagenUrl && (
                <div className="mt-3 w-24 h-24 overflow-hidden rounded-xl bg-[#F7F7F9] border">
                  <img
                    src={productoGaleria.imagenUrl}
                    alt={productoGaleria.nombre}
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <label className="admin-label">
                Nueva imagen
              </label>

              <CloudinaryUpload
                value={nuevaImagenGaleria}
                onChange={setNuevaImagenGaleria}
                onUploadingChange={setGaleriaSubiendo}
                soloImagen
              />

              <button
                type="button"
                onClick={agregarImagenGaleria}
                disabled={
                  guardandoGaleria ||
                  galeriaSubiendo ||
                  !nuevaImagenGaleria
                }
                className="admin-btn-primary w-full mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {galeriaSubiendo
                  ? "Subiendo imagen..."
                  : guardandoGaleria
                    ? "Agregando..."
                    : "Agregar a la galería"}
              </button>

              {errorGaleria && (
                <p className="mt-2 text-sm text-red-600">
                  {errorGaleria}
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-[#1F1B24]">
                Imágenes adicionales
              </h3>

              {cargandoGaleria ? (
                <p className="mt-3 text-sm text-[#8A8790]">
                  Cargando...
                </p>
              ) : imagenesGaleria.length === 0 ? (
                <p className="mt-3 text-sm text-[#8A8790]">
                  Este producto todavía no tiene imágenes adicionales.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imagenesGaleria.map((imagen) => (
                    <div
                      key={imagen.id}
                      className="overflow-hidden rounded-xl border bg-white"
                    >
                      <div className="aspect-square bg-[#F7F7F9]">
                        <img
                          src={imagen.url}
                          alt={`Galería de ${productoGaleria.nombre}`}
                          className="w-full h-full object-contain p-2"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          eliminarImagenGaleria(imagen)
                        }
                        className="w-full border-t px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {productoInformacion && (
        <Modal
          title={`Información: ${productoInformacion.nombre}`}
          onClose={() => {
            setProductoInformacion(null);
            setInformaciones([]);
            setErrorInformacion("");
            setEditandoInformacionId(null);
            setNuevaInformacion({
              tipo: "BENEFICIO",
              titulo: "",
              contenido: "",
              imagenUrl: "",
              videoUrl: "",
            });
          }}
        >
          <div className="space-y-5">

            <form onSubmit={guardarInformacion} className="space-y-4">
              <div>
                <label className="admin-label">
                  Tipo de información
                </label>

                <select
                  value={nuevaInformacion.tipo}
                  onChange={(e) =>
                    setNuevaInformacion({
                      ...nuevaInformacion,
                      tipo: e.target.value as TipoInformacion,
                    })
                  }
                  className="admin-input"
                >
                  <option value="BENEFICIO">Beneficio</option>
                  <option value="VIDEO">Video</option>
                  <option value="INGREDIENTE">Ingrediente</option>
                  <option value="FAQ">Pregunta frecuente</option>
                  <option value="DOCUMENTO">Documento</option>
                </select>
              </div>

              <div>
                <label className="admin-label">
                  Título
                </label>

                <input
                  type="text"
                  value={nuevaInformacion.titulo}
                  onChange={(e) =>
                    setNuevaInformacion({
                      ...nuevaInformacion,
                      titulo: e.target.value,
                    })
                  }
                  className="admin-input"
                  placeholder={
                    nuevaInformacion.tipo === "FAQ"
                      ? "Ej.: ¿Cómo se consume?"
                      : "Ej.: Beneficios principales"
                  }
                  required
                />
              </div>

              <div>
                <label className="admin-label">
                  {nuevaInformacion.tipo === "FAQ"
                    ? "Respuesta"
                    : "Contenido"}
                </label>

                <textarea
                  value={nuevaInformacion.contenido}
                  onChange={(e) =>
                    setNuevaInformacion({
                      ...nuevaInformacion,
                      contenido: e.target.value,
                    })
                  }
                  className="admin-input"
                  rows={4}
                  placeholder="Escribe la información..."
                />
              </div>

              <div>
                <label className="admin-label">
                  Imagen opcional
                </label>

                <CloudinaryUpload
                  value={nuevaInformacion.imagenUrl}
                  onChange={(url) =>
                    setNuevaInformacion({
                      ...nuevaInformacion,
                      imagenUrl: url,
                    })
                  }
                />
              </div>

              {nuevaInformacion.tipo === "VIDEO" && (
                <div>
                  <label className="admin-label">
                    Enlace del video
                  </label>

                  <input
                    type="url"
                    value={nuevaInformacion.videoUrl}
                    onChange={(e) =>
                      setNuevaInformacion({
                        ...nuevaInformacion,
                        videoUrl: e.target.value,
                      })
                    }
                    className="admin-input"
                    placeholder="https://youtube.com/..."
                  />
                </div>
              )}

              {errorInformacion && (
                <p className="text-sm text-red-600">
                  {errorInformacion}
                </p>
              )}

              <button
                type="submit"
                disabled={guardandoInformacion}
                className="admin-btn-primary w-full"
              >
                {guardandoInformacion
                  ? "Guardando..."
                  : editandoInformacionId
                    ? "Guardar cambios"
                    : "Agregar información"}
              </button>

              {editandoInformacionId && (
                <button
                  type="button"
                  onClick={cancelarEdicionInformacion}
                  className="w-full text-sm text-[#6B6870] font-medium"
                >
                  Cancelar edición
                </button>
              )}
            </form>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-[#1F1B24] mb-3">
                Información registrada
              </h3>

              {cargandoInformacion ? (
                <p className="text-sm text-[#8A8790]">
                  Cargando...
                </p>
              ) : informaciones.length === 0 ? (
                <p className="text-sm text-[#8A8790]">
                  Este producto todavía no tiene información adicional.
                </p>
              ) : (
                <div className="space-y-3">
                  {informaciones.map((info) => (
                    <div
                      key={info.id}
                      className="admin-card p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-brand-pink">
                            {info.tipo === "BENEFICIO"
                              ? "BENEFICIO"
                              : info.tipo === "VIDEO"
                                ? "VIDEO"
                                : info.tipo === "INGREDIENTE"
                                  ? "INGREDIENTE"
                                  : info.tipo === "FAQ"
                                    ? "PREGUNTA FRECUENTE"
                                    : "DOCUMENTO"}
                          </span>

                          <p className="font-medium text-sm mt-1">
                            {info.titulo}
                          </p>

                          <div className="flex items-center gap-3 mt-2">
                            <button
                              type="button"
                              onClick={() => editarInformacion(info)}
                              className="text-xs text-brand-blue font-semibold hover:underline"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => eliminarInformacion(info.id)}
                              className="text-xs text-red-600 font-semibold hover:underline"
                            >
                              Eliminar
                            </button>
                          </div>

                          {info.contenido && (
                            <p className="text-sm text-[#6B6870] mt-1 whitespace-pre-line">
                              {info.contenido}
                            </p>
                          )}
                        </div>
                      </div>

                      {info.imagenUrl && (
                        <img
                          src={info.imagenUrl}
                          alt={info.titulo}
                          className="mt-3 max-h-40 w-full object-contain rounded-lg bg-[#F7F7F9]"
                        />
                      )}

                      {info.videoUrl && (
                        <a
                          href={info.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-sm text-brand-pink font-medium hover:underline"
                        >
                          Ver video
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
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

    </div>
  );
}
