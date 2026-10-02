"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Modal from "@/components/Modal";

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
};

type Props = {
  seguimientoId: string;
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
  duracionDias,
  actividades,
}: Props) {
  const router = useRouter();

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
          ? `/api/admin/seguimiento/clientes/${seguimientoId}/actividades/${actividadEditando.id}`
          : `/api/admin/seguimiento/clientes/${seguimientoId}/actividades`;

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
          `/api/admin/seguimiento/clientes/${seguimientoId}/actividades/${actividad.id}`,
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
                  Agrega aquí los protocolos personalizados que acompañarán al protocolo principal.
                </p>

              </div>


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


            {actividades.length ===
            0 ? (

              <div className="mt-4 rounded-xl border border-dashed border-purple-200 bg-purple-50/50 p-5 text-center">

                <p className="text-sm font-medium text-purple-900">
                  Sin protocolos adicionales
                </p>

                <p className="mt-1 text-xs leading-5 text-purple-700">
                  No son obligatorios. Puedes agregarlos ahora si este cliente los necesita.
                </p>

              </div>

            ) : (

              <div className="mt-4 space-y-3">

                {actividades.map(
                  (
                    actividad
                  ) => (

                    <div
                      key={
                        actividad.id
                      }
                      className="rounded-xl border border-purple-100 bg-purple-50/40 p-4"
                    >

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            {actividad.hora && (
                              <span className="rounded-lg bg-purple-600 px-2.5 py-1 text-xs font-bold text-white">
                                {
                                  actividad.hora
                                }
                              </span>
                            )}

                            <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-purple-700">
                              Día{" "}
                              {
                                actividad.diaInicio
                              }
                              {actividad.diaFin !==
                              null
                                ? ` al ${actividad.diaFin}`
                                : " en adelante"}
                            </span>

                          </div>


                          <h3 className="mt-2 font-semibold text-gray-900">
                            {
                              actividad.titulo
                            }
                          </h3>


                          {actividad.descripcion && (
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                              {
                                actividad.descripcion
                              }
                            </p>
                          )}


                          <p className="mt-2 text-xs text-gray-500">
                            🔔{" "}
                            {textoRecordatorio(
                              actividad.recordatorio
                            )}
                          </p>

                        </div>


                        <div className="flex shrink-0 gap-2">

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
                            className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 disabled:opacity-50"
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
                            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            Quitar
                          </button>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </div>

      </section>


      {modalAbierto && (

        <Modal
          title={
            actividadEditando
              ? "Editar protocolo adicional"
              : "Agregar protocolo adicional"
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
          maxWidthClassName="max-w-xl"
        >

          <div className="space-y-4">

            <div>

              <label className="admin-label">
                Nombre del protocolo *
              </label>

              <input
                value={
                  form.titulo
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    titulo:
                      e.target
                        .value,
                  })
                }
                className="admin-input"
                placeholder="Ej. Protocolo E limpieza"
                maxLength={200}
              />

            </div>


            <div>

              <label className="admin-label">
                Hora *
              </label>

              <input
                type="time"
                value={
                  form.hora
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    hora:
                      e.target
                        .value,
                  })
                }
                className="admin-input"
              />

            </div>


            <div>

              <label className="admin-label">
                Indicaciones
              </label>

              <textarea
                value={
                  form.descripcion
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    descripcion:
                      e.target
                        .value,
                  })
                }
                className="admin-input min-h-28 resize-y"
                placeholder="Escribe las indicaciones que verá el cliente..."
                maxLength={5000}
              />

            </div>


            <div className="grid grid-cols-2 gap-3">

              <div>

                <label className="admin-label">
                  Desde el día
                </label>

                <input
                  type="number"
                  min={1}
                  max={
                    duracionDias
                  }
                  value={
                    form.diaInicio
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      diaInicio:
                        e.target
                          .value,
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
                  max={
                    duracionDias
                  }
                  value={
                    form.diaFin
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      diaFin:
                        e.target
                          .value,
                    })
                  }
                  className="admin-input"
                  placeholder="Opcional"
                />

              </div>

            </div>


            <p className="-mt-2 text-xs text-gray-500">
              Si dejas el día final vacío, continuará aplicándose hasta que sea retirado o termine el seguimiento.
            </p>


            <div>

              <label className="admin-label">
                Recordatorio
              </label>

              <select
                value={
                  form.recordatorio
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    recordatorio:
                      e.target
                        .value as Recordatorio,
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


            <div className="rounded-xl border border-purple-100 bg-purple-50 p-3 text-xs leading-5 text-purple-800">
              Este protocolo aparecerá separado del protocolo principal. El cliente podrá marcarlo como Realizado o Pendiente y contará para la calificación diaria.
            </div>


            <button
              type="button"
              disabled={
                procesando
              }
              onClick={() =>
                void guardar()
              }
              className="admin-btn-primary w-full disabled:opacity-60"
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
