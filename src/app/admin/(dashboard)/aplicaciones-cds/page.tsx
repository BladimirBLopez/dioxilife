"use client";

import { useEffect, useState } from "react";
import CloudinaryUpload from "@/components/CloudinaryUpload";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";

type Protocolo = {
  id: string;
  titulo: string;
  activo: boolean;
};

type AplicacionCds = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tratamiento: string | null;
  imagenUrl: string | null;
  activo: boolean;
  protocolos: {
    protocolo: Protocolo;
  }[];
};

const vacio = {
  nombre: "",
  descripcion: "",
  tratamiento: "",
  imagenUrl: "",
  protocoloIds: [] as string[],
};

export default function AplicacionesCdsPage() {
  const [aplicaciones, setAplicaciones] = useState<AplicacionCds[]>([]);
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [form, setForm] = useState(vacio);
  const [formInicial, setFormInicial] = useState(vacio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagenSubiendo, setImagenSubiendo] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [confirmarSalir, setConfirmarSalir] = useState(false);
  const [borrarId, setBorrarId] = useState<string | null>(null);

  async function cargar() {
    const [resAplicaciones, resProtocolos] = await Promise.all([
      fetch("/api/admin/aplicaciones-cds"),
      fetch("/api/admin/protocolos"),
    ]);

    const [dataAplicaciones, dataProtocolos] = await Promise.all([
      resAplicaciones.json(),
      resProtocolos.json(),
    ]);

    setAplicaciones(dataAplicaciones);
    setProtocolos(
      Array.isArray(dataProtocolos)
        ? dataProtocolos.filter((p: Protocolo) => p.activo)
        : []
    );
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

  function abrirEditar(a: AplicacionCds) {
    const datos = {
      nombre: a.nombre,
      descripcion: a.descripcion || "",
      tratamiento: a.tratamiento || "",
      imagenUrl: a.imagenUrl || "",
      protocoloIds: a.protocolos.map((rel) => rel.protocolo.id),
    };
    setEditandoId(a.id);
    setForm(datos);
    setFormInicial(datos);
    setModalAbierto(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre) {
      alert("El nombre es obligatorio");
      return;
    }
    if (imagenSubiendo) {
      alert("Espera a que termine de subir la imagen antes de guardar");
      return;
    }
    setLoading(true);

    const body = { ...form, activo: true };

    try {
      const res = editandoId
        ? await fetch(`/api/admin/aplicaciones-cds/${editandoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/aplicaciones-cds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Ocurrió un error al guardar");
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
    const res = await fetch(`/api/admin/aplicaciones-cds/${borrarId}`, {
      method: "DELETE",
    });
    setBorrarId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error || "No se pudo borrar");
      return;
    }

    cargar();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-[#1F1B24]">
          Aplicaciones del CDS
        </h1>
        <button onClick={abrirNuevo} className="admin-btn-primary">
          + Nueva aplicación
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {aplicaciones.length === 0 && (
          <p className="text-sm text-[#8A8790]">Aún no hay aplicaciones.</p>
        )}
        {aplicaciones.map((a) => (
          <div key={a.id} className="admin-card p-4 flex gap-3">
            {a.imagenUrl ? (
              <img
                src={a.imagenUrl}
                alt={a.nombre}
                className="w-14 h-14 object-cover rounded-lg shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-brand-pink/10 text-brand-pink flex items-center justify-center font-semibold shrink-0">
                {a.nombre.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-[#1F1B24]">{a.nombre}</p>
              {a.descripcion && (
                <p className="text-sm text-[#6B6870] line-clamp-2 mt-1">
                  {a.descripcion}
                </p>
              )}
              <div className="flex gap-4 text-sm mt-2">
                <button
                  onClick={() => abrirEditar(a)}
                  className="text-brand-blue font-medium hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => setBorrarId(a.id)}
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
          title={editandoId ? "Editar aplicación" : "Nueva aplicación"}
          onClose={pedirCerrarModal}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="admin-label">
                Nombre (ej. Acné, Aftas, Absceso)
              </label>
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
                rows={4}
              />
            </div>

            <div>
              <label className="admin-label">Tratamiento</label>
              <textarea
                value={form.tratamiento}
                onChange={(e) =>
                  setForm({ ...form, tratamiento: e.target.value })
                }
                className="admin-input"
                rows={5}
                placeholder="Escribe aquí el tratamiento o protocolo recomendado..."
              />
            </div>

            <div>
              <label className="admin-label">Protocolos relacionados</label>

              {protocolos.length === 0 ? (
                <p className="text-sm text-[#8A8790]">
                  No hay protocolos disponibles.
                </p>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 p-2 space-y-1">
                  {protocolos.map((p) => {
                    const seleccionado = form.protocoloIds.includes(p.id);

                    return (
                      <label
                        key={p.id}
                        className="flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={() =>
                            setForm({
                              ...form,
                              protocoloIds: seleccionado
                                ? form.protocoloIds.filter((id) => id !== p.id)
                                : [...form.protocoloIds, p.id],
                            })
                          }
                          className="mt-0.5"
                        />
                        <span className="text-sm text-[#1F1B24]">
                          {p.titulo}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {form.protocoloIds.length > 0 && (
                <p className="text-xs text-[#8A8790] mt-1">
                  {form.protocoloIds.length} protocolo(s) seleccionado(s)
                </p>
              )}
            </div>

            <div>
              <label className="admin-label">Imagen de la dolencia</label>
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
                : "Crear aplicación"}
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
          title="Borrar aplicación"
          message="¿Seguro que quieres borrar esta aplicación? Esta acción no se puede deshacer."
          onConfirm={confirmarBorrar}
          onCancel={() => setBorrarId(null)}
        />
      )}
    </div>
  );
}
