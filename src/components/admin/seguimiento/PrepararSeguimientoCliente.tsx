"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import {
  abrirWhatsApp,
} from "@/lib/whatsapp-cliente";

type Props = {
  seguimientoId: string;
  nombreCliente: string;
  nombrePlan: string;
  duracionDias: number;
  pesoInicial: number | null;
  observacionDia1: string | null;
  cantidadPrincipales: number;
  cantidadAdicionales: number;
  tieneTelefono: boolean;
};

export default function PrepararSeguimientoCliente({
  seguimientoId,
  nombreCliente,
  nombrePlan,
  duracionDias,
  pesoInicial,
  observacionDia1,
  cantidadPrincipales,
  cantidadAdicionales,
  tieneTelefono,
}: Props) {
  const [
    peso,
    setPeso,
  ] =
    useState(
      pesoInicial === null
        ? ""
        : String(pesoInicial)
    );

  const [
    pesoGuardado,
    setPesoGuardado,
  ] =
    useState<number | null>(
      pesoInicial
    );

  const [
    guardandoPeso,
    setGuardandoPeso,
  ] =
    useState(false);

  const [
    finalizando,
    setFinalizando,
  ] =
    useState(false);

  const [
    enlace,
    setEnlace,
  ] =
    useState<string | null>(
      null
    );

  const [
    token,
    setToken,
  ] =
    useState<string | null>(
      null
    );

  const [
    enviando,
    setEnviando,
  ] =
    useState(false);

  async function guardarPeso() {
    if (guardandoPeso) {
      return;
    }

    setGuardandoPeso(
      true
    );

    const toastId =
      toast.loading(
        "Guardando peso inicial..."
      );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/registro-diario/1`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                peso:
                  peso.trim() ||
                  null,

                observacion:
                  observacionDia1,
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          "No se pudo guardar el peso",
          {
            id: toastId,

            description:
              data?.error ||
              "Revisa el dato ingresado.",
          }
        );

        return;
      }

      const nuevoPeso =
        data?.registro?.peso ??
        data?.peso ??
        null;

      setPesoGuardado(
        nuevoPeso === null
          ? null
          : Number(
              nuevoPeso
            )
      );

      toast.success(
        peso.trim()
          ? "Peso inicial guardado"
          : "Peso inicial dejado pendiente",
        {
          id: toastId,
        }
      );

    } catch {
      toast.error(
        "No se pudo conectar con el servidor",
        {
          id: toastId,
        }
      );

    } finally {
      setGuardandoPeso(
        false
      );
    }
  }


  async function finalizarPreparacion() {
    if (finalizando) {
      return;
    }

    setFinalizando(
      true
    );

    const toastId =
      toast.loading(
        "Generando enlace definitivo..."
      );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/finalizar-preparacion`,
          {
            method: "POST",
          }
        );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          "No se pudo finalizar la preparación",
          {
            id: toastId,

            description:
              data?.error ||
              "Inténtalo nuevamente.",
          }
        );

        return;
      }

      const nuevoToken =
        String(
          data.token || ""
        );

      if (!nuevoToken) {
        throw new Error(
          "No se recibió el nuevo enlace."
        );
      }

      const nuevoEnlace =
        `${window.location.origin}/seguimiento/${nuevoToken}`;

      setToken(
        nuevoToken
      );

      setEnlace(
        nuevoEnlace
      );

      toast.success(
        "Preparación finalizada",
        {
          id: toastId,

          description:
            "El enlace del cliente ya está listo para enviar.",
        }
      );

    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo finalizar la preparación.",
        {
          id: toastId,
        }
      );

    } finally {
      setFinalizando(
        false
      );
    }
  }


  async function copiarEnlace() {
    if (!enlace) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        enlace
      );

      toast.success(
        "Enlace copiado"
      );

    } catch {
      toast.error(
        "No se pudo copiar el enlace"
      );
    }
  }


  async function enviarWhatsApp() {
    if (
      !token ||
      enviando
    ) {
      return;
    }

    setEnviando(
      true
    );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/enviar-whatsapp`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                token,
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
            "No se pudo preparar el WhatsApp."
        );
      }

      abrirWhatsApp(
        data.telefono,
        data.mensaje
      );

      toast.success(
        "WhatsApp listo y registrado"
      );

    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo preparar WhatsApp."
      );

    } finally {
      setEnviando(
        false
      );
    }
  }


  return (
    <div className="space-y-4">

      <section className="overflow-hidden rounded-xl bg-white shadow">

        <div className="border-b border-gray-100 p-5">

          <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
            Paso 2 de 2
          </p>

          <h2 className="mt-1 text-xl font-semibold text-gray-900">
            Preparar seguimiento
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Revisa todo antes de enviar el enlace al cliente.
          </p>

        </div>


        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl bg-gray-50 p-4">

            <p className="text-xs text-gray-500">
              Cliente
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {nombreCliente}
            </p>

          </div>


          <div className="rounded-xl bg-gray-50 p-4">

            <p className="text-xs text-gray-500">
              Plan
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {nombrePlan}
            </p>

            <p className="mt-0.5 text-xs text-gray-500">
              {duracionDias} días
            </p>

          </div>


          <div className="rounded-xl bg-blue-50 p-4">

            <p className="text-xs text-blue-700">
              Protocolo principal
            </p>

            <p className="mt-1 text-xl font-bold text-blue-800">
              {cantidadPrincipales}
            </p>

            <p className="text-xs text-blue-700">
              actividades
            </p>

          </div>


          <div className="rounded-xl bg-purple-50 p-4">

            <p className="text-xs text-purple-700">
              Adicionales
            </p>

            <p className="mt-1 text-xl font-bold text-purple-800">
              {cantidadAdicionales}
            </p>

            <p className="text-xs text-purple-700">
              protocolos
            </p>

          </div>

        </div>

      </section>


      <section className="rounded-xl bg-white p-5 shadow">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-700">
            1
          </div>

          <div className="min-w-0 flex-1">

            <h3 className="font-semibold text-gray-900">
              Peso inicial
            </h3>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              Es opcional. Si no se registra ahora, el primer peso ingresado posteriormente será tomado como peso inicial.
            </p>


            <div className="mt-4 flex max-w-sm items-end gap-2">

              <div className="flex-1">

                <label className="admin-label">
                  Peso inicial (kg)
                </label>

                <input
                  type="text"
                  inputMode="decimal"
                  value={peso}
                  onChange={(e) =>
                    setPeso(
                      e.target.value
                    )
                  }
                  className="admin-input"
                  placeholder="Ej. 78.5"
                />

              </div>


              <button
                type="button"
                disabled={
                  guardandoPeso
                }
                onClick={() =>
                  void guardarPeso()
                }
                className="admin-btn-primary disabled:opacity-60"
              >
                {guardandoPeso
                  ? "Guardando..."
                  : "Guardar"}
              </button>

            </div>


            <p className="mt-2 text-xs text-gray-500">
              {pesoGuardado === null
                ? "Peso inicial aún no registrado."
                : `Peso inicial registrado: ${pesoGuardado} kg`}
            </p>

          </div>

        </div>

      </section>


      <section className="rounded-xl border border-violet-100 bg-[#F8F6FF] p-5">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 font-bold text-violet-700">
            2
          </div>

          <div>

            <h3 className="font-semibold text-gray-900">
              Revisa la agenda
            </h3>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              Debajo puedes revisar las actividades principales, corregirlas y agregar los protocolos adicionales que correspondan al cliente.
            </p>

            <p className="mt-2 text-xs font-medium text-violet-700">
              Los protocolos adicionales creados ahora comenzarán desde el Día 1.
            </p>

          </div>

        </div>

      </section>


      <section className="rounded-xl bg-white p-5 shadow">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 font-bold text-green-700">
            3
          </div>

          <div className="min-w-0 flex-1">

            <h3 className="font-semibold text-gray-900">
              Finalizar preparación
            </h3>

            {!enlace ? (
              <>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Cuando todo esté correcto, genera el enlace que enviarás al cliente.
                </p>

                <button
                  type="button"
                  disabled={
                    finalizando
                  }
                  onClick={() =>
                    void finalizarPreparacion()
                  }
                  className="admin-btn-primary mt-4 disabled:opacity-60"
                >
                  {finalizando
                    ? "Generando..."
                    : "Finalizar preparación y generar enlace"}
                </button>

              </>
            ) : (
              <>

                <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4">

                  <p className="font-semibold text-green-800">
                    ✓ Seguimiento preparado
                  </p>

                  <p className="mt-1 text-sm leading-6 text-green-700">
                    El seguimiento todavía está pendiente. Comenzará cuando el cliente abra el enlace y pulse “Iniciar mi seguimiento”.
                  </p>


                  <div className="mt-3 rounded-lg bg-white p-3">

                    <p className="break-all text-xs leading-5 text-green-800">
                      {enlace}
                    </p>

                  </div>

                </div>


                <div className="mt-4 flex flex-wrap gap-2">

                  {tieneTelefono && (
                    <button
                      type="button"
                      disabled={
                        enviando
                      }
                      onClick={() =>
                        void enviarWhatsApp()
                      }
                      className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {enviando
                        ? "Preparando..."
                        : "📱 Enviar por WhatsApp"}
                    </button>
                  )}


                  <button
                    type="button"
                    onClick={() =>
                      void copiarEnlace()
                    }
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Copiar enlace
                  </button>


                  <Link
                    href={`/admin/seguimiento/clientes/${seguimientoId}`}
                    className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50"
                  >
                    Ir al seguimiento
                  </Link>

                </div>

              </>
            )}

          </div>

        </div>

      </section>


      {!enlace && (
        <div className="text-center">

          <Link
            href={`/admin/seguimiento/clientes/${seguimientoId}`}
            className="text-sm font-medium text-gray-500 underline underline-offset-4 hover:text-gray-800"
          >
            Guardar y continuar después
          </Link>

        </div>
      )}

    </div>
  );
}
