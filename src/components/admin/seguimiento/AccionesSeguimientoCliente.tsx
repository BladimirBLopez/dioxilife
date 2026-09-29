"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { abrirWhatsApp } from "@/lib/whatsapp-cliente";

type UltimoEnvio = {
  fechaEnvio: Date | string;
  enviadoPorUsuario: string | null;
} | null;

export default function AccionesSeguimientoCliente({
  seguimientoId,
  ultimoEnvio,
}: {
  seguimientoId: string;
  ultimoEnvio: UltimoEnvio;
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
    <div className="flex w-full flex-col gap-3 sm:w-auto">

      <div className="flex flex-wrap gap-2">

        <button
          type="button"
          disabled={procesando}
          onClick={() =>
            void enviarWhatsApp(false)
          }
          className="flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50 sm:w-auto"
        >
          {procesando
            ? "Preparando..."
            : "📱 Enviar WhatsApp"}
        </button>


        {ultimoEnvio && (
          <button
            type="button"
            disabled={procesando}
            onClick={() =>
              void enviarWhatsApp(true)
            }
            className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            🔄 Generar enlace nuevo
          </button>
        )}

      </div>


      {ultimoEnvio && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3">

          <p className="text-xs font-bold text-green-800">
            Último contacto WhatsApp
          </p>


          <div className="mt-2 space-y-1">

            <p className="text-xs text-green-700">
              ✅{" "}
              {new Date(
                ultimoEnvio.fechaEnvio
              ).toLocaleString(
                "es-BO",
                {
                  timeZone:
                    "America/La_Paz",
                }
              )}
            </p>


            <p className="text-xs text-green-700">
              👤 Enviado por:{" "}
              {ultimoEnvio.enviadoPorUsuario ||
                "Sistema"}
            </p>

          </div>

        </div>
      )}

    </div>
  );
}
