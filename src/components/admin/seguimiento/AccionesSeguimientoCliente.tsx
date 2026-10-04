"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { abrirWhatsApp } from "@/lib/whatsapp-cliente";
import BotonInformeSeguimiento from "@/components/admin/seguimiento/BotonInformeSeguimiento";

export default function AccionesSeguimientoCliente({
  seguimientoId,
  tieneTelefono,
  haEnviado,
  puedeDescargarInforme,
}: {
  seguimientoId: string;
  tieneTelefono: boolean;
  haEnviado: boolean;
  puedeDescargarInforme: boolean;
}) {
  const router = useRouter();

  const [procesando, setProcesando] =
    useState(false);


  async function enviarWhatsApp(
    nuevoEnlace: boolean
  ) {
    if (procesando) {
      return;
    }

    if (
      nuevoEnlace &&
      !window.confirm(
        "Se generará un enlace nuevo y el anterior dejará de funcionar para el cliente. ¿Continuar?"
      )
    ) {
      return;
    }

    if (
      !nuevoEnlace &&
      !haEnviado &&
      !window.confirm(
        "Este será el primer envío registrado. Se generará un enlace de acceso para el cliente. Si habías copiado otro enlace anteriormente, ese enlace dejará de funcionar. ¿Continuar?"
      )
    ) {
      return;
    }

    setProcesando(true);

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/enviar-whatsapp${
            nuevoEnlace ? "?nuevo=1" : ""
          }`,
          {
            method: "POST",
          }
        );


      const data =
        await res.json().catch(() => null);


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
        data.reutilizado
          ? "WhatsApp listo (enlace vigente reutilizado)"
          : "WhatsApp listo con enlace nuevo"
      );


      router.refresh();


    } catch (error) {

      toast.error(
        error instanceof Error
          ? error.message
          : "Error enviando WhatsApp"
      );

    } finally {

      setProcesando(false);

    }
  }


  return (
    <div className="flex flex-col gap-2 sm:flex-row">

      <button
        type="button"
        disabled={procesando || !tieneTelefono}
        onClick={() =>
          void enviarWhatsApp(false)
        }
        className="inline-flex flex-1 items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50 sm:flex-none"
      >
        {procesando
          ? "Preparando..."
          : haEnviado
          ? "📱 Reenviar por WhatsApp"
          : "📱 Generar enlace y enviar"}
      </button>


      {puedeDescargarInforme && (
        <BotonInformeSeguimiento
          seguimientoId={
            seguimientoId
          }
        />
      )}


      {haEnviado && (
        <button
          type="button"
          disabled={procesando || !tieneTelefono}
          onClick={() =>
            void enviarWhatsApp(true)
          }
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:flex-none"
        >
          🔄 Enlace nuevo
        </button>
      )}

    </div>
  );
}
