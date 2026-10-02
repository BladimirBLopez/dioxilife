"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Modal from "@/components/Modal";
import SelectorHora from "@/components/admin/seguimiento/SelectorHora";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  aplicaEnDia,
  describirDias,
  horaDeAviso,
} from "@/lib/seguimiento-agenda";

type RecordatorioActividad =
  | "NINGUNO"
  | "A_LA_HORA"
  | "MIN_15_ANTES"
  | "MIN_30_ANTES"
  | "MIN_60_ANTES";

type SeccionActividad =
  | "PRINCIPAL"
  | "ADICIONAL";

type Actividad = {
  id: string;
  tipo: "TAREA" | "INFORMACION" | "CONTROL";
  seccion: SeccionActividad;
  recordatorio: RecordatorioActividad;
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
  diaActual: number | null;
  actividades: Actividad[];
};

const vacio = {
  tipo: "TAREA" as "TAREA" | "INFORMACION" | "CONTROL",
  seccion: "PRINCIPAL" as SeccionActividad,
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

export default function AgendaCliente({
  seguimientoId,
  duracionDias,
  estado,
  diaActual,
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

  const [quitarActividad, setQuitarActividad] =
    useState<Actividad | null>(null);

  function abrirNueva() {
    setActividadEditando(null);
    setForm(vacio);
    setModalAbierto(true);
  }

  function abrirEditar(actividad: Actividad) {
    setActividadEditando(actividad);

    setForm({
      tipo: actividad.tipo,
      seccion: actividad.seccion,
      recordatorio: actividad.recordatorio,
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
          tipo: form.tipo,
          seccion: form.seccion,
          recordatorio: form.recordatorio,
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
            tipo:
              actividad.tipo,

            seccion:
              actividad.seccion,

            recordatorio:
              actividad.recordatorio,

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

  async function confirmarQuitar() {
    if (
      !quitarActividad ||
      procesando
    ) {
      return;
    }

    setProcesando(true);

    const toastId =
      toast.loading(
        "Quitando protocolo..."
      );

    try {
      const res = await fetch(
        `/api/admin/seguimiento/clientes/${seguimientoId}/actividades/${quitarActividad.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            quitar: true,
          }),
        }
      );

      const data =
        await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(
          "No se pudo quitar el protocolo",
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
        diaActual !== null
          ? `El protocolo deja de aplicarse desde el día ${diaActual}`
          : "Protocolo quitado",
        {
          id: toastId,
        }
      );

      setQuitarActividad(null);
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

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            actividad.tipo === "TAREA"
                              ? "bg-emerald-100 text-emerald-700"
                              : actividad.tipo === "INFORMACION"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {actividad.tipo === "TAREA"
                            ? "Tarea"
                            : actividad.tipo === "INFORMACION"
                            ? "Información"
                            : "Control"}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            actividad.seccion === "ADICIONAL"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {actividad.seccion === "ADICIONAL"
                            ? "Protocolo adicional"
                            : "Protocolo principal"}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            diaActual !== null &&
                            actividad.activo &&
                            aplicaEnDia(
                              actividad,
                              diaActual
                            )
                              ? "bg-violet-600 text-white"
                              : "bg-violet-100 text-violet-700"
                          }`}
                        >
                          {describirDias(
                            actividad,
                            duracionDias,
                            diaActual
                          )}
                        </span>

                        {actividad.hora && (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {actividad.hora}
                          </span>
                        )}

                        {actividad.hora &&
                          (() => {
                            const aviso =
                              horaDeAviso(
                                actividad.hora,
                                actividad.recordatorio
                              );

                            if (!aviso) {
                              return null;
                            }

                            return (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                {aviso.cruzaMedianoche
                                  ? "🔔 Aviso la noche anterior"
                                  : `🔔 Aviso ${aviso.texto}`}
                              </span>
                            );
                          })()}

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

                        {actividad.seccion === "ADICIONAL" ? (
                          actividad.activo &&
                          (
                            diaActual === null ||
                            aplicaEnDia(
                              actividad,
                              diaActual
                            )
                          ) && (
                            <button
                              type="button"
                              disabled={procesando}
                              onClick={() =>
                                setQuitarActividad(
                                  actividad
                                )
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                            >
                              {diaActual !== null
                                ? "Quitar desde hoy"
                                : "Quitar protocolo"}
                            </button>
                          )
                        ) : (
                          <>
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
                          </>
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
              ? actividadEditando.seccion === "ADICIONAL"
                ? "Editar protocolo adicional"
                : "Editar actividad"
              : form.seccion === "ADICIONAL"
              ? "Nuevo protocolo adicional"
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
                Sección
              </label>

              <select
                value={form.seccion}
                disabled={Boolean(
                  actividadEditando
                )}
                onChange={(e) => {
                  const nuevaSeccion =
                    e.target.value as SeccionActividad;

                  setForm({
                    ...form,

                    seccion:
                      nuevaSeccion,

                    tipo:
                      nuevaSeccion === "ADICIONAL"
                        ? "TAREA"
                        : form.tipo,

                    diaInicio:
                      nuevaSeccion === "ADICIONAL" &&
                      !actividadEditando
                        ? String(
                            diaActual ?? 1
                          )
                        : form.diaInicio,
                  });
                }}
                className="admin-input disabled:bg-gray-100"
              >
                <option value="PRINCIPAL">
                  Protocolo principal
                </option>

                <option value="ADICIONAL">
                  Protocolo adicional
                </option>
              </select>

              <p className="mt-1 text-xs text-gray-500">
                {actividadEditando
                  ? "La sección no se cambia después de crear la actividad."
                  : form.seccion === "ADICIONAL"
                  ? "El protocolo adicional se podrá registrar como Realizado o Pendiente y contará para la calificación."
                  : "Actividad del protocolo principal del cliente."}
              </p>
            </div>


            <div>
              <label className="admin-label">
                Tipo de actividad
              </label>

              <select
                value={form.tipo}
                disabled={
                  form.seccion ===
                  "ADICIONAL"
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    tipo: e.target.value as
                      | "TAREA"
                      | "INFORMACION"
                      | "CONTROL",
                  })
                }
                className="admin-input disabled:bg-gray-100"
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

              <p className="mt-1 text-xs text-gray-500">
                {form.seccion === "ADICIONAL"
                  ? "Los protocolos adicionales se registran como Realizado o Pendiente y cuentan para la calificación del día."
                  : form.tipo === "TAREA"
                  ? "El cliente podrá marcarla como realizada."
                  : form.tipo === "INFORMACION"
                  ? "Solo se mostrará como información."
                  : "Permitirá registrar un dato en una siguiente etapa."}
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
                maxLength={5000}
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
                  disabled={
                    Boolean(
                      actividadEditando &&
                      actividadEditando.seccion ===
                        "ADICIONAL" &&
                      diaActual !== null &&
                      diaActual >
                        actividadEditando.diaInicio
                    )
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      diaInicio:
                        e.target.value,
                    })
                  }
                  className="admin-input disabled:bg-gray-100"
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


            {actividadEditando &&
              actividadEditando.seccion === "ADICIONAL" &&
              diaActual !== null &&
              diaActual >
                actividadEditando.diaInicio && (
                <div className="rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-sm text-purple-800">
                  Este cambio se aplicará desde el día{" "}
                  <strong>
                    {diaActual}
                  </strong>
                  . Los días anteriores conservarán la hora y las indicaciones que tenían.
                </div>
              )}


            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="admin-label">
                  Hora
                </label>

                <SelectorHora
                  value={form.hora}
                  onChange={(hora) =>
                    setForm({
                      ...form,
                      hora,
                    })
                  }
                />
              </div>


              <div>
                <label className="admin-label">
                  Momento
                </label>

                <select
                  value={form.momento}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      momento:
                        e.target.value,
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


            {actividadEditando &&
              form.seccion === "PRINCIPAL" && (
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


      {quitarActividad && (

        <ConfirmDialog
          title="Quitar protocolo adicional"
          message={
            diaActual !== null
              ? `¿Deseas quitar "${quitarActividad.titulo}" desde el día ${diaActual}? Los días anteriores quedarán guardados.`
              : `¿Deseas quitar "${quitarActividad.titulo}" del seguimiento?`
          }
          confirmLabel="Quitar"
          onCancel={() =>
            setQuitarActividad(null)
          }
          onConfirm={() =>
            void confirmarQuitar()
          }
        />

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
