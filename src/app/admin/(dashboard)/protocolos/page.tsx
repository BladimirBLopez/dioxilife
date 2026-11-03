"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import CloudinaryUpload from "@/components/CloudinaryUpload";
import EditorContenidoProtocolo from "@/components/admin/protocolos/EditorContenidoProtocolo";
import {
  FORMATO_PROTOCOLO,
  guardarContenidoProtocolo,
  leerContenidoProtocolo,
  validarContenidoPublicable,
} from "@/lib/protocolos-contenido";
import { esVideo } from "@/lib/media";

type Producto = { id: string; nombre: string };
type Protocolo = {
  id: string;
  titulo: string;
  contenido: string;
  imagenUrl: string | null;
  videoUrl: string | null;
  productoId: string | null;
  producto: Producto | null;
  productosRelacionados: {
    producto: Producto;
  }[];
  activo: boolean;
};

const vacio = {
  titulo: "",
  contenido: guardarContenidoProtocolo({
    formato: FORMATO_PROTOCOLO,
    resumen: "",
    seguridad: "",
    secciones: [],
  }),
  imagenUrl: "",
  videoUrl: "",
  productoIds: [] as string[],
  activo: false,
};

function vistaPreviaContenido(valor: string): string {
  const lectura = leerContenidoProtocolo(valor);

  if (lectura.tipo === "anterior") {
    return lectura.texto;
  }

  return (
    lectura.documento.resumen.trim() ||
    lectura.documento.secciones.find(
      (s) => s.contenido.trim()
    )?.contenido ||
    "Contenido organizado"
  );
}

export default function ProtocolosPage() {
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState(vacio);
  const [formInicial, setFormInicial] = useState(vacio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
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
      videoUrl: p.videoUrl || "",
      productoIds: p.productosRelacionados.map(
        ({ producto }) => producto.id
      ),
        activo: p.activo,
    };
    setEditandoId(p.id);
    setForm(datos);
    setFormInicial(datos);
    setModalAbierto(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (loading || subiendoArchivo) return;

    if (!form.titulo || !form.contenido) {
      alert("Título y contenido son obligatorios");
      return;
    }

    const registroActual = editandoId
      ? protocolos.find((p) => p.id === editandoId)
      : undefined;

    const contenidoSinCambios = Boolean(
      registroActual?.activo &&
      registroActual.contenido === form.contenido
    );

    if (form.activo && !contenidoSinCambios) {
      const problema = validarContenidoPublicable(
        form.contenido
      );

      if (problema) {
        alert(problema);
        return;
      }
    }

    const estabaPublicado = Boolean(registroActual?.activo);

    if (form.activo && !estabaPublicado) {
      if (!window.confirm(
        "¿Confirmas que la información fue revisada " +
        "y deseas publicarla?"
      )) return;
    }

    setLoading(true);

    try {
      const body = {
        ...form,
        productoId: null,
        activo: form.activo,
      };

      const respuesta = await fetch(
        editandoId
          ? `/api/admin/protocolos/${editandoId}`
          : "/api/admin/protocolos",
        {
          method: editandoId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);

        throw new Error(
          datos && typeof datos.error === "string"
            ? datos.error
            : "No se pudieron guardar los cambios."
        );
      }

      setModalAbierto(false);
      setForm(vacio);
      setEditandoId(null);

      try {
        await cargar();
      } catch {
        alert(
          "Los cambios se guardaron, pero no se pudo actualizar la lista. Recarga la página."
        );
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Error de conexión al guardar."
      );
    } finally {
      setLoading(false);
    }
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
              esVideo(p.imagenUrl) ? (
                <video
                  src={p.imagenUrl}
                  muted
                  autoPlay
                  loop
                  playsInline
                  className="w-16 h-16 object-cover rounded-lg shrink-0"
                />
              ) : (
                <img
                  src={p.imagenUrl}
                  alt={p.titulo}
                  className="w-16 h-16 object-cover rounded-lg shrink-0"
                />
              )
            ) : (
              <div className="w-16 h-16 rounded-lg bg-[#F7F7F9] shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-[#1F1B24]">{p.titulo}</p>
              {p.productosRelacionados.length > 0 && (
                <p className="mt-0.5 text-xs font-medium text-brand-pink">
                  {p.productosRelacionados.length} producto
                  {p.productosRelacionados.length === 1 ? "" : "s"} relacionado
                  {p.productosRelacionados.length === 1 ? "" : "s"}
                </p>
              )}
              <span
                className={
                  p.activo
                    ? "inline-flex mt-2 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700"
                    : "inline-flex mt-2 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600"
                }
              >
                {p.activo ? "Publicado" : "Borrador"}
              </span>
              <p className="text-sm text-[#6B6870] line-clamp-2 mt-1">
                {vistaPreviaContenido(p.contenido)}
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
              <label className="admin-label">Imagen del protocolo (opcional)</label>
              <CloudinaryUpload
                value={form.imagenUrl}
                onChange={(url) => setForm({ ...form, imagenUrl: url })}
                onUploadingChange={setSubiendoArchivo}
                soloImagen
              />
                {form.imagenUrl && (
                  <button
                    type="button"
                    disabled={loading || subiendoArchivo}
                    onClick={() =>
                      setForm(actual => ({
                        ...actual,
                        imagenUrl: ""
                      }))
                    }
                    className="mt-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Quitar imagen del protocolo
                  </button>
                )}
            </div>

            <div>

              <EditorContenidoProtocolo
                  value={form.contenido}
                  onChange={(contenido) =>
                    setForm((actual) => ({
                      ...actual,
                      contenido,
                    }))
                  }
                  disabled={loading || subiendoArchivo}
                />
            </div>

            <div>
              <label className="admin-label">Imagen o video del modal (opcional)</label>
              <CloudinaryUpload
                value={form.videoUrl}
                onChange={(url) => setForm({ ...form, videoUrl: url })}
                onUploadingChange={setSubiendoArchivo}
              />
                {form.videoUrl && (
                  <button
                    type="button"
                    disabled={loading || subiendoArchivo}
                    onClick={() =>
                      setForm(actual => ({
                        ...actual,
                        videoUrl: ""
                      }))
                    }
                    className="mt-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Quitar imagen o video del modal
                  </button>
                )}
            </div>

            <div>
              <label className="admin-label">
                Productos relacionados (opcional)
              </label>

              <p className="mb-2 text-xs text-[#8A8790]">
                Selecciona únicamente los productos que correspondan a este protocolo.
              </p>

              <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3">
                {productos.length === 0 ? (
                  <p className="text-sm text-[#8A8790]">
                    No hay productos disponibles.
                  </p>
                ) : (
                  productos.map((p) => {
                    const seleccionado = form.productoIds.includes(p.id);

                    return (
                      <label
                        key={p.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                          seleccionado
                            ? "border-brand-pink bg-brand-pink/5"
                            : "border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={() => {
                            setForm((actual) => ({
                              ...actual,
                              productoIds: seleccionado
                                ? actual.productoIds.filter((id) => id !== p.id)
                                : [...actual.productoIds, p.id],
                            }));
                          }}
                          className="h-4 w-4 accent-pink-600"
                        />

                        <span className="min-w-0 flex-1 text-[#1F1B24]">
                          {p.nombre}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>

              <p className="mt-2 text-xs text-[#8A8790]">
                {form.productoIds.length} producto
                {form.productoIds.length === 1 ? "" : "s"} seleccionado
                {form.productoIds.length === 1 ? "" : "s"}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || subiendoArchivo}
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
