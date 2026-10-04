"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  LoaderCircle,
  Trophy,
  Users,
} from "lucide-react";

type ItemRanking = {
  puesto: number;
  nombre: string;
  esActual: boolean;
  porcentaje: number;
  completados: number;
  total: number;
};

type Respuesta = {
  grupo: {
    id: string;
    nombre: string;
    objetivo: string;
    diaActual: number;
    duracionDias: number;
    participantes: number;
  } | null;

  posicion?: {
    hoy: ItemRanking | null;
    acumulada:
      ItemRanking | null;
  };

  rankings?: {
    hoy: ItemRanking[];
    acumulado:
      ItemRanking[];
  };
};

function medalla(
  puesto: number
) {
  if (puesto === 1) {
    return "🥇";
  }

  if (puesto === 2) {
    return "🥈";
  }

  if (puesto === 3) {
    return "🥉";
  }

  return `${puesto}.`;
}

function ListaRanking({
  titulo,
  items,
}: {
  titulo: string;
  items: ItemRanking[];
}) {
  return (
    <div>

      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-brand-gray">
        {titulo}
      </p>


      <div className="mt-2 space-y-2">

        {items.map(
          (
            item,
            indice
          ) => (
            <div
              key={`${item.nombre}-${indice}`}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                item.esActual
                  ? "border-brand-blue/20 bg-[#F5F2FF]"
                  : "border-[#EEEAF3] bg-[#FAF9FC]"
              }`}
            >

              <div className="w-8 shrink-0 text-center text-sm font-extrabold text-[#1F1B24]">
                {medalla(
                  item.puesto
                )}
              </div>


              <div className="min-w-0 flex-1">

                <p
                  className={`truncate text-sm font-bold ${
                    item.esActual
                      ? "text-brand-blue"
                      : "text-[#1F1B24]"
                  }`}
                >
                  {item.nombre}
                </p>

                <p className="mt-0.5 text-[10px] font-medium text-brand-gray">
                  {item.completados}/
                  {item.total} checks
                </p>

              </div>


              <p
                className={`text-base font-extrabold ${
                  item.esActual
                    ? "text-brand-blue"
                    : "text-[#1F1B24]"
                }`}
              >
                {item.porcentaje}%
              </p>

            </div>
          )
        )}

      </div>

    </div>
  );
}

export default function RankingGrupoPublico({
  token,
}: {
  token: string;
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

  const cargar =
    useCallback(
      async () => {
        setCargando(true);

        try {
          const res =
            await fetch(
              `/api/seguimiento/${encodeURIComponent(
                token
              )}/grupo`,
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

          setData(
            respuesta
          );
        } finally {
          setCargando(false);
        }
      },
      [token]
    );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <section className="mt-5 rounded-2xl border border-[#E9E4F2] bg-white p-4 shadow-sm">

        <div className="flex items-center gap-2 text-sm font-semibold text-brand-gray">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Cargando grupo...
        </div>

      </section>
    );
  }

  if (
    !data?.grupo ||
    !data.rankings
  ) {
    return null;
  }

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-[#E9E4F2] bg-white shadow-sm">

      <div className="border-b border-[#EEEAF3] bg-gradient-to-br from-[#F7F4FF] to-white p-4 sm:p-5">

        <div className="flex items-start justify-between gap-3">

          <div className="min-w-0">

            <div className="flex items-center gap-2">

              <Trophy className="h-4 w-4 text-amber-500" />

              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-pink">
                Mi grupo
              </p>

            </div>

            <h2 className="mt-2 truncate text-lg font-extrabold text-[#1F1B24]">
              {data.grupo.nombre}
            </h2>

            <p className="mt-1 text-xs leading-5 text-brand-gray">
              {data.grupo.objetivo}
            </p>

          </div>


          <div className="shrink-0 rounded-xl bg-white px-3 py-2 text-right shadow-sm">

            <p className="text-sm font-extrabold text-brand-blue">
              Día {data.grupo.diaActual}
            </p>

            <p className="text-[10px] font-semibold text-brand-gray">
              de {data.grupo.duracionDias}
            </p>

          </div>

        </div>


        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-gray">
          <Users className="h-3.5 w-3.5" />
          {data.grupo.participantes} participantes
        </div>

      </div>


      {data.posicion?.hoy && (

        <div className="grid grid-cols-2 divide-x divide-[#EEEAF3] border-b border-[#EEEAF3] bg-[#FAF9FC]">

          <div className="p-4 text-center">

            <p className="text-[10px] font-bold uppercase tracking-wide text-brand-gray">
              Mi puesto hoy
            </p>

            <p className="mt-1 text-2xl font-extrabold text-brand-blue">
              #{data.posicion.hoy.puesto}
            </p>

            <p className="mt-0.5 text-xs font-semibold text-brand-gray">
              {data.posicion.hoy.porcentaje}%
            </p>

          </div>


          <div className="p-4 text-center">

            <p className="text-[10px] font-bold uppercase tracking-wide text-brand-gray">
              Mi puesto acumulado
            </p>

            <p className="mt-1 text-2xl font-extrabold text-brand-blue">
              #{data.posicion.acumulada?.puesto ?? "—"}
            </p>

            <p className="mt-0.5 text-xs font-semibold text-brand-gray">
              {data.posicion.acumulada?.porcentaje ?? 0}%
            </p>

          </div>

        </div>

      )}


      <div className="space-y-6 p-4 sm:p-5">

        <ListaRanking
          titulo="Ranking de hoy"
          items={
            data.rankings.hoy
          }
        />

        <div className="h-px bg-[#EEEAF3]" />

        <ListaRanking
          titulo="Ranking acumulado"
          items={
            data.rankings.acumulado
          }
        />

      </div>


      <div className="border-t border-[#EEEAF3] bg-[#FAF9FC] px-4 py-3">

        <p className="text-[10px] leading-4 text-brand-gray">
          El ranking muestra únicamente cumplimiento. Las mediciones personales de salud no se comparten con otros participantes.
        </p>

      </div>

    </section>
  );
}
