"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Clock3,
  Frown,
  LoaderCircle,
  Meh,
  Save,
  Smile,
} from "lucide-react";

import { toast } from "sonner";

import CloudinaryUpload from "@/components/CloudinaryUpload";


type MedicionGlucosa = {
  numero: number;
  valor: number | null;
  hora: string | null;
  momento: string | null;
};

type MedicionGlucosaFormulario = {
  numero: number;
  valor: string;
  hora: string;
  momento: string;
};

type Registro = {
  diaPlan: number;
  peso: number | null;
  cinturaCm: number | null;
  glucemiaAyunas: number | null;
  estadoAnimo: string | null;
  observacion: string | null;
};

type Respuesta = {
  diaActual: number | null;
  editable?: boolean;
  diaMinimo?: number;
  diaMaximo?: number | null;
  historialDisponible?: boolean;
  registro: Registro | null;
  medicionesGlucosa?: MedicionGlucosa[];
  fotos?: string[];
};

const MAX_FOTOS = 6;


function crearMedicionesVacias():
  MedicionGlucosaFormulario[] {
  return Array.from(
    { length: 4 },
    (_, indice) => ({
      numero:
        indice + 1,

      valor: "",
      hora: "",
      momento: "",
    })
  );
}


function prepararMediciones(
  mediciones:
    MedicionGlucosa[] | undefined
): MedicionGlucosaFormulario[] {
  return Array.from(
    { length: 4 },
    (_, indice) => {
      const numero =
        indice + 1;

      const medicion =
        mediciones?.find(
          (item) =>
            item.numero ===
            numero
        );

      return {
        numero,

        valor:
          medicion?.valor ===
            null ||
          medicion?.valor ===
            undefined
            ? ""
            : String(
                medicion.valor
              ),

        hora:
          medicion?.hora ??
          "",

        momento:
          medicion?.momento ??
          "",
      };
    }
  );
}


