"use client";

import { useEffect, useSyncExternalStore } from "react";

export type SolicitudInstalacion = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type EstadoInstalacion = {
  solicitud: SolicitudInstalacion | null;
  instalada: boolean;
};

const estadoInicial: EstadoInstalacion = {
  solicitud: null,
  instalada: false,
};

let estado: EstadoInstalacion = estadoInicial;

const observadores = new Set<() => void>();

function notificar() {
  for (const observador of observadores) {
    observador();
  }
}

function suscribir(observador: () => void) {
  observadores.add(observador);

  return () => {
    observadores.delete(observador);
  };
}

function obtenerEstado() {
  return estado;
}

function obtenerEstadoServidor() {
  return estadoInicial;
}

export function useEstadoInstalacion() {
  return useSyncExternalStore(
    suscribir,
    obtenerEstado,
    obtenerEstadoServidor
  );
}

export function tomarSolicitudInstalacion() {
  const solicitud = estado.solicitud;

  if (solicitud) {
    estado = {
      ...estado,
      solicitud: null,
    };

    notificar();
  }

  return solicitud;
}

export default function InstallAppPrompt() {
  useEffect(() => {
    const detectar = (evento: Event) => {
      evento.preventDefault();

      estado = {
        solicitud:
          evento as SolicitudInstalacion,
        instalada: false,
      };

      notificar();
    };

    const instalada = () => {
      estado = {
        solicitud: null,
        instalada: true,
      };

      notificar();
    };

    window.addEventListener(
      "beforeinstallprompt",
      detectar
    );

    window.addEventListener(
      "appinstalled",
      instalada
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        detectar
      );

      window.removeEventListener(
        "appinstalled",
        instalada
      );
    };
  }, []);

  // Mantiene el evento de instalacion disponible
  // sin mostrar avisos flotantes en la tienda.
  return null;
}
