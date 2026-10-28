"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type FilaComparacionGlucosa = {
  alimento: string;
  detalle: string;
  pruebas: number;
  antes: number;
  despues: number;
  diferencia: number;
};

type Propiedades = {
  titulo: string;
  descripcion: string;
  filas: readonly FilaComparacionGlucosa[];
  mensajeVacio?: string;
  nivelTitulo?: 2 | 3;
};

function numero(valor: number): string {
  return valor.toLocaleString("es-BO", {
    maximumFractionDigits: 2,
  });
}

function abreviar(texto: string): string {
  if (texto.length <= 15) return texto;
  return `${texto.slice(0, 14)}…`;
}

export default function GraficaComparativaGlucosa({
  titulo,
  descripcion,
  filas,
  mensajeVacio = "Todavía no hay mediciones completas.",
  nivelTitulo = 2,
}: Propiedades) {
  const Titulo = nivelTitulo === 2 ? "h2" : "h3";

  const datos = filas.map((fila, indice) => ({
    ...fila,
    eje: String(indice),
  }));

  const altura = Math.max(
    260,
    datos.length * 70 + 65
  );

  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-fuchsia-700">
          DioxiLife · Glucosa
        </p>

        <Titulo className="text-xl font-bold text-slate-900">
          {titulo}
        </Titulo>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {descripcion}
        </p>
      </div>

      {datos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm text-slate-600">
            {mensajeVacio}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-700">
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded bg-sky-600"
              />
              Antes de comer
            </span>
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded bg-fuchsia-600"
              />
              Después de comer
            </span>
          </div>

          <div className="w-full min-w-0">
            <div
              className="w-full"
              style={{ height: altura }}
              aria-label="Gráfico comparativo de glucosa en miligramos por decilitro"
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={datos}
                  layout="vertical"
                  margin={{
                    top: 8,
                    right: 12,
                    bottom: 8,
                    left: 0,
                  }}
                  barCategoryGap="24%"
                  accessibilityLayer
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    type="number"
                    domain={[0, "dataMax"]}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="eje"
                    width={102}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(valor) => {
                      const fila = datos[Number(valor)];
                      return abreviar(
                        fila?.alimento ?? String(valor)
                      );
                    }}
                  />

                  <Tooltip
                    labelFormatter={(valor) => {
                      const fila = datos[Number(valor)];
                      if (!fila) return "";
                      return fila.detalle
                        ? `${fila.alimento} · ${fila.detalle}`
                        : fila.alimento;
                    }}
                    formatter={(valor) =>
                      `${numero(Number(valor))} mg/dL`
                    }
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      fontSize: 12,
                    }}
                    cursor={{ fill: "#f8fafc" }}
                  />

                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                  />

                  <Bar
                    dataKey="antes"
                    name="Antes"
                    fill="#0284c7"
                    radius={[0, 5, 5, 0]}
                    maxBarSize={18}
                    isAnimationActive={false}
                  />

                  <Bar
                    dataKey="despues"
                    name="Después"
                    fill="#c026d3"
                    radius={[0, 5, 5, 0]}
                    maxBarSize={18}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <h4 className="text-sm font-bold text-slate-900">
              Detalle de las mediciones
            </h4>

            {datos.map((fila) => (
              <article
                key={fila.eje}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-slate-900">
                      {fila.alimento}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {fila.detalle ||
                        `${fila.pruebas} ${
                          fila.pruebas === 1
                            ? "prueba"
                            : "pruebas"
                        }`}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {fila.diferencia > 0 ? "+" : ""}
                      {numero(fila.diferencia)}
                    </p>
                    <p className="text-xs text-slate-500">
                      mg/dL de diferencia
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-sky-50 p-3">
                    <p className="text-xs text-sky-800">
                      Antes
                    </p>
                    <p className="mt-1 text-base font-bold text-sky-900">
                      {numero(fila.antes)}
                      <span className="ml-1 text-xs font-normal">
                        mg/dL
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl bg-fuchsia-50 p-3">
                    <p className="text-xs text-fuchsia-800">
                      Después
                    </p>
                    <p className="mt-1 text-base font-bold text-fuchsia-900">
                      {numero(fila.despues)}
                      <span className="ml-1 text-xs font-normal">
                        mg/dL
                      </span>
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
        Comparaciones descriptivas basadas en
        mediciones registradas. Por sí solas no
        determinan si un alimento es saludable
        o perjudicial y no constituyen un
        diagnóstico médico.
      </p>
    </section>
  );
}