export default function MedicionesSeguimientoPublico({
  token,
  onGuardado,
}: {
  token: string;
  onGuardado?:
    () =>
      | void
      | Promise<void>;
}) {
  const [
    diaActual,
    setDiaActual,
  ] =
    useState<number | null>(
      null
    );

  const [
    peso,
    setPeso,
  ] =
    useState("");

  const [
    cinturaCm,
    setCinturaCm,
  ] =
    useState("");

  const [
    estadoAnimo,
    setEstadoAnimo,
  ] =
    useState<string | null>(null);

  const [
    observacionTexto,
    setObservacionTexto,
  ] =
    useState("");

  const [
    medicionesGlucosa,
    setMedicionesGlucosa,
  ] =
    useState<
      MedicionGlucosaFormulario[]
    >(
      crearMedicionesVacias
    );

  const [fotos, setFotos] =
    useState<string[]>([]);

  const [subiendoFoto, setSubiendoFoto] =
    useState(false);

  const [
    cargando,
    setCargando,
  ] =
    useState(true);

  const [
    guardando,
    setGuardando,
  ] =
    useState(false);

  const [
    editable,
    setEditable,
  ] =
    useState(false);
  const [historialDisponible, setHistorialDisponible] = useState(false);
  const [diaMinimo, setDiaMinimo] = useState(1);
  const [diaMaximo, setDiaMaximo] = useState(1);

  const [
    sucio,
    setSucio,
  ] =
    useState(false);


  const cargar =
    useCallback(
      async (dia?: number) => {
        setCargando(true);

        try {
          const res =
            await fetch(
              (`/api/seguimiento/${encodeURIComponent(
                token
              )}/mediciones` + (dia === undefined ? "" : `?dia=${dia}`)),
              {
                cache:
                  "no-store",
              }
            );

          const data =
            await res
              .json()
              .catch(
                () => null
              );

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
      setHistorialDisponible(respuesta.historialDisponible === true);
      setDiaMinimo(typeof respuesta.diaMinimo === "number" ? respuesta.diaMinimo : 1);
      setDiaMaximo(typeof respuesta.diaMaximo === "number" ? respuesta.diaMaximo : 1);

          setPeso(
            respuesta.registro
              ?.peso === null ||
            respuesta.registro
              ?.peso ===
              undefined
              ? ""
              : String(
                  respuesta
                    .registro
                    .peso
                )
          );

          setCinturaCm(
            respuesta.registro
              ?.cinturaCm ===
                null ||
            respuesta.registro
              ?.cinturaCm ===
                undefined
              ? ""
              : String(
                  respuesta
                    .registro
                    .cinturaCm
                )
          );

          setMedicionesGlucosa(
            prepararMediciones(
              respuesta
                .medicionesGlucosa
            )
          );

          setEstadoAnimo(
            respuesta.registro
              ?.estadoAnimo ??
              null
          );

          setObservacionTexto(
            respuesta.registro
              ?.observacion ??
              ""
          );

          setFotos(
            respuesta.fotos ?? []
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


  function cambiarMedicion(
    numero: number,
    campo:
      | "valor"
      | "hora"
      | "momento",
    valor: string
  ) {
    setMedicionesGlucosa(
      (actual) =>
        actual.map(
          (medicion) =>
            medicion.numero ===
            numero
              ? {
                  ...medicion,
                  [campo]:
                    valor,
                }
              : medicion
        )
    );

    setSucio(true);
  }


  function agregarFoto(url: string) {
    setFotos((actual) => [...actual, url]);
    setSucio(true);
  }


  function quitarFoto(indice: number) {
    setFotos((actual) =>
      actual.filter((_, i) => i !== indice)
    );
    setSucio(true);
  }


  async function guardar() {
    if (
      !editable ||
      guardando ||
      subiendoFoto ||
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

                estadoAnimo:
                  estadoAnimo,

                observacion:
                  observacionTexto.trim() ||
                  null,

                fotos,

                medicionesGlucosa:
                  medicionesGlucosa.map(
                    (
                      medicion
                    ) => ({
                      numero:
                        medicion.numero,

                      valor:
                        medicion.valor
                          .trim() ||
                        null,

                      hora:
                        medicion.hora
                          .trim() ||
                        null,

                      momento:
                        medicion.momento
                          .trim() ||
                        null,
                    })
                  ),
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(
            () => null
          );

      if (!res.ok) {
        toast.error(
          "No se pudieron guardar las mediciones",
          {
            id:
              toastId,

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
          .cinturaCm ===
            null
          ? ""
          : String(
              data.registro
                .cinturaCm
            )
      );

      setMedicionesGlucosa(
        prepararMediciones(
          data.medicionesGlucosa
        )
      );

      setEstadoAnimo(
        data.registro
          .estadoAnimo ??
          null
      );

      setObservacionTexto(
        data.registro
          .observacion ??
          ""
      );

      setFotos(data.fotos ?? []);

      setSucio(false);

      if (onGuardado) {
        await onGuardado();
      }

      toast.success(
        "Mediciones guardadas",
        {
          id:
            toastId,
        }
      );
    } catch {
      toast.error(
        "No se pudo conectar con el servidor",
        {
          id:
            toastId,
        }
      );
    } finally {
      setGuardando(false);
    }
  }


  if (cargando) {
    return (
      <div className="py-4">

        <div className="flex items-center gap-2 text-sm font-semibold text-brand-gray">

          <LoaderCircle className="h-4 w-4 animate-spin" />

          Cargando mediciones...

        </div>

      </div>
    );
  }


  if (!diaActual) {
    return null;
  }


  return (
    <div className="py-3">

      <div>

        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
          Mediciones del día
        </p>

        <h2 className="mt-1 text-lg font-extrabold text-[#1F1B24]">
          Día {diaActual}
        </h2>

        <p className="mt-1 text-xs leading-5 text-brand-gray">
          {editable
            ? "Registra las mediciones que tengas disponibles hoy."
            : "Estas mediciones están disponibles en modo consulta."}
        </p>

      </div>


      {historialDisponible && diaMaximo >= diaMinimo && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E9E4F2] bg-[#FAF9FC] p-3">
          <button
            type="button"
            onClick={() => void cargar(Math.max(diaMinimo, (diaActual ?? diaMinimo) - 1))}
            disabled={(diaActual ?? diaMinimo) <= diaMinimo}
            className="rounded-lg border border-[#E9E4F2] bg-white px-3 py-2 text-sm font-semibold text-brand-blue disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-sm font-bold text-brand-blue">
            Día {diaActual} de {diaMaximo}
          </span>
          <button
            type="button"
            onClick={() => void cargar(Math.min(diaMaximo, (diaActual ?? diaMinimo) + 1))}
            disabled={(diaActual ?? diaMinimo) >= diaMaximo}
            className="rounded-lg border border-[#E9E4F2] bg-white px-3 py-2 text-sm font-semibold text-brand-blue disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">

        <div>

          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-brand-gray">
            Peso
          </label>

          <div className="relative">

            <input
              type="text"
              inputMode="decimal"
              disabled={
                !editable
              }
              value={
                peso
              }
              onChange={(
                event
              ) => {
                setPeso(
                  event.target
                    .value
                );

                setSucio(
                  true
                );
              }}
              placeholder="Ej. 80.50"
              className="w-full rounded-xl border border-[#DDD7E8] bg-[#FAF9FC] px-4 py-3 pr-14 text-base font-semibold text-[#1F1B24] outline-none transition focus:border-brand-blue focus:bg-white disabled:opacity-70"
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
              disabled={
                !editable
              }
              value={
                cinturaCm
              }
              onChange={(
                event
              ) => {
                setCinturaCm(
                  event.target
                    .value
                );

                setSucio(
                  true
                );
              }}
              placeholder="Ej. 94.00"
              className="w-full rounded-xl border border-[#DDD7E8] bg-[#FAF9FC] px-4 py-3 pr-14 text-base font-semibold text-[#1F1B24] outline-none transition focus:border-brand-blue focus:bg-white disabled:opacity-70"
            />

            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-brand-gray">
              cm
            </span>

          </div>

        </div>

      </div>


      <div className="mt-6">

        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8F6FF] text-brand-blue">
            <Clock3 className="h-4 w-4" />
          </div>

          <div className="min-w-0">

            <h3 className="font-extrabold text-[#1F1B24]">
              Glucosa de hoy
            </h3>

            <p className="mt-0.5 text-xs leading-5 text-brand-gray">
              Registra hasta 4 mediciones. Si ingresas un valor, indica también su hora. Cada medición debe tener un horario diferente.
            </p>

          </div>

        </div>


        <div className="mt-3 space-y-3">

          {medicionesGlucosa.map(
            (
              medicion
            ) => (

              <div
                key={
                  medicion.numero
                }
                className="rounded-xl border border-[#E9E4F2] bg-[#FAF9FC] p-3"
              >

                <div className="mb-3 flex items-center justify-between gap-3">

                  <p className="text-sm font-extrabold text-[#1F1B24]">
                    Medición {medicion.numero}
                  </p>

                  {medicion.valor && (

                    <span className="text-xs font-bold text-brand-blue">
                      {medicion.valor} mg/dL
                    </span>

                  )}

                </div>


                <div className="grid grid-cols-[1fr_120px] gap-2">

                  <div>

                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-brand-gray">
                      Valor
                    </label>

                    <div className="relative">

                      <input
                        type="text"
                        inputMode="decimal"
                        disabled={
                          !editable
                        }
                        value={
                          medicion.valor
                        }
                        onChange={(
                          event
                        ) =>
                          cambiarMedicion(
                            medicion.numero,
                            "valor",
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Ej. 102"
                        className="w-full rounded-xl border border-[#DDD7E8] bg-white px-3 py-2.5 pr-16 text-sm font-semibold text-[#1F1B24] outline-none transition focus:border-brand-blue disabled:opacity-70"
                      />

                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-semibold text-brand-gray">
                        mg/dL
                      </span>

                    </div>

                  </div>


                  <div>

                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-brand-gray">
                      Hora *
                    </label>

                    <input
                      type="time"
                      disabled={
                        !editable
                      }
                      value={
                        medicion.hora
                      }
                      onChange={(
                        event
                      ) =>
                        cambiarMedicion(
                          medicion.numero,
                          "hora",
                          event
                            .target
                            .value
                        )
                      }
                      className="w-full rounded-xl border border-[#DDD7E8] bg-white px-2 py-2.5 text-sm font-semibold text-[#1F1B24] outline-none transition focus:border-brand-blue disabled:opacity-70"
                    />

                  </div>

                </div>


                <div className="mt-2">

                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-brand-gray">
                    Momento o referencia
                  </label>

                  <input
                    type="text"
                    disabled={
                      !editable
                    }
                    value={
                      medicion.momento
                    }
                    onChange={(
                      event
                    ) =>
                      cambiarMedicion(
                        medicion.numero,
                        "momento",
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Ej. Después del almuerzo"
                    maxLength={
                      120
                    }
                    className="w-full rounded-xl border border-[#DDD7E8] bg-white px-3 py-2.5 text-sm text-[#1F1B24] outline-none transition focus:border-brand-blue disabled:opacity-70"
                  />

                </div>

              </div>

            )
          )}

        </div>

      </div>


      <div className="mt-6">

        <h3 className="font-extrabold text-[#1F1B24]">
          ¿Cómo te sientes hoy?
        </h3>

        <div className="mt-3 grid grid-cols-3 gap-2">

          {(
            [
              {
                valor: "BIEN",
                texto: "Bien",
                Icono: Smile,
              },
              {
                valor: "REGULAR",
                texto: "Regular",
                Icono: Meh,
              },
              {
                valor: "MAL",
                texto: "Mal",
                Icono: Frown,
              },
            ] as const
          ).map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              disabled={!editable}
              onClick={() => {
                setEstadoAnimo(
                  estadoAnimo === opcion.valor
                    ? null
                    : opcion.valor
                );
                setSucio(true);
              }}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                estadoAnimo === opcion.valor
                  ? "border-brand-pink bg-brand-pink/10 text-brand-pink"
                  : "border-[#DDD7E8] bg-[#FAF9FC] text-brand-gray"
              }`}
            >
              <opcion.Icono className="h-5 w-5" />
              {opcion.texto}
            </button>
          ))}

        </div>

        <label className="mb-1.5 mt-3 block text-xs font-bold uppercase tracking-wide text-brand-gray">
          Detalles (opcional)
        </label>

        <textarea
          disabled={!editable}
          value={observacionTexto}
          onChange={(event) => {
            setObservacionTexto(event.target.value);
            setSucio(true);
          }}
          maxLength={500}
          rows={3}
          placeholder="Contanos cómo te sentiste hoy..."
          className="w-full rounded-xl border border-[#DDD7E8] bg-[#FAF9FC] px-4 py-3 text-sm text-[#1F1B24] outline-none transition focus:border-brand-blue focus:bg-white disabled:opacity-70"
        />

      </div>


      <div className="mt-6">

        <h3 className="font-extrabold text-[#1F1B24]">
          Fotos de hoy (opcional)
        </h3>

        <p className="mt-1 text-xs text-brand-gray">
          Podés subir hasta {MAX_FOTOS} fotos de tu evolución.
        </p>

        {fotos.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {fotos.map((url, indice) => (
              <div
                key={url + indice}
                className="relative aspect-square overflow-hidden rounded-xl border border-[#DDD7E8]"
              >
                <img
                  src={url}
                  alt={`Foto ${indice + 1}`}
                  className="h-full w-full object-cover"
                />
                {editable && (
                  <button
                    type="button"
                    onClick={() => quitarFoto(indice)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {editable && fotos.length < MAX_FOTOS && (
          <div className="mt-3">
            <CloudinaryUpload
              value=""
              soloImagen
              onUploadingChange={setSubiendoFoto}
              onChange={agregarFoto}
            />
          </div>
        )}

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
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-pink px-4 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
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

    </div>
  );
}
