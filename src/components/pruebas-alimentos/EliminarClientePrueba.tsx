"use client";

import { useId, useRef, useState } from "react";

type Resumen = {
  ok: true;
  clientePruebaId: string;
  nombre: string;
  mediciones: number;
  recordatorios: number;
  suscripciones: number;
  vinculadoASeguimiento: boolean;
};

const API = "/api/admin/pruebas-alimentos/enlaces/eliminar";

function esResumen(valor: unknown): valor is Resumen {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return false;
  }
  const v = valor as Partial<Resumen>;
  return v.ok === true &&
    typeof v.clientePruebaId === "string" &&
    typeof v.nombre === "string" &&
    typeof v.vinculadoASeguimiento === "boolean" &&
    [v.mediciones, v.recordatorios, v.suscripciones].every(
      n => typeof n === "number" && Number.isSafeInteger(n) && n >= 0
    );
}

export default function EliminarClientePrueba({
  clienteId,
  deshabilitado,
  onEliminado,
}: {
  clienteId: string;
  deshabilitado: boolean;
  onEliminado: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const procesando = useRef(false);
  const tituloId = useId();

  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [confirmacion, setConfirmacion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");

  async function abrir() {
    if (deshabilitado || procesando.current || cargando) return;

    setError("");
    setResumen(null);
    setConfirmacion("");
    setCargando(true);

    if (!dialogo.current?.open) {
      dialogo.current?.showModal();
    }

    try {
      const respuesta = await fetch(
        API + "?clienteId=" + encodeURIComponent(clienteId),
        {
          credentials: "same-origin",
          cache: "no-store",
          referrerPolicy: "no-referrer",
        }
      );

      const datos: unknown = await respuesta.json();

      if (
        !respuesta.ok ||
        !esResumen(datos) ||
        datos.clientePruebaId !== clienteId
      ) {
        throw new Error("No se pudo verificar el cliente.");
      }

      setResumen(datos);
    } catch {
      setError("No se pudo consultar la información. No se eliminó nada.");
    } finally {
      setCargando(false);
    }
  }

  async function eliminar() {
    if (
      !resumen ||
      confirmacion !== "ELIMINAR" ||
      procesando.current
    ) return;

    procesando.current = true;
    setEliminando(true);
    setError("");

    try {
      const respuesta = await fetch(API, {
        method: "DELETE",
        credentials: "same-origin",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          clientePruebaId: clienteId,
          confirmacion: "ELIMINAR",
          esperado: {
            mediciones: resumen.mediciones,
            recordatorios: resumen.recordatorios,
            suscripciones: resumen.suscripciones,
          },
        }),
      });

      const datos: unknown = await respuesta.json();

      if (
        !respuesta.ok ||
        !datos ||
        typeof datos !== "object" ||
        !("ok" in datos) ||
        datos.ok !== true
      ) {
        throw new Error(
          respuesta.status === 409
            ? "Los datos cambiaron. Cancela y vuelve a revisar antes de eliminar."
            : "No se pudo eliminar. No se ha confirmado ningún borrado."
        );
      }

      dialogo.current?.close();
      onEliminado();
    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo completar la eliminación."
      );
    } finally {
      procesando.current = false;
      setEliminando(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={deshabilitado}
        onClick={() => void abrir()}
        className="rounded-lg border border-red-300 px-3 py-2 text-xs font-bold text-red-800 disabled:opacity-50"
      >
        Eliminar cliente
      </button>

      <dialog
        ref={dialogo}
        aria-labelledby={tituloId}
        onCancel={evento => {
          if (eliminando) evento.preventDefault();
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-red-200 bg-white p-5 text-slate-900 shadow-2xl backdrop:bg-slate-950/60"
      >
        <h2 id={tituloId} className="text-lg font-bold text-red-800">
          Eliminar cliente definitivamente
        </h2>

        {cargando && (
          <p role="status" className="mt-4 text-sm">
            Consultando los datos relacionados...
          </p>
        )}

        {resumen && (
          <div className="mt-4 space-y-3">
            <p className="text-sm">
              Cliente: <strong>{resumen.nombre}</strong>
            </p>

            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <p>Mediciones: <strong>{resumen.mediciones}</strong></p>
              <p>Recordatorios: <strong>{resumen.recordatorios}</strong></p>
              <p>Suscripciones push: <strong>{resumen.suscripciones}</strong></p>
              <p>
                Seguimiento vinculado:{" "}
                <strong>
                  {resumen.vinculadoASeguimiento ? "Sí" : "No"}
                </strong>
              </p>
            </div>

            <p className="text-sm font-semibold text-red-800">
              Se eliminarán permanentemente este cliente de
              Pruebas de Alimentos, su enlace y todos los
              registros relacionados indicados arriba.
              El cliente original de Seguimiento se conservará.
              Esta acción no puede deshacerse.
            </p>

            <label
              htmlFor={tituloId + "-confirmar"}
              className="block text-sm font-semibold"
            >
              Escribe ELIMINAR para confirmar
            </label>
            <input
              id={tituloId + "-confirmar"}
              value={confirmacion}
              onChange={evento => setConfirmacion(evento.target.value)}
              disabled={eliminando}
              autoComplete="off"
              maxLength={8}
              className="min-h-11 w-full rounded-xl border border-red-300 px-3 text-sm"
            />
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={eliminando}
            onClick={() => dialogo.current?.close()}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={
              !resumen ||
              cargando ||
              eliminando ||
              confirmacion !== "ELIMINAR"
            }
            onClick={() => void eliminar()}
            className="rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            {eliminando ? "Eliminando..." : "Eliminar definitivamente"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
