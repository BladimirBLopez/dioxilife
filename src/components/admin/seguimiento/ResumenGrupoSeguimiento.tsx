"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  LoaderCircle,
  Trophy,
} from "lucide-react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RankingCumplimiento = {
  puesto: number;
  seguimientoId: string;
  nombre: string;
  porcentaje: number;
  completados: number;
  total: number;
};

type RankingPeso = {
  puesto: number;
  seguimientoId: string;
  nombre: string;
  inicial: number | null;
  promedio: number | null;
  perdidaKg: number | null;
  perdidaPorcentaje:
    | number
    | null;
};

type Participante = {
  miembroId: string;
  seguimientoId: string;
  nombre: string;
  diaIngreso: number;
  ultimoRegistro: number | null;

  cumplimientoHoy: {
    completados: number;
    total: number;
    porcentaje: number;
  };

  cumplimientoAcumulado: {
    completados: number;
    total: number;
    porcentaje: number;
  };

  peso: {
    cantidad: number;
    inicial: {
      diaPlan: number;
      valor: number;
    } | null;
    ultima: {
      diaPlan: number;
      valor: number;
    } | null;
    promedio: number | null;
    cambio: number | null;
    perdidaKg: number | null;
    perdidaPorcentaje:
      | number
      | null;
  };

  cintura: {
    cantidad: number;
    inicial: {
      diaPlan: number;
      valor: number;
    } | null;
    ultima: {
      diaPlan: number;
      valor: number;
    } | null;
    promedio: number | null;
    cambio: number | null;
  };

  glucemia: {
    cantidad: number;
    inicial: {
      diaPlan: number;
      valor: number;
    } | null;
    ultima: {
      diaPlan: number;
      valor: number;
    } | null;
    promedio: number | null;
    cambio: number | null;
  };
};

type Respuesta = {
  grupo: {
    diaActual: number;
    duracionDias: number;
    participantes: number;
    promedioHoy: number;
    promedioAcumulado: number;
  };

  participantes:
    Participante[];

  rankings: {
    cumplimientoHoy:
      RankingCumplimiento[];

    cumplimientoAcumulado:
      RankingCumplimiento[];

    peso:
      RankingPeso[];
  };

  graficas: {
    cumplimiento: {
      diaPlan: number;
      porcentaje: number;
      completados: number;
      total: number;
      participantes: number;
    }[];

    peso: {
      diaPlan: number;
      promedio: number;
      registros: number;
    }[];

    cintura: {
      diaPlan: number;
      promedio: number;
      registros: number;
    }[];

    glucemia: {
      diaPlan: number;
      promedio: number;
      registros: number;
    }[];
  };
};

function numero(
  valor: number | null,
  sufijo: string
) {
  if (valor === null) {
    return "—";
  }

  return `${valor.toLocaleString(
    "es-BO",
    {
      maximumFractionDigits:
        2,
    }
  )} ${sufijo}`;
}

function GraficoGrupo({
  titulo,
  subtitulo,
  datos,
  dataKey,
  unidad,
}: {
  titulo: string;
  subtitulo: string;
  datos: Record<string, number>[];
  dataKey: string;
  unidad: string;
}) {
  return (
    <div className="admin-card p-4 sm:p-5">

      <div>
        <h3 className="font-semibold text-gray-900">
          {titulo}
        </h3>

        <p className="mt-1 text-xs text-gray-500">
          {subtitulo}
        </p>
      </div>


      {datos.length > 0 ? (

        <div className="mt-4 h-56 w-full">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={datos.map(
                (item) => ({
                  ...item,
                  dia:
                    `D${item.diaPlan}`,
                })
              )}
              margin={{
                top: 8,
                right: 8,
                left: -10,
                bottom: 0,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                opacity={0.25}
              />

              <XAxis
                dataKey="dia"
                axisLine={false}
                tickLine={false}
                fontSize={11}
              />

              <YAxis
                dataKey={dataKey}
                domain={[
                  "auto",
                  "auto",
                ]}
                axisLine={false}
                tickLine={false}
                fontSize={11}
                width={48}
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey={dataKey}
                name={titulo}
                unit={
                  unidad
                }
                stroke="#6750A4"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill:
                    "#FFFFFF",
                  stroke:
                    "#6750A4",
                  strokeWidth:
                    2,
                }}
                activeDot={{
                  r: 6,
                }}
              />

            </LineChart>
          </ResponsiveContainer>

        </div>

      ) : (

        <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center">

          <p className="text-sm font-medium text-gray-500">
            Todavía no hay datos suficientes.
          </p>

        </div>

      )}

    </div>
  );
}


