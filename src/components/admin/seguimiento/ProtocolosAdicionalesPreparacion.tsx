"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Modal from "@/components/Modal";
import SelectorHora from "@/components/admin/seguimiento/SelectorHora";
import IndicacionesActividadPreparacion from "@/components/admin/seguimiento/IndicacionesActividadPreparacion";
import AgregarDesdeBiblioteca from "@/components/admin/seguimiento/AgregarDesdeBiblioteca";

type Recordatorio =
  | "NINGUNO"
  | "A_LA_HORA"
  | "MIN_15_ANTES"
  | "MIN_30_ANTES"
  | "MIN_60_ANTES";

type ActividadAdicional = {
  id: string;
  titulo: string;
  descripcion: string | null;
  hora: string | null;
  diaInicio: number;
  diaFin: number | null;
  orden: number;
  recordatorio: Recordatorio;

  indicaciones: Array<{
    id: string;
    hora: string;
    texto: string;
    orden: number;
  }>;
};

type Props = {
  seguimientoId?: string;
  apiBase?: string;
  bibliotecaPlanId?: string;
  duracionDias: number;
  actividades: ActividadAdicional[];
};

const formularioVacio = {
  titulo: "",
  descripcion: "",
  hora: "",
  diaInicio: "1",
  diaFin: "",
  recordatorio: "NINGUNO" as Recordatorio,
};

function textoRecordatorio(
  valor: Recordatorio
) {
  switch (valor) {
    case "A_LA_HORA":
      return "A la hora";
    case "MIN_15_ANTES":
      return "15 min antes";
    case "MIN_30_ANTES":
      return "30 min antes";
    case "MIN_60_ANTES":
      return "1 hora antes";
    default:
      return "Sin recordatorio";
  }
}

