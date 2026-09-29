"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";

type Plan = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracionDias: number;
  estado: "BORRADOR" | "ACTIVO" | "INACTIVO";
  _count: {
    actividades: number;
    seguimientos: number;
  };
};

const vacio = {
  nombre: "",
  descripcion: "",
  duracionDias: "30",
  estado: "BORRADOR" as "BORRADOR" | "ACTIVO" | "INACTIVO",
};

export default function PlanesSeguimientoPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [cargando, setCargando] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(vacio);
  const [formInicial, setFormInicial] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  const [borrarId, setBorrarId] = useState<string | null>(null);
  const [confirmarSalir, setConfirmarSalir] = useState(false);

  async function cargar() {
    setCargando(true);

    const resPlanes =
      await fetch("/api/admin/seguimiento/planes");

    if (resPlanes.ok) {
      setPlanes(await resPlanes.json());
    }

    setCargando(false);
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

  function abrirEditar(plan: Plan) {
    const datos = {
      nombre: plan.nombre,
      descripcion: plan.descripcion || "",
      duracionDias: String(plan.duracionDias),
      estado: plan.estado,
    };

    setEditandoId(plan.id);
    setForm(datos);
    setFormInicial(datos);
    setModalAbierto(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.nombre.trim()) {
      alert("El nombre del plan es obligatorio");
      return;
    }

    const dias = Number(form.duracionDias);

    if (!Number.isInteger(dias) || dias < 1 || dias > 365) {
      alert("La duración debe estar entre 1 y 365 días");
      return;
    }

    setGuardando(true);

    const body = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      duracionDias: dias,
      estado: form.estado,
    };

    try {
      const res = editandoId
        ? await fetch(`/api/admin/seguimiento/planes/${editandoId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/seguimiento/planes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "No se pudo guardar el plan");
        return;
      }

      setModalAbierto(false);
      setEditandoId(null);
      setForm(vacio);
      await cargar();
    } catch {
      alert("No se pudo conectar con el servidor");
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrar() {
    if (!borrarId) return;

    const res = await fetch(
      `/api/admin/seguimiento/planes/${borrarId}`,
      {
        method: "DELETE",
      }
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(data?.error || "No se pudo borrar el plan");
      setBorrarId(null);
      return;
    }

    setBorrarId(null);
    await cargar();
  }

  function claseEstado(estado: Plan["estado"]) {
    if (estado === "ACTIVO") {
      return "bg-green-100 text-green-700";
    }

    if (estado === "INACTIVO") {
      return "bg-gray-100 text-gray-600";
    }

    return "bg-amber-100 text-amber-700";
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1F1B24]">
            Planes de seguimiento
          </h1>

          <p className="mt-1 text-sm text-[#6B6870]">
            Crea plantillas reutilizables para el seguimiento posterior a la compra.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNuevo}
          className="admin-btn-primary shrink-0"
        >
          + Nuevo plan
        </button>
      </div>

      {cargando ? (
        <p className="text-sm text-[#8A8790]">Cargando...</p>
      ) : planes.length === 0 ? (
        <div className="admin-card p-8 text-center">
          <p className="font-semibold text-[#1F1B24]">
            Aún no hay planes de seguimiento
          </p>

          <p className="mt-1 text-sm text-[#8A8790]">
            Crea el primer plan y luego podrás añadir sus actividades.
          </p>

          <button
            type="button"
            onClick={abrirNuevo}
            className="admin-btn-primary mt-4"
          >
            Crear primer plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {planes.map((plan) => (
            <article
              key={plan.id}
              className="admin-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-[#1F1B24]">
                    {plan.nombre}
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${claseEstado(
                      plan.estado
                    )}`}
                  >
                    {plan.estado}
                  </span>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8F6FF] text-brand-pink">
                  ✓
                </div>
              </div>

              {plan.descripcion && (
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#6B6870]">
                  {plan.descripcion}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-[#F8F6FF] p-3">
                  <p className="text-xs text-[#8A8790]">
                    Duración
                  </p>
                  <p className="mt-1 font-semibold text-[#1F1B24]">
                    {plan.duracionDias} días
                  </p>
                </div>

                <div className="rounded-xl bg-[#F8F6FF] p-3">
                  <p className="text-xs text-[#8A8790]">
                    Actividades
                  </p>
                  <p className="mt-1 font-semibold text-[#1F1B24]">
                    {plan._count.actividades}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-sm">
                <button
                  type="button"
                  onClick={() => abrirEditar(plan)}
                  className="font-medium text-brand-blue hover:underline"
                >
                  Editar
                </button>

                <a
                  href={`/admin/seguimiento/planes/${plan.id}`}
                  className="font-medium text-brand-pink hover:underline"
                >
                  Gestionar actividades
                </a>

                <button
                  type="button"
                  onClick={() => setBorrarId(plan.id)}
                  className="font-medium text-red-600 hover:underline"
                >
                  Borrar
                </button>
              </div>

              {plan._count.seguimientos > 0 && (
                <p className="mt-3 text-xs text-[#8A8790]">
                  Asignado a {plan._count.seguimientos} seguimiento
                  {plan._count.seguimientos === 1 ? "" : "s"}.
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {modalAbierto && (
        <Modal
          title={editandoId ? "Editar plan" : "Nuevo plan de seguimiento"}
          onClose={pedirCerrarModal}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="admin-label">
                Nombre del plan
              </label>

              <input
                type="text"
                value={form.nombre}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nombre: e.target.value,
                  })
                }
                className="admin-input"
                placeholder="Ej. Seguimiento 30 días"
                required
              />
            </div>

            <div>
              <label className="admin-label">
                Descripción
              </label>

              <textarea
                value={form.descripcion}
                onChange={(e) =>
                  setForm({
                    ...form,
                    descripcion: e.target.value,
                  })
                }
                className="admin-input"
                rows={4}
                placeholder="Descripción interna del plan..."
              />
            </div>

            <div>
              <label className="admin-label">
                Duración
              </label>

              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.duracionDias}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      duracionDias: e.target.value,
                    })
                  }
                  className="admin-input pr-14"
                  required
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8790]">
                  días
                </span>
              </div>
            </div>

            <div>
              <label className="admin-label">
                Estado
              </label>

              <select
                value={form.estado}
                onChange={(e) =>
                  setForm({
                    ...form,
                    estado: e.target.value as
                      | "BORRADOR"
                      | "ACTIVO"
                      | "INACTIVO",
                  })
                }
                className="admin-input"
              >
                <option value="BORRADOR">
                  Borrador
                </option>
                <option value="ACTIVO">
                  Activo
                </option>
                <option value="INACTIVO">
                  Inactivo
                </option>
              </select>

              <p className="mt-1 text-xs text-[#8A8790]">
                Solo los planes activos podrán asignarse posteriormente a clientes.
              </p>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="admin-btn-primary w-full"
            >
              {guardando
                ? "Guardando..."
                : editandoId
                ? "Guardar cambios"
                : "Crear plan"}
            </button>
          </form>
        </Modal>
      )}

      {confirmarSalir && (
        <ConfirmDialog
          title="Cambios sin guardar"
          message="Tienes cambios sin guardar. Si sales ahora se perderán."
          confirmLabel="Descartar cambios"
          onConfirm={cerrarSinGuardar}
          onCancel={() => setConfirmarSalir(false)}
        />
      )}

      {borrarId && (
        <ConfirmDialog
          title="Borrar plan"
          message="¿Seguro que quieres borrar este plan? Si ya fue asignado a un cliente no podrá eliminarse."
          onConfirm={confirmarBorrar}
          onCancel={() => setBorrarId(null)}
        />
      )}
    </div>
  );
}
