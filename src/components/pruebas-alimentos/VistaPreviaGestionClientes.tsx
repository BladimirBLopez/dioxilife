"use client";

import { useState } from "react";

type ModoCliente = "existente" | "nuevo";

export default function VistaPreviaGestionClientes() {
  const [modo, setModo] = useState<ModoCliente>("nuevo");
  const [nombre, setNombre] = useState("Cliente de ejemplo");
  const [telefono, setTelefono] = useState("");
  const [vigencia, setVigencia] = useState("30");

  const nombreMensaje = nombre.trim() || "cliente";

  const mensaje =
    `Hola, ${nombreMensaje}.\n\n` +
    "DioxiLife Bolivia te invita a registrar tu " +
    "respuesta de glucosa a los alimentos.\n\n" +
    "Tu enlace privado de acceso se agregará aquí " +
    "cuando el administrador lo genere.\n\n" +
    "Este mensaje es una demostración.";

  const campo =
    "w-full rounded-xl border border-slate-300 " +
    "bg-white px-4 py-3 text-sm text-slate-900 " +
    "focus:border-fuchsia-600 focus:outline-none " +
    "focus:ring-2 focus:ring-fuchsia-100";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm leading-6 text-amber-950">
          <strong>Vista previa administrativa.</strong>{" "}
          Los datos introducidos no se guardan.
          No se consultan clientes reales,
          no se generan enlaces activos y
          no se envían mensajes.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          1. Seleccionar cliente
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            aria-pressed={modo === "existente"}
            onClick={() => setModo("existente")}
            className={
              "rounded-xl border p-4 text-left text-sm " +
              (modo === "existente"
                ? "border-fuchsia-600 bg-fuchsia-50 font-semibold text-fuchsia-900"
                : "border-slate-200 bg-white text-slate-700")
            }
          >
            Cliente existente
            <span className="mt-1 block text-xs font-normal">
              Vincular con un cliente registrado
            </span>
          </button>

          <button
            type="button"
            aria-pressed={modo === "nuevo"}
            onClick={() => setModo("nuevo")}
            className={
              "rounded-xl border p-4 text-left text-sm " +
              (modo === "nuevo"
                ? "border-fuchsia-600 bg-fuchsia-50 font-semibold text-fuchsia-900"
                : "border-slate-200 bg-white text-slate-700")
            }
          >
            Cliente nuevo
            <span className="mt-1 block text-xs font-normal">
              Preparar un registro independiente
            </span>
          </button>
        </div>

        {modo === "existente" ? (
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">
              Clientes existentes
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Aquí aparecerá la lista real de clientes
              cuando autoricemos la conexión con
              la base de datos.
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Todavía no se consultan expedientes.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="pa-cliente-nombre"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Nombre de la persona
              </label>

              <input
                id="pa-cliente-nombre"
                className={campo}
                maxLength={120}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del cliente"
              />
            </div>

            <div>
              <label
                htmlFor="pa-cliente-telefono"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Teléfono de WhatsApp
              </label>

              <input
                id="pa-cliente-telefono"
                type="tel"
                className={campo}
                maxLength={30}
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ejemplo: 70000000"
              />
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          2. Configurar enlace privado
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Cada cliente tendrá un enlace independiente,
          con vencimiento y posibilidad de revocación.
        </p>

        <div className="mt-4">
          <label
            htmlFor="pa-vigencia"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Vigencia propuesta del enlace
          </label>

          <select
            id="pa-vigencia"
            className={campo}
            value={vigencia}
            onChange={(e) => setVigencia(e.target.value)}
          >
            <option value="7">7 días</option>
            <option value="30">30 días</option>
            <option value="90">90 días</option>
          </select>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          La vigencia es una configuración de muestra.
          No se ha creado ningún token.
        </p>

        <button
          type="button"
          disabled
          className="mt-5 w-full cursor-not-allowed rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-500"
        >
          Generar enlace privado — Próximamente
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          3. Mensaje para WhatsApp
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Ejemplo de mensaje para enviar cuando
          el enlace esté disponible.
        </p>

        <textarea
          aria-label="Vista previa del mensaje"
          readOnly
          rows={8}
          value={
            modo === "nuevo"
              ? mensaje
              : "Selecciona un cliente existente cuando la lista esté habilitada."
          }
          className="mt-4 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
        />

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Esta vista no abre WhatsApp
          ni transmite información personal.
        </p>
      </section>
    </div>
  );
}
