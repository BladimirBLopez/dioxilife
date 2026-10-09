"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import SelectorFecha from "@/components/admin/seguimiento/SelectorFecha";

type Plan = {
  id: string;
  nombre: string;
  duracionDias: number;
};

type ModoInicio =
  | "CERO"
  | "PLANTILLA";

type Seguimiento = {
  id: string;

  estado:
    | "PENDIENTE"
    | "ACTIVO"
    | "PAUSADO"
    | "COMPLETADO"
    | "CANCELADO";

  preparadoAt: string | Date | null;

  fechaInicioPrevista: string | Date | null;
  fechaInicio: string | Date | null;
  fechaFinalizado: string | Date | null;
  ultimoAccesoAt: string | Date | null;
  observacionInterna: string | null;

  nombrePlan: string;
  duracionDias: number;

  plan: {
    id: string;
    nombre: string;
    duracionDias: number;
  } | null;
};

type Props = {
  pedidoId: string;
  estadoPedido: string;
  planes: Plan[];
  seguimientos: Seguimiento[];
};

export default function SeguimientoPedido({
  pedidoId,
  estadoPedido,
  planes,
  seguimientos,
}: Props) {
  const router = useRouter();

  const vigente =
    seguimientos.find(
      (seguimiento) =>
        seguimiento.estado === "PENDIENTE" ||
        seguimiento.estado === "ACTIVO" ||
        seguimiento.estado === "PAUSADO"
    ) || null;

  const [
    modoInicio,
    setModoInicio,
  ] = useState<ModoInicio>(
    "CERO"
  );

  const [planId, setPlanId] = useState(
    planes[0]?.id || ""
  );

  const [
    nombreProtocolo,
    setNombreProtocolo,
  ] = useState(
    "Protocolo personalizado"
  );

  const [
    duracionDias,
    setDuracionDias,
  ] = useState(
    "30"
  );

  const [
    fechaInicioPrevista,
    setFechaInicioPrevista,
  ] = useState("");

  const [
    observacionInterna,
    setObservacionInterna,
  ] = useState("");

  const [procesando, setProcesando] =
    useState(false);

  const pedidoHabilitado =
    estadoPedido === "PAGADO" ||
    estadoPedido === "COMPLETADO";

  async function asignar() {
    if (procesando) {
      return;
    }

    if (
      modoInicio === "PLANTILLA" &&
      !planId
    ) {
      toast.error(
        "Selecciona una plantilla."
      );
      return;
    }

    const duracion =
      Number(
        duracionDias
      );

    if (
      modoInicio === "CERO" &&
      (
        !Number.isInteger(
          duracion
        ) ||
        duracion < 1 ||
        duracion > 365
      )
    ) {
      toast.error(
        "La duración debe estar entre 1 y 365 días."
      );
      return;
    }

    const confirmar =
      window.confirm(
        modoInicio === "PLANTILLA"
          ? "¿Deseas crear el seguimiento usando esta plantilla?"
          : "¿Deseas crear un seguimiento personalizado desde cero?"
      );

    if (!confirmar) {
      return;
    }

    setProcesando(true);

    const toastId =
      toast.loading(
        "Asignando seguimiento..."
      );

    try {
      const res = await fetch(
        "/api/admin/seguimiento/clientes",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            pedidoId,

            planId:
              modoInicio === "PLANTILLA"
                ? planId
                : null,

            nombreProtocolo:
              modoInicio === "CERO"
                ? nombreProtocolo.trim() ||
                  "Protocolo personalizado"
                : null,

            duracionDias:
              modoInicio === "CERO"
                ? duracion
                : null,

            fechaInicioPrevista:
              fechaInicioPrevista || null,

            observacionInterna:
              observacionInterna.trim() ||
              null,
          }),
        }
      );

      const data =
        await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(
          "No se pudo asignar el seguimiento",
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
        modoInicio === "PLANTILLA"
          ? "Plantilla aplicada correctamente"
          : "Seguimiento creado correctamente",
        {
          id: toastId,
          description:
            "Ahora prepara el protocolo antes de enviarlo al cliente.",
        }
      );

      router.push(
        `/admin/seguimiento/clientes/${data.seguimiento.id}/preparar`
      );
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

  function formatoFecha(
    fecha: string | Date | null
  ) {
    if (!fecha) {
      return null;
    }

    return new Date(fecha).toLocaleDateString(
      "es-BO",
      {
        timeZone: "UTC",
      }
    );
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow">

      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Seguimiento del cliente
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          La asignación es manual. Administración decide qué plan corresponde a cada pedido.
        </p>
      </div>


      {!pedidoHabilitado ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">

          <p className="text-sm font-medium text-gray-700">
            Seguimiento todavía no disponible
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Primero debe aprobarse el pago del pedido.
          </p>

        </div>

      ) : vigente ? (

        <div className="mt-4 space-y-4">

          <div className="rounded-xl border border-violet-100 bg-[#F8F6FF] p-4">

            <div className="flex flex-wrap items-start justify-between gap-3">

              <div>
                <p className="text-xs font-medium text-gray-500">
                  Protocolo
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {vigente.nombrePlan}
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  {vigente.duracionDias} días
                </p>
              </div>

              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                {vigente.estado}
              </span>

            </div>


            {vigente.fechaInicioPrevista && (
              <div className="mt-4">

                <p className="text-xs text-gray-500">
                  Inicio previsto
                </p>

                <p className="mt-1 text-sm font-medium text-gray-800">
                  {formatoFecha(
                    vigente.fechaInicioPrevista
                  )}
                </p>

              </div>
            )}


            {vigente.observacionInterna && (
              <div className="mt-4">

                <p className="text-xs text-gray-500">
                  Observación interna
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {vigente.observacionInterna}
                </p>

              </div>
            )}


            <div className="mt-4 flex flex-wrap gap-2 border-t border-violet-100 pt-4">

              <Link
                href={
                  vigente.estado === "PENDIENTE" &&
                  !vigente.preparadoAt
                    ? `/admin/seguimiento/clientes/${vigente.id}/preparar`
                    : `/admin/seguimiento/clientes/${vigente.id}`
                }
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
                  vigente.estado === "PENDIENTE" &&
                  !vigente.preparadoAt
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-violet-600 hover:bg-violet-700"
                }`}
              >
                {vigente.estado === "PENDIENTE" &&
                !vigente.preparadoAt
                  ? "Continuar preparación →"
                  : "Administrar seguimiento"}
              </Link>

            </div>

            <div className="mt-4 border-t border-violet-100 pt-4">

              {vigente.ultimoAccesoAt ? (
                <p className="text-xs text-green-700">
                  Último acceso del cliente:{" "}
                  {new Date(
                    vigente.ultimoAccesoAt
                  ).toLocaleString(
                    "es-BO",
                    {
                      timeZone:
                        "America/La_Paz",
                    }
                  )}
                </p>
              ) : (
                <p className="text-xs text-amber-700">
                  El cliente todavía no ha abierto su seguimiento.
                </p>
              )}

            </div>

          </div>



        </div>

      ) : (

        <div className="mt-5 space-y-4">

          <div>

            <p className="text-sm font-semibold text-gray-900">
              ¿Cómo quieres comenzar?
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Puedes preparar un protocolo personalizado o usar una plantilla existente.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={() =>
                  setModoInicio(
                    "CERO"
                  )
                }
                className={`rounded-xl border p-4 text-left transition ${
                  modoInicio === "CERO"
                    ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                    : "border-gray-200 bg-white hover:border-violet-200"
                }`}
              >
                <p className="font-semibold text-gray-900">
                  Crear desde cero
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Para un protocolo personalizado.
                </p>
              </button>


              <button
                type="button"
                disabled={
                  planes.length === 0
                }
                onClick={() =>
                  setModoInicio(
                    "PLANTILLA"
                  )
                }
                className={`rounded-xl border p-4 text-left transition ${
                  modoInicio === "PLANTILLA"
                    ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                    : "border-gray-200 bg-white hover:border-violet-200"
                } ${
                  planes.length === 0
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                <p className="font-semibold text-gray-900">
                  Usar plantilla
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {planes.length === 0
                    ? "No hay plantillas activas disponibles."
                    : "Copia un protocolo existente."}
                </p>
              </button>

            </div>

          </div>


          {modoInicio === "CERO" ? (

            <div className="grid gap-4 rounded-xl border border-violet-100 bg-violet-50/40 p-4 sm:grid-cols-[1fr_150px]">

              <div>
                <label className="admin-label">
                  Nombre del protocolo
                </label>

                <input
                  value={
                    nombreProtocolo
                  }
                  onChange={(e) =>
                    setNombreProtocolo(
                      e.target.value
                    )
                  }
                  className="admin-input"
                  maxLength={200}
                  placeholder="Protocolo personalizado"
                />
              </div>


              <div>
                <label className="admin-label">
                  Duración
                </label>

                <input
                  type="number"
                  min={1}
                  max={365}
                  value={
                    duracionDias
                  }
                  onChange={(e) =>
                    setDuracionDias(
                      e.target.value
                    )
                  }
                  className="admin-input"
                />
              </div>

            </div>

          ) : (

            <div>
              <label className="admin-label">
                Plantilla de seguimiento
              </label>

              <select
                value={
                  planId
                }
                onChange={(e) =>
                  setPlanId(
                    e.target.value
                  )
                }
                className="admin-input"
              >
                {planes.map((plan) => (
                  <option
                    key={plan.id}
                    value={plan.id}
                  >
                    {plan.nombre} ·{" "}
                    {plan.duracionDias} días
                  </option>
                ))}
              </select>

              <p className="mt-1 text-xs text-gray-500">
                Se copiará la plantilla y luego podrás personalizarla para este cliente.
              </p>
            </div>

          )}


          <div>
            <label className="admin-label">
              Fecha prevista de inicio
            </label>

            <SelectorFecha
              value={
                fechaInicioPrevista
              }
              onChange={
                setFechaInicioPrevista
              }
            />

            <p className="mt-1 text-xs text-gray-500">
              Es informativa. El seguimiento no comenzará automáticamente.
            </p>
          </div>


          <div>
            <label className="admin-label">
              Observación interna
            </label>

            <textarea
              value={observacionInterna}
              onChange={(e) =>
                setObservacionInterna(
                  e.target.value
                )
              }
              rows={3}
              maxLength={1500}
              className="admin-input"
              placeholder="Ej. Cliente indicó que desea comenzar el lunes."
            />

            <p className="mt-1 text-xs text-gray-500">
              Solo visible para administración.
            </p>
          </div>


          <button
            type="button"
            disabled={
              procesando ||
              (
                modoInicio ===
                  "PLANTILLA" &&
                !planId
              )
            }
            onClick={() =>
              void asignar()
            }
            className="admin-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {procesando
              ? "Asignando..."
              : "Crear y preparar protocolo →"}
          </button>

        </div>

      )}

    </section>
  );
}
