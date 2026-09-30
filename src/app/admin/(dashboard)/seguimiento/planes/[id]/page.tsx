"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import AgregarDesdeBiblioteca from "@/components/admin/seguimiento/AgregarDesdeBiblioteca";

type TipoActividad =
  | "TAREA"
  | "INFORMACION"
  | "CONTROL";

type RecordatorioActividad =
  | "NINGUNO"
  | "A_LA_HORA"
  | "MIN_15_ANTES"
  | "MIN_30_ANTES"
  | "MIN_60_ANTES";

type Actividad = {
  id: string;
  tipo: TipoActividad;
  recordatorio: RecordatorioActividad;
  titulo: string;
  descripcion: string | null;
  momento: string | null;
  hora: string | null;
  diaInicio: number;
  diaFin: number | null;
  orden: number;
  activo: boolean;
};

type Plan = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracionDias: number;
  estado: "BORRADOR" | "ACTIVO" | "INACTIVO";
  actividades: Actividad[];
  _count: {
    seguimientos: number;
  };
};

const vacio = {
  tipo: "TAREA" as TipoActividad,
  recordatorio: "NINGUNO" as RecordatorioActividad,
  titulo: "",
  descripcion: "",
  momento: "",
  hora: "",
  diaInicio: "1",
  diaFin: "",
  orden: "0",
  activo: true,
};

