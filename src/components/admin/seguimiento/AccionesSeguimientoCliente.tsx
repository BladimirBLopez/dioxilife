"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  toast,
} from "sonner";

import {
  AlertTriangle,
  ExternalLink,
  X,
} from "lucide-react";

import {
  abrirWhatsApp,
} from "@/lib/whatsapp-cliente";

import BotonInformeSeguimiento from "@/components/admin/seguimiento/BotonInformeSeguimiento";

type Confirmacion =
  | "PRIMER_ENVIO"
  | "NUEVO_ENLACE"
  | null;

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
  const router =
    useRouter();

  const [
    procesando,
    setProcesando,
  ] = useState(false);

  const [
    confirmacion,
    setConfirmacion,
  ] =
    useState<Confirmacion>(
      null
    );


  async function enviarWhatsApp(
    nuevoEnlace: boolean
  ) {
    if (procesando) {
      return;
    }

    setProcesando(true);

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/enviar-whatsapp${
            nuevoEnlace
              ? "?nuevo=1"
              : ""
          }`,
          {
            method:
              "POST",
          }
        );


      const data =
        await res
          .json()
          .catch(
            () => null
          );


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

      setProcesando(
        false
      );

    }
  }


  function solicitarEnvio(
    nuevoEnlace: boolean
  ) {
    if (procesando) {
      return;
    }

    /*
     * Si ya existe un enlace enviado
     * y solo se desea reenviar,
     * no hace falta confirmar.
     */
    if (
      !nuevoEnlace &&
      haEnviado
    ) {
      void enviarWhatsApp(
        false
      );

      return;
    }

    setConfirmacion(
      nuevoEnlace
        ? "NUEVO_ENLACE"
        : "PRIMER_ENVIO"
    );
  }


  function cerrarModal() {
    if (procesando) {
      return;
    }

    setConfirmacion(
      null
    );
  }


  async function confirmar() {
    if (
      !confirmacion ||
      procesando
    ) {
      return;
    }

    const nuevoEnlace =
      confirmacion ===
      "NUEVO_ENLACE";

    setConfirmacion(
      null
    );

    await enviarWhatsApp(
      nuevoEnlace
    );
  }


  const esNuevoEnlace =
    confirmacion ===
    "NUEVO_ENLACE";


  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row">

        <button
          type="button"
          disabled={
            procesando ||
            !tieneTelefono
          }
          onClick={() =>
            solicitarEnvio(
              false
            )
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
            disabled={
              procesando ||
              !tieneTelefono
            }
            onClick={() =>
              solicitarEnvio(
                true
              )
            }
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:flex-none"
          >
            🔄 Enlace nuevo
          </button>
        )}

      </div>


      {confirmacion && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onMouseDown={
            cerrarModal
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmacion-enlace"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
            className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >

            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">

              <div className="flex items-center gap-3">

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                    esNuevoEnlace
                      ? "bg-amber-50 text-amber-600"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  {esNuevoEnlace
                    ? (
                      <AlertTriangle className="h-5 w-5" />
                    )
                    : (
                      <ExternalLink className="h-5 w-5" />
                    )}
                </div>


                <div>
                  <h2
                    id="titulo-confirmacion-enlace"
                    className="text-base font-bold text-gray-900"
                  >
                    {esNuevoEnlace
                      ? "Generar un enlace nuevo"
                      : "Enviar acceso al cliente"}
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Seguimiento DioxiLife
                  </p>
                </div>

              </div>


              <button
                type="button"
                onClick={
                  cerrarModal
                }
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>

            </div>


            <div className="px-5 py-5">

              <p className="text-sm leading-6 text-gray-600">
                {esNuevoEnlace
                  ? (
                    <>
                      Se generará un{" "}
                      <strong className="font-semibold text-gray-900">
                        enlace de acceso nuevo
                      </strong>
                      . El enlace anterior dejará de funcionar para el cliente.
                    </>
                  )
                  : (
                    <>
                      Se generará el enlace personal de acceso y se preparará el mensaje para enviarlo por{" "}
                      <strong className="font-semibold text-gray-900">
                        WhatsApp
                      </strong>
                      .
                    </>
                  )}
              </p>


              {esNuevoEnlace && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">

                  <p className="text-xs leading-5 text-amber-800">
                    Usa esta opción únicamente si necesitas reemplazar el enlace anterior.
                  </p>

                </div>
              )}

            </div>


            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/70 px-5 py-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={
                  procesando
                }
                onClick={
                  cerrarModal
                }
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>


              <button
                type="button"
                disabled={
                  procesando
                }
                onClick={() =>
                  void confirmar()
                }
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
                  esNuevoEnlace
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {procesando
                  ? "Preparando..."
                  : esNuevoEnlace
                  ? "Generar enlace nuevo"
                  : "Continuar a WhatsApp"}
              </button>

            </div>

          </div>
        </div>
      )}

    </>
  );
}
