"use client";

import {
  CheckCircle2,
  Loader2,
  PackageCheck,
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

type Props = {
  id: string;
  estado: string;
};

export default function AccionesCompra({
  id,
  estado,
}: Props) {
  const router =
    useRouter();

  const [
    procesando,
    setProcesando,
  ] =
    useState(false);


  async function recibirCompra() {
    if (procesando) {
      return;
    }

    const aceptar =
      window.confirm(
        "¿Confirmas que la mercadería fue recibida? Al confirmar, el stock aumentará automáticamente."
      );

    if (!aceptar) {
      return;
    }


    setProcesando(true);

    const toastId =
      toast.loading(
        "Confirmando recepción..."
      );


    try {
      const respuesta =
        await fetch(
          `/api/admin/compras/${id}/recibir`,
          {
            method: "POST",
          }
        );


      const datos =
        await respuesta.json();


      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
          "No se pudo confirmar la recepción"
        );
      }


      toast.success(
        "Compra recibida correctamente",
        {
          id: toastId,

          description:
            "El inventario fue actualizado automáticamente.",
        }
      );


      router.refresh();

    } catch (error) {
      console.error(
        error
      );


      toast.error(
        "No se pudo confirmar la recepción",
        {
          id: toastId,

          description:
            error instanceof Error
              ? error.message
              : "Inténtalo nuevamente.",
        }
      );

    } finally {
      setProcesando(false);
    }
  }


  if (
    estado ===
    "RECIBIDA"
  ) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">

        <div className="flex gap-3">

          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

          <div>

            <p className="text-sm font-semibold text-emerald-700">
              Mercadería recibida
            </p>

            <p className="mt-1 text-xs text-emerald-600">
              El stock ya fue actualizado automáticamente.
            </p>

          </div>

        </div>

      </div>
    );
  }


  if (
    estado ===
    "ANULADA"
  ) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4">

        <p className="text-sm font-semibold text-red-600">
          Compra anulada
        </p>

        <p className="mt-1 text-xs text-red-500">
          Esta compra no puede ingresar al inventario.
        </p>

      </div>
    );
  }


  return (
    <button
      type="button"
      disabled={
        procesando
      }
      onClick={() => {
        void recibirCompra();
      }}
      className="admin-btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
    >

      {procesando ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <PackageCheck className="h-4 w-4" />
          Confirmar recepción
        </>
      )}

    </button>
  );
}
