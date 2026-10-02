"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

type Props = {
  value: string;
  onChange: (valor: string) => void;
  disabled?: boolean;
  permitirVacio?: boolean;
};

function separarHora(valor: string) {
  const match =
    /^([01]\d|2[0-3]):([0-5]\d)$/.exec(valor);

  if (!match) {
    return {
      hora: "08",
      minuto: "00",
    };
  }

  return {
    hora: match[1],
    minuto: match[2],
  };
}

const HORAS =
  Array.from(
    { length: 24 },
    (_, i) =>
      String(i).padStart(2, "0")
  );

const MINUTOS =
  Array.from(
    { length: 60 },
    (_, i) =>
      String(i).padStart(2, "0")
  );

const MINUTOS_RAPIDOS = [
  "00",
  "15",
  "30",
  "45",
];

export default function SelectorHora({
  value,
  onChange,
  disabled = false,
  permitirVacio = true,
}: Props) {
  const [abierto, setAbierto] =
    useState(false);

  const inicial =
    separarHora(value);

  const [hora, setHora] =
    useState(inicial.hora);

  const [minuto, setMinuto] =
    useState(inicial.minuto);

  function abrir() {
    const actual =
      separarHora(value);

    setHora(actual.hora);
    setMinuto(actual.minuto);
    setAbierto(true);
  }

  function guardar() {
    onChange(
      `${hora}:${minuto}`
    );

    setAbierto(false);
  }

  function limpiar() {
    onChange("");
    setAbierto(false);
  }

  return (
    <>

      <button
        type="button"
        disabled={disabled}
        onClick={abrir}
        className="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-left transition hover:border-violet-300 hover:bg-violet-50/30 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-60"
      >

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-lg">
            🕐
          </div>

          <div>

            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
              Horario
            </p>

            <p
              className={`text-base font-bold ${
                value
                  ? "text-gray-900"
                  : "text-gray-400"
              }`}
            >
              {value ||
                "Seleccionar hora"}
            </p>

          </div>

        </div>


        <span className="text-lg text-violet-500">
          ›
        </span>

      </button>


      {abierto && (

        <Modal
          title="Seleccionar horario"
          onClose={() =>
            setAbierto(false)
          }
          maxWidthClassName="max-w-md"
        >

          <div className="space-y-5">

            <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 p-5 text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-500">
                Hora seleccionada
              </p>

              <p className="mt-2 text-5xl font-bold tracking-tight text-violet-700">
                {hora}
                <span className="mx-1 text-violet-300">
                  :
                </span>
                {minuto}
              </p>

            </div>


            <div className="grid grid-cols-2 gap-3">

              <div>

                <label className="admin-label">
                  Hora
                </label>

                <select
                  value={hora}
                  onChange={(e) =>
                    setHora(
                      e.target.value
                    )
                  }
                  className="admin-input text-center text-lg font-semibold"
                >
                  {HORAS.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>

              </div>


              <div>

                <label className="admin-label">
                  Minutos
                </label>

                <select
                  value={minuto}
                  onChange={(e) =>
                    setMinuto(
                      e.target.value
                    )
                  }
                  className="admin-input text-center text-lg font-semibold"
                >
                  {MINUTOS.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>

              </div>

            </div>


            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Minutos frecuentes
              </p>

              <div className="mt-2 grid grid-cols-4 gap-2">

                {MINUTOS_RAPIDOS.map(
                  (item) => (

                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setMinuto(item)
                      }
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                        minuto === item
                          ? "border-violet-600 bg-violet-600 text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-violet-50"
                      }`}
                    >
                      :{item}
                    </button>

                  )
                )}

              </div>

            </div>


            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">

              <p className="text-xs leading-5 text-blue-800">
                El cliente verá esta hora directamente junto a la actividad para identificar fácilmente cuándo corresponde realizarla.
              </p>

            </div>


            <button
              type="button"
              onClick={guardar}
              className="admin-btn-primary w-full py-3"
            >
              Guardar {hora}:{minuto}
            </button>


            {permitirVacio &&
              value && (

              <button
                type="button"
                onClick={limpiar}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50"
              >
                Quitar horario
              </button>

            )}


            <button
              type="button"
              onClick={() =>
                setAbierto(false)
              }
              className="w-full py-2 text-sm font-medium text-gray-400 hover:text-gray-700"
            >
              Cancelar
            </button>

          </div>

        </Modal>

      )}

    </>
  );
}
