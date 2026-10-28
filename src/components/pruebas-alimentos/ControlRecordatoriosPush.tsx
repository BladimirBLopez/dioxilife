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
  const [suscrito, setSuscrito] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const ruta = `/api/prueba-alimentos/${token}/push`;

  useEffect(() => {
    const controlador = new AbortController();

    async function comprobar() {
      try {
        let endpoint: string | null = null;

        if (
          "serviceWorker" in navigator &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          const registro =
            await navigator.serviceWorker.getRegistration("/");

          const suscripcion =
            await registro?.pushManager.getSubscription();

          endpoint = suscripcion?.endpoint ?? null;
        }

        const respuesta = await fetch(
          ruta,
          {
            cache: "no-store",
            credentials: "same-origin",
            referrerPolicy: "no-referrer",
            signal: controlador.signal,
            headers: endpoint
              ? { "X-DioxiLife-Push-Endpoint": endpoint }
              : {},
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
            setSuscrito(
              "suscrito" in datos &&
              datos.suscrito === true
            );
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

      setSuscrito(true);
      setMensaje("");
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
        setSuscrito(false);
        setMensaje("");
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
      setSuscrito(false);
      setMensaje("");
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
    <section className="rounded-2xl border border-fuchsia-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">
        Recordatorios de glucosa
      </h2>

        <div
          role="status"
          aria-live="polite"
          className={
            "mt-3 rounded-xl border p-3 " +
            (suscrito
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50")
          }
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Estado de avisos en este celular
          </p>

          <p className="mt-1 text-sm font-bold text-slate-900">
            {suscrito
              ? "✓ Suscripción reconocida"
              : "Recordatorios sin activar"}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-600">
            {suscrito
              ? "Este navegador tiene una suscripción reconocida por DioxiLife. La entrega de cada aviso depende de la conexión y los permisos del dispositivo."
              : "Activa los recordatorios usando el botón de esta sección para recibir avisos cuando corresponda."}
          </p>
        </div>


      {suscrito ? (
        <p className="mt-3 text-sm font-medium text-emerald-700">
          ✓ Notificaciones autorizadas en este celular
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          Activa las notificaciones para recibir un aviso
          dos horas después de comer cuando tengas una
          segunda medición pendiente.
        </p>
      )}

      <div className="mt-4">
        {suscrito ? (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => void desactivar()}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            {ocupado ? "Procesando..." : "Desactivar recordatorios"}
          </button>
        ) : (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => void activar()}
            className="rounded-xl bg-fuchsia-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {ocupado ? "Procesando..." : "Activar recordatorios"}
          </button>
        )}
      </div>

      {mensaje && (
        <p role="status" className="mt-3 text-sm text-slate-700">
          {mensaje}
        </p>
      )}

      <p className="mt-4 text-xs text-slate-500">
        El envío automático depende de que el programador
        de recordatorios esté funcionando.
      </p>
    </section>
  );
}
