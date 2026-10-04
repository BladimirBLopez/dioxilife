"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];

function leerFecha(valor: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);

  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function valorFecha(
  year: number,
  month: number,
  day: number
) {
  return `${String(year).padStart(4, "0")}-${String(
    month
  ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function hoyValor() {
  const hoy = new Date();

  return valorFecha(
    hoy.getFullYear(),
    hoy.getMonth() + 1,
    hoy.getDate()
  );
}

function fechaVisible(valor: string) {
  const fecha = leerFecha(valor);

  if (!fecha) {
    return "Seleccionar fecha";
  }

  return `${String(fecha.day).padStart(2, "0")}/${String(
    fecha.month
  ).padStart(2, "0")}/${fecha.year}`;
}

export default function SelectorFecha({
  value,
  onChange,
  disabled = false,
}: Props) {
  const [abierto, setAbierto] =
    useState(false);

  const [seleccion, setSeleccion] =
    useState(value);

  const inicial =
    leerFecha(value) ||
    leerFecha(hoyValor())!;

  const [mes, setMes] =
    useState(
      new Date(
        inicial.year,
        inicial.month - 1,
        1
      )
    );

  function abrir() {
    const base =
      leerFecha(value) ||
      leerFecha(hoyValor())!;

    setSeleccion(value);

    setMes(
      new Date(
        base.year,
        base.month - 1,
        1
      )
    );

    setAbierto(true);
  }

  function moverMes(cantidad: number) {
    setMes(
      (actual) =>
        new Date(
          actual.getFullYear(),
          actual.getMonth() + cantidad,
          1
        )
    );
  }

  function seleccionarHoy() {
    const valor = hoyValor();
    const fecha = leerFecha(valor)!;

    setSeleccion(valor);

    setMes(
      new Date(
        fecha.year,
        fecha.month - 1,
        1
      )
    );
  }

  function confirmar() {
    if (!seleccion) return;

    onChange(seleccion);
    setAbierto(false);
  }

  const year = mes.getFullYear();
  const month = mes.getMonth();

  const totalDias =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  const primerDia =
    (
      new Date(
        year,
        month,
        1
      ).getDay() + 6
    ) % 7;

  const nombreMes =
    new Intl.DateTimeFormat(
      "es-BO",
      {
        month: "long",
        year: "numeric",
      }
    ).format(mes);

  const celdas = [
    ...Array.from(
      { length: primerDia },
      () => null
    ),
    ...Array.from(
      { length: totalDias },
      (_, i) => i + 1
    ),
  ];

  const hoy = hoyValor();

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={abrir}
        className="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-left transition hover:border-violet-300 hover:bg-violet-50/30 disabled:opacity-60"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
            📅
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
              Fecha
            </p>

            <p
              className={`text-base font-bold ${
                value
                  ? "text-gray-900"
                  : "text-gray-400"
              }`}
            >
              {fechaVisible(value)}
            </p>
          </div>
        </div>

        <span className="text-lg text-violet-500">
          ›
        </span>
      </button>

      {abierto && (
        <Modal
          title="Seleccionar fecha"
          onClose={() =>
            setAbierto(false)
          }
          maxWidthClassName="max-w-md"
        >
          <div className="space-y-4">

            <div className="flex items-center justify-between">

              <button
                type="button"
                onClick={() =>
                  moverMes(-1)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-xl text-gray-600"
              >
                ‹
              </button>

              <p className="font-bold capitalize text-gray-900">
                {nombreMes}
              </p>

              <button
                type="button"
                onClick={() =>
                  moverMes(1)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-xl text-gray-600"
              >
                ›
              </button>

            </div>


            <div className="grid grid-cols-7">

              {DIAS.map(
                (dia, indice) => (
                  <div
                    key={`${dia}-${indice}`}
                    className="flex h-9 items-center justify-center text-[11px] font-bold text-gray-400"
                  >
                    {dia}
                  </div>
                )
              )}

              {celdas.map(
                (dia, indice) => {
                  if (dia === null) {
                    return (
                      <div
                        key={`v-${indice}`}
                        className="h-11"
                      />
                    );
                  }

                  const valor =
                    valorFecha(
                      year,
                      month + 1,
                      dia
                    );

                  const seleccionado =
                    seleccion === valor;

                  const esHoy =
                    hoy === valor;

                  return (
                    <button
                      key={valor}
                      type="button"
                      onClick={() =>
                        setSeleccion(valor)
                      }
                      className="flex h-11 items-center justify-center"
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                          seleccionado
                            ? "bg-violet-600 text-white"
                            : esHoy
                            ? "border border-violet-300 bg-violet-50 text-violet-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {dia}
                      </span>
                    </button>
                  );
                }
              )}

            </div>


            {seleccion && (
              <div className="rounded-xl bg-violet-50 px-4 py-3">
                <p className="text-xs font-medium text-violet-500">
                  Fecha seleccionada
                </p>

                <p className="mt-0.5 font-bold text-violet-800">
                  {fechaVisible(seleccion)}
                </p>
              </div>
            )}


            <div className="grid grid-cols-2 gap-2">

              <button
                type="button"
                onClick={seleccionarHoy}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700"
              >
                Hoy
              </button>

              <button
                type="button"
                disabled={!seleccion}
                onClick={confirmar}
                className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Confirmar
              </button>

            </div>


            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setSeleccion("");
                  setAbierto(false);
                }}
                className="w-full py-2 text-sm font-medium text-gray-400 hover:text-red-600"
              >
                Quitar fecha
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setAbierto(false)
              }
              className="w-full py-1 text-sm font-medium text-gray-400"
            >
              Cancelar
            </button>

          </div>
        </Modal>
      )}
    </>
  );
}
