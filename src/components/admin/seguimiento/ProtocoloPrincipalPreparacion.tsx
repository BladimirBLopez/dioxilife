"use client";

import {
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import Modal from "@/components/Modal";

import SelectorHora from "@/components/admin/seguimiento/SelectorHora";
import IndicacionesActividadPreparacion from "@/components/admin/seguimiento/IndicacionesActividadPreparacion";

type Recordatorio =
  | "NINGUNO"
  | "A_LA_HORA"
  | "MIN_15_ANTES"
  | "MIN_30_ANTES"
  | "MIN_60_ANTES";

type Actividad = {
  id: string;
  tipo:
    | "TAREA"
    | "INFORMACION"
    | "CONTROL";
  recordatorio: Recordatorio;
  titulo: string;
  descripcion: string | null;
  momento: string | null;
  hora: string | null;
  diaInicio: number;
  diaFin: number | null;
  orden: number;

  indicaciones: Array<{
    id: string;
    hora: string;
    texto: string;
    orden: number;
  }>;
};

type Props = {
  seguimientoId: string;
  duracionDias: number;
  actividades: Actividad[];
};

const formVacio = {
  tipo:
    "TAREA" as
      | "TAREA"
      | "INFORMACION"
      | "CONTROL",

  recordatorio:
    "NINGUNO" as Recordatorio,

  titulo: "",
  descripcion: "",
  momento: "",
  hora: "",
  diaInicio: "1",
  diaFin: "",
  orden: "0",
};

const serieVacia = {
  nombreBase: "",
  descripcion: "",
  horaInicio: "09:00",
  intervalo: "30",
  cantidad: "7",
  diaInicio: "1",
  diaFin: "",
  recordatorio:
    "NINGUNO" as Recordatorio,
};

function sumarMinutos(
  hora: string,
  minutos: number
) {
  const match =
    /^([01]\d|2[0-3]):([0-5]\d)$/.exec(
      hora
    );

  if (!match) {
    return null;
  }

  const total =
    Number(match[1]) *
      60 +
    Number(match[2]) +
    minutos;

  if (
    total < 0 ||
    total > 1439
  ) {
    return null;
  }

  return `${String(
    Math.floor(
      total / 60
    )
  ).padStart(
    2,
    "0"
  )}:${String(
    total % 60
  ).padStart(
    2,
    "0"
  )}`;
}

export default function ProtocoloPrincipalPreparacion({
  seguimientoId,
  duracionDias,
  actividades,
}: Props) {
  const router =
    useRouter();

  const [
    modalActividad,
    setModalActividad,
  ] =
    useState(false);

  const [
    modalSerie,
    setModalSerie,
  ] =
    useState(false);

  const [
    editando,
    setEditando,
  ] =
    useState<Actividad | null>(
      null
    );

  const [form, setForm] =
    useState(formVacio);

  const [serie, setSerie] =
    useState(serieVacia);

  const [
    procesando,
    setProcesando,
  ] =
    useState(false);


  function abrirNueva() {
    setEditando(null);

    setForm({
      ...formVacio,
      orden:
        String(
          actividades.length
        ),
    });

    setModalActividad(
      true
    );
  }


  function abrirEditar(
    actividad: Actividad
  ) {
    setEditando(
      actividad
    );

    setForm({
      tipo:
        actividad.tipo,

      recordatorio:
        actividad.recordatorio,

      titulo:
        actividad.titulo,

      descripcion:
        actividad.descripcion ||
        "",

      momento:
        actividad.momento ||
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

      orden:
        String(
          actividad.orden
        ),
    });

    setModalActividad(
      true
    );
  }


  async function guardarActividad() {
    if (procesando) {
      return;
    }

    const titulo =
      form.titulo.trim();

    if (!titulo) {
      toast.error(
        "El título es obligatorio."
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

    setProcesando(
      true
    );

    const toastId =
      toast.loading(
        editando
          ? "Guardando actividad..."
          : "Agregando actividad..."
      );

    try {
      const url =
        editando
          ? `/api/admin/seguimiento/clientes/${seguimientoId}/actividades/${editando.id}`
          : `/api/admin/seguimiento/clientes/${seguimientoId}/actividades`;

      const res =
        await fetch(
          url,
          {
            method:
              editando
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                tipo:
                  form.tipo,

                seccion:
                  "PRINCIPAL",

                recordatorio:
                  form.recordatorio,

                titulo,

                descripcion:
                  form.descripcion
                    .trim() ||
                  null,

                momento:
                  form.momento
                    .trim() ||
                  null,

                hora:
                  form.hora ||
                  null,

                diaInicio,

                diaFin,

                orden:
                  Number(
                    form.orden ||
                      0
                  ),

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
        throw new Error(
          data?.error ||
            "No se pudo guardar."
        );
      }

      toast.success(
        editando
          ? "Actividad actualizada"
          : "Actividad agregada",
        {
          id: toastId,
        }
      );

      setModalActividad(
        false
      );

      setEditando(
        null
      );

      router.refresh();

    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar.",
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


  async function cambiarHora(
    actividad: Actividad,
    hora: string
  ) {
    if (procesando) {
      return;
    }

    setProcesando(
      true
    );

    const toastId =
      toast.loading(
        "Actualizando horario..."
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
                tipo:
                  actividad.tipo,

                seccion:
                  "PRINCIPAL",

                recordatorio:
                  actividad.recordatorio,

                titulo:
                  actividad.titulo,

                descripcion:
                  actividad.descripcion,

                momento:
                  actividad.momento,

                hora:
                  hora ||
                  null,

                diaInicio:
                  actividad.diaInicio,

                diaFin:
                  actividad.diaFin,

                orden:
                  actividad.orden,

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
        throw new Error(
          data?.error ||
            "No se pudo actualizar la hora."
        );
      }

      toast.success(
        "Horario actualizado",
        {
          id: toastId,
        }
      );

      router.refresh();

    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error actualizando horario",
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


  async function eliminar(
    actividad: Actividad
  ) {
    if (
      procesando ||
      !window.confirm(
        `¿Eliminar "${actividad.titulo}" del protocolo principal?`
      )
    ) {
      return;
    }

    setProcesando(
      true
    );

    const toastId =
      toast.loading(
        "Eliminando actividad..."
      );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/actividades/${actividad.id}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await res
          .json()
          .catch(
            () => null
          );

      if (!res.ok) {
        throw new Error(
          data?.error ||
            "No se pudo eliminar."
        );
      }

      toast.success(
        "Actividad eliminada",
        {
          id: toastId,
        }
      );

      router.refresh();

    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar.",
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


  const vistaSerie =
    useMemo(() => {
      const cantidad =
        Number(
          serie.cantidad
        );

      const intervalo =
        Number(
          serie.intervalo
        );

      if (
        !Number.isInteger(
          cantidad
        ) ||
        cantidad < 1 ||
        !Number.isFinite(
          intervalo
        )
      ) {
        return [];
      }

      return Array.from(
        {
          length:
            Math.min(
              cantidad,
              48
            ),
        },
        (_, indice) => ({
          titulo:
            `${serie.nombreBase || "Actividad"} ${indice + 1}`,

          hora:
            sumarMinutos(
              serie.horaInicio,
              intervalo *
                indice
            ),
        })
      );
    }, [
      serie,
    ]);


  async function generarSerie() {
    if (procesando) {
      return;
    }

    if (
      !serie.nombreBase
        .trim()
    ) {
      toast.error(
        "Escribe el nombre base de la serie."
      );
      return;
    }

    if (
      vistaSerie.some(
        (item) =>
          !item.hora
      )
    ) {
      toast.error(
        "La serie supera las 23:59. Ajusta el horario, intervalo o cantidad."
      );
      return;
    }

    setProcesando(
      true
    );

    const toastId =
      toast.loading(
        "Generando horarios..."
      );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/actividades/serie`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                nombreBase:
                  serie.nombreBase
                    .trim(),

                descripcion:
                  serie.descripcion
                    .trim() ||
                  null,

                horaInicio:
                  serie.horaInicio,

                intervalo:
                  Number(
                    serie.intervalo
                  ),

                cantidad:
                  Number(
                    serie.cantidad
                  ),

                diaInicio:
                  Number(
                    serie.diaInicio
                  ),

                diaFin:
                  serie.diaFin
                    ? Number(
                        serie.diaFin
                      )
                    : null,

                recordatorio:
                  serie.recordatorio,
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
        throw new Error(
          data?.error ||
            "No se pudo generar la serie."
        );
      }

      toast.success(
        `${data.cantidad} actividades generadas`,
        {
          id: toastId,
        }
      );

      setModalSerie(
        false
      );

      setSerie(
        serieVacia
      );

      router.refresh();

    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo generar la serie.",
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

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
            2
          </div>


          <div className="min-w-0 flex-1">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

              <div>

                <h2 className="font-semibold text-gray-900">
                  Protocolo principal
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Ajusta fácilmente los horarios e instrucciones antes de enviar el seguimiento.
                </p>

              </div>


              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setModalSerie(
                      true
                    )
                  }
                  className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                >
                  ⚡ Generar serie
                </button>

                <button
                  type="button"
                  onClick={
                    abrirNueva
                  }
                  className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  + Actividad
                </button>

              </div>

            </div>


            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">

              {actividades.length ===
              0 ? (

                <div className="p-5 text-sm text-gray-500">
                  No hay actividades principales.
                </div>

              ) : (

                <div className="divide-y divide-gray-100">

                  {actividades.map(
                    (
                      actividad
                    ) => (

                      <div
                        key={
                          actividad.id
                        }
                        className="p-3"
                      >

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">

                          <div className="w-full sm:w-36">

                            <SelectorHora
                              value={
                                actividad.hora ||
                                ""
                              }
                              onChange={(hora) =>
                                void cambiarHora(
                                  actividad,
                                  hora
                                )
                              }
                            />

                          </div>


                          <div className="min-w-0 flex-1">

                            <p className="font-semibold text-gray-900">
                              {
                                actividad.titulo
                              }
                            </p>

                            {actividad.descripcion &&
                              actividad.indicaciones.length === 0 && (

                              <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-gray-500">
                                {
                                  actividad.descripcion
                                }
                              </p>

                            )}


                            <IndicacionesActividadPreparacion
                              seguimientoId={seguimientoId}
                              actividadId={actividad.id}
                              indicaciones={actividad.indicaciones}
                            />


                            <div className="mt-3 flex flex-wrap gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  abrirEditar(
                                    actividad
                                  )
                                }
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                disabled={
                                  procesando
                                }
                                onClick={() =>
                                  void eliminar(
                                    actividad
                                  )
                                }
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                Eliminar
                              </button>

                            </div>

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </div>

        </div>

      </section>


      {modalActividad && (

        <Modal
          title={
            editando
              ? "Editar actividad"
              : "Agregar actividad"
          }
          onClose={() =>
            !procesando &&
            setModalActividad(
              false
            )
          }
          maxWidthClassName="max-w-xl"
        >

          <div className="space-y-4">

            <div>

              <label className="admin-label">
                Título *
              </label>

              <input
                value={
                  form.titulo
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    titulo:
                      e.target.value,
                  })
                }
                className="admin-input"
              />

            </div>


            <div>

              <label className="admin-label">
                Horario
              </label>

              <SelectorHora
                value={
                  form.hora
                }
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
                      e.target.value,
                  })
                }
                className="admin-input min-h-28"
                maxLength={5000}
              />

            </div>


            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="admin-label">
                  Desde día
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
                        e.target.value,
                    })
                  }
                  className="admin-input"
                />
              </div>

              <div>
                <label className="admin-label">
                  Hasta día
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
                        e.target.value,
                    })
                  }
                  className="admin-input"
                  placeholder="Opcional"
                />
              </div>

            </div>


            <button
              type="button"
              disabled={
                procesando
              }
              onClick={() =>
                void guardarActividad()
              }
              className="admin-btn-primary w-full"
            >
              {procesando
                ? "Guardando..."
                : "Guardar actividad"}
            </button>

          </div>

        </Modal>

      )}


      {modalSerie && (

        <Modal
          title="Generar serie de horarios"
          onClose={() =>
            !procesando &&
            setModalSerie(
              false
            )
          }
          maxWidthClassName="max-w-xl"
        >

          <div className="space-y-4">

            <div>

              <label className="admin-label">
                Nombre base *
              </label>

              <input
                value={
                  serie.nombreBase
                }
                onChange={(e) =>
                  setSerie({
                    ...serie,
                    nombreBase:
                      e.target.value,
                  })
                }
                className="admin-input"
                placeholder="Ej. Toma"
              />

            </div>


            <div>

              <label className="admin-label">
                Primera hora
              </label>

              <SelectorHora
                value={
                  serie.horaInicio
                }
                onChange={(horaInicio) =>
                  setSerie({
                    ...serie,
                    horaInicio,
                  })
                }
                permitirVacio={
                  false
                }
              />

            </div>


            <div>

              <label className="admin-label">
                Intervalo
              </label>

              <div className="grid grid-cols-4 gap-2">

                {[
                  15,
                  30,
                  45,
                  60,
                ].map(
                  (
                    minutos
                  ) => (

                    <button
                      key={
                        minutos
                      }
                      type="button"
                      onClick={() =>
                        setSerie({
                          ...serie,
                          intervalo:
                            String(
                              minutos
                            ),
                        })
                      }
                      className={`rounded-xl border px-2 py-2.5 text-xs font-semibold ${
                        serie.intervalo ===
                        String(
                          minutos
                        )
                          ? "border-violet-600 bg-violet-600 text-white"
                          : "border-gray-200 bg-white text-gray-700"
                      }`}
                    >
                      {minutos ===
                      60
                        ? "1 h"
                        : `${minutos} min`}
                    </button>

                  )
                )}

              </div>

            </div>


            <div>

              <label className="admin-label">
                Cantidad
              </label>

              <input
                type="number"
                min={2}
                max={48}
                value={
                  serie.cantidad
                }
                onChange={(e) =>
                  setSerie({
                    ...serie,
                    cantidad:
                      e.target.value,
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
                  serie.descripcion
                }
                onChange={(e) =>
                  setSerie({
                    ...serie,
                    descripcion:
                      e.target.value,
                  })
                }
                className="admin-input min-h-24"
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
                  max={duracionDias}
                  value={serie.diaInicio}
                  onChange={(e) =>
                    setSerie({
                      ...serie,
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
                  value={serie.diaFin}
                  onChange={(e) =>
                    setSerie({
                      ...serie,
                      diaFin: e.target.value,
                    })
                  }
                  className="admin-input"
                  placeholder="Opcional"
                />
              </div>

            </div>


            <p className="-mt-2 text-xs text-gray-500">
              Si dejas el día final vacío, las actividades se mantendrán según la configuración del protocolo.
            </p>


            <div>

              <label className="admin-label">
                Recordatorio
              </label>

              <select
                value={serie.recordatorio}
                onChange={(e) =>
                  setSerie({
                    ...serie,
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


            <div>

              <label className="admin-label">
                Intervalo personalizado
              </label>

              <div className="flex items-center gap-2">

                <input
                  type="number"
                  min={1}
                  max={360}
                  value={serie.intervalo}
                  onChange={(e) =>
                    setSerie({
                      ...serie,
                      intervalo: e.target.value,
                    })
                  }
                  className="admin-input"
                />

                <span className="shrink-0 text-sm font-medium text-gray-500">
                  minutos
                </span>

              </div>

              <p className="mt-1 text-xs text-gray-500">
                También puedes usar los botones rápidos de 15, 30, 45 o 60 minutos.
              </p>

            </div>


            <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                Vista previa
              </p>

              <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">

                {vistaSerie.map(
                  (
                    item,
                    indice
                  ) => (

                    <div
                      key={
                        indice
                      }
                      className="flex items-center gap-3 rounded-lg bg-white px-3 py-2"
                    >

                      <span className="w-12 shrink-0 font-mono text-sm font-bold text-violet-700">
                        {item.hora ||
                          "—"}
                      </span>

                      <span className="text-sm text-gray-700">
                        {
                          item.titulo
                        }
                      </span>

                    </div>

                  )
                )}

              </div>

            </div>


            <button
              type="button"
              disabled={
                procesando
              }
              onClick={() =>
                void generarSerie()
              }
              className="admin-btn-primary w-full py-3"
            >
              {procesando
                ? "Generando..."
                : `Generar ${serie.cantidad || 0} actividades`}
            </button>

          </div>

        </Modal>

      )}

    </>
  );
}
