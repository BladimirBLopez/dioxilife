"use client";

import {
  useState,
} from "react";

import {
  CalendarClock,
  Play,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import { toast } from "sonner";
import Modal from "@/components/Modal";

type EstadoGrupo =
  | "BORRADOR"
  | "ACTIVO"
  | "FINALIZADO"
  | "CANCELADO";

export default function GestionGrupoSeguimiento({
  grupoId,
  estado,
  duracionDias,
  participantes,
}: {
  grupoId: string;
  estado: EstadoGrupo;
  duracionDias: number;
  participantes: number;
}) {
  const router =
    useRouter();

  const [
    confirmandoInicio,
    setConfirmandoInicio,
  ] = useState(false);

  const [
    editandoDuracion,
    setEditandoDuracion,
  ] = useState(false);

  const [
    nuevaDuracion,
    setNuevaDuracion,
  ] = useState(
    String(
      duracionDias
    )
  );

  const [
    procesando,
    setProcesando,
  ] = useState(false);

  async function iniciarGrupo() {
    setProcesando(true);

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/grupos/${grupoId}`,
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
                  "ACTIVAR",
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
            "No se pudo iniciar el grupo."
        );
        return;
      }

      toast.success(
        "Grupo iniciado correctamente."
      );

      setConfirmandoInicio(
        false
      );

      router.refresh();
    } catch {
      toast.error(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setProcesando(false);
    }
  }

  function abrirDuracion() {
    setNuevaDuracion(
      String(
        duracionDias
      )
    );

    setEditandoDuracion(
      true
    );
  }

  async function guardarDuracion() {
    const dias =
      Number(
        nuevaDuracion
      );

    if (
      !Number.isInteger(
        dias
      ) ||
      dias < 1 ||
      dias > 365
    ) {
      toast.error(
        "La duración debe estar entre 1 y 365 días."
      );
      return;
    }

    setProcesando(true);

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/grupos/${grupoId}`,
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
                  "ACTUALIZAR_DURACION",

                duracionDias:
                  dias,
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
            "No se pudo actualizar la duración."
        );
        return;
      }

      toast.success(
        "Duración actualizada."
      );

      setEditandoDuracion(
        false
      );

      router.refresh();
    } catch {
      toast.error(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setProcesando(false);
    }
  }

  const editable =
    estado !==
      "FINALIZADO" &&
    estado !==
      "CANCELADO";

  return (
    <>
      <div className="flex flex-wrap gap-2">

        {estado ===
          "BORRADOR" && (
          <button
            type="button"
            onClick={() =>
              setConfirmandoInicio(
                true
              )
            }
            className="admin-btn-primary inline-flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Iniciar grupo
          </button>
        )}

        {editable && (
          <button
            type="button"
            onClick={
              abrirDuracion
            }
            className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
          >
            <CalendarClock className="h-4 w-4" />
            Editar duración
          </button>
        )}

      </div>


      {confirmandoInicio && (
        <Modal
          title="Iniciar grupo"
          onClose={() =>
            !procesando &&
            setConfirmandoInicio(
              false
            )
          }
          maxWidthClassName="max-w-md"
        >
          <div className="space-y-5">

            <div className="rounded-2xl bg-violet-50 p-4">

              <p className="font-semibold text-violet-900">
                El grupo quedará activo
              </p>

              <p className="mt-1 text-sm leading-6 text-violet-700">
                Los {participantes} participante{participantes === 1 ? "" : "s"} conservarán la misma fecha de inicio, duración y protocolo del grupo.
              </p>

            </div>

            {participantes ===
              0 && (
              <p className="text-sm font-medium text-amber-700">
                Debes agregar al menos un participante antes de iniciar.
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={
                  procesando
                }
                onClick={() =>
                  setConfirmandoInicio(
                    false
                  )
                }
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  procesando ||
                  participantes ===
                    0
                }
                onClick={
                  iniciarGrupo
                }
                className="admin-btn-primary"
              >
                {procesando
                  ? "Iniciando..."
                  : "Confirmar inicio"}
              </button>

            </div>

          </div>
        </Modal>
      )}


      {editandoDuracion && (
        <Modal
          title="Editar duración"
          onClose={() =>
            !procesando &&
            setEditandoDuracion(
              false
            )
          }
          maxWidthClassName="max-w-md"
        >
          <div className="space-y-5">

            <div>

              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Duración del grupo
              </label>

              <div className="flex items-center rounded-xl border border-gray-300 bg-white px-3.5">

                <input
                  type="number"
                  min={1}
                  max={365}
                  value={
                    nuevaDuracion
                  }
                  onChange={(
                    event
                  ) =>
                    setNuevaDuracion(
                      event.target
                        .value
                    )
                  }
                  className="min-w-0 flex-1 bg-transparent py-3 text-lg font-bold text-gray-900 outline-none"
                />

                <span className="text-sm font-medium text-gray-400">
                  días
                </span>

              </div>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                El cambio también se aplicará a los seguimientos individuales de todos los participantes.
              </p>

            </div>


            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={
                  procesando
                }
                onClick={() =>
                  setEditandoDuracion(
                    false
                  )
                }
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  procesando
                }
                onClick={
                  guardarDuracion
                }
                className="admin-btn-primary"
              >
                {procesando
                  ? "Guardando..."
                  : "Guardar duración"}
              </button>

            </div>

          </div>
        </Modal>
      )}
    </>
  );
}
