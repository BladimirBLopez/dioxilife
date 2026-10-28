"use client";

/**
 * Este módulo no guarda datos ni envía solicitudes.
 * Solo se ejecutará cuando el cliente pulse
 * explícitamente Activar recordatorios.
 *
 * No cancela la suscripción usada por Seguimiento.
 */

export type SuscripcionPushCliente = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export function claveVapidABuffer(
  clave: string
): ArrayBuffer {
  if (!/^[A-Za-z0-9_-]{86,88}$/.test(clave)) {
    throw new Error("Clave pública no válida.");
  }

  const normalizada = clave
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const texto = atob(normalizada);

  if (
    texto.length !== 65 ||
    texto.charCodeAt(0) !== 4
  ) {
    throw new Error("Clave pública no válida.");
  }

  const bytes = new Uint8Array(
    new ArrayBuffer(65)
  );

  for (let i = 0; i < texto.length; i++) {
    bytes[i] = texto.charCodeAt(i);
  }

  return bytes.buffer as ArrayBuffer;
}

export async function solicitarPermisoPushCliente(
  clavePublica: string
): Promise<SuscripcionPushCliente | null> {
  if (
    typeof window === "undefined" ||
    !window.isSecureContext ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    throw new Error(
      "Este dispositivo no admite notificaciones Push."
    );
  }

  if (Notification.permission === "denied") {
    return null;
  }

  if (Notification.permission !== "granted") {
    const permiso =
      await Notification.requestPermission();

    if (permiso !== "granted") {
      return null;
    }
  }

  await navigator.serviceWorker.register("/sw.js");

  const registro =
    await navigator.serviceWorker.ready;

  // Reutilizar una suscripción existente.
  // No llamar unsubscribe: podría afectar Seguimiento.
  let suscripcion =
    await registro.pushManager.getSubscription();

  if (!suscripcion) {
    suscripcion =
      await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          claveVapidABuffer(clavePublica),
      });
  }

  const datos = suscripcion.toJSON();

  if (
    typeof datos.endpoint !== "string" ||
    !datos.endpoint.startsWith("https://") ||
    !datos.keys ||
    typeof datos.keys.p256dh !== "string" ||
    typeof datos.keys.auth !== "string"
  ) {
    throw new Error(
      "Suscripción de notificaciones no válida."
    );
  }

  return {
    endpoint: datos.endpoint,
    keys: {
      p256dh: datos.keys.p256dh,
      auth: datos.keys.auth,
    },
  };
}
