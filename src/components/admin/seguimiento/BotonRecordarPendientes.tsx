"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { abrirWhatsApp } from "@/lib/whatsapp-cliente";

export default function BotonRecordarPendientes({
  seguimientoId,
}: {
  seguimientoId: string;
}) {
  const router = useRouter();

  const [procesando, setProcesando] =
    useState(false);


  async function recordar() {
    if (procesando) {
      return;
    }

    setProcesando(true);

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/recordar-whatsapp`,
          {
            method: "POST",
          }
        );


      const data =
        await res.json().catch(() => null);


      if (!res.ok) {
        throw new Error(
          data?.error ||
          "No se pudo preparar el recordatorio."
        );
      }


      abrirWhatsApp(
        data.telefono,
        data.mensaje
      );


      toast.success(
        "Recordatorio listo en WhatsApp"
      );


      router.refresh();


    } catch (error) {

      toast.error(
        error instanceof Error
          ? error.message
          : "Error preparando el recordatorio"
      );

    } finally {

      setProcesando(false);

    }
  }


  return (
    <button
      type="button"
      disabled={procesando}
      onClick={() =>
        void recordar()
      }
      className="inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50 sm:w-auto"
    >
      {procesando
        ? "Preparando..."
        : "📱 Recordarle lo pendiente"}
    </button>
  );
}
