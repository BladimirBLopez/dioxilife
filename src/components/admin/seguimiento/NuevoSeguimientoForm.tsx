"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  toast,
} from "sonner";

import SelectorFecha from "@/components/admin/seguimiento/SelectorFecha";

type Plan = {
  id: string;
  nombre: string;
  duracionDias: number;
};

type Origen =
  | "WHATSAPP"
  | "LLAMADA"
  | "TIENDA"
  | "OTRO";

type ModoInicio =
  | "CERO"
  | "PLANTILLA";

export default function NuevoSeguimientoForm({
  planes,
}: {
  planes: Plan[];
}) {
  const router =
    useRouter();

  const [
    nombreCliente,
    setNombreCliente,
  ] =
    useState("");

  const [
    telefonoCliente,
    setTelefonoCliente,
  ] =
    useState("");

  const [
    origen,
    setOrigen,
  ] =
    useState<Origen>(
      "WHATSAPP"
    );

  const [
    referenciaCompra,
    setReferenciaCompra,
  ] =
    useState("");

  const [
    fechaInicioPrevista,
    setFechaInicioPrevista,
  ] =
    useState("");

  const [
    observacionInterna,
    setObservacionInterna,
  ] =
    useState("");

  const [
    modoInicio,
    setModoInicio,
  ] =
    useState<ModoInicio>(
      "CERO"
    );

  const [
    nombreProtocolo,
    setNombreProtocolo,
  ] =
    useState(
      "Protocolo personalizado"
    );

  const [
    duracionDias,
    setDuracionDias,
  ] =
    useState(
      "30"
    );

  const [
    planId,
    setPlanId,
  ] =
    useState(
      planes[0]?.id ||
      ""
    );

  const [
    procesando,
    setProcesando,
  ] =
    useState(false);

  const planSeleccionado =
    planes.find(
      (plan) =>
        plan.id ===
        planId
    ) ||
    null;

  async function crear(
    e: FormEvent
  ) {
    e.preventDefault();

    if (procesando) {
      return;
    }

    const telefono =
      telefonoCliente.replace(
        /\D/g,
        ""
      );

    if (
      !nombreCliente.trim()
    ) {
      toast.error(
        "Escribe el nombre del cliente."
      );
      return;
    }

    if (
      !/^[0-9]{8}$/.test(
        telefono
      )
    ) {
      toast.error(
        "El WhatsApp debe tener exactamente 8 números."
      );
      return;
    }

    if (
      modoInicio ===
        "PLANTILLA" &&
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
      modoInicio ===
        "CERO" &&
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

    setProcesando(
      true
    );

    const toastId =
      toast.loading(
        "Creando seguimiento..."
      );

    try {
      const res =
        await fetch(
          "/api/admin/seguimiento/clientes",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                pedidoId:
                  null,

                nombreCliente:
                  nombreCliente.trim(),

                telefonoCliente:
                  telefono,

                origen,

                referenciaCompra:
                  referenciaCompra.trim() ||
                  null,

                planId:
                  modoInicio ===
                  "PLANTILLA"
                    ? planId
                    : null,

                nombreProtocolo:
                  modoInicio ===
                  "CERO"
                    ? nombreProtocolo
                        .trim() ||
                      "Protocolo personalizado"
                    : null,

                duracionDias:
                  modoInicio ===
                  "CERO"
                    ? duracion
                    : null,

                fechaInicioPrevista:
                  fechaInicioPrevista ||
                  null,

                observacionInterna:
                  observacionInterna.trim() ||
                  null,
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(
            () =>
              null
          );

      if (!res.ok) {
        toast.error(
          "No se pudo crear el seguimiento",
          {
            id:
              toastId,

            description:
              data?.error ||
              "Revisa los datos e inténtalo nuevamente.",
          }
        );

        return;
      }

      toast.success(
        modoInicio ===
          "CERO"
          ? "Seguimiento creado"
          : "Plantilla aplicada",
        {
          id:
            toastId,

          description:
            "Ahora prepara el protocolo del cliente.",
        }
      );

      router.push(
        `/admin/seguimiento/clientes/${data.seguimiento.id}/preparar`
      );

    } catch {
      toast.error(
        "No se pudo conectar con el servidor",
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

  return (
    <form
      onSubmit={
        crear
      }
      className="mx-auto max-w-4xl space-y-5"
    >

      <section className="rounded-2xl bg-white p-5 shadow sm:p-6">

        <div className="mb-5">

          <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
            Paso 1
          </p>

          <h2 className="mt-1 text-xl font-semibold text-gray-900">
            Cliente
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            Registra los datos básicos. El protocolo se prepara en el siguiente paso.
          </p>

        </div>


        <div className="grid gap-5 md:grid-cols-2">

          <div>

            <label className="admin-label">
              Nombre del cliente *
            </label>

            <input
              value={
                nombreCliente
              }
              onChange={(e) =>
                setNombreCliente(
                  e.target.value
                )
              }
              className="admin-input"
              placeholder="Ej. María Pérez"
              maxLength={120}
              required
            />

          </div>


          <div>

            <label className="admin-label">
              WhatsApp *
            </label>

            <input
              type="tel"
              inputMode="numeric"
              value={
                telefonoCliente
              }
              onChange={(e) =>
                setTelefonoCliente(
                  e.target.value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
              className="admin-input"
              placeholder="Ej. 71234567"
              maxLength={8}
              required
            />

          </div>


          <div>

            <label className="admin-label">
              Origen
            </label>

            <select
              value={
                origen
              }
              onChange={(e) =>
                setOrigen(
                  e.target
                    .value as Origen
                )
              }
              className="admin-input"
            >

              <option value="WHATSAPP">
                WhatsApp
              </option>

              <option value="LLAMADA">
                Llamada
              </option>

              <option value="TIENDA">
                Tienda
              </option>

              <option value="OTRO">
                Otro
              </option>

            </select>

          </div>


          <div>

            <label className="admin-label">
              Inicio previsto
            </label>

            <SelectorFecha
              value={
                fechaInicioPrevista
              }
              onChange={
                setFechaInicioPrevista
              }
            />

          </div>

        </div>

      </section>


      <section className="rounded-2xl bg-white p-5 shadow sm:p-6">

        <div>

          <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
            Paso 2
          </p>

          <h2 className="mt-1 text-xl font-semibold text-gray-900">
            ¿Cómo quieres comenzar?
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            Puedes preparar el protocolo directamente o ahorrar tiempo usando una plantilla existente.
          </p>

        </div>


        <div className="mt-5 grid gap-3 md:grid-cols-2">

          <button
            type="button"
            onClick={() =>
              setModoInicio(
                "CERO"
              )
            }
            className={`rounded-2xl border p-5 text-left transition ${
              modoInicio ===
              "CERO"
                ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                : "border-gray-200 bg-white hover:border-violet-200"
            }`}
          >

            <div className="flex items-start gap-3">

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                  modoInicio ===
                  "CERO"
                    ? "bg-violet-600 text-white"
                    : "bg-gray-100"
                }`}
              >
                +
              </div>

              <div>

                <p className="font-semibold text-gray-900">
                  Crear protocolo desde cero
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Recomendado para protocolos personalizados.
                </p>

              </div>

            </div>

          </button>


          <button
            type="button"
            disabled={
              planes.length ===
              0
            }
            onClick={() =>
              setModoInicio(
                "PLANTILLA"
              )
            }
            className={`rounded-2xl border p-5 text-left transition ${
              modoInicio ===
              "PLANTILLA"
                ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                : "border-gray-200 bg-white hover:border-violet-200"
            } ${
              planes.length ===
              0
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
          >

            <div className="flex items-start gap-3">

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                  modoInicio ===
                  "PLANTILLA"
                    ? "bg-violet-600 text-white"
                    : "bg-gray-100"
                }`}
              >
                ≡
              </div>

              <div>

                <p className="font-semibold text-gray-900">
                  Usar una plantilla
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Carga un protocolo previamente guardado.
                </p>

              </div>

            </div>

          </button>

        </div>


        {modoInicio ===
          "CERO" && (

          <div className="mt-5 rounded-2xl border border-violet-100 bg-[#FBFAFF] p-4">

            <div className="grid gap-4 md:grid-cols-[1fr_180px]">

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
                  Duración *
                </label>

                <div className="relative">

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
                    className="admin-input pr-14"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    días
                  </span>

                </div>

              </div>

            </div>


            <p className="mt-3 text-xs leading-5 text-violet-700">
              En el siguiente paso agregarás las actividades, horarios, instrucciones y protocolos adicionales.
            </p>

          </div>

        )}


        {modoInicio ===
          "PLANTILLA" && (

          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">

            <label className="admin-label">
              Plantilla
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

              {planes.map(
                (plan) => (

                <option
                  key={
                    plan.id
                  }
                  value={
                    plan.id
                  }
                >
                  {plan.nombre} · {plan.duracionDias} días
                </option>

                )
              )}

            </select>


            {planSeleccionado && (

              <p className="mt-2 text-xs text-gray-500">
                Se copiará la plantilla y luego podrás personalizarla para este cliente.
              </p>

            )}

          </div>

        )}

      </section>


      <details className="rounded-2xl bg-white shadow">

        <summary className="cursor-pointer list-none p-5 text-sm font-semibold text-gray-700">
          Opciones adicionales
          <span className="ml-2 text-xs font-normal text-gray-400">
            compra, referencia y nota interna
          </span>
        </summary>


        <div className="space-y-4 border-t border-gray-100 p-5">

          <div>

            <label className="admin-label">
              Producto o referencia de compra
            </label>

            <input
              value={
                referenciaCompra
              }
              onChange={(e) =>
                setReferenciaCompra(
                  e.target.value
                )
              }
              className="admin-input"
              placeholder="Ej. Kit, compra por WhatsApp..."
              maxLength={500}
            />

          </div>


          <div>

            <label className="admin-label">
              Nota interna
            </label>

            <textarea
              value={
                observacionInterna
              }
              onChange={(e) =>
                setObservacionInterna(
                  e.target.value
                )
              }
              className="admin-input min-h-24 resize-y"
              placeholder="Información interna..."
              maxLength={1500}
            />

          </div>

        </div>

      </details>


      <div className="sticky bottom-3 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur">

        <button
          type="submit"
          disabled={
            procesando ||
            (
              modoInicio ===
                "PLANTILLA" &&
              !planId
            )
          }
          className="admin-btn-primary w-full py-3 disabled:opacity-50"
        >
          {procesando
            ? "Creando seguimiento..."
            : "Crear y preparar protocolo →"}
        </button>

      </div>

    </form>
  );
}
