"use client";

import {
  Ban,
  Check,
  CheckCircle2,
  Loader2,
  WalletCards,
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
  actualizarEstadoComision,
} from "./acciones";

type Props = {
  id: string;
  estado: string;
};

type EstadoDestino =
  | "APROBADA"
  | "PAGADA"
  | "ANULADA";

export default function AccionesComision({
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
    carga: string,
    exito: string
  ) {
    if (procesando) {
      return;
    }

    setProcesando(
      nuevoEstado
    );

    const toastId =
      toast.loading(carga);

    try {
      await actualizarEstadoComision(
        id,
        nuevoEstado
      );

      toast.success(
        exito,
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
        "No se pudo actualizar la comisión.",
        {
          id: toastId,

          description:
            "La comisión pudo haber cambiado de estado o no tienes autorización.",
        }
      );

    } finally {
      setProcesando(null);
    }
  }


  if (
    estado ===
    "PAGADA"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">

        <CheckCircle2 className="h-3.5 w-3.5" />

        Finalizada

      </span>
    );
  }


  if (
    estado ===
    "ANULADA"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">

        <Ban className="h-3.5 w-3.5" />

        Anulada

      </span>
    );
  }


  return (
    <div className="flex flex-wrap gap-2">

      {estado ===
        "PENDIENTE" && (

        <button
          type="button"
          disabled={
            Boolean(
              procesando
            )
          }
          onClick={() => {
            void ejecutar(
              "APROBADA",
              "Aprobando comisión...",
              "Comisión aprobada correctamente"
            );
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {procesando ===
          "APROBADA" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}

          Aprobar
        </button>

      )}


      {estado ===
        "APROBADA" && (

        <button
          type="button"
          disabled={
            Boolean(
              procesando
            )
          }
          onClick={() => {
            void ejecutar(
              "PAGADA",
              "Registrando pago...",
              "Comisión marcada como pagada"
            );
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {procesando ===
          "PAGADA" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <WalletCards className="h-3.5 w-3.5" />
          )}

          Marcar pagada
        </button>

      )}


      {(estado ===
        "PENDIENTE" ||
        estado ===
          "APROBADA") && (

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
                "¿Deseas anular esta comisión?"
              );

            if (!aceptar) {
              return;
            }

            void ejecutar(
              "ANULADA",
              "Anulando comisión...",
              "Comisión anulada"
            );
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {procesando ===
          "ANULADA" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Ban className="h-3.5 w-3.5" />
          )}

          Anular
        </button>

      )}

    </div>
  );
}
