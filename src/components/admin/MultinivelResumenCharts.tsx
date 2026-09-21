"use client";

import {
  TrendingUp,
  UsersRound,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";


type CrecimientoDia = {
  fecha: string;
  etiqueta: string;
  nuevos: number;
};

type EstadoMiembro = {
  estado: string;
  etiqueta: string;
  total: number;
};

type Props = {
  crecimiento: CrecimientoDia[];
  estados: EstadoMiembro[];
};


const colores = [
  "#10B981",
  "#94A3B8",
];


export default function MultinivelResumenCharts({
  crecimiento,
  estados,
}: Props) {

  const nuevos30Dias =
    crecimiento.reduce(
      (total, item) =>
        total + item.nuevos,
      0
    );

  const totalMiembros =
    estados.reduce(
      (total, item) =>
        total + item.total,
      0
    );


  return (
    <section className="grid gap-4 xl:grid-cols-12">

      <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm xl:col-span-7">

        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Crecimiento de la red
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Nuevos miembros · últimos 30 días
              </p>

            </div>

          </div>


          <div className="text-right">

            <p className="text-xl font-bold text-slate-900">
              +{nuevos30Dias}
            </p>

            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Nuevos
            </p>

          </div>

        </div>


        <div className="h-[220px] p-3 sm:h-[270px] sm:p-5">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={crecimiento}
              margin={{
                top: 10,
                right: 10,
                left: -20,
                bottom: 0,
              }}
            >

              <defs>

                <linearGradient
                  id="resumenRedGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#3B82F6"
                    stopOpacity={0.25}
                  />

                  <stop
                    offset="95%"
                    stopColor="#3B82F6"
                    stopOpacity={0}
                  />
                </linearGradient>

              </defs>


              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
              />

              <XAxis
                dataKey="etiqueta"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={28}
                tick={{
                  fontSize: 10,
                  fill: "#94A3B8",
                }}
              />

              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fill: "#94A3B8",
                }}
              />

              <Tooltip />

              <Area
                type="monotone"
                dataKey="nuevos"
                name="Nuevos miembros"
                stroke="#3B82F6"
                strokeWidth={3}
                fill="url(#resumenRedGradient)"
              />

            </AreaChart>
          </ResponsiveContainer>

        </div>

      </article>


      <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm xl:col-span-5">

        <div className="flex items-center gap-3 border-b border-slate-100 p-5">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <UsersRound className="h-5 w-5" />
          </div>

          <div>

            <h2 className="font-bold text-slate-900">
              Estado de la red
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              Distribución actual de miembros
            </p>

          </div>

        </div>


        {totalMiembros === 0 ? (

          <div className="flex h-[250px] items-center justify-center p-6 text-sm text-slate-400">
            Todavía no existen miembros.
          </div>

        ) : (

          <div className="p-5">

            <div className="h-[170px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={estados}
                    dataKey="total"
                    nameKey="etiqueta"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={4}
                  >

                    {estados.map(
                      (item, index) => (

                        <Cell
                          key={item.estado}
                          fill={
                            colores[
                              index %
                                colores.length
                            ]
                          }
                        />

                      )
                    )}

                    <Label
                      value={totalMiembros}
                      position="center"
                      fill="#0F172A"
                      fontSize={26}
                      fontWeight={700}
                    />

                  </Pie>

                  <Tooltip />

                </PieChart>
              </ResponsiveContainer>

            </div>


            <div className="mt-3 grid grid-cols-2 gap-2">

              {estados.map(
                (item, index) => (

                  <div
                    key={item.estado}
                    className="rounded-xl bg-slate-50 p-3"
                  >

                    <div className="flex items-center gap-2">

                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            colores[
                              index %
                                colores.length
                            ],
                        }}
                      />

                      <span className="text-xs font-medium text-slate-500">
                        {item.etiqueta}
                      </span>

                    </div>

                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {item.total}
                    </p>

                  </div>

                )
              )}

            </div>

          </div>

        )}

      </article>

    </section>
  );
}
