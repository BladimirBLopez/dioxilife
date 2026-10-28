"use client";

import { useState } from "react";

import type {
  RegistroHistorialCliente,
} from "./historial-formulario-cliente";

import {
  calcularResumenHistorial,
} from "./resumen-historial-cliente";

import GraficaComparativaGlucosa, {
  type FilaComparacionGlucosa,
} from "./GraficaComparativaGlucosa";

type Propiedades = {
  registros: readonly RegistroHistorialCliente[];
};

export default function GraficaHistorialCliente({
  registros,
}: Propiedades) {
  const [vista, setVista] = useState<
    "promedios" | "individuales"
  >("promedios");

  const resumen = calcularResumenHistorial(registros);

  const alimentosOrdenados = [...resumen.alimentos]
    .sort(
      (a, b) =>
        b.diferencia - a.diferencia ||
        b.pruebas - a.pruebas
    )
    .slice(0, 8);

  const promedios: FilaComparacionGlucosa[] =
    alimentosOrdenados.map((alimento) => ({
      alimento: alimento.alimento,
      detalle: "",
      pruebas: alimento.pruebas,
      antes: alimento.promedioAntes,
      despues: alimento.promedioDespues,
      diferencia: alimento.diferencia,
    }));

  const individuales: FilaComparacionGlucosa[] =
    registros
      .slice(0, 50)
      .filter(
        (registro) =>
          registro.glucosaDespues !== null &&
          registro.horaMedicionDespues !== null
      )
      .sort(
        (a, b) =>
          (Number(b.glucosaDespues) - b.glucosaAntes) -
          (Number(a.glucosaDespues) - a.glucosaAntes)
      )
      .slice(0, 8)
      .map((registro) => ({
        alimento: registro.alimento,
        detalle: registro.fecha,
        pruebas: 1,
        antes: registro.glucosaAntes,
        despues: Number(registro.glucosaDespues),
        diferencia:
          Math.round(
            (
              Number(registro.glucosaDespues) -
              registro.glucosaAntes
            ) * 100
          ) / 100,
      }));

  const filas =
    vista === "promedios"
      ? promedios
      : individuales;

  return (
    <div className="min-w-0 space-y-3">
      {resumen.totalCompletadas > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-3 text-xs text-slate-600">
            {resumen.totalCompletadas} pruebas
            completas analizadas del historial
            reciente.
          </p>

          <div
            role="group"
            aria-label="Tipo de comparación"
            className="grid grid-cols-2 gap-2"
          >
            <button
              type="button"
              aria-pressed={vista === "promedios"}
              onClick={() => setVista("promedios")}
              className={
                "min-h-11 rounded-xl px-3 py-2 text-sm font-semibold " +
                (vista === "promedios"
                  ? "bg-fuchsia-700 text-white"
                  : "border border-slate-300 bg-white text-slate-700")
              }
            >
              Por alimento
            </button>

            <button
              type="button"
              aria-pressed={vista === "individuales"}
              onClick={() => setVista("individuales")}
              className={
                "min-h-11 rounded-xl px-3 py-2 text-sm font-semibold " +
                (vista === "individuales"
                  ? "bg-fuchsia-700 text-white"
                  : "border border-slate-300 bg-white text-slate-700")
              }
            >
              Por medición
            </button>
          </div>
        </div>
      )}

      <GraficaComparativaGlucosa
        titulo="Comparación de alimentos"
        descripcion={
          vista === "promedios"
            ? "Hasta ocho alimentos ordenados por mayor aumento promedio de glucosa."
            : "Hasta ocho mediciones individuales ordenadas por mayor aumento registrado."
        }
        filas={filas}
        nivelTitulo={2}
        mensajeVacio="Las gráficas aparecerán cuando completes una prueba con las dos mediciones de glucosa."
      />
    </div>
  );
}
