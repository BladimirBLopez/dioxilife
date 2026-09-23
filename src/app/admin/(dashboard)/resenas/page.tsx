"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import CloudinaryUpload from "@/components/CloudinaryUpload";

type Producto = { id: string; nombre: string };

type Resena = {
  id: string;
  nombreCliente: string;
  calificacion: number;
  comentario: string;
  imagenUrl: string | null;
  productoId: string | null;
  producto: { nombre: string } | null;
  aprobado: boolean;
  tiempoUso: string | null;
  destacado: boolean;
  createdAt: string;
};

type Filtro = "pendientes" | "aprobadas" | "todas";

const vacio = {
  nombreCliente: "",
  calificacion: "5",
  comentario: "",
  imagenUrl: "",
  productoId: "",
};

export default function ResenasPage() {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("pendientes");
  const [borrarId, setBorrarId] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(vacio);
  const [formInicial, setFormInicial] = useState(vacio);
  const [confirmarSalir, setConfirmarSalir] = useState(false);
  const [imagenSubiendo, setImagenSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setCargando(true);
    const [resR, resP] = await Promise.all([
      fetch("/api/admin/resenas"),
      fetch("/api/admin/productos"),
    ]);
    if (resR.ok) setResenas(await resR.json());
    if (resP.ok) setProductos(await resP.json());
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function cambiarAprobado(id: string, aprobado: boolean) {
    setProcesandoId(id);
    const res = await fetch(`/api/admin/resenas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aprobado }),
    });
    if (res.ok) {
      setResenas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, aprobado } : r))
      );
    } else {
      alert("No se pudo actualizar la testimonio");
    }
    setProcesandoId(null);
  }

  async function cambiarDestacado(id: string, destacado: boolean) {
    setProcesandoId(id);

    const res = await fetch(`/api/admin/resenas/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destacado,
      }),
    });

    if (res.ok) {
      setResenas((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, destacado }
            : r
        )
      );
    } else {
      alert("No se pudo actualizar el destacado");
    }

    setProcesandoId(null);
  }

  async function confirmarBorrar() {
    if (!borrarId) return;
    const res = await fetch(`/api/admin/resenas/${borrarId}`, {
      method: "DELETE",
    });
    setBorrarId(null);
    if (res.ok) {
      setResenas((prev) => prev.filter((r) => r.id !== borrarId));
    } else {
      alert("No se pudo borrar la testimonio");
    }
  }

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

  function abrirNueva() {
    setEditandoId(null);
    setForm(vacio);
    setFormInicial(vacio);
    setModalAbierto(true);
  }

  function abrirEditar(r: Resena) {
    const datos = {
      nombreCliente: r.nombreCliente,
      calificacion: String(r.calificacion),
      comentario: r.comentario,
      imagenUrl: r.imagenUrl || "",
      productoId: r.productoId || "",
    };
    setEditandoId(r.id);
    setForm(datos);
    setFormInicial(datos);
    setModalAbierto(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombreCliente || !form.comentario) {
      alert("Nombre y comentario son obligatorios");
      return;
    }
    if (imagenSubiendo) {
      alert("Espera a que termine de subir la imagen antes de guardar");
      return;
    }
    setGuardando(true);

    const body = {
      nombreCliente: form.nombreCliente,
      calificacion: Number(form.calificacion),
      comentario: form.comentario,
      imagenUrl: form.imagenUrl || null,
      productoId: form.productoId || null,
      aprobado: true,
    };

    try {
      const res = editandoId
        ? await fetch(`/api/admin/resenas/${editandoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/resenas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Ocurrió un error al guardar");
        setGuardando(false);
        return;
      }

      setModalAbierto(false);
      setForm(vacio);
      setEditandoId(null);
      await cargar();
    } catch {
      alert("No se pudo conectar con el servidor");
    } finally {
      setGuardando(false);
    }
  }

  const pendientesCount = resenas.filter((r) => !r.aprobado).length;
  const aprobadasCount = resenas.filter((r) => r.aprobado).length;

  const visibles = resenas.filter((r) => {
    if (filtro === "pendientes") return !r.aprobado;
    if (filtro === "aprobadas") return r.aprobado;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-[#1F1B24]">Testimonios</h1>
        <button onClick={abrirNueva} className="admin-btn-primary">
          + Nueva testimonio
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFiltro("pendientes")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
            filtro === "pendientes"
              ? "bg-brand-pink text-white border-brand-pink"
              : "bg-white text-[#6B6870] border-gray-300"
          }`}
        >
          Pendientes ({pendientesCount})
        </button>
        <button
          onClick={() => setFiltro("aprobadas")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
            filtro === "aprobadas"
              ? "bg-brand-pink text-white border-brand-pink"
              : "bg-white text-[#6B6870] border-gray-300"
          }`}
        >
          Aprobadas ({aprobadasCount})
        </button>
        <button
          onClick={() => setFiltro("todas")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
            filtro === "todas"
              ? "bg-brand-pink text-white border-brand-pink"
              : "bg-white text-[#6B6870] border-gray-300"
          }`}
        >
          Todas ({resenas.length})
        </button>
      </div>

      {cargando ? (
        <p className="text-sm text-[#8A8790]">Cargando...</p>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-[#8A8790]">No hay testimonios en esta vista.</p>
      ) : (
        <div className="space-y-3">
          {visibles.map((r) => (
            <div key={r.id} className="admin-card p-4 flex gap-3">
              {r.imagenUrl ? (
                <img
                  src={r.imagenUrl}
                  alt={r.nombreCliente}
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-brand-pink/10 text-brand-pink flex items-center justify-center font-semibold shrink-0">
                  {r.nombreCliente.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm text-[#1F1B24]">
                    {r.nombreCliente}
                  </p>
                  <span className="text-xs text-yellow-500">
                    {"⭐".repeat(r.calificacion)}
                  </span>
                  {!r.aprobado && (
                    <span className="text-[10px] font-bold text-white bg-orange-500 px-1.5 py-0.5 rounded-full">
                      PENDIENTE
                    </span>
                  )}

                  {r.destacado && (
                    <span className="text-[10px] font-bold text-white bg-yellow-500 px-1.5 py-0.5 rounded-full">
                      ⭐ DESTACADO EN INICIO
                    </span>
                  )}
                </div>
                <p className="text-xs text-brand-pink font-medium mt-0.5">
                  {r.producto ? r.producto.nombre : "Testimonio general de la tienda"}
                </p>
                <p className="text-sm text-[#6B6870] mt-1 whitespace-pre-line">
                  {r.comentario}
                </p>
                <p className="text-[11px] text-[#8A8790] mt-1">
                  {new Date(r.createdAt).toLocaleDateString("es-BO", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>

                <div className="flex gap-4 text-sm mt-3">
                  {r.aprobado ? (
                    <button
                      onClick={() => cambiarAprobado(r.id, false)}
                      disabled={procesandoId === r.id}
                      className="text-[#6B6870] font-medium hover:underline"
                    >
                      Ocultar
                    </button>
                  ) : (
                    <button
                      onClick={() => cambiarAprobado(r.id, true)}
                      disabled={procesandoId === r.id}
                      className="text-green-600 font-medium hover:underline"
                    >
                      Aprobar
                    </button>
                  )}
                  <button
                    onClick={() => abrirEditar(r)}
                    className="text-brand-blue font-medium hover:underline"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => cambiarDestacado(r.id, !r.destacado)}
                    disabled={procesandoId === r.id}
                    className="text-yellow-600 font-medium hover:underline"
                  >
                    {r.destacado
                      ? "★ Quitar destacado"
                      : "⭐ Destacar"}
                  </button>

                  <button
                    onClick={() => setBorrarId(r.id)}
                    className="text-red-600 font-medium hover:underline"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAbierto && (
        <Modal
          title={editandoId ? "Editar testimonio" : "Nueva testimonio"}
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
              <label className="admin-label">Comentario</label>
              <textarea
                value={form.comentario}
                onChange={(e) =>
                  setForm({ ...form, comentario: e.target.value })
                }
                className="admin-input"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="admin-label">
                Producto (opcional — vacío = testimonio general)
              </label>
              <select
                value={form.productoId}
                onChange={(e) =>
                  setForm({ ...form, productoId: e.target.value })
                }
                className="admin-input"
              >
                <option value="">General de la tienda</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
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

            <button
              type="submit"
              disabled={guardando || imagenSubiendo}
              className="admin-btn-primary w-full"
            >
              {imagenSubiendo
                ? "Esperando imagen..."
                : guardando
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
          message="¿Seguro que quieres borrar esta testimonio? Esta acción no se puede deshacer."
          onConfirm={confirmarBorrar}
          onCancel={() => setBorrarId(null)}
        />
      )}
    </div>
  );
}
