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

function actividadDestacada(
  actividad: Actividad
) {
  const valor =
    `${actividad.momento || ""} ${actividad.titulo}`
      .toLowerCase();

  return [
    "desayuno",
    "almuerzo",
    "cena",
  ].some(
    (nombre) =>
      valor.includes(
        nombre
      )
  );
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


  const actividadesOrdenadas =
    useMemo(
      () =>
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
        ),
      [actividades]
    );


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
                  Agrega las actividades tal como aparecen en el protocolo del cliente: hora, título, instrucciones e indicaciones.
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
                  ⚡ Serie de horarios
                </button>

                <button
                  type="button"
                  onClick={
                    abrirNueva
                  }
                  className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  + Agregar actividad
                </button>

              </div>

            </div>


            <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">

              <div className="hidden border-b border-gray-200 bg-gray-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500 sm:grid sm:grid-cols-[130px_minmax(0,1fr)_150px] sm:gap-4">

                <div>
                  Hora
                </div>

                <div>
                  Actividad / instrucciones
                </div>

                <div className="text-right">
                  Estado
                </div>

              </div>


              {actividadesOrdenadas.length ===
              0 ? (

                <div className="p-7 text-center">

                  <p className="font-semibold text-gray-800">
                    El protocolo todavía está vacío
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Agrega la primera actividad para comenzar a construir el protocolo del cliente.
                  </p>

                  <button
                    type="button"
                    onClick={
                      abrirNueva
                    }
                    className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    + Agregar primera actividad
                  </button>

                </div>

              ) : (

                <div className="divide-y divide-gray-200">

                  {actividadesOrdenadas.map(
                    (
                      actividad
                    ) => {
                      const destacada =
                        actividadDestacada(
                          actividad
                        );

                      const descripcionVisible =
                        actividad.descripcion &&
                        actividad.descripcion.trim() !==
                          actividad.indicaciones
                            .map(
                              (
                                indicacion
                              ) =>
                                indicacion.texto.trim()
                            )
                            .filter(Boolean)
                            .join("\n")
                            .trim();

                      return (

                        <article
                          key={
                            actividad.id
                          }
                          className={`relative ${
                            destacada
                              ? "bg-amber-50/60"
                              : "bg-white"
                          }`}
                        >

                          {destacada && (
                            <div className="absolute inset-y-0 left-0 w-1 bg-amber-400" />
                          )}


                          <div className="grid gap-4 p-4 sm:grid-cols-[130px_minmax(0,1fr)_150px] sm:p-5">


                            <div>

                              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 sm:hidden">
                                Hora
                              </p>

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


                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <h3
                                  className={`text-base font-bold ${
                                    destacada
                                      ? "text-amber-950"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {
                                    actividad.titulo
                                  }
                                </h3>


                                {destacada && (

                                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                                    Comida
                                  </span>

                                )}

                              </div>


                              {descripcionVisible && (

                                <div className={`mt-2 rounded-xl px-3 py-2.5 ${
                                  destacada
                                    ? "bg-white/70"
                                    : "bg-gray-50"
                                }`}>

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


                              <IndicacionesActividadPreparacion
                                seguimientoId={
                                  seguimientoId
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
                                  onClick={() =>
                                    abrirEditar(
                                      actividad
                                    )
                                  }
                                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700"
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
                                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                                >
                                  Eliminar
                                </button>

                              </div>

                            </div>


                            <div className="hidden sm:block">

                              <div className="flex justify-end">

                                {actividad.tipo ===
                                "TAREA" ? (

                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                    <span>
                                      ✓
                                    </span>
                                    Check
                                  </span>

                                ) : actividad.tipo ===
                                  "INFORMACION" ? (

                                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                                    Información
                                  </span>

                                ) : (

                                  <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                                    Control
                                  </span>

                                )}

                              </div>


                              <div className="mt-4 flex flex-col items-end gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirEditar(
                                      actividad
                                    )
                                  }
                                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
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
                                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                >
                                  Eliminar
                                </button>

                              </div>

                            </div>

                          </div>

                        </article>

                      );
                    }
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
              : "Nueva actividad"
          }
          onClose={() =>
            !procesando &&
            setModalActividad(
              false
            )
          }
          maxWidthClassName="max-w-2xl"
        >

          <div className="space-y-5">


            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">

              <div className="grid gap-4 sm:grid-cols-[180px_1fr]">


                <div>

                  <label className="admin-label">
                    Hora
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
                    Actividad / título *
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
                    maxLength={200}
                    placeholder="Ej. Desayuno, Zeolita, Control..."
                    autoFocus
                  />

                </div>

              </div>


              <div className="mt-5">

                <label className="admin-label">
                  Instrucciones
                </label>

                <p className="mb-2 text-xs leading-5 text-gray-500">
                  Escribe aquí las instrucciones que corresponden directamente a esta actividad.
                </p>

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
                  className="admin-input min-h-32 resize-y"
                  maxLength={5000}
                  placeholder="Escribe las instrucciones que verá el cliente..."
                />

                <p className="mt-1 text-right text-[11px] text-gray-400">
                  {form.descripcion.length}/5000
                </p>

              </div>

            </div>


            <details className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">

              <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-gray-700">

                Opciones avanzadas

                <span className="ml-2 text-xs font-normal text-gray-400">
                  días, recordatorio, momento y tipo
                </span>

              </summary>


              <div className="space-y-5 border-t border-gray-200 bg-white p-4">


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
                            e.target.value,
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
                            e.target.value,
                        })
                      }
                      className="admin-input"
                      placeholder="Opcional"
                    />

                  </div>

                </div>


                <p className="-mt-3 text-xs leading-5 text-gray-500">
                  Si dejas el día final vacío, la actividad continuará hasta finalizar el seguimiento.
                </p>


                <div>

                  <label className="admin-label">
                    Momento
                  </label>

                  <select
                    value={
                      form.momento
                    }
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


                  {form.recordatorio !==
                    "NINGUNO" &&
                    !form.hora && (

                    <p className="mt-1 text-xs text-amber-600">
                      Para utilizar un recordatorio debes seleccionar una hora.
                    </p>

                  )}

                </div>


                <div>

                  <label className="admin-label">
                    Tipo
                  </label>

                  <select
                    value={
                      form.tipo
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tipo:
                          e.target.value as
                            | "TAREA"
                            | "INFORMACION"
                            | "CONTROL",
                      })
                    }
                    className="admin-input"
                  >

                    <option value="TAREA">
                      Actividad que el cliente debe marcar
                    </option>

                    <option value="INFORMACION">
                      Solo información
                    </option>

                    <option value="CONTROL">
                      Control
                    </option>

                  </select>

                </div>


                <div>

                  <label className="admin-label">
                    Orden manual
                  </label>

                  <input
                    type="number"
                    value={
                      form.orden
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        orden:
                          e.target.value,
                      })
                    }
                    className="admin-input"
                  />

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Normalmente no necesitas modificarlo. El horario será la referencia principal para mostrar el protocolo.
                  </p>

                </div>

              </div>

            </details>


            <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">

              <p className="text-xs leading-5 text-violet-800">
                Después de guardar podrás agregar debajo todas las indicaciones que necesites, cada una con su propio horario.
              </p>

            </div>


            <button
              type="button"
              disabled={
                procesando
              }
              onClick={() =>
                void guardarActividad()
              }
              className="admin-btn-primary w-full py-3 disabled:opacity-60"
            >
              {procesando
                ? "Guardando..."
                : editando
                ? "Guardar cambios"
                : "Agregar actividad"}
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
                Instrucciones
              </label>

              <p className="mb-2 text-xs leading-5 text-gray-500">
                Estas instrucciones se aplicarán a las actividades generadas.
              </p>

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
