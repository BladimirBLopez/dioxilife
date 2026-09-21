"use client";

import {
  Check,
  CheckCircle2,
  CircleX,
  Loader2,
  PackageCheck,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  useState,
} from "react";

import {
  toast,
} from "sonner";

import {
  actualizarEstadoPedido,
} from "./acciones";

type Props = {
  id: string;
  estado: string;
};

type EstadoDestino =
  | "CONFIRMADO"
  | "PAGADO"
  | "COMPLETADO"
  | "CANCELADO";

export default function AccionesPedido({
  id,
  estado,
}: Props) {
  const router =
    useRouter();

  const [
    procesando,
    setProcesando,
  ] =
    useState<string | null>(
      null
    );


  async function ejecutar(
    nuevoEstado: EstadoDestino,
    mensajeCarga: string,
    mensajeExito: string
  ) {
    if (procesando) {
      return;
    }

    setProcesando(
      nuevoEstado
    );

    const toastId =
      toast.loading(
        mensajeCarga
      );

    try {
      await actualizarEstadoPedido(
        id,
        nuevoEstado
      );

      toast.success(
        mensajeExito,
        {
          id: toastId,
        }
      );

      router.refresh();

    } catch (error) {
      console.error(
        error
      );

      toast.error(
        "No se pudo completar la operación.",
        {
          id: toastId,

          description:
            "Verifica el estado del pedido e inténtalo nuevamente.",
        }
      );

    } finally {
      setProcesando(null);
    }
  }


  function BotonProcesando({
    accion,
    children,
  }: {
    accion: string;
    children:
      React.ReactNode;
  }) {
    if (
      procesando !== accion
    ) {
      return children;
    }

    return (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        Procesando...
      </>
    );
  }


  if (
    estado ===
    "COMPLETADO"
  ) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">

        <div className="flex gap-3">

          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

          <div>

            <p className="text-sm font-semibold text-emerald-700">
              Pedido completado
            </p>

            <p className="mt-1 text-xs text-emerald-600">
              La operación comercial fue finalizada correctamente.
            </p>

          </div>

        </div>

      </div>
    );
  }


  if (
    estado ===
    "CANCELADO"
  ) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4">

        <div className="flex gap-3">

          <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

          <div>

            <p className="text-sm font-semibold text-red-600">
              Pedido cancelado
            </p>

            <p className="mt-1 text-xs text-red-500">
              Este pedido ya no puede continuar con el flujo comercial.
            </p>

          </div>

        </div>

      </div>
    );
  }


  if (
    estado ===
    "CONFIRMADO"
  ) {
    return (
      <div className="space-y-4">

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

          <p className="text-sm font-semibold text-blue-700">
            Esperando reporte de pago
          </p>

          <p className="mt-1 text-xs text-blue-600">
            El vendedor debe reportar el pago desde su panel.
          </p>

        </div>


        <button
          type="button"
          disabled={
            Boolean(
              procesando
            )
          }
          onClick={() => {
            const aceptar =
              window.confirm(
                "¿Deseas cancelar este pedido?"
              );

            if (!aceptar) {
              return;
            }

            void ejecutar(
              "CANCELADO",
              "Cancelando pedido...",
              "Pedido cancelado correctamente"
            );
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <BotonProcesando accion="CANCELADO">
            <X className="h-4 w-4" />
            Cancelar pedido
          </BotonProcesando>
        </button>

      </div>
    );
  }


  if (
    estado ===
    "PAGO_REPORTADO"
  ) {
    return (
      <div className="space-y-4">

        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">

          <p className="font-semibold text-orange-700">
            Pago reportado
          </p>

          <p className="mt-1 text-sm text-orange-600">
            El vendedor indicó que el cliente realizó el pago. Verifica el pago antes de aprobarlo.
          </p>

        </div>


        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            disabled={
              Boolean(
                procesando
              )
            }
            onClick={() => {
              void ejecutar(
                "PAGADO",
                "Aprobando pago...",
                "Pago aprobado correctamente"
              );
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BotonProcesando accion="PAGADO">
              <ShieldCheck className="h-4 w-4" />
              Aprobar pago
            </BotonProcesando>
          </button>


          <button
            type="button"
            disabled={
              Boolean(
                procesando
              )
            }
            onClick={() => {
              void ejecutar(
                "CONFIRMADO",
                "Rechazando reporte...",
                "Reporte de pago rechazado"
              );
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BotonProcesando accion="CONFIRMADO">
              <X className="h-4 w-4" />
              Rechazar reporte
            </BotonProcesando>
          </button>

        </div>

      </div>
    );
  }


  if (
    estado ===
    "PAGADO"
  ) {
    return (
      <div className="space-y-4">

        <div className="rounded-xl border border-green-100 bg-green-50 p-4">

          <div className="flex gap-3">

            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

            <div>

              <p className="text-sm font-semibold text-green-700">
                Pago aprobado
              </p>

              <p className="mt-1 text-xs text-green-600">
                El pago fue validado por administración.
              </p>

            </div>

          </div>

        </div>


        <button
          type="button"
          disabled={
            Boolean(
              procesando
            )
          }
          onClick={() => {
            void ejecutar(
              "COMPLETADO",
              "Completando pedido...",
              "Pedido completado correctamente"
            );
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <BotonProcesando accion="COMPLETADO">
            <PackageCheck className="h-4 w-4" />
            Completar pedido
          </BotonProcesando>
        </button>

      </div>
    );
  }


  return (
    <div className="flex flex-wrap gap-2">

      {estado ===
        "NUEVO" && (
        <>
          <button
            type="button"
            disabled={
              Boolean(
                procesando
              )
            }
            onClick={() => {
              void ejecutar(
                "CONFIRMADO",
                "Confirmando pedido...",
                "Pedido confirmado correctamente"
              );
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BotonProcesando accion="CONFIRMADO">
              <Check className="h-4 w-4" />
              Confirmar pedido
            </BotonProcesando>
          </button>


          <button
            type="button"
            disabled={
              Boolean(
                procesando
              )
            }
            onClick={() => {
              const aceptar =
                window.confirm(
                  "¿Deseas cancelar este pedido?"
                );

              if (!aceptar) {
                return;
              }

              void ejecutar(
                "CANCELADO",
                "Cancelando pedido...",
                "Pedido cancelado correctamente"
              );
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BotonProcesando accion="CANCELADO">
              <X className="h-4 w-4" />
              Cancelar pedido
            </BotonProcesando>
          </button>
        </>
      )}

    </div>
  );
}
