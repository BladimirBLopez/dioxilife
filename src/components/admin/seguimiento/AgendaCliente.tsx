"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";

type Actividad = {
  id: string;
  titulo: string;
  descripcion: string | null;
  momento: string | null;
  hora: string | null;
  diaInicio: number;
  diaFin: number | null;
  orden: number;
  activo: boolean;
  cantidadProgresos: number;
};

type Props = {
  seguimientoId: string;
  duracionDias: number;
  estado: string;
  actividades: Actividad[];
};

const vacio = {
  titulo: "",
  descripcion: "",
  momento: "",
  hora: "",
  diaInicio: "1",
  diaFin: "",
  orden: "0",
  activo: true,
};

export default function AgendaCliente({
  seguimientoId,
  duracionDias,
  estado,
  actividades,
}: Props) {
  const router = useRouter();

  const bloqueado =
    estado === "COMPLETADO" ||
    estado === "CANCELADO";

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [actividadEditando, setActividadEditando] =
    useState<Actividad | null>(null);

  const [form, setForm] =
    useState(vacio);

  const [procesando, setProcesando] =
    useState(false);

  const [eliminarActividad, setEliminarActividad] =
    useState<Actividad | null>(null);

  function abrirNueva() {
    setActividadEditando(null);
    setForm(vacio);
    setModalAbierto(true);
  }

  function abrirEditar(actividad: Actividad) {
    setActividadEditando(actividad);

    setForm({
      titulo: actividad.titulo,
      descripcion: actividad.descripcion || "",
      momento: actividad.momento || "",
      hora: actividad.hora || "",
      diaInicio: String(actividad.diaInicio),
      diaFin:
        actividad.diaFin === null
          ? ""
          : String(actividad.diaFin),
      orden: String(actividad.orden),
      activo: actividad.activo,
    });

    setModalAbierto(true);
  }

  async function guardar() {
    if (procesando) {
      return;
    }

    const titulo =
      form.titulo.trim();

    if (!titulo) {
      toast.error("El título es obligatorio");
      return;
    }

    setProcesando(true);

    const toastId =
      toast.loading(
        actividadEditando
          ? "Guardando cambios..."
          : "Agregando actividad..."
      );

    try {
      const url =
        actividadEditando
          ? `/api/admin/seguimiento/clientes/${seguimientoId}/actividades/${actividadEditando.id}`
          : `/api/admin/seguimiento/clientes/${seguimientoId}/actividades`;

      const res = await fetch(url, {
        method:
          actividadEditando
            ? "PUT"
            : "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          titulo,
          descripcion:
            form.descripcion.trim() || null,
          momento:
            form.momento.trim() || null,
          hora:
            form.hora.trim() || null,
          diaInicio:
            Number(form.diaInicio),
          diaFin:
            form.diaFin
              ? Number(form.diaFin)
              : null,
          orden:
            Number(form.orden || 0),
          activo:
            form.activo,
        }),
      });

      const data =
        await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(
          actividadEditando
            ? "No se pudo actualizar la actividad"
            : "No se pudo agregar la actividad",
          {
            id: toastId,
            description:
              data?.error ||
              "Inténtalo nuevamente.",
          }
        );

        return;
      }

      toast.success(
        actividadEditando
          ? "Actividad actualizada"
          : "Actividad agregada",
        {
          id: toastId,
        }
      );

      setModalAbierto(false);
      setActividadEditando(null);
      setForm(vacio);

      router.refresh();

    } catch {
      toast.error(
        "No se pudo conectar con el servidor",
        {
          id: toastId,
        }
      );

    } finally {
      setProcesando(false);
    }
  }

  async function cambiarEstado(
    actividad: Actividad
  ) {
    if (procesando) {
      return;
    }

    setProcesando(true);

    const toastId =
      toast.loading(
        actividad.activo
          ? "Desactivando actividad..."
          : "Activando actividad..."
      );

    try {
      const res = await fetch(
        `/api/admin/seguimiento/clientes/${seguimientoId}/actividades/${actividad.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            titulo:
              actividad.titulo,
            descripcion:
              actividad.descripcion,
            momento:
              actividad.momento,
            hora:
              actividad.hora,
            diaInicio:
              actividad.diaInicio,
            diaFin:
              actividad.diaFin,
            orden:
              actividad.orden,
            activo:
              !actividad.activo,
          }),
        }
      );

      const data =
        await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(
          "No se pudo cambiar el estado",
          {
            id: toastId,
            description:
              data?.error ||
              "Inténtalo nuevamente.",
          }
        );

        return;
      }

      toast.success(
        actividad.activo
          ? "Actividad desactivada"
          : "Actividad activada",
        {
          id: toastId,
        }
      );

      router.refresh();

    } catch {
      toast.error(
        "No se pudo conectar con el servidor",
        {
          id: toastId,
        }
      );

    } finally {
      setProcesando(false);
    }
  }

  async function confirmarEliminar() {
    if (
      !eliminarActividad ||
      procesando
    ) {
      return;
    }

    setProcesando(true);

    const toastId =
      toast.loading(
        "Eliminando actividad..."
      );

    try {
      const res = await fetch(
        `/api/admin/seguimiento/clientes/${seguimientoId}/actividades/${eliminarActividad.id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(
          "No se pudo eliminar la actividad",
          {
            id: toastId,
            description:
              data?.error ||
              "Inténtalo nuevamente.",
          }
        );

        return;
      }

      toast.success(
        "Actividad eliminada",
        {
          id: toastId,
        }
      );

      setEliminarActividad(null);
      router.refresh();

    } catch {
      toast.error(
        "No se pudo conectar con el servidor",
        {
          id: toastId,
        }
      );

    } finally {
      setProcesando(false);
    }
  }

  return (
    <>

      <div className="rounded-xl bg-white shadow">

        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-lg font-semibold text-gray-900">
              Agenda individual
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Estas actividades pertenecen exclusivamente a este cliente.
            </p>

          </div>

          {!bloqueado && (
            <button
              type="button"
              onClick={abrirNueva}
              className="admin-btn-primary"
            >
              Nueva actividad
            </button>
          )}

        </div>


        {bloqueado && (
          <div className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-800">
            Este seguimiento está finalizado y su agenda ya no puede modificarse.
          </div>
        )}


        {actividades.length === 0 ? (

          <div className="p-6 text-sm text-gray-500">
            Esta agenda no tiene actividades.
          </div>

        ) : (

          <div className="divide-y">

            {actividades.map(
              (actividad) => (

                <div
                  key={actividad.id}
                  className="p-5"
                >

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          Día {actividad.diaInicio}
                          {actividad.diaFin &&
                          actividad.diaFin !==
                            actividad.diaInicio
                            ? ` al ${actividad.diaFin}`
                            : ""}
                        </span>

                        {actividad.hora && (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {actividad.hora}
                          </span>
                        )}

                        {actividad.momento && (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {actividad.momento}
                          </span>
                        )}

                        {!actividad.activo && (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                            Inactiva
                          </span>
                        )}

                      </div>


                      <h3 className="mt-3 font-semibold text-gray-900">
                        {actividad.titulo}
                      </h3>


                      {actividad.descripcion && (
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                          {actividad.descripcion}
                        </p>
                      )}


                      <p className="mt-2 text-xs text-gray-400">
                        Orden: {actividad.orden} ·{" "}
                        {actividad.cantidadProgresos} progreso
                        {actividad.cantidadProgresos === 1
                          ? ""
                          : "s"}
                      </p>

                    </div>


                    {!bloqueado && (

                      <div className="flex shrink-0 flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            abrirEditar(
                              actividad
                            )
                          }
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          disabled={procesando}
                          onClick={() =>
                            void cambiarEstado(
                              actividad
                            )
                          }
                          className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                        >
                          {actividad.activo
                            ? "Desactivar"
                            : "Activar"}
                        </button>

                        {actividad.cantidadProgresos === 0 && (
                          <button
                            type="button"
                            disabled={procesando}
                            onClick={() =>
                              setEliminarActividad(
                                actividad
                              )
                            }
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                          >
                            Eliminar
                          </button>
                        )}

                      </div>

                    )}

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>


      {modalAbierto && (

        <Modal
          title={
            actividadEditando
              ? "Editar actividad"
              : "Nueva actividad"
          }
          onClose={() => {
            if (!procesando) {
              setModalAbierto(false);
            }
          }}
        >

          <div className="space-y-4">

            <div>
              <label className="admin-label">
                Título
              </label>

              <input
                value={form.titulo}
                onChange={(e) =>
                  setForm({
                    ...form,
                    titulo:
                      e.target.value,
                  })
                }
                maxLength={200}
                className="admin-input"
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
                    descripcion:
                      e.target.value,
                  })
                }
                rows={3}
                maxLength={1500}
                className="admin-input"
              />
            </div>


            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="admin-label">
                  Día inicial
                </label>

                <input
                  type="number"
                  min={1}
                  max={duracionDias}
                  value={form.diaInicio}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      diaInicio:
                        e.target.value,
                    })
                  }
                  className="admin-input"
                />
              </div>


              <div>
                <label className="admin-label">
                  Día final
                </label>

                <input
                  type="number"
                  min={1}
                  max={duracionDias}
                  value={form.diaFin}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      diaFin:
                        e.target.value,
                    })
                  }
                  className="admin-input"
                  placeholder="Opcional"
                />
              </div>

            </div>


            <div className="grid grid-cols-2 gap-3">

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
                      hora:
                        e.target.value,
                    })
                  }
                  className="admin-input"
                />
              </div>


              <div>
                <label className="admin-label">
                  Momento
                </label>

                <input
                  value={form.momento}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      momento:
                        e.target.value,
                    })
                  }
                  maxLength={60}
                  className="admin-input"
                  placeholder="Ej. Mañana"
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
                    orden:
                      e.target.value,
                  })
                }
                className="admin-input"
              />
            </div>


            {actividadEditando && (
              <label className="flex items-center gap-2 text-sm text-gray-700">

                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      activo:
                        e.target.checked,
                    })
                  }
                />

                Actividad activa

              </label>
            )}


            <div className="flex justify-end gap-2 pt-2">

              <button
                type="button"
                disabled={procesando}
                onClick={() =>
                  setModalAbierto(false)
                }
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={procesando}
                onClick={() =>
                  void guardar()
                }
                className="admin-btn-primary disabled:opacity-60"
              >
                {procesando
                  ? "Guardando..."
                  : "Guardar"}
              </button>

            </div>

          </div>

        </Modal>

      )}


      {eliminarActividad && (

        <ConfirmDialog
          title="Eliminar actividad"
          message={`¿Deseas eliminar "${eliminarActividad.titulo}" de esta agenda individual?`}
          confirmLabel="Eliminar"
          onCancel={() =>
            setEliminarActividad(null)
          }
          onConfirm={() =>
            void confirmarEliminar()
          }
        />

      )}

    </>
  );
}
