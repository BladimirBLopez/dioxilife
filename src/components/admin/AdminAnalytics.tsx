"use client";

import {
  Activity,
  BarChart3,
  TrendingUp,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type VentaDia = {
  fecha: string;
  etiqueta: string;
  total: number;
  pedidos: number;
};

type EstadoPedido = {
  estado: string;
  etiqueta: string;
  total: number;
};

type Volumen = {
  nombre: string;
  valor: number;
};

type Props = {
  ventas: VentaDia[];
  estados: EstadoPedido[];
  volumen: Volumen[];
};

const coloresEstados = [
  "#EAB308",
  "#3B82F6",
  "#F97316",
  "#22C55E",
  "#10B981",
  "#EF4444",
];

function dinero(
  valor: number
) {
  return new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(valor);
}

export default function AdminAnalytics({
  ventas,
  estados,
  volumen,
}: Props) {
  const totalEstados =
    estados.reduce(
      (total, item) =>
        total + item.total,
      0
    );

  const totalVentas14Dias =
    ventas.reduce(
      (total, item) =>
        total + item.total,
      0
    );

  return (
    <section className="space-y-4">

      <div className="flex flex-col gap-1">

        <h2 className="text-lg font-bold text-slate-900">
          Analítica del negocio
        </h2>

        <p className="text-sm text-slate-400">
          Ventas, volumen y estado operativo de DioxiLife.
        </p>

      </div>


      <div className="grid gap-4 xl:grid-cols-12">

        <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm xl:col-span-7">

          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>

              <div>

                <h3 className="font-bold text-slate-900">
                  Ventas pagadas
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  Últimos 14 días
                </p>

              </div>

            </div>


            <div className="sm:text-right">

              <p className="text-xs font-medium text-slate-400">
                Total del período
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                Bs {dinero(
                  totalVentas14Dias
                )}
              </p>

            </div>

          </div>


          <div className="h-[300px] p-3 sm:p-5">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={ventas}
                margin={{
                  top: 10,
                  right: 10,
                  left: -15,
                  bottom: 0,
                }}
              >

                <defs>

                  <linearGradient
                    id="ventasGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#10B981"
                      stopOpacity={0.25}
                    />

                    <stop
                      offset="95%"
                      stopColor="#10B981"
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
                  tick={{
                    fontSize: 11,
                    fill: "#94A3B8",
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "#94A3B8",
                  }}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border:
                      "1px solid #E2E8F0",
                    boxShadow:
                      "0 10px 30px rgba(15, 23, 42, 0.08)",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="total"
                  name="Ventas Bs"
                  stroke="#10B981"
                  strokeWidth={3}
                  fill="url(#ventasGradient)"
                />

              </AreaChart>
            </ResponsiveContainer>

          </div>

        </article>


        <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm xl:col-span-5">

          <div className="flex items-center gap-3 border-b border-slate-100 p-5">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Activity className="h-5 w-5" />
            </div>

            <div>

              <h3 className="font-bold text-slate-900">
                Estado de pedidos
              </h3>

              <p className="mt-0.5 text-xs text-slate-400">
                Distribución de operaciones
              </p>

            </div>

          </div>


          {totalEstados === 0 ? (

            <div className="flex h-[300px] items-center justify-center p-6 text-center">

              <p className="text-sm text-slate-400">
                Todavía no existen pedidos.
              </p>

            </div>

          ) : (

            <div className="h-[300px] p-3">

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
                    cy="45%"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={3}
                  >

                    {estados.map(
                      (item, index) => (

                        <Cell
                          key={item.estado}
                          fill={
                            coloresEstados[
                              index %
                                coloresEstados.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip />

                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: 11,
                    }}
                  />

                </PieChart>
              </ResponsiveContainer>

            </div>

          )}

        </article>


        <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm xl:col-span-12">

          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <BarChart3 className="h-5 w-5" />
              </div>

              <div>

                <h3 className="font-bold text-slate-900">
                  Volumen comercial
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  CV y PV de pedidos pagados o completados
                </p>

              </div>

            </div>

          </div>


          <div className="grid gap-5 p-5 md:grid-cols-[1fr_220px]">

            <div className="h-[230px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={volumen}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 25,
                    left: 10,
                    bottom: 5,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#E2E8F0"
                  />

                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "#94A3B8",
                    }}
                  />

                  <YAxis
                    type="category"
                    dataKey="nombre"
                    axisLine={false}
                    tickLine={false}
                    width={45}
                    tick={{
                      fontSize: 12,
                      fill: "#475569",
                    }}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="valor"
                    name="Volumen"
                    fill="#6366F1"
                    radius={[
                      0,
                      8,
                      8,
                      0,
                    ]}
                    barSize={30}
                  />

                </BarChart>
              </ResponsiveContainer>

            </div>


            <div className="grid grid-cols-2 gap-3 md:grid-cols-1">

              {volumen.map(
                (item) => (

                  <div
                    key={item.nombre}
                    className="rounded-2xl bg-slate-50 p-4"
                  >

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {item.nombre}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {dinero(
                        item.valor
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Volumen acumulado
                    </p>

                  </div>

                )
              )}

            </div>

          </div>

        </article>

      </div>

    </section>
  );
}
