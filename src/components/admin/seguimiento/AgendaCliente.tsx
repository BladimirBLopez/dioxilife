"use client";
import SeleccionarProtocoloGuardado from "@/components/admin/seguimiento/SeleccionarProtocoloGuardado";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DuracionRapidaProtocolo from "@/components/admin/seguimiento/DuracionRapidaProtocolo";
import { toast } from "sonner";
import Modal from "@/components/Modal";
import SelectorHora from "@/components/admin/seguimiento/SelectorHora";
import IndicacionesActividadPreparacion from "@/components/admin/seguimiento/IndicacionesActividadPreparacion";
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
  etapaId?: string | null;
  etapa?: {
    nombre: string;
    estado: string;
    diaInicio: number;
    diaFin: number;
  } | null;

  indicaciones: Array<{
    id: string;
    hora: string;
    texto: string;
    orden: number;
  }>;

  cantidadProgresos: number;
};

type EtapaAgenda = {
  id: string;
  nombre: string;
  estado: string;
  diaInicio: number;
  diaFin: number;
};

type Props = {
  seguimientoId?: string;
  apiBase?: string;
  tituloAgenda?: string;
  descripcionAgenda?: string;
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
  apiBase,
  tituloAgenda = "Agenda individual",
  descripcionAgenda = "Estas actividades pertenecen exclusivamente a este cliente.",
  duracionDias,
  estado,
  diaActual,
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
      "No se definió el recurso de la agenda."
    );
  }

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

  const [etapasAgenda, setEtapasAgenda] =
    useState<EtapaAgenda[]>([]);

  const [etapaElegida, setEtapaElegida] =
    useState("");

  const [cargandoEtapas, setCargandoEtapas] =
    useState(true);

  const [errorEtapas, setErrorEtapas] =
    useState("");

  function reiniciarSeleccionEtapa() {
    setEtapaElegida("");
    setEtapasAgenda([]);
    setCargandoEtapas(true);
    setErrorEtapas("");
  }

  useEffect(() => {
    if (
      !modalAbierto ||
      !seguimientoId ||
      actividadEditando
    ) {
      return;
    }

    let vigente = true;

    fetch(
      `/api/admin/seguimiento/clientes/${seguimientoId}/etapas`,
      { cache: "no-store" }
    )
      .then(async (respuesta) => {
        const datos = await respuesta.json();

        if (
          !respuesta.ok ||
          !Array.isArray(datos.etapas)
        ) {
          throw new Error(
            datos.error ||
            "No se pudieron consultar las etapas."
          );
        }

        if (vigente) {
          setEtapasAgenda(datos.etapas);
          setErrorEtapas("");
        }
      })
      .catch((error: unknown) => {
        if (vigente) {
          setErrorEtapas(
            error instanceof Error
              ? error.message
              : "Error al consultar las etapas."
          );
        }
      })
      .finally(() => {
        if (vigente) {
          setCargandoEtapas(false);
        }
      });

    return () => {
      vigente = false;
    };
  }, [modalAbierto, seguimientoId, actividadEditando]);

  function abrirNueva() {
    setActividadEditando(null);
    setForm(
      seguimientoId
        ? {
            ...vacio,
            diaInicio: String(
              Math.max(
                1,
                Math.min(duracionDias, diaActual ?? 1)
              )
            ),
            diaFin: String(duracionDias),
          }
        : vacio
    );
    reiniciarSeleccionEtapa();
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

    reiniciarSeleccionEtapa();
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

    if (seguimientoId && !actividadEditando) {
      if (cargandoEtapas) {
        toast.error("Espera mientras se consultan las etapas.");
        return;
      }

      if (errorEtapas) {
        toast.error(errorEtapas);
        return;
      }

      if (etapasAgenda.length > 0) {
        const etapa = etapasAgenda.find(
          (item) =>
            item.id === etapaElegida &&
            item.estado === "BORRADOR"
        );

        if (!etapa) {
          toast.error("Selecciona una etapa en borrador.");
          return;
        }

        const inicio = Number(form.diaInicio);
        const fin = form.diaFin
          ? Number(form.diaFin)
          : null;

        if (
          !Number.isInteger(inicio) ||
          inicio < etapa.diaInicio ||
          inicio > etapa.diaFin ||
          (
            fin !== null &&
            (
              !Number.isInteger(fin) ||
              fin < inicio ||
              fin > etapa.diaFin
            )
          )
        ) {
          toast.error(
            `Los días deben estar entre ${etapa.diaInicio} y ${etapa.diaFin}.`
          );
          return;
        }
      }
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
          ? `${baseApi}/actividades/${actividadEditando.id}`
          : `${baseApi}/actividades`;

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
          ...(actividadEditando
            ? {}
            : { etapaId: etapaElegida || null }),
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
        `${baseApi}/actividades/${actividad.id}`,
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
        `${baseApi}/actividades/${quitarActividad.id}`,
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
        `${baseApi}/actividades/${eliminarActividad.id}`,
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

          {(tituloAgenda || descripcionAgenda) && (
            <div>
              {tituloAgenda && (
                <h2 className="text-lg font-semibold text-gray-900">
                  {tituloAgenda}
                </h2>
              )}
              {descripcionAgenda && (
                <p className="mt-1 text-sm text-gray-500">
                  {descripcionAgenda}
                </p>
              )}
            </div>
          )}

          {!bloqueado && (
            <div className="flex flex-wrap items-center gap-2">

              <button
                type="button"
                onClick={abrirNueva}
                className="admin-btn-primary"
              >
                + Actividad principal
              </button>

              <button
                type="button"
                onClick={() => {
                  setActividadEditando(null);
                  setForm({
                    ...vacio,
                    seccion: "ADICIONAL",
                    tipo: "TAREA",
                    diaInicio: String(diaActual ?? 1),
                  });
                  reiniciarSeleccionEtapa();
                  setModalAbierto(true);
                }}
                className="rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-800 hover:bg-purple-100"
              >
                + Protocolo adicional
              </button>

              {seguimientoId && (
                <SeleccionarProtocoloGuardado
                  seguimientoId={seguimientoId}
                  duracionDias={duracionDias}
                  diaActual={diaActual}
                  onAgregada={() => router.refresh()}
                />
              )}

            </div>
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

                        {actividad.etapa && (
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800">
                            {actividad.etapa.nombre}
                            {" · "}
                            Días {actividad.etapa.diaInicio} al {actividad.etapa.diaFin}
                            {" · "}
                            {actividad.etapa.estado === "BORRADOR"
                              ? "Borrador — No publicada"
                              : actividad.etapa.estado === "PROGRAMADA"
                              ? "Programada — No publicada"
                              : actividad.etapa.estado === "PUBLICADA"
                              ? "Publicada"
                              : actividad.etapa.estado === "FINALIZADA"
                              ? "Finalizada"
                              : actividad.etapa.estado}
                          </span>
                        )}

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


                      <details className="group mt-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50/60">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-semibold text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600">
                          <span>Ver detalles</span>
                          <span aria-hidden="true" className="text-gray-400 transition-transform group-open:rotate-180">
                            ▾
                          </span>
                        </summary>
                        <div className="space-y-3 border-t border-gray-200 p-3">
                          {actividad.descripcion && (
                            <div className="mt-2 rounded-xl bg-gray-50 px-3 py-2.5">

                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                                Instrucciones del título
                              </p>

                              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                                {actividad.descripcion}
                              </p>

                            </div>
                          )}


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
                            horaActividad={actividad.hora}
                            indicaciones={
                              actividad.indicaciones
                            }
                            editable={
                              !bloqueado &&
                              actividad.activo &&
                              (
                                actividad.etapaId
                                  ? actividad.etapa?.estado ===
                                      "BORRADOR"
                                  : actividad.seccion ===
                                      "ADICIONAL" &&
                                    (
                                      diaActual === null ||
                                      aplicaEnDia(
                                        actividad,
                                        diaActual
                                      ) ||
                                      actividad.diaInicio >
                                        diaActual
                                    )
                              )
                            }
                          />


                          <p className="mt-2 text-xs text-gray-400">
                            Orden: {actividad.orden} ·{" "}
                            {actividad.cantidadProgresos} progreso
                            {actividad.cantidadProgresos === 1
                              ? ""
                              : "s"}
                          </p>
                        </div>
                      </details>

                    </div>


                    {!bloqueado && actividad.etapaId && (
                      <div className="shrink-0">
                        {actividad.etapa?.estado === "BORRADOR" ? (
                          <button
                            type="button"
                            disabled={procesando}
                            onClick={() => abrirEditar(actividad)}
                            className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800 hover:bg-violet-100 disabled:opacity-50"
                          >
                            Editar borrador
                          </button>
                        ) : (
                          <div className="max-w-56 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                            Edicion protegida para conservar
                            el contenido y el historial de
                            esta etapa.
                          </div>
                        )}
                      </div>
                    )}

                    {!bloqueado && !actividad.etapaId && (

                      <div className="flex shrink-0 flex-wrap items-start gap-2">

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

                        {(actividad.seccion !== "ADICIONAL" ||
                          (actividad.activo &&
                            (diaActual === null ||
                              aplicaEnDia(actividad, diaActual)))) && (
                          <details className="group min-w-0">
                            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600">
                              Más opciones
                              <span aria-hidden="true" className="text-gray-400 transition group-open:rotate-180">▾</span>
                            </summary>
                            <div className="mt-2 flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
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
                          </details>
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

          <div className="space-y-5">

            {!actividadEditando && (
              <section className="rounded-2xl border border-gray-200 bg-white p-4">

                <p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-600">
                  ¿Qué quieres agregar?
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">

                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        seccion: "PRINCIPAL",
                        ...(seguimientoId
                          ? {
                              diaInicio: String(
                                Math.max(
                                  1,
                                  Math.min(
                                    duracionDias,
                                    diaActual ?? 1
                                  )
                                )
                              ),
                              diaFin: String(duracionDias),
                            }
                          : {}),
                      })
                    }
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      form.seccion === "PRINCIPAL"
                        ? "border-violet-400 bg-violet-50 text-violet-900"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      Actividad del protocolo
                    </span>

                    <span className="mt-1 block text-[11px] leading-4 opacity-70">
                      Una actividad normal de la agenda principal.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        seccion: "ADICIONAL",
                        tipo: "TAREA",
                        diaInicio:
                          String(diaActual ?? 1),
                      })
                    }
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      form.seccion === "ADICIONAL"
                        ? "border-purple-400 bg-purple-50 text-purple-900"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      Protocolo adicional
                    </span>

                    <span className="mt-1 block text-[11px] leading-4 opacity-70">
                      Añade un protocolo complementario desde el día actual.
                    </span>
                  </button>

                </div>
              </section>
            )}

            {seguimientoId && !actividadEditando && (
              <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <p className="text-sm font-bold text-violet-900">
                  Etapa de destino
                </p>

                {cargandoEtapas ? (
                  <p className="mt-2 text-sm text-violet-700">
                    Consultando etapas...
                  </p>
                ) : errorEtapas ? (
                  <p className="mt-2 text-sm text-red-700">
                    {errorEtapas}
                  </p>
                ) : etapasAgenda.length === 0 ? (
                  <p className="mt-2 text-sm text-violet-700">
                    No hay etapas. La actividad se guardará
                    en la agenda tradicional.
                  </p>
                ) : (
                  <>
                    <select
                      value={etapaElegida}
                      onChange={(evento) => {
                        const id = evento.target.value;
                        const etapa = etapasAgenda.find(
                          (item) => item.id === id
                        );

                        setEtapaElegida(id);

                        if (etapa) {
                          setForm((anterior) => ({
                            ...anterior,
                            diaInicio: String(etapa.diaInicio),
                            diaFin: String(etapa.diaFin),
                          }));
                        }
                      }}
                      className="admin-input mt-3"
                      required
                    >
                      <option value="">
                        Selecciona una etapa en borrador
                      </option>

                      {etapasAgenda
                        .filter(
                          (etapa) =>
                            etapa.estado === "BORRADOR"
                        )
                        .map((etapa) => (
                          <option
                            key={etapa.id}
                            value={etapa.id}
                          >
                            {etapa.nombre} — días {etapa.diaInicio} al {etapa.diaFin}
                          </option>
                        ))}
                    </select>

                    {etapaElegida && (
                      <p className="mt-2 text-xs text-violet-700">
                        Esta actividad permanecerá oculta
                        al cliente mientras la etapa esté
                        en borrador.
                      </p>
                    )}

                    {!etapasAgenda.some(
                      (etapa) =>
                        etapa.estado === "BORRADOR"
                    ) && (
                      <p className="mt-2 text-sm text-amber-800">
                        No hay etapas en borrador disponibles.
                      </p>
                    )}
                  </>
                )}
              </section>
            )}

            <section className="rounded-2xl border border-gray-200 bg-white p-4">

              <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-violet-600">
                1. {form.seccion === "ADICIONAL"
                  ? "Qué protocolo vas a agregar"
                  : "Qué debe hacer el cliente"}
              </p>

              <div>
                <label className="admin-label">
                  {form.seccion === "ADICIONAL"
                    ? "Nombre del protocolo *"
                    : "Nombre de la actividad *"}
                </label>

                <input
                  value={form.titulo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      titulo: e.target.value,
                    })
                  }
                  maxLength={200}
                  className="admin-input"
                  placeholder={
                    form.seccion === "ADICIONAL"
                      ? "Ej. Protocolo adicional"
                      : "Ej. Caminata, desayuno, control..."
                  }
                  autoFocus={!actividadEditando}
                />
              </div>

              <div className="mt-4">
                <label className="admin-label">
                  Instrucciones
                </label>

                <textarea
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      descripcion: e.target.value,
                    })
                  }
                  rows={4}
                  maxLength={5000}
                  className="admin-input"
                  placeholder="Escribe lo que verá el cliente..."
                />
              </div>

            </section>

            <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">

              <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                2. Cuándo se aplica
              </p>

              <div className="grid gap-3 sm:grid-cols-3">

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
                        recordatorio:
                          hora
                            ? form.recordatorio
                            : "NINGUNO",
                      })
                    }
                  />
                </div>

                {(!seguimientoId ||
                  form.seccion === "ADICIONAL" ||
                  Boolean(etapaElegida) ||
                  Boolean(actividadEditando?.etapaId)) && (
                  <>
                    {seguimientoId && form.seccion === "ADICIONAL" && (
                      <DuracionRapidaProtocolo
                        inicio={form.diaInicio}
                        fin={form.diaFin}
                        duracionDias={duracionDias}
                        onFinChange={(diaFin) =>
                          setForm((anterior) => ({
                            ...anterior,
                            diaFin,
                          }))
                        }
                      />
                    )}
                <div>
                  <label className="admin-label">
                    Desde el día
                  </label>

                  <input
                    type="number"
                    min={1}
                    max={duracionDias}
                    value={form.diaInicio}
                    disabled={Boolean(
                      actividadEditando &&
                      actividadEditando.seccion === "ADICIONAL" &&
                      diaActual !== null &&
                      diaActual > actividadEditando.diaInicio
                    )}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        diaInicio: e.target.value,
                      })
                    }
                    className="admin-input disabled:bg-gray-100"
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

                  </>
                )}

              </div>

              {seguimientoId && form.seccion === "PRINCIPAL" && (
                <p className="mt-3 text-xs leading-5 text-gray-600">
                  {actividadEditando
                    ? "Se conserva la programación de días que ya tiene esta actividad."
                    : "Esta actividad se programará desde el día " +
                      Math.max(
                        1,
                        Math.min(duracionDias, diaActual ?? 1)
                      ) +
                      " hasta el día " +
                      duracionDias +
                      "."}
                </p>
              )}

              {actividadEditando &&
                actividadEditando.seccion === "ADICIONAL" &&
                diaActual !== null &&
                diaActual > actividadEditando.diaInicio && (
                  <div className="mt-3 rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-sm text-purple-800">
                    Este cambio se aplicará desde el día{" "}
                    <strong>{diaActual}</strong>.
                    Los días anteriores conservarán su configuración.
                  </div>
                )}

              {form.hora ? (
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
                </div>
              ) : (
                <p className="mt-3 text-xs leading-5 text-gray-500">
                  Agrega una hora si deseas programar un recordatorio.
                </p>
              )}

            </section>

            <details className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">

              <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-gray-700">
                3. Más opciones
              </summary>

              <div className="space-y-4 border-t border-gray-200 bg-white p-4">

                {form.seccion === "PRINCIPAL" && (
                  <div>
                    <label className="admin-label">
                      Cómo se mostrará al cliente
                    </label>

                    <select
                      value={form.tipo}
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
                        Debe marcarla como realizada
                      </option>
                      <option value="INFORMACION">
                        Solo mostrar información
                      </option>
                      <option value="CONTROL">
                        Control
                      </option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="admin-label">
                    Momento del día
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
                    <option value="">Sin especificar</option>
                    <option value="Ayunas">Ayunas</option>
                    <option value="Desayuno">Desayuno</option>
                    <option value="Media mañana">Media mañana</option>
                    <option value="Almuerzo">Almuerzo</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Cena">Cena</option>
                    <option value="Antes de dormir">Antes de dormir</option>
                    <option value="Noche">Noche</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label">
                    Orden manual
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

                  <p className="mt-1 text-xs text-gray-500">
                    Normalmente puedes dejarlo sin modificar.
                  </p>
                </div>

              </div>
            </details>

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