export default function PlanActividadesPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [plan, setPlan] = useState<Plan | null>(null);
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

    const res = await fetch(
      `/api/admin/seguimiento/planes/${id}/actividades`
    );

    if (res.ok) {
      setPlan(await res.json());
    } else {
      setPlan(null);
    }

    setCargando(false);
  }

  useEffect(() => {
    if (id) {
      cargar();
    }
  }, [id]);

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

  function abrirEditar(a: Actividad) {
    const datos = {
      tipo: a.tipo,
      recordatorio: a.recordatorio,
      titulo: a.titulo,
      descripcion: a.descripcion || "",
      momento: a.momento || "",
      hora: a.hora || "",
      diaInicio: String(a.diaInicio),
      diaFin: a.diaFin ? String(a.diaFin) : "",
      orden: String(a.orden),
      activo: a.activo,
    };

    setEditandoId(a.id);
    setForm(datos);
    setFormInicial(datos);
    setModalAbierto(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!plan) return;

    const inicio = Number(form.diaInicio);
    const fin = form.diaFin
      ? Number(form.diaFin)
      : null;

    if (!form.titulo.trim()) {
      alert("El título es obligatorio");
      return;
    }

    if (
      !Number.isInteger(inicio) ||
      inicio < 1 ||
      inicio > plan.duracionDias
    ) {
      alert(
        `El día inicial debe estar entre 1 y ${plan.duracionDias}`
      );
      return;
    }

    if (
      fin !== null &&
      (
        !Number.isInteger(fin) ||
        fin < inicio ||
        fin > plan.duracionDias
      )
    ) {
      alert(
        "El día final debe ser igual o mayor al día inicial y no superar la duración de la plantilla"
      );
      return;
    }

    setGuardando(true);

    const body = {
      tipo: form.tipo,
      recordatorio: form.recordatorio,
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      momento: form.momento.trim() || null,
      hora: form.hora.trim() || null,
      diaInicio: inicio,
      diaFin: fin,
      orden: Number(form.orden || 0),
      activo: form.activo,
    };

    try {
      const res = editandoId
        ? await fetch(
            `/api/admin/seguimiento/planes/${id}/actividades/${editandoId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(body),
            }
          )
        : await fetch(
            `/api/admin/seguimiento/planes/${id}/actividades`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(body),
            }
          );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(
          data?.error ||
            "No se pudo guardar la actividad"
        );
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
      `/api/admin/seguimiento/planes/${id}/actividades/${borrarId}`,
      {
        method: "DELETE",
      }
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(
        data?.error ||
          "No se pudo eliminar la actividad"
      );
      setBorrarId(null);
      return;
    }

    setBorrarId(null);
    await cargar();
  }

  if (cargando) {
    return (
      <p className="text-sm text-[#8A8790]">
        Cargando plantilla...
      </p>
    );
  }

  if (!plan) {
    return (
      <div className="admin-card p-6">
        <p className="font-semibold text-[#1F1B24]">
          Plantilla no encontrada
        </p>

        <Link
          href="/admin/seguimiento/planes"
          className="mt-3 inline-block text-sm font-medium text-brand-blue hover:underline"
        >
          Volver a plantillas
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <Link
          href="/admin/seguimiento/planes"
          className="text-sm font-medium text-brand-blue hover:underline"
        >
          ← Volver a plantillas
        </Link>
      </div>

      <div className="admin-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-[#1F1B24]">
                {plan.nombre}
              </h1>

              <span className="rounded-full bg-[#F8F6FF] px-2.5 py-1 text-[10px] font-bold text-brand-pink">
                {plan.estado}
              </span>
            </div>

            {plan.descripcion && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6870]">
                {plan.descripcion}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <span className="text-[#6B6870]">
                Duración:{" "}
                <strong className="text-[#1F1B24]">
                  {plan.duracionDias} días
                </strong>
              </span>

              <span className="text-[#6B6870]">
                Seguimientos:{" "}
                <strong className="text-[#1F1B24]">
                  {plan._count.seguimientos}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <AgregarDesdeBiblioteca
              planId={id}
              onAgregadas={cargar}
            />

            <button
              type="button"
              onClick={abrirNueva}
              className="rounded-xl border border-brand-pink bg-white px-4 py-2.5 text-sm font-semibold text-brand-pink transition hover:bg-brand-pink/5"
            >
              + Crear actividad manual
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-[#1F1B24]">
            Actividades
          </h2>

          <span className="text-xs text-[#8A8790]">
            {plan.actividades.length} actividad
            {plan.actividades.length === 1
              ? ""
              : "es"}
          </span>
        </div>

        {plan.actividades.length === 0 ? (
          <div className="admin-card p-8 text-center">
            <p className="font-semibold text-[#1F1B24]">
              Esta plantilla todavía no tiene actividades
            </p>

            <p className="mt-1 text-sm text-[#8A8790]">
              Agrega la primera actividad para empezar a estructurar el calendario.
            </p>

            <button
              type="button"
              onClick={abrirNueva}
              className="admin-btn-primary mt-4"
            >
              Agregar primera actividad
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {plan.actividades.map((a) => (
              <article
                key={a.id}
                className={`admin-card p-4 ${
                  a.activo
                    ? ""
                    : "opacity-60"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                          a.tipo === "TAREA"
                            ? "bg-emerald-50 text-emerald-700"
                            : a.tipo === "INFORMACION"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {a.tipo === "TAREA"
                          ? "Tarea"
                          : a.tipo === "INFORMACION"
                          ? "Información"
                          : "Control"}
                      </span>

                      {a.hora && (
                        <span className="rounded-lg bg-[#F8F6FF] px-2 py-1 text-xs font-semibold text-brand-pink">
                          {a.hora}
                        </span>
                      )}

                      {a.momento && (
                        <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                          {a.momento}
                        </span>
                      )}

                      {!a.activo && (
                        <span className="rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
                          INACTIVA
                        </span>
                      )}
                    </div>

                    <p className="mt-2 font-semibold text-[#1F1B24]">
                      {a.titulo}
                    </p>

                    <p className="mt-1 text-xs font-medium text-[#8A8790]">
                      Día {a.diaInicio}
                      {a.diaFin
                        ? ` al ${a.diaFin}`
                        : ""}
                    </p>

                    {a.descripcion && (
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6870]">
                        {a.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-4 text-sm">
                    <button
                      type="button"
                      onClick={() => abrirEditar(a)}
                      className="font-medium text-brand-blue hover:underline"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => setBorrarId(a.id)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {modalAbierto && (
        <Modal
          title={
            editandoId
              ? "Editar actividad"
              : "Nueva actividad"
          }
          onClose={pedirCerrarModal}
        >
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="admin-label">
                Tipo de actividad
              </label>

              <select
                value={form.tipo}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tipo: e.target.value as TipoActividad,
                  })
                }
                className="admin-input"
              >
                <option value="TAREA">
                  Tarea
                </option>

                <option value="INFORMACION">
                  Información
                </option>

                <option value="CONTROL">
                  Control
                </option>
              </select>

              <p className="mt-1 text-xs text-[#8A8790]">
                {form.tipo === "TAREA"
                  ? "El cliente podrá marcar esta actividad como realizada."
                  : form.tipo === "INFORMACION"
                  ? "Se mostrará como información y no contará como tarea pendiente."
                  : "Se usará para registrar un dato o control del cliente."}
              </p>
            </div>

            <div>
              <label className="admin-label">
                Recordatorio
              </label>

              <select
                value={form.recordatorio}
                onChange={(e) =>
                  setForm({
                    ...form,
                    recordatorio:
                      e.target.value as RecordatorioActividad,
                  })
                }
                className="admin-input"
              >
                <option value="NINGUNO">
                  Sin recordatorio
                </option>

                <option value="A_LA_HORA">
                  A la hora indicada
                </option>

                <option value="MIN_15_ANTES">
                  15 minutos antes
                </option>

                <option value="MIN_30_ANTES">
                  30 minutos antes
                </option>

                <option value="MIN_60_ANTES">
                  1 hora antes
                </option>
              </select>

              {form.recordatorio !== "NINGUNO" &&
                !form.hora && (
                  <p className="mt-1 text-xs text-amber-600">
                    Define una hora para poder usar este recordatorio.
                  </p>
                )}
            </div>

            <div>
              <label className="admin-label">
                Título
              </label>

              <input
                type="text"
                value={form.titulo}
                onChange={(e) =>
                  setForm({
                    ...form,
                    titulo: e.target.value,
                  })
                }
                className="admin-input"
                placeholder="Ej. Registro de actividad de la mañana"
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
                placeholder="Información que verá el cliente..."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="admin-label">
                  Momento
                </label>

                <select
                  value={form.momento}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      momento: e.target.value,
                    })
                  }
                  className="admin-input"
                >
                  <option value="">
                    Sin especificar
                  </option>
                  <option value="Ayunas">
                    Ayunas
                  </option>
                  <option value="Desayuno">
                    Desayuno
                  </option>
                  <option value="Media mañana">
                    Media mañana
                  </option>
                  <option value="Almuerzo">
                    Almuerzo
                  </option>
                  <option value="Tarde">
                    Tarde
                  </option>
                  <option value="Cena">
                    Cena
                  </option>
                  <option value="Antes de dormir">
                    Antes de dormir
                  </option>
                  <option value="Noche">
                    Noche
                  </option>
                </select>
              </div>

              <div>
                <label className="admin-label">
                  Hora
                </label>

                <input
                  type="time"
                  value={form.hora}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      hora: e.target.value,
                    })
                  }
                  className="admin-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="admin-label">
                  Día inicial
                </label>

                <input
                  type="number"
                  min={1}
                  max={plan.duracionDias}
                  value={form.diaInicio}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      diaInicio: e.target.value,
                    })
                  }
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label className="admin-label">
                  Día final
                </label>

                <input
                  type="number"
                  min={1}
                  max={plan.duracionDias}
                  value={form.diaFin}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      diaFin: e.target.value,
                    })
                  }
                  className="admin-input"
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div>
              <label className="admin-label">
                Orden
              </label>

              <input
                type="number"
                value={form.orden}
                onChange={(e) =>
                  setForm({
                    ...form,
                    orden: e.target.value,
                  })
                }
                className="admin-input"
              />
            </div>

            {editandoId && (
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      activo: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-pink-600"
                />

                <div>
                  <p className="text-sm font-medium text-[#1F1B24]">
                    Actividad activa
                  </p>

                  <p className="text-xs text-[#8A8790]">
                    Si la desactivas, dejará de mostrarse en nuevas vistas del plan.
                  </p>
                </div>
              </label>
            )}

            <button
              type="submit"
              disabled={guardando}
              className="admin-btn-primary w-full"
            >
              {guardando
                ? "Guardando..."
                : editandoId
                ? "Guardar cambios"
                : "Crear actividad"}
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
          onCancel={() =>
            setConfirmarSalir(false)
          }
        />
      )}

      {borrarId && (
        <ConfirmDialog
          title="Borrar actividad"
          message="¿Seguro que quieres borrar esta actividad? Si ya tiene progreso registrado no podrá eliminarse."
          onConfirm={confirmarBorrar}
          onCancel={() =>
            setBorrarId(null)
          }
        />
      )}
    </div>
  );
}
