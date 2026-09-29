"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function AccionesSeguimientoCliente({
  seguimientoId,
  telefono,
  nombreCliente,
}: {
  seguimientoId: string;
  telefono: string | null;
  nombreCliente: string | null;
}) {
  const [enlaceTemporal, setEnlaceTemporal] =
    useState<string | null>(null);

  const [procesando, setProcesando] =
    useState(false);


  async function regenerarEnlace() {
    if (procesando) {
      return;
    }

    const confirmar =
      window.confirm(
        "Se generará un nuevo enlace privado. El enlace anterior dejará de funcionar. ¿Continuar?"
      );

    if (!confirmar) {
      return;
    }


    setProcesando(true);

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/regenerar`,
          {
            method: "POST",
          }
        );


      const data =
        await res.json().catch(() => null);


      if (!res.ok) {
        throw new Error(
          data?.error ||
          "No se pudo generar el enlace."
        );
      }


      const url =
        `${window.location.origin}/seguimiento/${data.token}`;


      setEnlaceTemporal(url);


      toast.success(
        "Nuevo enlace privado generado"
      );


    } catch (error) {

      toast.error(
        error instanceof Error
          ? error.message
          : "Error generando enlace"
      );

    } finally {

      setProcesando(false);

    }
  }


  async function copiarEnlace() {

    if (!enlaceTemporal) {
      return;
    }


    await navigator.clipboard.writeText(
      enlaceTemporal
    );


    toast.success(
      "Enlace privado copiado"
    );

  }


  function abrirWhatsapp() {

    if (!telefono) {
      return;
    }


    const numero =
      telefono.replace(/\D/g, "");


    const mensaje =
      `Hola ${nombreCliente || ""}, te compartimos tu enlace privado de seguimiento Dioxilife: ${enlaceTemporal || ""}`;


    window.open(
      `https://wa.me/591${numero}?text=${encodeURIComponent(mensaje)}`,
      "_blank"
    );

  }


  return (
    <div className="flex flex-wrap gap-3">

      {telefono && (
        <button
          type="button"
          onClick={abrirWhatsapp}
          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          WhatsApp
        </button>
      )}


      <button
        type="button"
        disabled={procesando}
        onClick={() => void regenerarEnlace()}
        className="rounded-xl border border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50"
      >
        {procesando
          ? "Generando..."
          : "Generar enlace privado"}
      </button>


      {enlaceTemporal && (
        <>
          <button
            type="button"
            onClick={() => void copiarEnlace()}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            Copiar enlace
          </button>


          <a
            href={enlaceTemporal}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Abrir enlace
          </a>
        </>
      )}

    </div>
  );
}
