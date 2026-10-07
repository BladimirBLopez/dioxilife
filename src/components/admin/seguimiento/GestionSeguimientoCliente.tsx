"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  AlertTriangle,
  Ban,
  Pause,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";

import {
  toast,
} from "sonner";

import Modal from "@/components/Modal";

type Estado =
  | "PENDIENTE"
  | "ACTIVO"
  | "PAUSADO"
  | "COMPLETADO"
  | "CANCELADO";

type AccionEstado =
  | "PAUSAR"
  | "REANUDAR"
  | "CANCELAR";

type Props = {
  seguimientoId: string;
  estado: Estado;
  esGrupo: boolean;

  nombreCliente:
    | string
    | null;

  telefonoCliente:
    | string
    | null;

  nombrePlan: string;

  referenciaCompra:
    | string
    | null;

  observacionInterna:
    | string
    | null;
};

export default function GestionSeguimientoCliente({
  seguimientoId,
  estado,
  esGrupo,
  nombreCliente,
  telefonoCliente,
  nombrePlan,
  referenciaCompra,
  observacionInterna,
}: Props) {
  const router =
    useRouter();

  const [
    editando,
    setEditando,
  ] =
    useState(false);

  const [
    accion,
    setAccion,
  ] =
    useState<AccionEstado | null>(
      null
    );

  const [
    eliminando,
    setEliminando,
  ] =
    useState(false);

  const [
    procesando,
    setProcesando,
  ] =
    useState(false);

  const [
    textoEliminar,
    setTextoEliminar,
  ] =
    useState("");

  const [
    form,
    setForm,
  ] =
    useState({
      nombreCliente:
        nombreCliente ?? "",

      telefonoCliente:
        telefonoCliente ?? "",

      nombrePlan,

      referenciaCompra:
        referenciaCompra ?? "",

      observacionInterna:
        observacionInterna ??
        "",
    });


  function abrirEditar() {
    setForm({
      nombreCliente:
        nombreCliente ?? "",

      telefonoCliente:
        telefonoCliente ?? "",

      nombrePlan,

      referenciaCompra:
        referenciaCompra ?? "",

      observacionInterna:
        observacionInterna ??
        "",
    });

    setEditando(
      true
    );
  }


  async function editar() {
    if (procesando) {
      return;
    }

    if (
      !form.nombrePlan.trim()
    ) {
      toast.error(
        "El nombre del protocolo es obligatorio."
      );
      return;
    }

    setProcesando(
      true
    );

    const toastId =
      toast.loading(
        "Guardando cambios..."
      );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                accion:
                  "EDITAR",

                ...form,
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          data?.error ||
            "No se pudo editar el cliente.",
          {
            id:
              toastId,
          }
        );

        return;
      }

      toast.success(
        "Datos actualizados.",
        {
          id:
            toastId,
        }
      );

      setEditando(
        false
      );

      router.refresh();
    } catch {
      toast.error(
        "No se pudo conectar con el servidor.",
        {
          id:
            toastId,
        }
      );
    } finally {
      setProcesando(
        false
      );
    }
  }


  async function cambiarEstado() {
    if (
      !accion ||
      procesando
    ) {
      return;
    }

    setProcesando(
      true
    );

    const toastId =
      toast.loading(
        accion ===
          "PAUSAR"
          ? "Pausando seguimiento..."
          : accion ===
            "REANUDAR"
          ? "Reanudando seguimiento..."
          : "Cancelando seguimiento..."
      );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                accion,
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          data?.error ||
            "No se pudo cambiar el estado.",
          {
            id:
              toastId,
          }
        );

        return;
      }

      toast.success(
        accion ===
          "PAUSAR"
          ? "Seguimiento pausado."
          : accion ===
            "REANUDAR"
          ? "Seguimiento reanudado."
          : "Seguimiento cancelado.",
        {
          id:
            toastId,
        }
      );

      setAccion(
        null
      );

      router.refresh();
    } catch {
      toast.error(
        "No se pudo conectar con el servidor.",
        {
          id:
            toastId,
        }
      );
    } finally {
      setProcesando(
        false
      );
    }
  }


  async function eliminar() {
    if (
      textoEliminar !==
        "ELIMINAR" ||
      procesando
    ) {
      return;
    }

    setProcesando(
      true
    );

    const toastId =
      toast.loading(
        "Eliminando seguimiento..."
      );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          data?.error ||
            "No se pudo eliminar el seguimiento.",
          {
            id:
              toastId,
          }
        );

        return;
      }

      toast.success(
        "Seguimiento eliminado definitivamente.",
        {
          id:
            toastId,
        }
      );

      router.push(
        "/admin/seguimiento/clientes"
      );

      router.refresh();
    } catch {
      toast.error(
        "No se pudo conectar con el servidor.",
        {
          id:
            toastId,
        }
      );
    } finally {
      setProcesando(
        false
      );
    }
  }


  const tituloAccion =
    accion === "PAUSAR"
      ? "Pausar seguimiento"
      : accion ===
        "REANUDAR"
      ? "Reanudar seguimiento"
      : "Cancelar seguimiento";


  const descripcionAccion =
    accion === "PAUSAR"
      ? "El cliente conservará todo su progreso. Los días del protocolo dejarán de avanzar y los recordatorios se detendrán hasta que lo reanudes."
      : accion ===
        "REANUDAR"
      ? "El cliente continuará desde el mismo día del protocolo en el que quedó cuando fue pausado."
      : "El seguimiento se cerrará definitivamente, pero conservarás sus actividades, mediciones, progreso e historial.";


  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
            Administración
          </p>

          <h2 className="mt-1 font-semibold text-gray-900">
            Gestionar cliente
          </h2>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            Edita sus datos o administra el estado de este seguimiento.
          </p>
        </div>


        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={
              abrirEditar
            }
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>


          {!esGrupo &&
            estado ===
              "ACTIVO" && (
              <button
                type="button"
                onClick={() =>
                  setAccion(
                    "PAUSAR"
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                <Pause className="h-4 w-4" />
                Pausar
              </button>
            )}


          {!esGrupo &&
            estado ===
              "PAUSADO" && (
              <button
                type="button"
                onClick={() =>
                  setAccion(
                    "REANUDAR"
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
              >
                <Play className="h-4 w-4" />
                Reanudar
              </button>
            )}


          {!esGrupo &&
            estado !==
              "COMPLETADO" &&
            estado !==
              "CANCELADO" && (
              <button
                type="button"
                onClick={() =>
                  setAccion(
                    "CANCELAR"
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <Ban className="h-4 w-4" />
                Cancelar
              </button>
            )}


          <button
            type="button"
            onClick={() => {
              setTextoEliminar(
                ""
              );

              setEliminando(
                true
              );
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>

        </div>

      </div>


      {esGrupo && (
        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">

          <p className="text-xs leading-5 text-violet-800">
            Este cliente pertenece a un grupo. Para detener su participación sin borrar el historial utiliza <strong>Retirar miembro</strong> desde el grupo. La opción Eliminar sí borra definitivamente su seguimiento y su participación.
          </p>

        </div>
      )}


      {editando && (
        <Modal
          title="Editar cliente"
          onClose={() => {
            if (
              !procesando
            ) {
              setEditando(
                false
              );
            }
          }}
        >
          <div className="space-y-4">

            <div>
              <label className="admin-label">
                Nombre del cliente
              </label>

              <input
                type="text"
                className="admin-input"
                value={
                  form.nombreCliente
                }
                maxLength={120}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nombreCliente:
                      e.target.value,
                  })
                }
              />
            </div>


            <div>
              <label className="admin-label">
                WhatsApp
              </label>

              <input
                type="tel"
                inputMode="numeric"
                className="admin-input"
                value={
                  form.telefonoCliente
                }
                placeholder="Ej. 71234567"
                onChange={(e) =>
                  setForm({
                    ...form,
                    telefonoCliente:
                      e.target.value,
                  })
                }
              />
            </div>


            <div>
              <label className="admin-label">
                Nombre del protocolo
              </label>

              <input
                type="text"
                className="admin-input"
                value={
                  form.nombrePlan
                }
                maxLength={200}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nombrePlan:
                      e.target.value,
                  })
                }
              />
            </div>


            <div>
              <label className="admin-label">
                Referencia de compra
              </label>

              <input
                type="text"
                className="admin-input"
                value={
                  form.referenciaCompra
                }
                maxLength={500}
                onChange={(e) =>
                  setForm({
                    ...form,
                    referenciaCompra:
                      e.target.value,
                  })
                }
              />
            </div>


            <div>
              <label className="admin-label">
                Nota interna
              </label>

              <textarea
                className="admin-input min-h-28"
                rows={4}
                maxLength={1500}
                value={
                  form.observacionInterna
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    observacionInterna:
                      e.target.value,
                  })
                }
              />
            </div>


            <button
              type="button"
              disabled={
                procesando
              }
              onClick={() =>
                void editar()
              }
              className="admin-btn-primary w-full disabled:opacity-50"
            >
              {procesando
                ? "Guardando..."
                : "Guardar cambios"}
            </button>

          </div>
        </Modal>
      )}


      {accion && (
        <Modal
          title={
            tituloAccion
          }
          onClose={() => {
            if (
              !procesando
            ) {
              setAccion(
                null
              );
            }
          }}
        >
          <div className="space-y-5">

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

              <div className="flex gap-3">

                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                <p className="text-sm leading-6 text-amber-900">
                  {
                    descripcionAccion
                  }
                </p>

              </div>

            </div>


            <div className="flex gap-2">

              <button
                type="button"
                disabled={
                  procesando
                }
                onClick={() =>
                  setAccion(
                    null
                  )
                }
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
              >
                Volver
              </button>

              <button
                type="button"
                disabled={
                  procesando
                }
                onClick={() =>
                  void cambiarEstado()
                }
                className="admin-btn-primary flex-1 disabled:opacity-50"
              >
                {procesando
                  ? "Procesando..."
                  : "Confirmar"}
              </button>

            </div>

          </div>
        </Modal>
      )}


      {eliminando && (
        <Modal
          title="Eliminar definitivamente"
          onClose={() => {
            if (
              !procesando
            ) {
              setEliminando(
                false
              );
            }
          }}
        >
          <div className="space-y-5">

            <div className="rounded-xl border border-red-200 bg-red-50 p-4">

              <div className="flex gap-3">

                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                <div>

                  <p className="text-sm font-semibold text-red-900">
                    Esta acción no se puede deshacer.
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-800">
                    Se eliminarán el seguimiento, actividades copiadas, registros, mediciones, progreso, accesos y datos relacionados de este seguimiento.
                  </p>

                  {esGrupo && (
                    <p className="mt-2 text-sm font-semibold leading-6 text-red-900">
                      Además dejará de formar parte del grupo y de sus resultados.
                    </p>
                  )}

                </div>

              </div>

            </div>


            <div>
              <label className="admin-label">
                Escribe ELIMINAR para confirmar
              </label>

              <input
                type="text"
                className="admin-input"
                value={
                  textoEliminar
                }
                autoComplete="off"
                onChange={(e) =>
                  setTextoEliminar(
                    e.target.value
                  )
                }
              />
            </div>


            <button
              type="button"
              disabled={
                procesando ||
                textoEliminar !==
                  "ELIMINAR"
              }
              onClick={() =>
                void eliminar()
              }
              className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {procesando
                ? "Eliminando..."
                : "Eliminar definitivamente"}
            </button>

          </div>
        </Modal>
      )}

    </section>
  );
}
