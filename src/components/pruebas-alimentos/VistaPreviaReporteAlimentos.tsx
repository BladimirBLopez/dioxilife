"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Datos ficticios usados solo para revisar la interfaz.
 * Este componente no consulta ni modifica la base de datos.
 */

const registros = [
  { fecha: "02/10", alimento: "Pan", antes: 91, despues: 111 },
  { fecha: "05/10", alimento: "Pan", antes: 94, despues: 117 },
  { fecha: "09/10", alimento: "Pan", antes: 90, despues: 115 },

  { fecha: "03/10", alimento: "Arroz", antes: 95, despues: 126 },
  { fecha: "07/10", alimento: "Arroz", antes: 92, despues: 120 },
  { fecha: "11/10", alimento: "Arroz", antes: 96, despues: 127 },

  { fecha: "04/10", alimento: "Avena", antes: 89, despues: 102 },
  { fecha: "08/10", alimento: "Avena", antes: 91, despues: 101 },
  { fecha: "12/10", alimento: "Avena", antes: 90, despues: 101 },
] as const;

type Alimento = (typeof registros)[number]["alimento"];

const alimentos: Alimento[] = [
  "Pan",
  "Arroz",
  "Avena",
];

function promedio(valores: number[]): number {
  if (valores.length === 0) return 0;

  const suma = valores.reduce(
    (total, valor) => total + valor,
    0
  );

  return Math.round((suma / valores.length) * 10) / 10;
}

function formato(numero: number): string {
  return numero.toLocaleString("es-BO", {
    maximumFractionDigits: 1,
  });
}

const resumenGeneral = alimentos.map((alimento) => {
  const pruebas = registros.filter(
    (registro) => registro.alimento === alimento
  );

  return {
    alimento,
    variacionPromedio: promedio(
      pruebas.map(
        (registro) => registro.despues - registro.antes
      )
    ),
    total: pruebas.length,
  };
});

const promedioGeneral = promedio(
  registros.map(
    (registro) => registro.despues - registro.antes
  )
);

export default function VistaPreviaReporteAlimentos() {
  const [alimento, setAlimento] = useState<Alimento>("Pan");

  const pruebas = registros.filter(
    (registro) => registro.alimento === alimento
  );

  const promedioAntes = promedio(
    pruebas.map((registro) => registro.antes)
  );

  const promedioDespues = promedio(
    pruebas.map((registro) => registro.despues)
  );

  const variacionMedia = promedio(
    pruebas.map(
      (registro) => registro.despues - registro.antes
    )
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <strong>Demostración con datos ficticios.</strong>{" "}
        Las gráficas todavía no están conectadas
        a registros de clientes ni a Neon.
        No representan resultados médicos reales.
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">
          Gráfica por alimento
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Compara las mediciones realizadas antes
          y después de consumir un alimento.
        </p>

        <div className="mt-5">
          <label
            htmlFor="reporte-alimento"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Seleccionar alimento
          </label>

          <select
            id="reporte-alimento"
            value={alimento}
            onChange={(evento) =>
              setAlimento(evento.target.value as Alimento)
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 sm:max-w-xs"
          >
            {alimentos.map((nombre) => (
              <option key={nombre} value={nombre}>
                {nombre}
              </option>
            ))}
          </select>
        </div>

        <div
          className="mt-6 w-full"
          role="img"
          aria-label={`Gráfica de glucosa antes y después de consumir ${alimento}`}
        >
          <ResponsiveContainer width="100%" height={270}>
            <LineChart
              data={pruebas}
              margin={{ top: 10, right: 12, left: -18, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E2E8F0"
              />

              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 12 }}
              />

              <YAxis
                tick={{ fontSize: 12 }}
                domain={["auto", "auto"]}
              />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="antes"
                name="Antes de comer"
                stroke="#7C3AED"
                strokeWidth={3}
                dot={{ r: 4 }}
              />

              <Line
                type="monotone"
                dataKey="despues"
                name="Después de comer"
                stroke="#C026D3"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-violet-50 p-4">
            <p className="text-xs font-semibold text-violet-800">
              Promedio antes
            </p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {formato(promedioAntes)}
              <span className="ml-1 text-xs font-normal">
                mg/dL
              </span>
            </p>
          </div>

          <div className="rounded-xl bg-fuchsia-50 p-4">
            <p className="text-xs font-semibold text-fuchsia-800">
              Promedio después
            </p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {formato(promedioDespues)}
              <span className="ml-1 text-xs font-normal">
                mg/dL
              </span>
            </p>
          </div>

          <div className="rounded-xl bg-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-700">
              Variación promedio
            </p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {variacionMedia > 0 ? "+" : ""}
              {formato(variacionMedia)}
              <span className="ml-1 text-xs font-normal">
                mg/dL
              </span>
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          {pruebas.length} mediciones de demostración
          para este alimento.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">
          Comparación general de alimentos
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Variación promedio de glucosa registrada
          después de consumir cada alimento.
        </p>

        <div
          className="mt-6 w-full"
          role="img"
          aria-label="Gráfica general de variaciones promedio de glucosa por alimento"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={resumenGeneral}
              margin={{ top: 10, right: 12, left: -18, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E2E8F0"
              />

              <XAxis
                dataKey="alimento"
                tick={{ fontSize: 12 }}
              />

              <YAxis tick={{ fontSize: 12 }} />

              <Tooltip />

              <Bar
                dataKey="variacionPromedio"
                name="Variación promedio (mg/dL)"
                fill="#A21CAF"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-5 rounded-xl bg-fuchsia-50 p-4">
          <p className="text-sm font-semibold text-fuchsia-800">
            Variación promedio general
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {promedioGeneral > 0 ? "+" : ""}
            {formato(promedioGeneral)}
            <span className="ml-1 text-sm font-normal">
              mg/dL
            </span>
          </p>

          <p className="mt-2 text-xs text-slate-600">
            Calculado sobre todas las mediciones
            de demostración.
          </p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-700">
                <th scope="col" className="py-3 pr-3">
                  Alimento
                </th>
                <th scope="col" className="py-3 pr-3">
                  Pruebas
                </th>
                <th scope="col" className="py-3">
                  Variación media
                </th>
              </tr>
            </thead>

            <tbody>
              {resumenGeneral.map((fila) => (
                <tr
                  key={fila.alimento}
                  className="border-b border-slate-100"
                >
                  <td className="py-3 pr-3">
                    {fila.alimento}
                  </td>
                  <td className="py-3 pr-3">
                    {fila.total}
                  </td>
                  <td className="py-3">
                    {fila.variacionPromedio > 0 ? "+" : ""}
                    {formato(fila.variacionPromedio)} mg/dL
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Las gráficas describen las mediciones,
        pero no diagnostican diabetes ni determinan
        por sí solas si un alimento es perjudicial.
      </p>
    </div>
  );
}
