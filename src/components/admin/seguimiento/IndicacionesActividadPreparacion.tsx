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
  seguimientoId: string;
  actividadId: string;
  indicaciones: Indicacion[];
};

export default function IndicacionesActividadPreparacion({
  seguimientoId,
  actividadId,
  indicaciones,
}: Props) {
  const router =
    useRouter();

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
          ? `/api/admin/seguimiento/clientes/${seguimientoId}/actividades/${actividadId}/indicaciones/${editando.id}`
          : `/api/admin/seguimiento/clientes/${seguimientoId}/actividades/${actividadId}/indicaciones`;

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
      procesando ||
      !window.confirm(
        `¿Eliminar la indicación de las ${indicacion.hora}?`
      )
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
          `/api/admin/seguimiento/clientes/${seguimientoId}/actividades/${actividadId}/indicaciones/${indicacion.id}`,
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

      <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/70 p-3">

        <div className="flex items-center justify-between gap-3">

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-600">
              Indicaciones con horario
            </p>

            <p className="mt-0.5 text-[11px] text-gray-400">
              Cada indicación tiene su propia hora.
            </p>
          </div>

          <button
            type="button"
            onClick={
              abrirNueva
            }
            className="shrink-0 rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50"
          >
            + Agregar
          </button>

        </div>


        {indicaciones.length ===
        0 ? (

          <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-white p-3">

            <p className="text-xs leading-5 text-gray-500">
              Esta actividad todavía no tiene indicaciones estructuradas.
            </p>

          </div>

        ) : (

          <div className="mt-3 space-y-2">

            {indicaciones.map(
              (
                indicacion,
                indice
              ) => (

                <div
                  key={
                    indicacion.id
                  }
                  className="rounded-xl border border-gray-200 bg-white p-3"
                >

                  <div className="flex gap-3">

                    <div className="shrink-0">

                      <div className="rounded-lg bg-violet-50 px-2.5 py-1.5 font-mono text-sm font-bold text-violet-700">
                        {
                          indicacion.hora
                        }
                      </div>

                    </div>


                    <div className="min-w-0 flex-1">

                      <div className="flex gap-2">

                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
                          {indice + 1}
                        </span>

                        <p className="whitespace-pre-wrap text-sm leading-5 text-gray-700">
                          {
                            indicacion.texto
                          }
                        </p>

                      </div>


                      <div className="mt-2 flex flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            abrirEditar(
                              indicacion
                            )
                          }
                          className="text-xs font-semibold text-blue-600 hover:underline"
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
                              indicacion
                            )
                          }
                          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
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

    </>
  );
}
