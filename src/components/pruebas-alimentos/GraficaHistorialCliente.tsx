"use client";

import type {
  RegistroHistorialCliente,
} from "./historial-formulario-cliente";

import {
  calcularResumenHistorial,
} from "./resumen-historial-cliente";

type Propiedades = {
  registros: readonly RegistroHistorialCliente[];
};

function mostrarNumero(valor: number): string {
  return valor.toLocaleString("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function GraficaHistorialCliente({
  registros,
}: Propiedades) {
  const resumen = calcularResumenHistorial(registros);

  if (resumen.totalCompletadas === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Comparación de alimentos
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Las gráficas aparecerán cuando completes
          al menos una prueba con las mediciones
          antes y después de comer.
        </p>
      </section>
    );
  }

  const maximo = Math.max(
    1,
    ...resumen.alimentos.flatMap(alimento => [
      alimento.promedioAntes,
      alimento.promedioDespues,
    ])
  );

  function anchoBarra(valor: number): string {
    const porcentaje = Math.min(
      100,
      Math.max(0, (valor / maximo) * 100)
    );

    return `${porcentaje}%`;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">
        Comparación de alimentos
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Promedios de glucosa antes y después
        de comer, expresados en mg/dL.
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {resumen.totalCompletadas} pruebas completas
        analizadas del historial reciente.
        Se muestran hasta ocho alimentos.
      </p>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-700">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-sky-500" />
          Antes de comer
        </span>

        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-fuchsia-600" />
          Después de comer
        </span>
      </div>

      <div className="mt-6 space-y-6">
        {resumen.alimentos.map(alimento => (
          <div
            key={alimento.alimento}
            className="rounded-xl border border-slate-100 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900">
                {alimento.alimento}
              </h3>

              <span className="text-xs text-slate-500">
                {alimento.pruebas}{" "}
                {alimento.pruebas === 1
                  ? "prueba"
                  : "pruebas"}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-1 flex justify-between gap-3 text-xs text-slate-700">
                  <span>Antes</span>
                  <span>
                    {mostrarNumero(
                      alimento.promedioAntes
                    )}{" "}
                    mg/dL
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    aria-hidden="true"
                    className="h-full rounded-full bg-sky-500"
                    style={{
                      width: anchoBarra(
                        alimento.promedioAntes
                      ),
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between gap-3 text-xs text-slate-700">
                  <span>Después</span>
                  <span>
                    {mostrarNumero(
                      alimento.promedioDespues
                    )}{" "}
                    mg/dL
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    aria-hidden="true"
                    className="h-full rounded-full bg-fuchsia-600"
                    style={{
                      width: anchoBarra(
                        alimento.promedioDespues
                      ),
                    }}
                  />
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-600">
              Diferencia promedio:{" "}
              <strong>
                {alimento.diferencia > 0 ? "+" : ""}
                {mostrarNumero(alimento.diferencia)}
                {" "}mg/dL
              </strong>
            </p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs leading-5 text-slate-500">
        Estos promedios describen mediciones
        registradas. No determinan por sí solos
        si un alimento es saludable o perjudicial,
        ni constituyen un diagnóstico médico.
      </p>
    </section>
  );
}
