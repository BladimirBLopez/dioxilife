"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  toast,
} from "sonner";

import Modal from "@/components/Modal";

import SelectorHora from "@/components/admin/seguimiento/SelectorHora";

type Indicacion = {
  id: string;
  hora: string;
  texto: string;
  orden: number;
};

type Props = {
  seguimientoId?: string;
  apiBase?: string;
  actividadId: string;
  indicaciones: Indicacion[];
  editable?: boolean;
};

export default function IndicacionesActividadPreparacion({
  seguimientoId,
  apiBase,
  actividadId,
  indicaciones,
  editable = true,
}: Props) {
  const router =
    useRouter();

  const baseApi =
    apiBase ??
    (
      seguimientoId
        ? `/api/admin/seguimiento/clientes/${seguimientoId}`
        : ""
    );

  if (!baseApi) {
    throw new Error(
      "No se definió el recurso de las indicaciones."
    );
  }

  const [
    modalAbierto,
    setModalAbierto,
  ] =
    useState(false);

  const [
    editando,
    setEditando,
  ] =
    useState<Indicacion | null>(
      null
    );

  const [
    hora,
    setHora,
  ] =
    useState("08:00");

  const [
    texto,
    setTexto,
  ] =
    useState("");

  const [
    procesando,
    setProcesando,
  ] =
    useState(false);

  const [
    indicacionAEliminar,
    setIndicacionAEliminar,
  ] =
    useState<Indicacion | null>(
      null
    );

  function abrirNueva() {
    setEditando(null);

    setHora(
      indicaciones.at(-1)
        ?.hora ||
        "08:00"
    );

    setTexto("");

    setModalAbierto(
      true
    );
  }

  function abrirEditar(
    indicacion: Indicacion
  ) {
    setEditando(
      indicacion
    );

    setHora(
      indicacion.hora
    );

    setTexto(
      indicacion.texto
    );

    setModalAbierto(
      true
    );
  }

  async function guardar() {
    if (
      procesando ||
      !texto.trim()
    ) {
      if (!texto.trim()) {
        toast.error(
          "Escribe la indicación."
        );
      }

      return;
    }

    setProcesando(
      true
    );

    const toastId =
      toast.loading(
        editando
          ? "Actualizando indicación..."
          : "Agregando indicación..."
      );

    try {
      const url =
        editando
          ? `${baseApi}/actividades/${actividadId}/indicaciones/${editando.id}`
          : `${baseApi}/actividades/${actividadId}/indicaciones`;

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
                hora,

                texto:
                  texto.trim(),

                orden:
                  editando?.orden,
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
            "No se pudo guardar la indicación."
        );
      }

      toast.success(
        editando
          ? "Indicación actualizada"
          : "Indicación agregada",
        {
          id: toastId,
        }
      );

      setModalAbierto(
        false
      );

      setEditando(
        null
      );

      setTexto("");

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

  async function eliminar(
    indicacion: Indicacion
  ) {
    if (
      procesando
    ) {
      return;
    }

    setProcesando(
      true
    );

    const toastId =
      toast.loading(
        "Eliminando indicación..."
      );

    try {
      const res =
        await fetch(
          `${baseApi}/actividades/${actividadId}/indicaciones/${indicacion.id}`,
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
        "Indicación eliminada",
        {
          id: toastId,
        }
      );

      setIndicacionAEliminar(
        null
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

  return (
    <>

      <div className="mt-3 w-full">

        <div className="flex items-center justify-between gap-2">

          <div className="flex items-center gap-1.5">

            <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-gray-500">
              Indicaciones
            </p>

            {indicaciones.length > 0 && (

              <span className="text-[11px] font-bold text-violet-600">
                · {indicaciones.length}
              </span>

            )}

          </div>


          {editable && (

            <button
              type="button"
              onClick={
                abrirNueva
              }
              className="rounded-lg px-2 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
            >
              + Añadir
            </button>

          )}

        </div>


        {indicaciones.length ===
        0 ? (

          <p className="mt-1.5 text-xs text-gray-400">
            Sin indicaciones adicionales.
          </p>

        ) : (

          <div className="mt-1 divide-y divide-gray-100">

            {indicaciones.map(
              (
                indicacion
              ) => (

                <div
                  key={
                    indicacion.id
                  }
                  className="flex items-start gap-3 py-2.5"
                >


                  <span className="mt-0.5 inline-flex shrink-0 rounded-md bg-violet-50 px-2 py-1 font-mono text-xs font-bold text-violet-700">
                    {
                      indicacion.hora
                    }
                  </span>


                  <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-5 text-gray-700">
                    {
                      indicacion.texto
                    }
                  </p>


                  {editable && (

                    <details
                      name="seguimiento-opciones"
                      className="relative shrink-0"
                    >

                      <summary
                        className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-lg font-bold leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        aria-label={`Opciones de la indicación de las ${indicacion.hora}`}
                      >
                        ⋮
                      </summary>


                      <div className="absolute bottom-full right-0 z-50 mb-1 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-xl">

                        <button
                          type="button"
                          onClick={() =>
                            abrirEditar(
                              indicacion
                            )
                          }
                          className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Editar indicación
                        </button>

                        <button
                          type="button"
                          disabled={
                            procesando
                          }
                          onClick={(event) => {
                            event.currentTarget
                              .closest("details")
                              ?.removeAttribute(
                                "open"
                              );

                            setIndicacionAEliminar(
                              indicacion
                            );
                          }}
                          className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Eliminar indicación
                        </button>

                      </div>

                    </details>

                  )}

                </div>

              )
            )}

          </div>

        )}

      </div>


      {modalAbierto && (

        <Modal
          title={
            editando
              ? "Editar indicación"
              : "Agregar indicación"
          }
          onClose={() =>
            !procesando &&
            setModalAbierto(
              false
            )
          }
          maxWidthClassName="max-w-lg"
        >

          <div className="space-y-4">

            <div>

              <label className="admin-label">
                Horario *
              </label>

              <SelectorHora
                value={
                  hora
                }
                onChange={
                  setHora
                }
                permitirVacio={
                  false
                }
              />

            </div>


            <div>

              <label className="admin-label">
                Indicación *
              </label>

              <textarea
                value={
                  texto
                }
                onChange={(e) =>
                  setTexto(
                    e.target.value
                  )
                }
                className="admin-input min-h-32"
                maxLength={5000}
                placeholder="Escribe la instrucción correspondiente a este horario..."
              />

              <p className="mt-1 text-right text-[11px] text-gray-400">
                {texto.length}/5000
              </p>

            </div>


            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">

              <p className="text-xs leading-5 text-blue-800">
                Esta indicación aparecerá junto a su horario en el protocolo del cliente.
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
              className="admin-btn-primary w-full py-3"
            >
              {procesando
                ? "Guardando..."
                : editando
                  ? "Guardar cambios"
                  : "Agregar indicación"}
            </button>

          </div>

        </Modal>

      )}


      {indicacionAEliminar && (

        <Modal
          title="Eliminar indicación"
          onClose={() =>
            !procesando &&
            setIndicacionAEliminar(
              null
            )
          }
          maxWidthClassName="max-w-md"
        >

          <div className="space-y-5">

            <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-lg font-extrabold text-red-600">
                !
              </div>


              <div className="min-w-0">

                <p className="text-sm font-bold text-red-900">
                  ¿Eliminar esta indicación?
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  Se eliminará la indicación programada para las{" "}
                  <span className="font-extrabold">
                    {
                      indicacionAEliminar.hora
                    }
                  </span>
                  .
                </p>

                <p className="mt-1 text-xs leading-5 text-red-600">
                  Esta acción no se puede deshacer.
                </p>

              </div>

            </div>


            <div className="rounded-xl bg-gray-50 p-3">

              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Indicación
              </p>

              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-gray-700">
                {
                  indicacionAEliminar.texto
                }
              </p>

            </div>


            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                disabled={
                  procesando
                }
                onClick={() =>
                  setIndicacionAEliminar(
                    null
                  )
                }
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>


              <button
                type="button"
                disabled={
                  procesando
                }
                onClick={() =>
                  void eliminar(
                    indicacionAEliminar
                  )
                }
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {
                  procesando
                    ? "Eliminando..."
                    : "Eliminar"
                }
              </button>

            </div>

          </div>

        </Modal>

      )}

    </>
  );
}