export default function ProtocolosAdicionalesPreparacion({
  seguimientoId,
  apiBase,
  bibliotecaPlanId,
  duracionDias,
  actividades,
}: Props) {
  const router = useRouter();

  const baseApi =
    apiBase ??
    (
      seguimientoId
        ? `/api/admin/seguimiento/clientes/${seguimientoId}`
        : ""
    );

  if (!baseApi) {
    throw new Error(
      "No se definió el recurso del protocolo."
    );
  }

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [
    actividadEditando,
    setActividadEditando,
  ] =
    useState<ActividadAdicional | null>(
      null
    );

  const [form, setForm] =
    useState(formularioVacio);

  const [procesando, setProcesando] =
    useState(false);

  function abrirNuevo() {
    setActividadEditando(null);
    setForm(formularioVacio);
    setModalAbierto(true);
  }

  function abrirEditar(
    actividad: ActividadAdicional
  ) {
    setActividadEditando(
      actividad
    );

    setForm({
      titulo:
        actividad.titulo,

      descripcion:
        actividad.descripcion ||
        "",

      hora:
        actividad.hora ||
        "",

      diaInicio:
        String(
          actividad.diaInicio
        ),

      diaFin:
        actividad.diaFin ===
        null
          ? ""
          : String(
              actividad.diaFin
            ),

      recordatorio:
        actividad.recordatorio,
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
      toast.error(
        "Escribe el nombre del protocolo."
      );
      return;
    }

    if (!form.hora) {
      toast.error(
        "Indica la hora del protocolo."
      );
      return;
    }

    const diaInicio =
      Number(
        form.diaInicio
      );

    const diaFin =
      form.diaFin
        ? Number(
            form.diaFin
          )
        : null;

    if (
      !Number.isInteger(
        diaInicio
      ) ||
      diaInicio < 1 ||
      diaInicio >
        duracionDias
    ) {
      toast.error(
        `El día inicial debe estar entre 1 y ${duracionDias}.`
      );
      return;
    }

    if (
      diaFin !== null &&
      (
        !Number.isInteger(
          diaFin
        ) ||
        diaFin <
          diaInicio ||
        diaFin >
          duracionDias
      )
    ) {
      toast.error(
        "Revisa el día final."
      );
      return;
    }

    setProcesando(true);

    const toastId =
      toast.loading(
        actividadEditando
          ? "Guardando protocolo..."
          : "Agregando protocolo..."
      );

    try {
      const url =
        actividadEditando
          ? `${baseApi}/actividades/${actividadEditando.id}`
          : `${baseApi}/actividades`;

      const res =
        await fetch(
          url,
          {
            method:
              actividadEditando
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                tipo:
                  "TAREA",

                seccion:
                  "ADICIONAL",

                recordatorio:
                  form.recordatorio,

                titulo,

                descripcion:
                  form.descripcion
                    .trim() ||
                  null,

                momento:
                  null,

                hora:
                  form.hora,

                diaInicio,

                diaFin,

                orden:
                  actividadEditando
                    ?.orden ??
                  0,

                activo:
                  true,
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(
            () => null
          );

      if (!res.ok) {
        toast.error(
          actividadEditando
            ? "No se pudo actualizar el protocolo"
            : "No se pudo agregar el protocolo",
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
          ? "Protocolo actualizado"
          : "Protocolo adicional agregado",
        {
          id: toastId,
        }
      );

      setModalAbierto(
        false
      );

      setActividadEditando(
        null
      );

      setForm(
        formularioVacio
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
      setProcesando(
        false
      );
    }
  }

  async function quitar(
    actividad:
      ActividadAdicional
  ) {
    if (
      procesando ||
      !window.confirm(
        `¿Quitar "${actividad.titulo}" del protocolo de este cliente?`
      )
    ) {
      return;
    }

    setProcesando(
      true
    );

    const toastId =
      toast.loading(
        "Quitando protocolo..."
      );

    try {
      const res =
        await fetch(
          `${baseApi}/actividades/${actividad.id}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                quitar:
                  true,
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(
            () => null
          );

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
        "Protocolo quitado",
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
      setProcesando(
        false
      );
    }
  }

  const actividadesOrdenadas =
    [...actividades].sort(
      (a, b) => {
        if (
          a.hora &&
          b.hora
        ) {
          const porHora =
            a.hora.localeCompare(
              b.hora
            );

          if (porHora !== 0) {
            return porHora;
          }
        } else if (a.hora) {
          return -1;
        } else if (b.hora) {
          return 1;
        }

        return (
          a.orden -
          b.orden
        );
      }
    );


  return (
    <>

      <section className="rounded-xl bg-white p-5 shadow">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 font-bold text-purple-700">
            3
          </div>


          <div className="min-w-0 flex-1">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

              <div>

                <h2 className="font-semibold text-gray-900">
                  Protocolos adicionales
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Agrega únicamente los protocolos complementarios que necesita este cliente.
                </p>

              </div>


              <div className="flex flex-wrap gap-2">

                {bibliotecaPlanId && (
                  <AgregarDesdeBiblioteca
                    planId={
                      bibliotecaPlanId
                    }
                    seccion="ADICIONAL"
                    onAgregadas={() => {
                      router.refresh();
                    }}
                  />
                )}

                <button
                  type="button"
                  onClick={
                    abrirNuevo
                  }
                  className="shrink-0 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
                >
                  + Agregar protocolo
                </button>

              </div>

            </div>


            <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">

              <div className="hidden border-b border-gray-200 bg-gray-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500 sm:grid sm:grid-cols-[110px_minmax(0,1fr)_140px] sm:gap-4">

                <div>
                  Hora
                </div>

                <div>
                  Protocolo / instrucciones
                </div>

                <div className="text-right">
                  Acciones
                </div>

              </div>


              {actividadesOrdenadas.length ===
              0 ? (

                <div className="p-7 text-center">

                  <p className="font-semibold text-gray-800">
                    Sin protocolos adicionales
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Esta sección es opcional. Agrégala únicamente cuando el cliente tenga un protocolo complementario.
                  </p>

                  <button
                    type="button"
                    onClick={
                      abrirNuevo
                    }
                    className="mt-4 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100"
                  >
                    + Agregar protocolo adicional
                  </button>

                </div>

              ) : (

                <div className="divide-y divide-gray-200">

                  {actividadesOrdenadas.map(
                    (
                      actividad
                    ) => (

                    <article
                      key={
                        actividad.id
                      }
                      className="bg-white"
                    >

                      <div className="grid gap-4 p-4 sm:grid-cols-[110px_minmax(0,1fr)_140px] sm:p-5">


                        <div>

                          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 sm:hidden">
                            Hora
                          </p>

                          <div className="inline-flex rounded-xl bg-purple-50 px-3 py-2 font-mono text-sm font-bold text-purple-700">
                            {
                              actividad.hora ||
                              "—"
                            }
                          </div>

                        </div>


                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="font-bold text-gray-900">
                              {
                                actividad.titulo
                              }
                            </h3>

                            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-purple-700">
                              Adicional
                            </span>

                          </div>


                          {actividad.descripcion && (

                            <div className="mt-2 rounded-xl bg-gray-50 px-3 py-2.5">

                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                                Instrucciones
                              </p>

                              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                                {
                                  actividad.descripcion
                                }
                              </p>

                            </div>

                          )}


                          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">

                            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
                              Día{" "}
                              {
                                actividad.diaInicio
                              }
                              {actividad.diaFin !==
                              null
                                ? ` al ${actividad.diaFin}`
                                : " en adelante"}
                            </span>


                            {actividad.recordatorio !==
                              "NINGUNO" && (

                              <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                                🔔{" "}
                                {textoRecordatorio(
                                  actividad.recordatorio
                                )}
                              </span>

                            )}

                          </div>


                          <IndicacionesActividadPreparacion
                            seguimientoId={
                              seguimientoId
                            }
                            apiBase={
                              baseApi
                            }
                            actividadId={
                              actividad.id
                            }
                            indicaciones={
                              actividad.indicaciones
                            }
                          />


                          <div className="mt-3 flex flex-wrap gap-2 sm:hidden">

                            <button
                              type="button"
                              disabled={
                                procesando
                              }
                              onClick={() =>
                                abrirEditar(
                                  actividad
                                )
                              }
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              disabled={
                                procesando
                              }
                              onClick={() =>
                                void quitar(
                                  actividad
                                )
                              }
                              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                            >
                              Quitar
                            </button>

                          </div>

                        </div>


                        <div className="hidden sm:block">

                          <div className="flex flex-col items-end gap-2">

                            <button
                              type="button"
                              disabled={
                                procesando
                              }
                              onClick={() =>
                                abrirEditar(
                                  actividad
                                )
                              }
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              disabled={
                                procesando
                              }
                              onClick={() =>
                                void quitar(
                                  actividad
                                )
                              }
                              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Quitar
                            </button>

                          </div>

                        </div>

                      </div>

                    </article>

                    )
                  )}

                </div>

              )}

            </div>

          </div>

        </div>

      </section>


      {modalAbierto && (

        <Modal
          title={
            actividadEditando
              ? "Editar protocolo adicional"
              : "Nuevo protocolo adicional"
          }
          onClose={() => {
            if (
              !procesando
            ) {
              setModalAbierto(
                false
              );
            }
          }}
          maxWidthClassName="max-w-2xl"
        >

          <div className="space-y-5">

            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">

              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-purple-700">
                  1. Qué protocolo vas a agregar
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Dale un nombre claro y explica en qué consiste.
                </p>
              </div>

              <div>
                <label className="admin-label">
                  Nombre del protocolo *
                </label>

                <input
                  value={form.titulo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      titulo: e.target.value,
                    })
                  }
                  className="admin-input"
                  placeholder="Ej. Protocolo adicional"
                  maxLength={200}
                  autoFocus
                />
              </div>

              <div className="mt-4">
                <label className="admin-label">
                  Instrucciones generales
                </label>

                <p className="mb-2 text-xs leading-5 text-gray-500">
                  Después de guardarlo podrás añadir indicaciones independientes, cada una con su propio horario.
                </p>

                <textarea
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      descripcion: e.target.value,
                    })
                  }
                  className="admin-input min-h-28 resize-y"
                  placeholder="Escribe las instrucciones que verá el cliente..."
                  maxLength={5000}
                />

                <p className="mt-1 text-right text-[11px] text-gray-400">
                  {form.descripcion.length}/5000
                </p>
              </div>

            </section>

            <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 sm:p-5">

              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                  2. Cuándo se aplica
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700/80">
                  Define su horario y durante qué días estará vigente.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">

                <div>
                  <label className="admin-label">
                    Hora *
                  </label>

                  <SelectorHora
                    value={form.hora}
                    onChange={(hora) =>
                      setForm({
                        ...form,
                        hora,
                        recordatorio:
                          hora
                            ? form.recordatorio
                            : "NINGUNO",
                      })
                    }
                    permitirVacio={false}
                  />
                </div>

                <div>
                  <label className="admin-label">
                    Desde el día
                  </label>

                  <input
                    type="number"
                    min={1}
                    max={duracionDias}
                    value={form.diaInicio}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        diaInicio: e.target.value,
                      })
                    }
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="admin-label">
                    Hasta el día
                  </label>

                  <input
                    type="number"
                    min={1}
                    max={duracionDias}
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

              <p className="mt-2 text-xs leading-5 text-gray-500">
                Si no defines un día final, seguirá activo hasta terminar el seguimiento.
              </p>

              <div className="mt-4">
                <label className="admin-label">
                  Avisar al cliente
                </label>

                <select
                  value={form.recordatorio}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      recordatorio:
                        e.target.value as Recordatorio,
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
              </div>

            </section>

            <div className="rounded-xl border border-purple-100 bg-purple-50 px-4 py-3">

              <p className="text-xs leading-5 text-purple-800">
                Después de guardar podrás agregar todas las indicaciones con horario que necesite este protocolo.
              </p>

            </div>


            <button
              type="button"
              disabled={
                procesando
              }
              onClick={() =>
                void guardar()
              }
              className="admin-btn-primary w-full py-3 disabled:opacity-60"
            >
              {procesando
                ? "Guardando..."
                : actividadEditando
                ? "Guardar cambios"
                : "Agregar protocolo"}
            </button>

          </div>

        </Modal>

      )}


    </>
  );
}
