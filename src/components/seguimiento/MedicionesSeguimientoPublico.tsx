"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  LoaderCircle,
  Save,
} from "lucide-react";

import { toast } from "sonner";

type Registro = {
  diaPlan: number;
  peso: number | null;
  cinturaCm: number | null;
  glucemiaAyunas: number | null;
};

type Respuesta = {
  diaActual: number | null;
  editable?: boolean;
  registro: Registro | null;
};

export default function MedicionesSeguimientoPublico({
  token,
}: {
  token: string;
}) {
  const [diaActual, setDiaActual] =
    useState<number | null>(null);

  const [peso, setPeso] =
    useState("");

  const [cinturaCm, setCinturaCm] =
    useState("");

  const [
    glucemiaAyunas,
    setGlucemiaAyunas,
  ] = useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [editable, setEditable] =
    useState(false);

  const [sucio, setSucio] =
    useState(false);

  const cargar =
    useCallback(
      async () => {
        setCargando(true);

        try {
          const res =
            await fetch(
              `/api/seguimiento/${encodeURIComponent(
                token
              )}/mediciones`,
              {
                cache: "no-store",
              }
            );

          const data =
            await res
              .json()
              .catch(() => null);

          if (!res.ok) {
            return;
          }

          const respuesta =
            data as Respuesta;

          setDiaActual(
            respuesta.diaActual
          );

          setEditable(
            respuesta.editable ===
              true
          );

          setPeso(
            respuesta.registro
              ?.peso === null ||
            respuesta.registro
              ?.peso === undefined
              ? ""
              : String(
                  respuesta
                    .registro
                    .peso
                )
          );

          setCinturaCm(
            respuesta.registro
              ?.cinturaCm === null ||
            respuesta.registro
              ?.cinturaCm === undefined
              ? ""
              : String(
                  respuesta
                    .registro
                    .cinturaCm
                )
          );

          setGlucemiaAyunas(
            respuesta.registro
              ?.glucemiaAyunas === null ||
            respuesta.registro
              ?.glucemiaAyunas === undefined
              ? ""
              : String(
                  respuesta
                    .registro
                    .glucemiaAyunas
                )
          );

          setSucio(false);
        } finally {
          setCargando(false);
        }
      },
      [token]
    );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function guardar() {
    if (
      !editable ||
      guardando ||
      !sucio
    ) {
      return;
    }

    setGuardando(true);

    const toastId =
      toast.loading(
        "Guardando mediciones..."
      );

    try {
      const res =
        await fetch(
          `/api/seguimiento/${encodeURIComponent(
            token
          )}/mediciones`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                peso:
                  peso.trim() ||
                  null,

                cinturaCm:
                  cinturaCm.trim() ||
                  null,

                glucemiaAyunas:
                  glucemiaAyunas.trim() ||
                  null,
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          "No se pudieron guardar las mediciones",
          {
            id: toastId,
            description:
              data?.error ||
              "Inténtalo nuevamente.",
          }
        );

        return;
      }

      setPeso(
        data.registro
          .peso === null
          ? ""
          : String(
              data.registro
                .peso
            )
      );

      setCinturaCm(
        data.registro
          .cinturaCm === null
          ? ""
          : String(
              data.registro
                .cinturaCm
            )
      );

      setGlucemiaAyunas(
        data.registro
          .glucemiaAyunas === null
          ? ""
          : String(
              data.registro
                .glucemiaAyunas
            )
      );

      setSucio(false);

      toast.success(
        "Mediciones guardadas",
        {
          id: toastId,
        }
      );
    } catch {
      toast.error(
        "No se pudo conectar con el servidor",
        {
          id: toastId,
        }
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <section className="mt-5 rounded-2xl border border-[#E9E4F2] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-gray">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Cargando mediciones...
        </div>
      </section>
    );
  }

  if (!diaActual) {
    return null;
  }

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-[#E9E4F2] bg-white p-4 shadow-sm sm:p-5">

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
          Mediciones de hoy
        </p>

        <h2 className="mt-1 text-lg font-extrabold text-[#1F1B24]">
          Día {diaActual}
        </h2>

        <p className="mt-1 text-xs leading-5 text-brand-gray">
          {editable
            ? "Registra solamente las mediciones que tengas disponibles hoy."
            : "Estas son tus últimas mediciones registradas. El historial se encuentra en modo consulta."}
        </p>
      </div>


      <div className="mt-4 space-y-3">

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-brand-gray">
            Peso
          </label>

          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              disabled={!editable}
              value={peso}
              onChange={(event) => {
                setPeso(
                  event.target.value
                );
                setSucio(true);
              }}
              placeholder="Ej. 80.50"
              className="w-full rounded-xl border border-[#DDD7E8] bg-[#FAF9FC] px-4 py-3 pr-14 text-base font-semibold text-[#1F1B24] outline-none transition focus:border-brand-blue focus:bg-white"
            />

            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-brand-gray">
              kg
            </span>
          </div>
        </div>


        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-brand-gray">
            Cintura
          </label>

          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              disabled={!editable}
              value={cinturaCm}
              onChange={(event) => {
                setCinturaCm(
                  event.target.value
                );
                setSucio(true);
              }}
              placeholder="Ej. 94.00"
              className="w-full rounded-xl border border-[#DDD7E8] bg-[#FAF9FC] px-4 py-3 pr-14 text-base font-semibold text-[#1F1B24] outline-none transition focus:border-brand-blue focus:bg-white"
            />

            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-brand-gray">
              cm
            </span>
          </div>
        </div>


        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-brand-gray">
            Glucemia en ayunas
          </label>

          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              disabled={!editable}
              value={glucemiaAyunas}
              onChange={(event) => {
                setGlucemiaAyunas(
                  event.target.value
                );
                setSucio(true);
              }}
              placeholder="Ej. 102"
              className="w-full rounded-xl border border-[#DDD7E8] bg-[#FAF9FC] px-4 py-3 pr-20 text-base font-semibold text-[#1F1B24] outline-none transition focus:border-brand-blue focus:bg-white"
            />

            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-semibold text-brand-gray">
              mg/dL
            </span>
          </div>
        </div>

      </div>


      <button
        type="button"
        disabled={
          !editable ||
          guardando ||
          !sucio
        }
        onClick={() =>
          void guardar()
        }
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-pink px-4 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {guardando ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}

        {!editable
          ? "Solo lectura"
          : guardando
          ? "Guardando..."
          : sucio
          ? "Guardar mediciones"
          : "Mediciones guardadas"}
      </button>

    </section>
  );
}
