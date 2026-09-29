"use client";

import { useState } from "react";
import { toast } from "sonner";

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
  const [procesando, setProcesando] =
    useState(false);


  async function enviarWhatsApp() {
    if (procesando) {
      return;
    }

    setProcesando(true);

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/enviar-whatsapp`,
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


      const numero =
        data.telefono.replace(/\D/g, "");


      const enlace =
        `https://wa.me/591${numero}?text=${encodeURIComponent(
          data.mensaje
        )}`;


      window.open(
        enlace,
        "_blank"
      );


      toast.success(
        "WhatsApp preparado correctamente"
      );


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
    <div className="space-y-3">

      <button
        type="button"
        disabled={procesando}
        onClick={() =>
          void enviarWhatsApp()
        }
        className="inline-flex items-center rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
      >
        {procesando
          ? "Preparando..."
          : "📱 Enviar WhatsApp seguimiento"}
      </button>


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


          <button
            type="button"
            disabled={procesando}
            onClick={() =>
              void enviarWhatsApp()
            }
            className="mt-3 rounded-xl border border-green-300 bg-white px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
          >
            📱 Enviar nuevamente
          </button>

        </div>
      )}

    </div>
  );
}
