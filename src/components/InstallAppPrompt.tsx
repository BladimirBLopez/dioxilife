"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

type Plataforma = "android" | "ios" | null;

type EventoInstalacion = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const CLAVE_OCULTAR =
  "dioxilife-instalacion-oculta-hasta-v1";

const CATORCE_DIAS =
  14 * 24 * 60 * 60 * 1000;


function suscripcionEstatica() {
  return () => {};
}

function obtenerPlataforma(): Plataforma {
  if (typeof navigator === "undefined") {
    return null;
  }

  const agente = navigator.userAgent;

  const ios =
    /iPad|iPhone|iPod/i.test(agente) ||
    (
      /Macintosh/i.test(agente) &&
      navigator.maxTouchPoints > 1
    );

  return ios
    ? "ios"
    : /Android/i.test(agente)
      ? "android"
      : null;
}

function verificarModoInstalado() {
  if (typeof window === "undefined") {
    return false;
  }

  const iosStandalone =
    (
      navigator as Navigator & {
        standalone?: boolean;
      }
    ).standalone === true;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    iosStandalone
  );
}

function suscribirModoInstalado(notificar: () => void) {
  const medio = window.matchMedia(
    "(display-mode: standalone)"
  );

  medio.addEventListener("change", notificar);

  return () => {
    medio.removeEventListener("change", notificar);
  };
}

function verificarOcultaGuardada() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const hasta = Number(
      window.localStorage.getItem(CLAVE_OCULTAR) || "0"
    );

    return hasta > Date.now();
  } catch {
    return false;
  }
}

export default function InstallAppPrompt() {
  const pathname = usePathname();

  const plataforma = useSyncExternalStore(
    suscripcionEstatica,
    obtenerPlataforma,
    () => null
  );

  const instaladaPorSistema = useSyncExternalStore(
    suscribirModoInstalado,
    verificarModoInstalado,
    () => false
  );

  const ocultaGuardada = useSyncExternalStore(
    suscripcionEstatica,
    verificarOcultaGuardada,
    () => false
  );

  const [instalada, setInstalada] =
    useState(false);

  const [oculta, setOculta] =
    useState(false);

  const [mostrarPasos, setMostrarPasos] =
    useState(false);

  const [evento, setEvento] =
    useState<EventoInstalacion | null>(null);

  useEffect(() => {
    const detectarInstalacion = (event: Event) => {
      event.preventDefault();

      setEvento(
        event as EventoInstalacion
      );
    };

    const confirmarInstalacion = () => {
      setInstalada(true);
      setEvento(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      detectarInstalacion
    );

    window.addEventListener(
      "appinstalled",
      confirmarInstalacion
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        detectarInstalacion
      );

      window.removeEventListener(
        "appinstalled",
        confirmarInstalacion
      );

    };
  }, []);

  const ocultarInvitacion = () => {
    setOculta(true);

    try {
      window.localStorage.setItem(
        CLAVE_OCULTAR,
        String(Date.now() + CATORCE_DIAS)
      );
    } catch {
      // No bloquear si el almacenamiento esta deshabilitado.
    }
  };

  const instalar = async () => {
    if (!evento) {
      setMostrarPasos(true);
      return;
    }

    const solicitud = evento;
    setEvento(null);

    try {
      await solicitud.prompt();

      const decision =
        await solicitud.userChoice;

      if (decision.outcome === "accepted") {
        setInstalada(true);
      } else {
        ocultarInvitacion();
      }
    } catch {
      setMostrarPasos(true);
    }
  };

  if (
    pathname !== "/" ||
    instalada ||
    instaladaPorSistema ||
    oculta ||
    ocultaGuardada ||
    !plataforma
  ) {
    return null;
  }

  const instalacionDirecta =
    plataforma === "android" && evento !== null;

  return (
    <aside
      aria-label="Instalar DioxiLife Bolivia"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-fuchsia-200 bg-white p-4 text-slate-900 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <Image
          src="/icon-192-dioxilife-v2.png"
          alt=""
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-xl border border-slate-100 object-contain"
        />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            Instala DioxiLife Bolivia
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-600">
            Abre DioxiLife fácilmente desde
            la pantalla de inicio de tu celular.
          </p>
        </div>

        <button
          type="button"
          aria-label="Cerrar invitación"
          onClick={ocultarInvitacion}
          className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100"
        >
          ×
        </button>
      </div>

      <button
        type="button"
        onClick={
          instalacionDirecta
            ? instalar
            : () => setMostrarPasos(
                valor => !valor
              )
        }
        className="mt-3 w-full rounded-xl bg-fuchsia-700 px-4 py-3 text-sm font-semibold text-white hover:bg-fuchsia-800"
      >
        {instalacionDirecta
          ? "Instalar aplicación"
          : mostrarPasos
            ? "Ocultar instrucciones"
            : "Cómo instalar DioxiLife"}
      </button>

      {mostrarPasos && (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-700">
          {plataforma === "ios" ? (
            <p>
              Abre DioxiLife en Safari.
              Pulsa Compartir y selecciona
              «Añadir a pantalla de inicio».
              Confirma la opción.
            </p>
          ) : (
            <p>
              Abre DioxiLife en Chrome.
              Pulsa el menú de tres puntos
              y busca «Instalar aplicación»
              o «Añadir a pantalla de inicio».
              Confirma la opción disponible.
            </p>
          )}
        </div>
      )}

      <p className="mt-2 text-center text-xs text-slate-500">
        Puedes seguir utilizando la página
        sin instalar la aplicación.
      </p>
    </aside>
  );
}