function RankingCumplimiento({
  titulo,
  items,
}: {
  titulo: string;
  items: RankingCumplimiento[];
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">

      <h3 className="font-semibold text-gray-900">
        {titulo}
      </h3>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">
          Sin datos todavía.
        </p>
      ) : (
        <div className="mt-3 space-y-2">

          {items.map(
            (item) => (
              <Link
                key={
                  item.seguimientoId
                }
                href={`/admin/seguimiento/clientes/${item.seguimientoId}`}
                className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition hover:bg-violet-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-violet-700 shadow-sm">
                  {item.puesto}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {item.nombre}
                  </p>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {item.completados}/
                    {item.total} checks
                  </p>
                </div>

                <p className="text-lg font-extrabold text-violet-700">
                  {item.porcentaje}%
                </p>
              </Link>
            )
          )}

        </div>
      )}

    </div>
  );
}

export default function ResumenGrupoSeguimiento({
  grupoId,
}: {
  grupoId: string;
}) {
  const [
    data,
    setData,
  ] = useState<Respuesta | null>(
    null
  );

  const [
    cargando,
    setCargando,
  ] = useState(true);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setCargando(true);

      try {
        const res =
          await fetch(
            `/api/admin/seguimiento/grupos/${grupoId}/resumen`,
            {
              cache:
                "no-store",
            }
          );

        if (!res.ok) {
          return;
        }

        const respuesta =
          await res.json();

        if (activo) {
          setData(
            respuesta
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void cargar();

    return () => {
      activo = false;
    };
  }, [grupoId]);

  if (cargando) {
    return (
      <section className="admin-card p-5">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Calculando estadísticas del grupo...
        </div>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="space-y-4">

      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Resumen del grupo
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Cumplimiento y evolución de los participantes.
        </p>
      </div>


      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        <div className="admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Jornada
          </p>

          <p className="mt-1 text-xl font-extrabold text-gray-900">
            Día {data.grupo.diaActual}
          </p>

          <p className="text-xs text-gray-500">
            de {data.grupo.duracionDias}
          </p>
        </div>


        <div className="admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Participantes
          </p>

          <p className="mt-1 text-xl font-extrabold text-gray-900">
            {data.grupo.participantes}
          </p>
        </div>


        <div className="admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Promedio hoy
          </p>

          <p className="mt-1 text-xl font-extrabold text-violet-700">
            {data.grupo.promedioHoy}%
          </p>
        </div>


        <div className="admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Promedio acumulado
          </p>

          <p className="mt-1 text-xl font-extrabold text-violet-700">
            {data.grupo.promedioAcumulado}%
          </p>
        </div>

      </div>


      <div>

        <h2 className="text-lg font-semibold text-gray-900">
          Evolución del grupo
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Promedios diarios de cumplimiento y mediciones registradas.
        </p>

      </div>


      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

        <GraficoGrupo
          titulo="Cumplimiento"
          subtitulo="Porcentaje diario de checks completados por el grupo."
          datos={
            data.graficas
              .cumplimiento
          }
          dataKey="porcentaje"
          unidad="%"
        />

        <GraficoGrupo
          titulo="Peso"
          subtitulo="Promedio de los pesos registrados en cada día."
          datos={
            data.graficas
              .peso
          }
          dataKey="promedio"
          unidad=" kg"
        />

        <GraficoGrupo
          titulo="Cintura"
          subtitulo="Promedio de las mediciones de cintura registradas."
          datos={
            data.graficas
              .cintura
          }
          dataKey="promedio"
          unidad=" cm"
        />

        <GraficoGrupo
          titulo="Glucemia en ayunas"
          subtitulo="Promedio de los registros de glucemia en ayunas."
          datos={
            data.graficas
              .glucemia
          }
          dataKey="promedio"
          unidad=" mg/dL"
        />

      </div>


      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

        <RankingCumplimiento
          titulo="Ranking de hoy"
          items={
            data.rankings
              .cumplimientoHoy
          }
        />

        <RankingCumplimiento
          titulo="Ranking acumulado"
          items={
            data.rankings
              .cumplimientoAcumulado
          }
        />

      </div>


      <div className="admin-card p-5">

        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />

          <h3 className="font-semibold text-gray-900">
            Ranking por pérdida de peso
          </h3>
        </div>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          Se compara el peso inicial con el promedio de las mediciones registradas.
        </p>


        {data.rankings.peso.length ===
        0 ? (
          <p className="mt-4 text-sm text-gray-500">
            Todavía no hay suficientes registros de peso.
          </p>
        ) : (
          <div className="mt-4 space-y-2">

            {data.rankings.peso.map(
              (item) => (
                <Link
                  key={
                    item.seguimientoId
                  }
                  href={`/admin/seguimiento/clientes/${item.seguimientoId}`}
                  className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition hover:bg-violet-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-amber-600 shadow-sm">
                    {item.puesto}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {item.nombre}
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Inicial{" "}
                      {numero(
                        item.inicial,
                        "kg"
                      )}
                      {" · "}
                      Promedio{" "}
                      {numero(
                        item.promedio,
                        "kg"
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-extrabold text-violet-700">
                      {item.perdidaPorcentaje !==
                      null
                        ? `${item.perdidaPorcentaje.toLocaleString(
                            "es-BO",
                            {
                              maximumFractionDigits:
                                2,
                            }
                          )}%`
                        : "—"}
                    </p>

                    <p className="text-[10px] text-gray-500">
                      {item.perdidaKg !==
                      null
                        ? `${item.perdidaKg.toLocaleString(
                            "es-BO",
                            {
                              maximumFractionDigits:
                                2,
                            }
                          )} kg`
                        : ""}
                    </p>
                  </div>
                </Link>
              )
            )}

          </div>
        )}

      </div>


      <div className="admin-card overflow-hidden">

        <div className="border-b border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900">
            Indicadores por participante
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Peso, cintura, glucemia en ayunas y cumplimiento.
          </p>
        </div>


        <div className="overflow-x-auto">

          <table className="min-w-[1180px] w-full text-left text-xs">

            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3">
                  Participante
                </th>

                <th className="px-4 py-3">
                  Hoy
                </th>

                <th className="px-4 py-3">
                  Acumulado
                </th>

                <th className="px-4 py-3">
                  Peso inicial
                </th>

                <th className="px-4 py-3">
                  Peso promedio
                </th>

                <th className="px-4 py-3">
                  Pérdida %
                </th>

                <th className="px-4 py-3">
                  Cintura inicial
                </th>

                <th className="px-4 py-3">
                  Cintura actual
                </th>

                <th className="px-4 py-3">
                  Cintura promedio
                </th>

                <th className="px-4 py-3">
                  Glucemia inicial
                </th>

                <th className="px-4 py-3">
                  Glucemia última
                </th>

                <th className="px-4 py-3">
                  Glucemia promedio
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {data.participantes.map(
                (participante) => (
                  <tr
                    key={
                      participante.miembroId
                    }
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/seguimiento/clientes/${participante.seguimientoId}`}
                        className="font-semibold text-violet-700 hover:underline"
                      >
                        {participante.nombre}
                      </Link>

                      <p className="mt-0.5 text-[10px] text-gray-400">
                        Desde día{" "}
                        {participante.diaIngreso}
                      </p>
                    </td>

                    <td className="px-4 py-3 font-bold">
                      {participante.cumplimientoHoy.porcentaje}%
                    </td>

                    <td className="px-4 py-3 font-bold">
                      {participante.cumplimientoAcumulado.porcentaje}%
                    </td>

                    <td className="px-4 py-3">
                      {numero(
                        participante.peso.inicial?.valor ??
                          null,
                        "kg"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {numero(
                        participante.peso.promedio,
                        "kg"
                      )}
                    </td>

                    <td className="px-4 py-3 font-semibold">
                      {participante.peso.perdidaPorcentaje !==
                      null
                        ? `${participante.peso.perdidaPorcentaje}%`
                        : "—"}
                    </td>

                    <td className="px-4 py-3">
                      {numero(
                        participante.cintura.inicial?.valor ??
                          null,
                        "cm"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {numero(
                        participante.cintura.ultima?.valor ??
                          null,
                        "cm"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {numero(
                        participante.cintura.promedio,
                        "cm"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {numero(
                        participante.glucemia.inicial?.valor ??
                          null,
                        "mg/dL"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {numero(
                        participante.glucemia.ultima?.valor ??
                          null,
                        "mg/dL"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {numero(
                        participante.glucemia.promedio,
                        "mg/dL"
                      )}
                    </td>
                  </tr>
                )
              )}

            </tbody>
          </table>

        </div>

      </div>

    </section>
  );
}
