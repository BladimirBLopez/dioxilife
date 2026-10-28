"use client";

import { useEffect, useState } from "react";
import {
  solicitarPermisoPushCliente,
} from "@/lib/pruebas-alimentos/permiso-push-cliente";

type Estado = "cargando" | "apagado" | "disponible";

export default function ControlRecordatoriosPush({
  token,
}: {
  token: string;
}) {
  const [estado, setEstado] =
    useState<Estado>("cargando");
  const [clave, setClave] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const ruta = `/api/prueba-alimentos/${token}/push`;

  useEffect(() => {
    const controlador = new AbortController();

    async function comprobar() {
      try {
        const respuesta = await fetch(
          ruta,
          {
            cache: "no-store",
            credentials: "same-origin",
            referrerPolicy: "no-referrer",
            signal: controlador.signal,
          }
        );

        if (!respuesta.ok) {
          throw new Error("Servicio no disponible");
        }

        const datos: unknown = await respuesta.json();

        if (
          datos &&
          typeof datos === "object" &&
          "habilitado" in datos &&
          datos.habilitado === true &&
          "clavePublica" in datos &&
          typeof datos.clavePublica === "string"
        ) {
          if (!controlador.signal.aborted) {
            setClave(datos.clavePublica);
            setEstado("disponible");
          }
        } else if (!controlador.signal.aborted) {
          setEstado("apagado");
        }
      } catch {
        if (!controlador.signal.aborted) {
          setEstado("apagado");
        }
      }
    }

    void comprobar();

    return () => controlador.abort();
  }, [ruta]);

  async function activar() {
    if (ocupado || !clave) return;

    setOcupado(true);
    setMensaje("");

    try {
      // El permiso se solicita únicamente tras tocar
      // el botón, nunca de manera automática.
      const suscripcion =
        await solicitarPermisoPushCliente(clave);

      if (!suscripcion) {
        setMensaje(
          "No se autorizaron las notificaciones. " +
          "Puedes habilitarlas desde Chrome."
        );
        return;
      }

      const respuesta = await fetch(ruta, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(suscripcion),
      });

      if (!respuesta.ok) {
        throw new Error(
          "No se pudo registrar el permiso en DioxiLife."
        );
      }

      setMensaje(
        "Recordatorios activados para este cliente. " +
        "Recibirás avisos de mediciones pendientes."
      );
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo activar el servicio."
      );
    } finally {
      setOcupado(false);
    }
  }

  async function desactivar() {
    if (ocupado) return;

    setOcupado(true);
    setMensaje("");

    try {
      if (!("serviceWorker" in navigator)) {
        throw new Error("Servicio no disponible.");
      }

      const registro =
        await navigator.serviceWorker.register("/sw.js");

      const suscripcion =
        await registro.pushManager.getSubscription();

      if (!suscripcion) {
        setMensaje(
          "Este navegador no tiene una suscripción activa."
        );
        return;
      }

      const respuesta = await fetch(ruta, {
        method: "DELETE",
        credentials: "same-origin",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: suscripcion.endpoint,
        }),
      });

      if (!respuesta.ok) {
        throw new Error(
          "No se pudo desactivar el recordatorio."
        );
      }

      // No ejecutar unsubscribe().
      // La suscripción puede servir a Seguimiento.
      setMensaje(
        "Recordatorios de glucosa desactivados " +
        "para este cliente en este dispositivo."
      );
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo desactivar el servicio."
      );
    } finally {
      setOcupado(false);
    }
  }

  if (estado !== "disponible") {
    return null;
  }

  return (
    <section className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-5">
      <h2 className="text-lg font-bold text-fuchsia-950">
        Recordatorios automáticos
      </h2>

      <p className="mt-2 text-sm text-fuchsia-900">
        DioxiLife puede recordarte que registres tu
        segunda medición dos horas después de comer.
        Primero debes autorizar las notificaciones.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={ocupado}
          onClick={() => void activar()}
          className="rounded-xl bg-fuchsia-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Activar recordatorios
        </button>

        <button
          type="button"
          disabled={ocupado}
          onClick={() => void desactivar()}
          className="rounded-xl border border-fuchsia-400 px-4 py-3 text-sm font-semibold text-fuchsia-900 disabled:opacity-50"
        >
          Desactivar en este celular
        </button>
      </div>

      {mensaje && (
        <p role="status" className="mt-3 text-sm">
          {mensaje}
        </p>
      )}

      <p className="mt-3 text-xs text-fuchsia-800">
        Las notificaciones requieren conexión y
        permisos del dispositivo. No constituyen
        una alarma médica garantizada.
      </p>
    </section>
  );
}
