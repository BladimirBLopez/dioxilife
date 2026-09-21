"use client";

import {
  BadgeDollarSign,
  Network,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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

type ComisionEstado = {
  estado: string;
  etiqueta: string;
  monto: number;
  cantidad: number;
};

type Volumen = {
  nombre: string;
  valor: number;
};


type Props = {
  crecimiento: CrecimientoDia[];
  estadosMiembros: EstadoMiembro[];
  comisiones: ComisionEstado[];
  volumen: Volumen[];
};


const coloresMiembros = [
  "#10B981",
  "#94A3B8",
];


const coloresComisiones: Record<
  string,
  string
> = {
  PENDIENTE: "#EAB308",
  APROBADA: "#3B82F6",
  PAGADA: "#10B981",
  ANULADA: "#EF4444",
};


function dinero(
  valor: number
) {
  return new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(valor);
}


export default function MultinivelAnalytics({
  crecimiento,
  estadosMiembros,
  comisiones,
  volumen,
}: Props) {

  const nuevosPeriodo =
    crecimiento.reduce(
      (
        total,
        item
      ) =>
        total +
        item.nuevos,
      0
    );


  const totalMiembros =
    estadosMiembros.reduce(
      (
        total,
        item
      ) =>
        total +
        item.total,
      0
    );


  return (
    <section className="space-y-4">

      <div>

        <h2 className="text-lg font-bold text-slate-900">
          Analítica de la red
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Crecimiento, actividad y comportamiento financiero del multinivel.
        </p>

      </div>


      <div className="grid gap-4 xl:grid-cols-12">

        {/* CRECIMIENTO */}
        <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm xl:col-span-7">

          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp className="h-5 w-5" />
              </div>

              <div>

                <h3 className="font-bold text-slate-900">
                  Crecimiento de miembros
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  Nuevos registros en los últimos 30 días
                </p>

              </div>

            </div>


            <div className="sm:text-right">

              <p className="text-xs font-medium text-slate-400">
                Nuevos en el período
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {nuevosPeriodo}
              </p>

            </div>

          </div>


          <div className="h-[240px] p-3 sm:h-[300px] sm:p-5">

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
                    id="miembrosGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#3B82F6"
                      stopOpacity={0.28}
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
                  tickMargin={8}
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
                  fill="url(#miembrosGradient)"
                />

              </AreaChart>
            </ResponsiveContainer>

          </div>

        </article>


        {/* ESTADO MIEMBROS */}
        <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm xl:col-span-5">

          <div className="flex items-center gap-3 border-b border-slate-100 p-5">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UsersRound className="h-5 w-5" />
            </div>

            <div>

              <h3 className="font-bold text-slate-900">
                Estado de la red
              </h3>

              <p className="mt-0.5 text-xs text-slate-400">
                Miembros activos y no activos
              </p>

            </div>

          </div>


          {totalMiembros === 0 ? (

            <div className="flex h-[280px] items-center justify-center p-6 text-sm text-slate-400">
              Todavía no existen miembros.
            </div>

          ) : (

            <div className="p-5">

              <div className="h-[190px]">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>

                    <Pie
                      data={estadosMiembros}
                      dataKey="total"
                      nameKey="etiqueta"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >

                      {estadosMiembros.map(
                        (
                          item,
                          index
                        ) => (

                          <Cell
                            key={
                              item.estado
                            }
                            fill={
                              coloresMiembros[
                                index %
                                  coloresMiembros.length
                              ]
                            }
                          />

                        )
                      )}

                      <Label
                        value={totalMiembros}
                        position="center"
                        fill="#0F172A"
                        fontSize={27}
                        fontWeight={700}
                      />

                    </Pie>

                    <Tooltip />

                  </PieChart>
                </ResponsiveContainer>

              </div>


              <div className="mt-3 grid grid-cols-2 gap-2">

                {estadosMiembros.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      key={
                        item.estado
                      }
                      className="rounded-xl bg-slate-50 p-3"
                    >

                      <div className="flex items-center gap-2">

                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              coloresMiembros[
                                index %
                                  coloresMiembros.length
                              ],
                          }}
                        />

                        <p className="text-xs font-medium text-slate-500">
                          {item.etiqueta}
                        </p>

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


        {/* COMISIONES */}
        <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm xl:col-span-7">

          <div className="flex items-center gap-3 border-b border-slate-100 p-5">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <BadgeDollarSign className="h-5 w-5" />
            </div>

            <div>

              <h3 className="font-bold text-slate-900">
                Comisiones por estado
              </h3>

              <p className="mt-0.5 text-xs text-slate-400">
                Monto financiero registrado por cada estado
              </p>

            </div>

          </div>


          <div className="h-[240px] p-4 sm:h-[280px] sm:p-5">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={comisiones}
                margin={{
                  top: 5,
                  right: 5,
                  left: -10,
                  bottom: 0,
                }}
              >

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
                    fontSize: 10,
                    fill: "#64748B",
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: "#94A3B8",
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="monto"
                  name="Monto Bs"
                  radius={[
                    7,
                    7,
                    0,
                    0,
                  ]}
                  barSize={34}
                >

                  {comisiones.map(
                    (
                      item
                    ) => (

                      <Cell
                        key={
                          item.estado
                        }
                        fill={
                          coloresComisiones[
                            item.estado
                          ] ??
                          "#64748B"
                        }
                      />

                    )
                  )}

                </Bar>

              </BarChart>
            </ResponsiveContainer>

          </div>


          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-4 sm:grid-cols-4">

            {comisiones.map(
              (
                item
              ) => (

                <div
                  key={
                    item.estado
                  }
                  className="rounded-xl bg-slate-50 p-3"
                >

                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {item.etiqueta}
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    Bs {dinero(
                      item.monto
                    )}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    {item.cantidad} operación
                    {item.cantidad === 1
                      ? ""
                      : "es"}
                  </p>

                </div>

              )
            )}

          </div>

        </article>


        {/* VOLUMEN */}
        <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm xl:col-span-5">

          <div className="flex items-center gap-3 border-b border-slate-100 p-5">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Network className="h-5 w-5" />
            </div>

            <div>

              <h3 className="font-bold text-slate-900">
                Volumen pagado
              </h3>

              <p className="mt-0.5 text-xs text-slate-400">
                CV y PV de pedidos pagados o completados
              </p>

            </div>

          </div>


          <div className="h-[190px] p-5">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={volumen}
                layout="vertical"
                margin={{
                  top: 0,
                  right: 20,
                  left: 0,
                  bottom: 0,
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
                    fontSize: 10,
                    fill: "#94A3B8",
                  }}
                />

                <YAxis
                  type="category"
                  dataKey="nombre"
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  tick={{
                    fontSize: 12,
                    fill: "#475569",
                    fontWeight: 700,
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


          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 p-5">

            {volumen.map(
              (
                item
              ) => (

                <div
                  key={
                    item.nombre
                  }
                  className="rounded-xl bg-slate-50 p-3"
                >

                  <p className="text-xs font-bold text-slate-400">
                    {item.nombre}
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {dinero(
                      item.valor
                    )}
                  </p>

                </div>

              )
            )}

          </div>

        </article>

      </div>

    </section>
  );
}
