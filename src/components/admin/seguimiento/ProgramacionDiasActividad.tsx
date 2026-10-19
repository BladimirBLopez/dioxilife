"use client";

import { useState } from "react";

type Modo = "TODOS" | "UNICO" | "PERIODO";

type Props = {
  diaInicio: string;
  diaFin: string;
  duracionDias: number;
  onChange: (inicio: string, fin: string) => void;
};

function detectarModo(inicio: string, fin: string): Modo {
  if (inicio === "1" && fin === "") return "TODOS";
  if (fin !== "" && inicio === fin) return "UNICO";
  return "PERIODO";
}

export default function ProgramacionDiasActividad({
  diaInicio,
  diaFin,
  duracionDias,
  onChange,
}: Props) {
  const [seleccion, setSeleccion] = useState<{
    modo: Modo;
    clave: string;
  }>(() => ({
    modo: detectarModo(diaInicio, diaFin),
    clave: JSON.stringify([diaInicio, diaFin]),
  }));

  const claveActual = JSON.stringify([diaInicio, diaFin]);

  const modo =
    seleccion.clave === claveActual
      ? seleccion.modo
      : detectarModo(diaInicio, diaFin);

  function cambiarDias(
    inicio: string,
    fin: string,
    nuevoModo: Modo = modo
  ) {
    setSeleccion({
      modo: nuevoModo,
      clave: JSON.stringify([inicio, fin]),
    });
    onChange(inicio, fin);
  }

  const inicioActual = Number(diaInicio);

  const inicioValido =
    Number.isInteger(inicioActual) &&
    inicioActual >= 1 &&
    inicioActual <= duracionDias
      ? diaInicio
      : "1";

  function seleccionar(nuevo: Modo) {
    if (nuevo === "TODOS") {
      cambiarDias("1", "", nuevo);
    } else if (nuevo === "UNICO") {
      cambiarDias(inicioValido, inicioValido, nuevo);
    } else {
      cambiarDias(inicioValido, String(duracionDias), nuevo);
    }
  }

  const opciones: { valor: Modo; texto: string }[] = [
    { valor: "TODOS", texto: "Todos los días" },
    { valor: "UNICO", texto: "Un día" },
    { valor: "PERIODO", texto: "Periodo" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-800">
        ¿Cuándo se realiza?
      </p>

      {duracionDias > 1 ? (
        <div
          className="grid grid-cols-3 gap-2"
          role="group"
          aria-label="Programación de la actividad"
        >
          {opciones.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              aria-pressed={modo === opcion.valor}
              onClick={() => seleccionar(opcion.valor)}
              className={
                "rounded-xl border px-2 py-3 text-xs font-semibold " +
                (modo === opcion.valor
                  ? "border-blue-600 bg-blue-50 text-blue-800"
                  : "border-gray-200 bg-white text-gray-600")
              }
            >
              {opcion.texto}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          Seguimiento de un día
        </p>
      )}

      {modo === "UNICO" && duracionDias > 1 ? (
        <div>
          <label className="admin-label">
            ¿Qué día?
          </label>

          <input
            type="number"
            min={1}
            max={duracionDias}
            value={diaInicio}
            onChange={(e) =>
              cambiarDias(e.target.value, e.target.value)
            }
            className="admin-input"
          />
        </div>
      ) : null}

      {modo === "PERIODO" && duracionDias > 1 ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="admin-label">
              Empieza el día
            </label>

            <input
              type="number"
              min={1}
              max={duracionDias}
              value={diaInicio}
              onChange={(e) => {
                const nuevoInicio = e.target.value;

                const nuevoFin =
                  diaFin !== "" &&
                  Number(diaFin) < Number(nuevoInicio)
                    ? nuevoInicio
                    : diaFin;

                cambiarDias(nuevoInicio, nuevoFin);
              }}
              className="admin-input"
            />
          </div>

          <div>
            <label className="admin-label">
              Termina el día
            </label>

            <input
              type="number"
              min={1}
              max={duracionDias}
              value={diaFin}
              placeholder={String(duracionDias)}
              onChange={(e) =>
                cambiarDias(diaInicio, e.target.value)
              }
              className="admin-input"
            />
          </div>
        </div>
      ) : null}

      <p className="text-xs leading-5 text-gray-500">
        {modo === "TODOS"
          ? "Se repetirá todos los días del seguimiento."
          : modo === "UNICO"
            ? "Se realizará solamente el día seleccionado."
            : `Se repetirá desde el día ${
                diaInicio || "—"
              } hasta el día ${
                diaFin || duracionDias
              }.`}
      </p>
    </div>
  );
}
