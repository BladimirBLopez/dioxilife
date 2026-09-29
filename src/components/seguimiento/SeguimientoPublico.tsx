"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Image from "next/image";

import {
  Ban,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock3,
  Home,
  LoaderCircle,
  PauseCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";

import { toast } from "sonner";


type EstadoSeguimiento =
  | "PENDIENTE"
  | "ACTIVO"
  | "PAUSADO"
  | "COMPLETADO"
  | "CANCELADO";


type Progreso = {
  diaPlan: number;
  completado: boolean;
  completadoAt: string | null;
};


type RecordatorioActividad =
  | "NINGUNO"
  | "A_LA_HORA"
  | "MIN_15_ANTES"
  | "MIN_30_ANTES"
  | "MIN_60_ANTES";


type Actividad = {
  id: string;
  tipo: "TAREA" | "INFORMACION" | "CONTROL";
  recordatorio: RecordatorioActividad;
  titulo: string;
  descripcion: string | null;
  momento: string | null;
  hora: string | null;
  diaInicio: number;
  diaFin: number | null;
  orden: number;
  progresos: Progreso[];
};


type Seguimiento = {
  nombreCliente: string | null;
  nombrePlan: string;
  duracionDias: number;
  estado: EstadoSeguimiento;
  fechaInicioPrevista: string | null;
  fechaInicio: string | null;
  fechaFinalizado: string | null;
  diaActual: number | null;
  actividades: Actividad[];
};


type DatosRespuesta = {
  seguimiento: Seguimiento;
};


type Pestana =
  | "hoy"
  | "calendario"
  | "plan";


function primerNombre(
  nombre: string | null
) {
  if (!nombre) {
    return "Hola";
  }

  const limpio =
    nombre.trim();

  if (!limpio) {
    return "Hola";
  }

  return limpio.split(/\s+/)[0];
}


function formatearFecha(
  fecha: string | null
) {
  if (!fecha) {
    return "No definida";
  }

  return new Intl.DateTimeFormat(
    "es-BO",
    {
      timeZone:
        "America/La_Paz",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(
    new Date(fecha)
  );
}


function actividadCorrespondeDia(
  actividad: Actividad,
  dia: number
) {
  const diaFin =
    actividad.diaFin ??
    actividad.diaInicio;

  return (
    dia >=
      actividad.diaInicio &&
    dia <= diaFin
  );
}


function textoRecordatorio(
  recordatorio: RecordatorioActividad
) {
  switch (recordatorio) {
    case "A_LA_HORA":
      return "A la hora";
    case "MIN_15_ANTES":
      return "15 min antes";
    case "MIN_30_ANTES":
      return "30 min antes";
    case "MIN_60_ANTES":
      return "1 hora antes";
    default:
      return null;
  }
}


const ORDEN_MOMENTOS: Record<string, number> = {
  "Ayunas": 10,
  "Desayuno": 20,
  "Mañana": 25,
  "Media mañana": 30,
  "Almuerzo": 40,
  "Mediodía": 45,
  "Tarde": 50,
  "Cena": 60,
  "Noche": 70,
  "Antes de dormir": 80,
};


function ordenarActividadesAgenda(
  a: Actividad,
  b: Actividad
) {
  const momentoA =
    a.momento
      ? ORDEN_MOMENTOS[a.momento] ?? 90
      : 90;

  const momentoB =
    b.momento
      ? ORDEN_MOMENTOS[b.momento] ?? 90
      : 90;

  if (momentoA !== momentoB) {
    return momentoA - momentoB;
  }

  const horaA =
    a.hora || "99:99";

  const horaB =
    b.hora || "99:99";

  const porHora =
    horaA.localeCompare(horaB);

  if (porHora !== 0) {
    return porHora;
  }

  return a.orden - b.orden;
}


function actividadCompletadaEnDia(
  actividad: Actividad,
  dia: number
) {
  return actividad.progresos.some(
    (progreso) =>
      progreso.diaPlan ===
        dia &&
      progreso.completado
  );
}


function cantidadTotalTareas(
  seguimiento: Seguimiento
) {
  return seguimiento.actividades.reduce(
    (
      total,
      actividad
    ) => {
      if (
        actividad.tipo !==
        "TAREA"
      ) {
        return total;
      }

      const fin =
        Math.min(
          actividad.diaFin ??
            actividad.diaInicio,
          seguimiento.duracionDias
        );

      const inicio =
        Math.max(
          actividad.diaInicio,
          1
        );

      if (fin < inicio) {
        return total;
      }

      return (
        total +
        (fin - inicio + 1)
      );
    },
    0
  );
}


function cantidadCompletadas(
  seguimiento: Seguimiento
) {
  return seguimiento.actividades.reduce(
    (
      total,
      actividad
    ) =>
      actividad.tipo === "TAREA"
        ? total +
          actividad.progresos.filter(
            (progreso) =>
              progreso.completado
          ).length
        : total,
    0
  );
}


export default function SeguimientoPublico({
  token,
}: {
  token: string;
}) {
  const [
    seguimiento,
    setSeguimiento,
  ] =
    useState<Seguimiento | null>(
      null
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(true);

  const [
    iniciando,
    setIniciando,
  ] =
    useState(false);

  const [
    actualizandoActividad,
    setActualizandoActividad,
  ] =
    useState<string | null>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    pestana,
    setPestana,
  ] =
    useState<Pestana>(
      "hoy"
    );


  const cargarSeguimiento =
    useCallback(
      async () => {
        try {
          setError("");

          const respuesta =
            await fetch(
              `/api/seguimiento/${encodeURIComponent(token)}`,
              {
                cache:
                  "no-store",
              }
            );

          const data =
            await respuesta.json();

          if (!respuesta.ok) {
            throw new Error(
              data.error ||
                "No se pudo abrir el seguimiento."
            );
          }

          const datos =
            data as DatosRespuesta;

          setSeguimiento(
            datos.seguimiento
          );

        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo abrir el seguimiento."
          );

        } finally {
          setCargando(
            false
          );
        }
      },
      [
        token,
      ]
    );


  useEffect(
    () => {
      cargarSeguimiento();
    },
    [
      cargarSeguimiento,
    ]
  );


  const actividadesHoy =
    useMemo(
      () => {
        if (
          !seguimiento ||
          !seguimiento.diaActual
        ) {
          return [];
        }

        return seguimiento.actividades
          .filter(
            (actividad) =>
              actividadCorrespondeDia(
                actividad,
                seguimiento.diaActual as number
              )
          )
          .sort(
            ordenarActividadesAgenda
          );
      },
      [
        seguimiento,
      ]
    );


  const tareasHoy =
    useMemo(
      () =>
        actividadesHoy.filter(
          (actividad) =>
            actividad.tipo === "TAREA"
        ),
      [actividadesHoy]
    );


  const completadasHoy =
    useMemo(
      () => {
        if (
          !seguimiento ||
          !seguimiento.diaActual
        ) {
          return 0;
        }

        return tareasHoy.filter(
          (actividad) =>
            actividadCompletadaEnDia(
              actividad,
              seguimiento.diaActual as number
            )
        ).length;
      },
      [
        tareasHoy,
        seguimiento,
      ]
    );


  const porcentajeHoy =
    tareasHoy.length > 0
      ? Math.round(
          (
            completadasHoy /
            tareasHoy.length
          ) * 100
        )
      : 0;


  const totalTareas =
    seguimiento
      ? cantidadTotalTareas(
          seguimiento
        )
      : 0;


  const totalCompletadas =
    seguimiento
      ? cantidadCompletadas(
          seguimiento
        )
      : 0;


  const porcentajeGeneral =
    totalTareas > 0
      ? Math.min(
          100,
          Math.round(
            (
              totalCompletadas /
              totalTareas
            ) * 100
          )
        )
      : 0;


  async function iniciarSeguimiento() {
    if (iniciando) {
      return;
    }

    setIniciando(
      true
    );

    try {
      const respuesta =
        await fetch(
          `/api/seguimiento/${encodeURIComponent(token)}/iniciar`,
          {
            method:
              "POST",
          }
        );

      const data =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.error ||
            "No se pudo iniciar el seguimiento."
        );
      }

      toast.success(
        "Tu seguimiento comenzó correctamente."
      );

      setCargando(
        true
      );

      await cargarSeguimiento();

    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar el seguimiento."
      );

    } finally {
      setIniciando(
        false
      );
    }
  }


  async function cambiarEstadoActividad(
    actividad: Actividad
  ) {
    if (
      !seguimiento?.diaActual ||
      seguimiento.estado !==
        "ACTIVO"
    ) {
      return;
    }

    const completada =
      actividadCompletadaEnDia(
        actividad,
        seguimiento.diaActual
      );

    setActualizandoActividad(
      actividad.id
    );

    try {
      const respuesta =
        await fetch(
          `/api/seguimiento/${encodeURIComponent(token)}/actividades/${encodeURIComponent(actividad.id)}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                completado:
                  !completada,
              }),
          }
        );

      const data =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.error ||
            "No se pudo actualizar la actividad."
        );
      }

      setSeguimiento(
        (actual) => {
          if (
            !actual ||
            !actual.diaActual
          ) {
            return actual;
          }

          const dia =
            actual.diaActual;

          return {
            ...actual,

            actividades:
              actual.actividades.map(
                (item) => {
                  if (
                    item.id !==
                    actividad.id
                  ) {
                    return item;
                  }

                  const otros =
                    item.progresos.filter(
                      (progreso) =>
                        progreso.diaPlan !==
                        dia
                    );

                  return {
                    ...item,

                    progresos: [
                      ...otros,
                      {
                        diaPlan:
                          dia,

                        completado:
                          data.completado,

                        completadoAt:
                          data.completadoAt,
                      },
                    ],
                  };
                }
              ),
          };
        }
      );

      if (
        data.completado
      ) {
        toast.success(
          "Actividad marcada como realizada."
        );
      }

    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la actividad."
      );

    } finally {
      setActualizandoActividad(
        null
      );
    }
  }


  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F7FC] px-5">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-[#E9E4F2] bg-white shadow-sm">
            <Image
              src="/logo.png"
              alt="DioxiLife Bolivia"
              width={80}
              height={66}
              priority
              className="h-auto w-16"
            />
          </div>

          <LoaderCircle className="mx-auto mt-6 h-7 w-7 animate-spin text-brand-pink" />

          <p className="mt-3 text-sm font-medium text-brand-gray">
            Abriendo tu seguimiento...
          </p>
        </div>
      </main>
    );
  }


  if (
    error ||
    !seguimiento
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F7FC] px-5 py-10">
        <div className="w-full max-w-md rounded-3xl border border-[#E9E4F2] bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <h1 className="mt-5 text-xl font-bold text-[#1F1B24]">
            Enlace no disponible
          </h1>

          <p className="mt-2 text-sm leading-6 text-brand-gray">
            {error ||
              "No pudimos encontrar este seguimiento."}
          </p>

          <p className="mt-5 text-xs leading-5 text-brand-gray">
            Si recibiste un enlace nuevo, utiliza siempre el más reciente enviado por DioxiLife.
          </p>
        </div>
      </main>
    );
  }


  if (
    seguimiento.estado ===
    "PENDIENTE"
  ) {
    return (
      <main className="min-h-screen bg-[#F8F7FC] px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-md">

          <header className="mb-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-[#E9E4F2] bg-white shadow-sm">
              <Image
                src="/logo.png"
                alt="DioxiLife Bolivia"
                width={90}
                height={74}
                priority
                className="h-auto w-16"
              />
            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-brand-pink">
              Mi seguimiento
            </p>
          </header>


          <section className="overflow-hidden rounded-3xl border border-[#E9E4F2] bg-white shadow-sm">

            <div className="bg-gradient-to-br from-brand-blue to-[#4B2DB7] px-6 py-7 text-white">
              <Sparkles className="h-7 w-7 text-white/90" />

              <h1 className="mt-4 text-2xl font-bold">
                {primerNombre(
                  seguimiento.nombreCliente
                ) === "Hola"
                  ? "¡Bienvenido!"
                  : `Hola, ${primerNombre(
                      seguimiento.nombreCliente
                    )}`}
              </h1>

              <p className="mt-2 text-sm leading-6 text-white/80">
                Tu agenda personal ya está preparada.
              </p>
            </div>


            <div className="p-6">

              <div className="rounded-2xl bg-[#F8F6FF] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
                  Tu plan
                </p>

                <h2 className="mt-2 text-lg font-bold text-[#1F1B24]">
                  {seguimiento.nombrePlan}
                </h2>

                <div className="mt-4 flex items-center gap-2 text-sm text-brand-gray">
                  <CalendarDays className="h-4 w-4 text-brand-blue" />

                  <span>
                    {seguimiento.duracionDias} días de seguimiento
                  </span>
                </div>

                {seguimiento.fechaInicioPrevista && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-brand-gray">
                    <Clock3 className="h-4 w-4 text-brand-blue" />

                    <span>
                      Inicio previsto:{" "}
                      {formatearFecha(
                        seguimiento.fechaInicioPrevista
                      )}
                    </span>
                  </div>
                )}
              </div>


              <button
                type="button"
                onClick={
                  iniciarSeguimiento
                }
                disabled={
                  iniciando
                }
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-pink px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {iniciando ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Play className="h-5 w-5" />
                )}

                {iniciando
                  ? "Iniciando..."
                  : "Iniciar mi seguimiento"}
              </button>


              <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#EEEAF5] bg-white p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />

                <p className="text-xs leading-5 text-brand-gray">
                  Este enlace es personal. Guárdalo para volver a consultar tu agenda y tus avances.
                </p>
              </div>

            </div>
          </section>
        </div>
      </main>
    );
  }


  if (
    seguimiento.estado ===
    "PAUSADO"
  ) {
    return (
      <EstadoEspecial
        titulo="Seguimiento pausado"
        descripcion="Tu seguimiento está temporalmente pausado. Contacta con DioxiLife antes de continuar."
        icono={
          <PauseCircle className="h-8 w-8" />
        }
      />
    );
  }


  if (
    seguimiento.estado ===
    "CANCELADO"
  ) {
    return (
      <EstadoEspecial
        titulo="Seguimiento finalizado"
        descripcion="Este seguimiento fue cerrado y ya no admite nuevos registros."
        icono={
          <Ban className="h-8 w-8" />
        }
      />
    );
  }


  if (
    seguimiento.estado ===
    "COMPLETADO"
  ) {
    return (
      <EstadoEspecial
        titulo="Seguimiento completado"
        descripcion="Tu agenda fue completada. Tus registros anteriores permanecen guardados."
        icono={
          <Trophy className="h-8 w-8" />
        }
      />
    );
  }


  const diaActual =
    seguimiento.diaActual ??
    1;


  return (
    <main className="min-h-screen bg-[#F8F7FC] pb-24">

      <header className="border-b border-[#E9E4F2] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E9E4F2] bg-white">
              <Image
                src="/logo.png"
                alt="DioxiLife Bolivia"
                width={52}
                height={43}
                priority
                className="h-auto w-9"
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-pink">
                DioxiLife
              </p>

              <p className="text-sm font-semibold text-[#1F1B24]">
                Mi seguimiento
              </p>
            </div>
          </div>


          <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            Activo
          </div>

        </div>
      </header>


      <div className="mx-auto max-w-3xl px-4 py-5">

        <section>
          <p className="text-sm text-brand-gray">
            {primerNombre(
              seguimiento.nombreCliente
            ) === "Hola"
              ? "Bienvenido"
              : `Hola, ${primerNombre(
                  seguimiento.nombreCliente
                )}`}
          </p>

          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1F1B24]">
            Tu día de seguimiento
          </h1>
        </section>


        <section className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue to-[#4B2DB7] p-5 text-white shadow-sm">

          <div className="flex items-start justify-between gap-4">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                {seguimiento.nombrePlan}
              </p>

              <p className="mt-2 text-3xl font-extrabold">
                Día {diaActual}
              </p>

              <p className="mt-1 text-sm text-white/75">
                de {seguimiento.duracionDias} días
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <CalendarDays className="h-6 w-6" />
            </div>

          </div>


          <div className="mt-6">

            <div className="flex items-center justify-between gap-3 text-xs font-semibold">
              <span>
                Progreso de hoy
              </span>

              <span>
                {completadasHoy} de {tareasHoy.length}
              </span>
            </div>

            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-300"
                style={{
                  width:
                    `${porcentajeHoy}%`,
                }}
              />
            </div>

            <p className="mt-2 text-right text-xs text-white/70">
              {porcentajeHoy}% realizado
            </p>

          </div>
        </section>


        {pestana ===
          "hoy" && (

          <section className="mt-6">

            <div className="mb-3 flex items-center justify-between gap-3">

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
                  Hoy
                </p>

                <h2 className="mt-1 text-lg font-bold text-[#1F1B24]">
                  Tus actividades
                </h2>
              </div>

              {actividadesHoy.length > 0 && (
                <span className="rounded-full border border-[#E9E4F2] bg-white px-3 py-1 text-xs font-semibold text-brand-gray">
                  {actividadesHoy.length}
                </span>
              )}

            </div>


            {actividadesHoy.length ===
            0 ? (

              <div className="rounded-2xl border border-[#E9E4F2] bg-white p-7 text-center shadow-sm">
                <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" />

                <h3 className="mt-3 font-bold text-[#1F1B24]">
                  No tienes actividades para hoy
                </h3>

                <p className="mt-1 text-sm leading-6 text-brand-gray">
                  Puedes revisar tu calendario para ver las próximas actividades.
                </p>
              </div>

            ) : (

              <div className="space-y-3">

                {actividadesHoy.map(
                  (actividad) => {

                    const completada =
                      actividadCompletadaEnDia(
                        actividad,
                        diaActual
                      );

                    const actualizando =
                      actualizandoActividad ===
                      actividad.id;

                    return (
                      <article
                        key={
                          actividad.id
                        }
                        className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                          completada
                            ? "border-emerald-200"
                            : "border-[#E9E4F2]"
                        }`}
                      >

                        <div className="p-4">

                          <div className="flex items-start gap-3">

                            <div
                              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                completada
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-[#F8F6FF] text-brand-blue"
                              }`}
                            >
                              {completada ? (
                                <Check className="h-5 w-5" />
                              ) : (
                                <Clock3 className="h-5 w-5" />
                              )}
                            </div>


                            <div className="min-w-0 flex-1">

                              <div className="flex flex-wrap items-center gap-2">

                                <span
                                  className={`rounded-lg px-2 py-1 text-xs font-bold ${
                                    actividad.tipo === "TAREA"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : actividad.tipo === "INFORMACION"
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {actividad.tipo === "TAREA"
                                    ? "Tarea"
                                    : actividad.tipo === "INFORMACION"
                                    ? "Información"
                                    : "Control"}
                                </span>

                                {actividad.hora && (
                                  <span className="rounded-lg bg-[#F4F2F8] px-2 py-1 text-xs font-bold text-brand-blue">
                                    {actividad.hora}
                                  </span>
                                )}

                                {actividad.momento && (
                                  <span className="text-xs font-medium text-brand-gray">
                                    {actividad.momento}
                                  </span>
                                )}

                                {actividad.recordatorio !== "NINGUNO" && (
                                  <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                                    🔔 {textoRecordatorio(
                                      actividad.recordatorio
                                    )}
                                  </span>
                                )}

                              </div>


                              <h3 className={`mt-2 text-base font-bold ${
                                completada
                                  ? "text-emerald-800"
                                  : "text-[#1F1B24]"
                              }`}>
                                {actividad.titulo}
                              </h3>


                              {actividad.descripcion && (
                                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-brand-gray">
                                  {actividad.descripcion}
                                </p>
                              )}

                            </div>

                          </div>


                          {actividad.tipo === "TAREA" && (
                            <button
                              type="button"
                              onClick={() =>
                                cambiarEstadoActividad(
                                  actividad
                                )
                              }
                              disabled={
                                actualizando
                              }
                              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                completada
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "bg-brand-pink text-white hover:opacity-90"
                              }`}
                            >
                              {actualizando ? (
                                <LoaderCircle className="h-5 w-5 animate-spin" />
                              ) : completada ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <Circle className="h-5 w-5" />
                              )}

                              {completada
                                ? "Realizada"
                                : "Marcar como realizada"}
                            </button>
                          )}

                          {actividad.tipo === "INFORMACION" && (
                            <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                              Información del día
                            </div>
                          )}

                          {actividad.tipo === "CONTROL" && (
                            <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                              Control programado
                            </div>
                          )}

                        </div>
                      </article>
                    );
                  }
                )}

              </div>
            )}
          </section>
        )}


        {pestana ===
          "calendario" && (

          <section className="mt-6">

            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
              Calendario
            </p>

            <h2 className="mt-1 text-lg font-bold text-[#1F1B24]">
              Tu agenda completa
            </h2>

            <div className="mt-4 space-y-3">

              {Array.from(
                {
                  length:
                    seguimiento.duracionDias,
                },
                (
                  _,
                  indice
                ) =>
                  indice + 1
              ).map(
                (dia) => {

                  const actividadesDia =
                    seguimiento.actividades
                      .filter(
                        (actividad) =>
                          actividadCorrespondeDia(
                            actividad,
                            dia
                          )
                      )
                      .sort(
                        ordenarActividadesAgenda
                      );

                  const tareasDia =
                    actividadesDia.filter(
                      (actividad) =>
                        actividad.tipo === "TAREA"
                    );

                  const completadasDia =
                    tareasDia.filter(
                      (actividad) =>
                        actividadCompletadaEnDia(
                          actividad,
                          dia
                        )
                    ).length;

                  const esHoy =
                    dia ===
                    diaActual;

                  return (
                    <div
                      key={
                        dia
                      }
                      className={`rounded-2xl border bg-white p-4 shadow-sm ${
                        esHoy
                          ? "border-brand-pink"
                          : "border-[#E9E4F2]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">

                        <div className="flex items-center gap-3">

                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${
                              esHoy
                                ? "bg-brand-pink text-white"
                                : "bg-[#F8F6FF] text-brand-blue"
                            }`}
                          >
                            {dia}
                          </div>

                          <div>
                            <p className="font-bold text-[#1F1B24]">
                              Día {dia}
                            </p>

                            <p className="text-xs text-brand-gray">
                              {actividadesDia.length ===
                              0
                                ? "Sin actividades"
                                : `${actividadesDia.length} ${
                                    actividadesDia.length ===
                                    1
                                      ? "actividad"
                                      : "actividades"
                                  }`}
                            </p>
                          </div>

                        </div>


                        {tareasDia.length >
                          0 && (
                          <span className={`text-xs font-bold ${
                            completadasDia ===
                            tareasDia.length
                              ? "text-emerald-600"
                              : "text-brand-gray"
                          }`}>
                            {completadasDia}/{tareasDia.length}
                          </span>
                        )}

                      </div>


                      {actividadesDia.length >
                        0 && (
                        <div className="mt-3 space-y-2 border-t border-[#EEEAF5] pt-3">

                          {actividadesDia.map(
                            (actividad) => {

                              const hecha =
                                actividadCompletadaEnDia(
                                  actividad,
                                  dia
                                );

                              return (
                                <div
                                  key={
                                    actividad.id
                                  }
                                  className="flex items-start gap-2 text-sm"
                                >
                                  {actividad.tipo === "TAREA" ? (
                                    hecha ? (
                                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                    ) : (
                                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                                    )
                                  ) : actividad.tipo === "INFORMACION" ? (
                                    <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                                  ) : (
                                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                  )}

                                  <span className={
                                    hecha
                                      ? "text-brand-gray"
                                      : "text-[#1F1B24]"
                                  }>
                                    {actividad.hora
                                      ? `${actividad.hora} · `
                                      : ""}
                                    {actividad.titulo}

                                    {actividad.recordatorio !== "NINGUNO" && (
                                      <span className="ml-2 text-xs font-medium text-amber-600">
                                        · 🔔 {textoRecordatorio(
                                          actividad.recordatorio
                                        )}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              );
                            }
                          )}

                        </div>
                      )}
                    </div>
                  );
                }
              )}

            </div>
          </section>
        )}


        {pestana ===
          "plan" && (

          <section className="mt-6">

            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
              Mi plan
            </p>

            <h2 className="mt-1 text-lg font-bold text-[#1F1B24]">
              Resumen de seguimiento
            </h2>


            <div className="mt-4 rounded-2xl border border-[#E9E4F2] bg-white p-5 shadow-sm">

              <p className="text-sm font-bold text-[#1F1B24]">
                {seguimiento.nombrePlan}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">

                <div className="rounded-xl bg-[#F8F6FF] p-3">
                  <p className="text-xs text-brand-gray">
                    Duración
                  </p>

                  <p className="mt-1 text-lg font-bold text-brand-blue">
                    {seguimiento.duracionDias} días
                  </p>
                </div>


                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-700">
                    Progreso
                  </p>

                  <p className="mt-1 text-lg font-bold text-emerald-700">
                    {porcentajeGeneral}%
                  </p>
                </div>

              </div>


              <div className="mt-5">

                <div className="flex items-center justify-between text-xs font-semibold text-brand-gray">
                  <span>
                    Avance general
                  </span>

                  <span>
                    {totalCompletadas}/{totalTareas}
                  </span>
                </div>

                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#EEEAF5]">
                  <div
                    className="h-full rounded-full bg-brand-pink transition-all"
                    style={{
                      width:
                        `${porcentajeGeneral}%`,
                    }}
                  />
                </div>

              </div>


              <div className="mt-5 space-y-3 border-t border-[#EEEAF5] pt-4">

                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-brand-blue" />

                  <div>
                    <p className="text-xs text-brand-gray">
                      Fecha de inicio
                    </p>

                    <p className="text-sm font-semibold text-[#1F1B24]">
                      {formatearFecha(
                        seguimiento.fechaInicio
                      )}
                    </p>
                  </div>
                </div>


                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-brand-blue" />

                  <div>
                    <p className="text-xs text-brand-gray">
                      Día actual
                    </p>

                    <p className="text-sm font-semibold text-[#1F1B24]">
                      Día {diaActual} de {seguimiento.duracionDias}
                    </p>
                  </div>
                </div>

              </div>
            </div>


            <div className="mt-4 rounded-2xl border border-[#E9E4F2] bg-white p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />

                <p className="text-xs leading-5 text-brand-gray">
                  Tu agenda es personal. Las actividades que ves corresponden al seguimiento preparado para ti por DioxiLife.
                </p>
              </div>
            </div>

          </section>
        )}

      </div>


      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E9E4F2] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">

        <div className="mx-auto grid max-w-md grid-cols-3">

          <BotonNavegacion
            activo={
              pestana ===
              "hoy"
            }
            texto="Hoy"
            icono={
              <Home className="h-5 w-5" />
            }
            onClick={() =>
              setPestana(
                "hoy"
              )
            }
          />

          <BotonNavegacion
            activo={
              pestana ===
              "calendario"
            }
            texto="Calendario"
            icono={
              <CalendarDays className="h-5 w-5" />
            }
            onClick={() =>
              setPestana(
                "calendario"
              )
            }
          />

          <BotonNavegacion
            activo={
              pestana ===
              "plan"
            }
            texto="Mi plan"
            icono={
              <ClipboardList className="h-5 w-5" />
            }
            onClick={() =>
              setPestana(
                "plan"
              )
            }
          />

        </div>
      </nav>

    </main>
  );
}


function BotonNavegacion({
  activo,
  texto,
  icono,
  onClick,
}: {
  activo: boolean;
  texto: string;
  icono: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-xs font-semibold transition ${
        activo
          ? "text-brand-pink"
          : "text-brand-gray"
      }`}
    >
      {icono}

      <span>
        {texto}
      </span>
    </button>
  );
}


function EstadoEspecial({
  titulo,
  descripcion,
  icono,
}: {
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F7FC] px-5 py-10">

      <div className="w-full max-w-md rounded-3xl border border-[#E9E4F2] bg-white p-7 text-center shadow-sm">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-[#E9E4F2] bg-white">
          <Image
            src="/logo.png"
            alt="DioxiLife Bolivia"
            width={80}
            height={66}
            className="h-auto w-16"
          />
        </div>

        <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8F6FF] text-brand-blue">
          {icono}
        </div>

        <h1 className="mt-4 text-xl font-bold text-[#1F1B24]">
          {titulo}
        </h1>

        <p className="mt-2 text-sm leading-6 text-brand-gray">
          {descripcion}
        </p>

      </div>
    </main>
  );
}
