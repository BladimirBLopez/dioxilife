"use client";

import {
  useState,
} from "react";

import {
  CalendarClock,
  CheckCircle2,
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

type ModoInicio =
  | "MANTENER_FECHA"
  | "HOY";

function fechaBoliviaActual() {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/La_Paz",
        year:
          "numeric",
        month:
          "2-digit",
        day:
          "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const valor = (
    tipo: string
  ) =>
    partes.find(
      (
        parte
      ) =>
        parte.type ===
        tipo
    )?.value || "";

  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

function fechaLegible(
  valor: string
) {
  return new Date(
    `${valor}T00:00:00.000Z`
  ).toLocaleDateString(
    "es-BO",
    {
      timeZone:
        "UTC",
      year:
        "numeric",
      month:
        "long",
      day:
        "numeric",
    }
  );
}

function diaCorrespondiente(
  inicio: string,
  hoy: string
) {
  const inicioMs =
    Date.parse(
      `${inicio}T00:00:00.000Z`
    );

  const hoyMs =
    Date.parse(
      `${hoy}T00:00:00.000Z`
    );

  return (
    Math.floor(
      (
        hoyMs -
        inicioMs
      ) /
        86400000
    ) + 1
  );
}

export default function GestionGrupoSeguimiento({
  grupoId,
  estado,
  duracionDias,
  participantes,
  fechaInicio,
  programado = false,
}: {
  grupoId: string;
  estado: EstadoGrupo;
  duracionDias: number;
  participantes: number;
  fechaInicio: string;
  programado?: boolean;
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
    confirmandoFinalizacion,
    setConfirmandoFinalizacion,
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

  const [
    modoInicio,
    setModoInicio,
  ] =
    useState<ModoInicio>(
      "MANTENER_FECHA"
    );

  const hoyBolivia =
    fechaBoliviaActual();

  const fechaPasada =
    fechaInicio <
    hoyBolivia;

  const fechaFutura =
    fechaInicio >
    hoyBolivia;

  const diaSiMantiene =
    fechaPasada
      ? diaCorrespondiente(
          fechaInicio,
          hoyBolivia
        )
      : 1;

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

                modoInicio:
                  fechaPasada
                    ? modoInicio
                    : undefined,
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

      if (
        data?.programado
      ) {
        toast.success(
          "Grupo programado correctamente."
        );
      } else if (
        Number(
          data?.diaActual
        ) > 1
      ) {
        toast.success(
          `Grupo activado en el día ${data.diaActual}.`
        );
      } else {
        toast.success(
          "Grupo iniciado correctamente."
        );
      }

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

  async function finalizarGrupo() {
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
                  "FINALIZAR",
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
            "No se pudo finalizar el grupo."
        );
        return;
      }

      toast.success(
        "Grupo finalizado correctamente."
      );

      setConfirmandoFinalizacion(
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

        {estado ===
          "ACTIVO" &&
          !programado && (
          <button
            type="button"
            onClick={() =>
              setConfirmandoFinalizacion(
                true
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Finalizar grupo
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
                {fechaFutura
                  ? "El grupo quedará programado"
                  : "El grupo quedará activo"}
              </p>

              <p className="mt-1 text-sm leading-6 text-violet-700">

                {fechaFutura ? (
                  <>
                    Comenzará automáticamente el{" "}
                    <strong>
                      {fechaLegible(
                        fechaInicio
                      )}
                    </strong>
                    . Hasta esa fecha no se consumirá ninguna jornada.
                  </>
                ) : fechaPasada ? (
                  <>
                    La fecha configurada fue el{" "}
                    <strong>
                      {fechaLegible(
                        fechaInicio
                      )}
                    </strong>
                    . Elige cómo deseas iniciar.
                  </>
                ) : (
                  <>
                    El grupo comenzará hoy. Los{" "}
                    {participantes} participante
                    {participantes === 1
                      ? ""
                      : "s"}{" "}
                    usarán la misma fecha, duración y protocolo.
                  </>
                )}

              </p>

            </div>


            {fechaPasada && (

              <div className="space-y-3">

                <label className="block cursor-pointer rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50">

                  <div className="flex items-start gap-3">

                    <input
                      type="radio"
                      name="modoInicioGrupo"
                      checked={
                        modoInicio ===
                        "MANTENER_FECHA"
                      }
                      onChange={() =>
                        setModoInicio(
                          "MANTENER_FECHA"
                        )
                      }
                      className="mt-1"
                    />

                    <div>

                      <p className="font-semibold text-gray-900">
                        Mantener fecha original
                      </p>

                      <p className="mt-1 text-sm leading-5 text-gray-500">
                        Se conservará el{" "}
                        {fechaLegible(
                          fechaInicio
                        )}{" "}
                        como inicio oficial. Actualmente el grupo quedará en el día{" "}
                        <strong>
                          {diaSiMantiene}
                        </strong>
                        .
                      </p>

                    </div>

                  </div>

                </label>


                <label className="block cursor-pointer rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50">

                  <div className="flex items-start gap-3">

                    <input
                      type="radio"
                      name="modoInicioGrupo"
                      checked={
                        modoInicio ===
                        "HOY"
                      }
                      onChange={() =>
                        setModoInicio(
                          "HOY"
                        )
                      }
                      className="mt-1"
                    />

                    <div>

                      <p className="font-semibold text-gray-900">
                        Comenzar hoy
                      </p>

                      <p className="mt-1 text-sm leading-5 text-gray-500">
                        La fecha oficial cambiará a hoy y todos los participantes comenzarán en el día 1.
                      </p>

                    </div>

                  </div>

                </label>

              </div>

            )}

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
                  ? "Procesando..."
                  : fechaFutura
                  ? "Programar grupo"
                  : "Confirmar inicio"}
              </button>

            </div>

          </div>
        </Modal>
      )}


      {confirmandoFinalizacion && (
        <Modal
          title="Finalizar grupo"
          onClose={() =>
            !procesando &&
            setConfirmandoFinalizacion(
              false
            )
          }
          maxWidthClassName="max-w-md"
        >
          <div className="space-y-5">

            <div className="rounded-2xl bg-emerald-50 p-4">

              <p className="font-semibold text-emerald-900">
                Se cerrará el seguimiento grupal
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-700">
                Los seguimientos activos de los {participantes} participante{participantes === 1 ? "" : "s"} pasarán a completados y conservarán todos sus registros, mediciones, gráficas y resultados.
              </p>

            </div>


            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">

              <p className="text-xs leading-5 text-amber-800">
                Después de finalizar el grupo ya no se podrá modificar su duración ni agregar nuevos participantes.
              </p>

            </div>


            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={
                  procesando
                }
                onClick={() =>
                  setConfirmandoFinalizacion(
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
                  finalizarGrupo
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />

                {procesando
                  ? "Finalizando..."
                  : "Confirmar finalización"}
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
