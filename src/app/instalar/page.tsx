"use client";

import Image from "next/image";
import Link from "next/link";
import InstalacionCarrusel from "@/components/InstalacionCarrusel";
import {
  useState,
  useSyncExternalStore,
} from "react";

import {
  tomarSolicitudInstalacion,
  useEstadoInstalacion,
} from "@/components/InstallAppPrompt";

type Plataforma = "android" | "ios" | "otra";

function suscripcionVacia() {
  return () => {};
}

function detectarPlataforma(): Plataforma {
  if (typeof navigator === "undefined") {
    return "otra";
  }

  const agente = navigator.userAgent;

  const ios =
    /iPhone|iPad|iPod/i.test(agente) ||
    (
      /Macintosh/i.test(agente) &&
      navigator.maxTouchPoints > 1
    );

  if (ios) return "ios";

  if (/Android/i.test(agente)) {
    return "android";
  }

  return "otra";
}

function estaAbiertaComoApp() {
  if (typeof window === "undefined") {
    return false;
  }

  const iosStandalone = (
    navigator as Navigator & {
      standalone?: boolean;
    }
  ).standalone === true;

  return (
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches || iosStandalone
  );
}

function suscribirModo(notificar: () => void) {
  const media = window.matchMedia(
    "(display-mode: standalone)"
  );

  media.addEventListener("change", notificar);

  return () => {
    media.removeEventListener(
      "change",
      notificar
    );
  };
}

export default function PaginaInstalar() {
  const estado = useEstadoInstalacion();

  const plataforma = useSyncExternalStore(
    suscripcionVacia,
    detectarPlataforma,
    () => "otra"
  );

  const modoInstalado = useSyncExternalStore(
    suscribirModo,
    estaAbiertaComoApp,
    () => false
  );

  const [mostrarGuia, setMostrarGuia] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const instalada =
    modoInstalado || estado.instalada;

  const disponible =
    !instalada && !!estado.solicitud;

  const instalar = async () => {
    const solicitud =
      tomarSolicitudInstalacion();

    if (!solicitud) {
      setMostrarGuia(true);
      return;
    }

    try {
      // Se invoca desde el clic del usuario.
      await solicitud.prompt();

      const respuesta =
        await solicitud.userChoice;

      if (respuesta.outcome === "accepted") {
        setMensaje(
          "Instalación aceptada. Revisa la pantalla de inicio de tu celular."
        );
      } else {
        setMostrarGuia(true);
      }
    } catch {
      setMostrarGuia(true);
      setMensaje(
        "Tu navegador no abrió la instalación directa."
      );
    }
  };

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-5 py-8 text-slate-900">
      <div className="rounded-3xl border border-fuchsia-100 bg-white p-6 text-center shadow-sm">
        <Image
          src="/icon-blanco-192-v3.png"
          alt="Logo DioxiLife Bolivia"
          width={104}
          height={104}
          priority
          className="mx-auto rounded-3xl"
        />

        <h1 className="mt-5 text-2xl font-bold">
          Instala DioxiLife Bolivia
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Lleva DioxiLife en tu celular y
          accede fácilmente desde tu
          pantalla de inicio.
        </p>

        {instalada ? (
          <div className="mt-6 space-y-3">
            <p className="font-semibold text-emerald-700">
              DioxiLife ya está abierta como aplicación.
            </p>

            <Link
              href="/"
              className="block rounded-2xl bg-fuchsia-700 px-5 py-4 font-semibold text-white"
            >
              Abrir DioxiLife
            </Link>
          </div>
        ) : disponible ? (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={instalar}
              className="w-full rounded-2xl bg-fuchsia-700 px-5 py-4 text-base font-semibold text-white shadow-sm hover:bg-fuchsia-800"
            >
              Instalar DioxiLife
            </button>

            <p className="text-xs text-slate-500">
              Se abrirá la confirmación oficial
              de tu navegador.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-fuchsia-50 px-4 py-4 text-sm leading-6 text-fuchsia-900">
            La instalación directa no está
            disponible en este navegador
            por el momento.
          </div>
        )}

        {mensaje && (
          <p
            role="status"
            className="mt-4 text-sm text-slate-700"
          >
            {mensaje}
          </p>
        )}
      </div>

      {!instalada && plataforma !== "ios" && (
        <InstalacionCarrusel />
      )}

      {!instalada && (
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold">
            ¿No aparece la instalación?
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Algunos navegadores, incluido
            el navegador interno de WhatsApp,
            no ofrecen la instalación directa.
          </p>

          {disponible && !mostrarGuia && (
            <button
              type="button"
              onClick={() => setMostrarGuia(true)}
              className="mt-4 text-sm font-semibold text-fuchsia-700 underline underline-offset-4"
            >
              Ver otra forma de instalar
            </button>
          )}

          {(!disponible || mostrarGuia) && (
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {plataforma === "ios" ? (
                <>
                  <p>
                    <strong>En iPhone:</strong>
                  </p>

                  <p>
                    1. Abre este enlace en Safari.
                  </p>

                  <p>
                    2. Pulsa Compartir y selecciona
                    «Añadir a pantalla de inicio».
                  </p>

                  <p>
                    3. Confirma para colocar
                    DioxiLife en tu celular.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>En Android:</strong>
                  </p>

                  <p>
                    1. Abre este enlace
                    directamente en Google Chrome.
                  </p>

                  <p>
                    2. En el menú de tres puntos
                    busca «Instalar aplicación» o
                    «Añadir a pantalla de inicio».
                  </p>

                  <p>
                    3. Confirma la instalación.
                  </p>
                </>
              )}

              <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                Si ya tienes DioxiLife instalada,
                ábrela desde su ícono en la
                pantalla de inicio.
              </p>
            </div>
          )}
        </section>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm font-semibold text-fuchsia-700 underline underline-offset-4"
        >
          Continuar a la tienda DioxiLife
        </Link>
      </div>
    </main>
  );
}
