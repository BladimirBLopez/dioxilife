"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";

const DEPARTAMENTOS = [
  { value: "LA_PAZ", label: "La Paz" },
  { value: "SANTA_CRUZ", label: "Santa Cruz" },
  { value: "COCHABAMBA", label: "Cochabamba" },
  { value: "ORURO", label: "Oruro" },
  { value: "POTOSI", label: "Potosí" },
  { value: "CHUQUISACA", label: "Chuquisaca" },
  { value: "TARIJA", label: "Tarija" },
  { value: "BENI", label: "Beni" },
  { value: "PANDO", label: "Pando" },
];

type Sucursal = {
  id: string;
  departamento: string;
  nombre: string | null;
  direccion: string | null;
  telefono: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  instagramUrl: string | null;
  activo: boolean;
};

const vacio = {
  departamento: "LA_PAZ",
  nombre: "",
  direccion: "",
  telefono: "",
  facebookUrl: "",
  tiktokUrl: "",
  instagramUrl: "",
};

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [form, setForm] = useState(vacio);
  const [formInicial, setFormInicial] = useState(vacio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [confirmarSalir, setConfirmarSalir] = useState(false);
  const [borrarId, setBorrarId] = useState<string | null>(null);

  async function cargar() {
    const res = await fetch("/api/admin/sucursales");
    setSucursales(await res.json());
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

  function abrirEditar(s: Sucursal) {
    const datos = {
      departamento: s.departamento,
      nombre: s.nombre || "",
      direccion: s.direccion || "",
      telefono: s.telefono || "",
      facebookUrl: s.facebookUrl || "",
      tiktokUrl: s.tiktokUrl || "",
      instagramUrl: s.instagramUrl || "",
    };
    setEditandoId(s.id);
    setForm(datos);
    setFormInicial(datos);
    setModalAbierto(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (editandoId) {
      await fetch(`/api/admin/sucursales/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/admin/sucursales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    await fetch(`/api/admin/sucursales/${borrarId}`, { method: "DELETE" });
    setBorrarId(null);
    cargar();
  }

  function labelDepto(value: string) {
    return DEPARTAMENTOS.find((d) => d.value === value)?.label || value;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Sucursales</h1>
        <button
          onClick={abrirNuevo}
          className="bg-black text-white px-4 py-2 rounded"
        >
          + Nueva sucursal
        </button>
      </div>

      <div className="bg-white rounded-lg shadow max-w-2xl">
        {sucursales.length === 0 && (
          <p className="p-4 text-gray-500 text-sm">No hay sucursales aún.</p>
        )}
        {sucursales.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between border-b last:border-b-0 px-4 py-3"
          >
            <div>
              <p className="font-medium">
                {labelDepto(s.departamento)}
                {s.nombre ? ` — ${s.nombre}` : ""}
              </p>
              <p className="text-xs text-gray-500">
                {s.direccion || "Sin dirección"}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                onClick={() => abrirEditar(s)}
                className="text-blue-600 hover:underline"
              >
                Editar
              </button>
              <button
                onClick={() => setBorrarId(s.id)}
                className="text-red-600 hover:underline"
              >
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalAbierto && (
        <Modal
          title={editandoId ? "Editar sucursal" : "Nueva sucursal"}
          onClose={pedirCerrarModal}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="text-sm font-medium">Departamento</label>
            <select
              value={form.departamento}
              onChange={(e) =>
                setForm({ ...form, departamento: e.target.value })
              }
              className="border rounded px-3 py-2"
            >
              {DEPARTAMENTOS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Nombre del punto de venta (opcional)"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Dirección"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Enlace de Facebook"
              value={form.facebookUrl}
              onChange={(e) =>
                setForm({ ...form, facebookUrl: e.target.value })
              }
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Enlace de TikTok"
              value={form.tiktokUrl}
              onChange={(e) => setForm({ ...form, tiktokUrl: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Enlace de Instagram"
              value={form.instagramUrl}
              onChange={(e) =>
                setForm({ ...form, instagramUrl: e.target.value })
              }
              className="border rounded px-3 py-2"
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white rounded py-2 disabled:opacity-50"
            >
              {loading
                ? "Guardando..."
                : editandoId
                ? "Guardar cambios"
                : "Agregar sucursal"}
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
          title="Borrar sucursal"
          message="¿Seguro que quieres borrar esta sucursal? Esta acción no se puede deshacer."
          onConfirm={confirmarBorrar}
          onCancel={() => setBorrarId(null)}
        />
      )}
    </div>
  );
}
