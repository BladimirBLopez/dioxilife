"use client";

import { useState } from "react";

import type {
  ReporteIndividualCliente,
} from "./contrato-reporte-individual-admin";

import GraficaComparativaGlucosa, {
  type FilaComparacionGlucosa,
} from "./GraficaComparativaGlucosa";

type Medicion = NonNullable<
  ReporteIndividualCliente["mediciones"]
>[number];

function mostrarFecha(fecha: string): string {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return valor.toLocaleString("es-BO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function GraficaMedicionesAdmin({
  mediciones,
}: {
  mediciones: readonly Medicion[];
}) {
  const [orden, setOrden] = useState<
    "aumento" | "recientes"
  >("aumento");

  const filas: FilaComparacionGlucosa[] =
    [...mediciones]
      .sort((a, b) => {
        if (orden === "recientes") {
          const fechaA = Date.parse(a.fecha);
          const fechaB = Date.parse(b.fecha);

          if (
            Number.isFinite(fechaA) &&
            Number.isFinite(fechaB)
          ) {
            return fechaB - fechaA;
          }
        }

        return b.diferencia - a.diferencia;
      })
      .slice(0, 8)
      .map((medicion) => ({
        alimento: medicion.alimento,
        detalle: mostrarFecha(medicion.fecha),
        pruebas: 1,
        antes: medicion.glucosaAntes,
        despues: medicion.glucosaDespues,
        diferencia: medicion.diferencia,
      }));

  return (
    <div className="min-w-0 space-y-3">
      {mediciones.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">
            Ordenar las mediciones
          </p>

          <div
            role="group"
            aria-label="Orden de las mediciones"
            className="grid grid-cols-2 gap-2"
          >
            <button
              type="button"
              aria-pressed={orden === "aumento"}
              onClick={() => setOrden("aumento")}
              className={
                "min-h-11 rounded-xl px-3 py-2 text-sm font-semibold " +
                (orden === "aumento"
                  ? "bg-fuchsia-700 text-white"
                  : "border border-slate-300 bg-white text-slate-700")
              }
            >
              Mayor aumento
            </button>

            <button
              type="button"
              aria-pressed={orden === "recientes"}
              onClick={() => setOrden("recientes")}
              className={
                "min-h-11 rounded-xl px-3 py-2 text-sm font-semibold " +
                (orden === "recientes"
                  ? "bg-fuchsia-700 text-white"
                  : "border border-slate-300 bg-white text-slate-700")
              }
            >
              Más recientes
            </button>
          </div>
        </div>
      )}

      <GraficaComparativaGlucosa
        titulo="Mediciones individuales"
        descripcion={
          orden === "aumento"
            ? "Hasta ocho pruebas completas ordenadas por mayor aumento de glucosa. Valores en mg/dL."
            : "Hasta ocho pruebas completas ordenadas por fecha más reciente. Valores en mg/dL."
        }
        filas={filas}
        nivelTitulo={3}
        mensajeVacio="Este cliente todavía no tiene pruebas completas para comparar."
      />
    </div>
  );
}
