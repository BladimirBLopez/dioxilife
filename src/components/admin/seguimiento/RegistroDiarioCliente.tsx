"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

type IndicacionDia = {
  id: string;
  hora: string;
  texto: string;
  orden: number;
  activo: boolean;
  completado: boolean;
  completadoAt: string | null;
};

type ActividadDia = {
  id: string;
  tipo: "TAREA" | "INFORMACION" | "CONTROL";
  seccion: "PRINCIPAL" | "ADICIONAL";
  titulo: string;
  descripcion: string | null;
  momento: string | null;
  hora: string | null;
  diaInicio: number;
  diaFin: number | null;
  orden: number;
  activo: boolean;
  indicaciones: IndicacionDia[];
  completado: boolean | null;
  completadoAt: string | null;
};

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

type RegistroDia = {
  id: string | null;
  diaPlan: number;
  peso: number | null;
  cinturaCm: number | null;
  glucemiaAyunas: number | null;
  observacion: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type RespuestaDia = {
  seguimiento: {
    id: string;
    nombreCliente: string | null;
    nombrePlan: string;
    duracionDias: number;
    estado: string;
  };

  registro: RegistroDia;

  medicionesGlucosa: MedicionGlucosa[];

  actividades: ActividadDia[];

  resumenPeso: {
    cantidadRegistros: number;

    pesoInicial: {
      diaPlan: number;
      peso: number;
    } | null;

    ultimoPeso: {
      diaPlan: number;
      peso: number;
    } | null;

    pesoPromedio: number | null;

    cambio: number | null;

    esPesoFinal: boolean;
  };

  resumen: {
    realizadas: number;
    pendientes: number;
    total: number;
    porcentaje: number;

    actividadesRealizadas: number;
    actividadesTotal: number;

    indicacionesRealizadas: number;
    indicacionesTotal: number;
  };
};

function prepararMedicionesGlucosa(
  mediciones:
    MedicionGlucosa[] | undefined
): MedicionGlucosaFormulario[] {
  return Array.from(
    {
      length: 4,
    },
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


type Props = {
  seguimientoId: string;
  duracionDias: number;
  diaInicial: number;
};

function calcularResumen(
  actividades: ActividadDia[]
) {
  const tareas =
    actividades.filter(
      (actividad) =>
        actividad.tipo ===
        "TAREA"
    );

  const actividadesRealizadas =
    tareas.filter(
      (actividad) =>
        actividad.completado ===
        true
    ).length;

  const actividadesTotal =
    tareas.length;

  const indicacionesTotal =
    tareas.reduce(
      (
        total,
        actividad
      ) =>
        total +
        actividad.indicaciones.length,
      0
    );

  const indicacionesRealizadas =
    tareas.reduce(
      (
        total,
        actividad
      ) =>
        total +
        actividad.indicaciones.filter(
          (indicacion) =>
            indicacion.completado
        ).length,
      0
    );

  const realizadas =
    actividadesRealizadas +
    indicacionesRealizadas;

  const total =
    actividadesTotal +
    indicacionesTotal;

  return {
    realizadas,

    pendientes:
      total -
      realizadas,

    total,

    porcentaje:
      total > 0
        ? Math.round(
            (
              realizadas /
              total
            ) * 100
          )
        : 0,

    actividadesRealizadas,
    actividadesTotal,

    indicacionesRealizadas,
    indicacionesTotal,
  };
}

function esComida(
  momento: string | null
) {
  return (
    momento === "Desayuno" ||
    momento === "Almuerzo" ||
    momento === "Cena"
  );
}

export default function RegistroDiarioCliente({
  seguimientoId,
  duracionDias,
  diaInicial,
}: Props) {
  const diaInicialSeguro =
    Math.min(
      Math.max(
        diaInicial,
        1
      ),
      duracionDias
    );

  const [diaPlan, setDiaPlan] =
    useState(
      diaInicialSeguro
    );

  const [data, setData] =
    useState<RespuestaDia | null>(
      null
    );

  const [peso, setPeso] =
    useState("");

  const [
    cinturaCm,
    setCinturaCm,
  ] = useState("");

  const [
    medicionesGlucosa,
    setMedicionesGlucosa,
  ] =
    useState<
      MedicionGlucosaFormulario[]
    >(
      () =>
        prepararMedicionesGlucosa(
          undefined
        )
    );

  const [
    observacion,
    setObservacion,
  ] = useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [
    actividadProcesando,
    setActividadProcesando,
  ] = useState<string | null>(
    null
  );

  const [error, setError] =
    useState<string | null>(
      null
    );

  const [sucio, setSucio] =
    useState(false);

  const cargarDia =
    useCallback(
      async (
        dia: number
      ) => {
        setCargando(true);
        setError(null);
        setData(null);

        try {
          const res =
            await fetch(
              `/api/admin/seguimiento/clientes/${seguimientoId}/registro-diario/${dia}`,
              {
                method: "GET",
                cache: "no-store",
              }
            );

          const respuesta =
            await res
              .json()
              .catch(
                () => null
              );

          if (!res.ok) {
            throw new Error(
              respuesta?.error ||
                "No se pudo cargar el registro del día."
            );
          }

          const datos =
            respuesta as RespuestaDia;

          setData(datos);

          setPeso(
            datos.registro
              .peso === null
              ? ""
              : String(
                  datos.registro
                    .peso
                )
          );

          setCinturaCm(
            datos.registro
              .cinturaCm === null
              ? ""
              : String(
                  datos.registro
                    .cinturaCm
                )
          );

          setMedicionesGlucosa(
            prepararMedicionesGlucosa(
              datos.medicionesGlucosa
            )
          );

          setObservacion(
            datos.registro
              .observacion ||
              ""
          );

          setSucio(false);
        } catch (
          errorDesconocido
        ) {
          setError(
            errorDesconocido instanceof
              Error
              ? errorDesconocido.message
              : "No se pudo cargar el registro del día."
          );
        } finally {
          setCargando(false);
        }
      },
      [seguimientoId]
    );

  useEffect(() => {
    void cargarDia(
      diaPlan
    );
  }, [
    cargarDia,
    diaPlan,
  ]);

  const principales =
    useMemo(
      () =>
        data?.actividades.filter(
          (actividad) =>
            actividad.seccion ===
            "PRINCIPAL"
        ) ?? [],
      [data]
    );

  const adicionales =
    useMemo(
      () =>
        data?.actividades.filter(
          (actividad) =>
            actividad.seccion ===
            "ADICIONAL"
        ) ?? [],
      [data]
    );

  const bloqueado =
    data?.seguimiento
      .estado ===
    "CANCELADO";

  function cambiarMedicionGlucosa(
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


  async function guardarRegistro(
    mostrarMensaje = true
  ) {
    if (
      !data ||
      guardando
    ) {
      return false;
    }

    setGuardando(true);

    const toastId =
      mostrarMensaje
        ? toast.loading(
            "Guardando registro..."
          )
        : undefined;

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/registro-diario/${diaPlan}`,
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

                observacion:
                  observacion.trim() ||
                  null,
              }),
          }
        );

      const respuesta =
        await res
          .json()
          .catch(
            () => null
          );

      if (!res.ok) {
        toast.error(
          "No se pudo guardar el registro",
          {
            id: toastId,
            description:
              respuesta?.error ||
              "Inténtalo nuevamente.",
          }
        );

        return false;
      }

      setData(
        (actual) =>
          actual
            ? {
                ...actual,
                registro:
                  respuesta.registro,
              }
            : actual
      );

      setPeso(
        respuesta.registro
          .peso === null
          ? ""
          : String(
              respuesta.registro
                .peso
            )
      );

      setCinturaCm(
        respuesta.registro
          .cinturaCm === null
          ? ""
          : String(
              respuesta.registro
                .cinturaCm
            )
      );

      setMedicionesGlucosa(
        prepararMedicionesGlucosa(
          respuesta.medicionesGlucosa
        )
      );

      setObservacion(
        respuesta.registro
          .observacion ||
          ""
      );

      setSucio(false);

      if (
        mostrarMensaje
      ) {
        await cargarDia(
          diaPlan
        );

        toast.success(
          "Registro guardado",
          {
            id: toastId,
          }
        );
      }

      return true;
    } catch {
      toast.error(
        "No se pudo conectar con el servidor",
        {
          id: toastId,
        }
      );

      return false;
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarDia(
    nuevoDia: number
  ) {
    if (
      nuevoDia < 1 ||
      nuevoDia >
        duracionDias ||
      nuevoDia ===
        diaPlan
    ) {
      return;
    }

    if (
      sucio &&
      !bloqueado
    ) {
      const guardado =
        await guardarRegistro(
          false
        );

      if (!guardado) {
        return;
      }
    }

    setDiaPlan(
      nuevoDia
    );
  }

  async function cambiarActividad(
    actividad: ActividadDia
  ) {
    if (
      actividad.tipo !==
        "TAREA" ||
      actividadProcesando ||
      bloqueado
    ) {
      return;
    }

    const nuevoEstado =
      !actividad.completado;

    setActividadProcesando(
      actividad.id
    );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/registro-diario/${diaPlan}/actividades/${actividad.id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                completado:
                  nuevoEstado,
              }),
          }
        );

      const respuesta =
        await res
          .json()
          .catch(
            () => null
          );

      if (!res.ok) {
        toast.error(
          "No se pudo cambiar el estado",
          {
            description:
              respuesta?.error ||
              "Inténtalo nuevamente.",
          }
        );

        return;
      }

      setData(
        (actual) => {
          if (!actual) {
            return actual;
          }

          const actividades =
            actual.actividades.map(
              (item) =>
                item.id ===
                actividad.id
                  ? {
                      ...item,

                      completado:
                        respuesta
                          .progreso
                          .completado,

                      completadoAt:
                        respuesta
                          .progreso
                          .completadoAt,
                    }
                  : item
            );

          return {
            ...actual,
            actividades,
            resumen:
              calcularResumen(
                actividades
              ),
          };
        }
      );
    } catch {
      toast.error(
        "No se pudo conectar con el servidor"
      );
    } finally {
      setActividadProcesando(
        null
      );
    }
  }

  async function cambiarIndicacion(
    actividad: ActividadDia,
    indicacion: IndicacionDia
  ) {
    const clave =
      `indicacion:${indicacion.id}`;

    if (
      actividad.tipo !==
        "TAREA" ||
      actividadProcesando ||
      bloqueado
    ) {
      return;
    }

    const nuevoEstado =
      !indicacion.completado;

    setActividadProcesando(
      clave
    );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/registro-diario/${diaPlan}/actividades/${actividad.id}/indicaciones/${indicacion.id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                completado:
                  nuevoEstado,
              }),
          }
        );

      const respuesta =
        await res
          .json()
          .catch(
            () => null
          );

      if (!res.ok) {
        toast.error(
          "No se pudo cambiar la indicación",
          {
            description:
              respuesta?.error ||
              "Inténtalo nuevamente.",
          }
        );

        return;
      }

      setData(
        (actual) => {
          if (!actual) {
            return actual;
          }

          const actividades =
            actual.actividades.map(
              (item) =>
                item.id ===
                actividad.id
                  ? {
                      ...item,

                      indicaciones:
                        item.indicaciones.map(
                          (
                            itemIndicacion
                          ) =>
                            itemIndicacion.id ===
                            indicacion.id
                              ? {
                                  ...itemIndicacion,

                                  completado:
                                    respuesta
                                      .progreso
                                      .completado,

                                  completadoAt:
                                    respuesta
                                      .progreso
                                      .completadoAt,
                                }
                              : itemIndicacion
                        ),
                    }
                  : item
            );

          return {
            ...actual,

            actividades,

            resumen:
              calcularResumen(
                actividades
              ),
          };
        }
      );
    } catch {
      toast.error(
        "No se pudo conectar con el servidor"
      );
    } finally {
      setActividadProcesando(
        null
      );
    }
  }


  function renderActividad(
    actividad: ActividadDia
  ) {
    const comida =
      esComida(
        actividad.momento
      );

    return (
      <div
        key={actividad.id}
        className={`rounded-xl border p-4 ${
          comida
            ? "border-violet-200 bg-violet-50/60"
            : actividad.activo
            ? "border-gray-200 bg-white"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        <div className="flex items-start gap-3">

          <div className="w-14 shrink-0">

            <p className="text-sm font-bold text-gray-900">
              {actividad.hora ||
                "—"}
            </p>

          </div>


          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <h4 className="font-semibold text-gray-900">
                {actividad.titulo}
              </h4>

              {actividad.momento && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                  {actividad.momento}
                </span>
              )}

              {!actividad.activo && (
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                  Histórica
                </span>
              )}

            </div>


            {actividad.descripcion && (
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                {actividad.descripcion}
              </p>
            )}


            <div className="mt-3">

              {actividad.tipo ===
              "TAREA" ? (

                <button
                  type="button"
                  disabled={
                    bloqueado ||
                    actividadProcesando ===
                      actividad.id
                  }
                  onClick={() =>
                    void cambiarActividad(
                      actividad
                    )
                  }
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    actividad.completado
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  }`}
                >
                  {actividadProcesando ===
                  actividad.id
                    ? "Guardando..."
                    : actividad.completado
                    ? "✓ Realizado"
                    : "Pendiente"}
                </button>

              ) : (

                <span
                  className={`inline-flex rounded-lg px-3 py-2 text-xs font-semibold ${
                    actividad.tipo ===
                    "INFORMACION"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {actividad.tipo ===
                  "INFORMACION"
                    ? "Información"
                    : "Control"}
                </span>

              )}

            </div>


            {actividad.tipo ===
              "TAREA" &&
              actividad.indicaciones.length >
                0 && (

              <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">

                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  Indicaciones
                </p>

                {actividad.indicaciones.map(
                  (indicacion) => {
                    const clave =
                      `indicacion:${indicacion.id}`;

                    return (
                      <div
                        key={
                          indicacion.id
                        }
                        className={`flex items-start gap-3 rounded-lg border p-3 ${
                          indicacion.activo
                            ? "border-gray-100 bg-gray-50"
                            : "border-gray-200 bg-gray-100"
                        }`}
                      >

                        <div className="w-12 shrink-0">

                          <p className="text-xs font-bold text-gray-700">
                            {indicacion.hora ||
                              "—"}
                          </p>

                        </div>


                        <div className="min-w-0 flex-1">

                          <p className="whitespace-pre-wrap text-sm leading-5 text-gray-700">
                            {indicacion.texto}
                          </p>

                          {!indicacion.activo && (
                            <span className="mt-1 inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                              Histórica
                            </span>
                          )}

                        </div>


                        <button
                          type="button"
                          disabled={
                            bloqueado ||
                            actividadProcesando ===
                              clave
                          }
                          onClick={() =>
                            void cambiarIndicacion(
                              actividad,
                              indicacion
                            )
                          }
                          className={`shrink-0 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            indicacion.completado
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          }`}
                        >
                          {actividadProcesando ===
                          clave
                            ? "..."
                            : indicacion.completado
                            ? "✓ Realizada"
                            : "Pendiente"}
                        </button>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </div>

        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl bg-white shadow">

      <div className="border-b border-gray-100 p-4 sm:p-5">

        <div className="flex flex-col gap-1">

          <h2 className="text-lg font-semibold text-gray-900">
            Registro diario
          </h2>

          <p className="text-sm text-gray-500">
            Registra peso, cintura, glucosa, observaciones y cumplimiento de cada día.
          </p>

        </div>


        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-gray-50 p-2">

          <button
            type="button"
            disabled={
              diaPlan <= 1 ||
              cargando ||
              guardando
            }
            onClick={() =>
              void cambiarDia(
                diaPlan - 1
              )
            }
            className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Día anterior
          </button>


          <div className="text-center">

            <p className="text-sm font-bold text-gray-900">
              Día {diaPlan} de{" "}
              {duracionDias}
            </p>

            {cargando && (
              <p className="text-[11px] text-gray-400">
                Cargando...
              </p>
            )}

          </div>


          <button
            type="button"
            disabled={
              diaPlan >=
                duracionDias ||
              cargando ||
              guardando
            }
            onClick={() =>
              void cambiarDia(
                diaPlan + 1
              )
            }
            className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Día siguiente →
          </button>

        </div>

      </div>


      {cargando ? (

        <div className="p-6 text-sm text-gray-500">
          Cargando registro del día...
        </div>

      ) : error ? (

        <div className="p-5">

          <div className="rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="text-sm font-semibold text-red-800">
              No se pudo cargar el registro
            </p>

            <p className="mt-1 text-xs text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void cargarDia(
                  diaPlan
                )
              }
              className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-700"
            >
              Reintentar
            </button>

          </div>

        </div>

      ) : data ? (

        <div className="space-y-5 p-4 sm:p-5">

          {bloqueado && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Este seguimiento está cancelado. El registro se muestra en modo de consulta.
            </div>
          )}


          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

            <div className="rounded-xl bg-gray-50 p-3">

              <p className="text-[11px] text-gray-500">
                Peso inicial
              </p>

              <p className="mt-1 text-sm font-bold text-gray-900">
                {data.resumenPeso
                  .pesoInicial
                  ? `${data.resumenPeso.pesoInicial.peso} kg`
                  : "Sin registro"}
              </p>

              {data.resumenPeso
                .pesoInicial && (
                <p className="mt-1 text-[10px] text-gray-400">
                  Día{" "}
                  {data.resumenPeso
                    .pesoInicial
                    .diaPlan}
                </p>
              )}

            </div>


            <div className="rounded-xl bg-gray-50 p-3">

              <p className="text-[11px] text-gray-500">
                {data.resumenPeso
                  .esPesoFinal
                  ? "Peso final"
                  : "Último peso"}
              </p>

              <p className="mt-1 text-sm font-bold text-gray-900">
                {data.resumenPeso
                  .ultimoPeso
                  ? `${data.resumenPeso.ultimoPeso.peso} kg`
                  : "Sin registro"}
              </p>

              {data.resumenPeso
                .ultimoPeso && (
                <p className="mt-1 text-[10px] text-gray-400">
                  Día{" "}
                  {data.resumenPeso
                    .ultimoPeso
                    .diaPlan}
                </p>
              )}

            </div>


            <div className="rounded-xl bg-gray-50 p-3">

              <p className="text-[11px] text-gray-500">
                Peso promedio
              </p>

              <p className="mt-1 text-sm font-bold text-gray-900">
                {data.resumenPeso
                  .pesoPromedio !==
                null
                  ? `${data.resumenPeso.pesoPromedio} kg`
                  : "Sin registro"}
              </p>

              <p className="mt-1 text-[10px] text-gray-400">
                {data.resumenPeso
                  .cantidadRegistros}{" "}
                pesaje
                {data.resumenPeso
                  .cantidadRegistros ===
                1
                  ? ""
                  : "s"}
              </p>

            </div>


            <div className="rounded-xl bg-gray-50 p-3">

              <p className="text-[11px] text-gray-500">
                Cambio
              </p>

              <p className="mt-1 text-sm font-bold text-gray-900">
                {data.resumenPeso
                  .cambio !==
                null
                  ? `${data.resumenPeso.cambio > 0 ? "+" : ""}${data.resumenPeso.cambio} kg`
                  : "—"}
              </p>

              <p className="mt-1 text-[10px] text-gray-400">
                Desde el primer pesaje
              </p>

            </div>

          </div>


          <div>

            <div className="mb-3">

              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800">
                Mediciones del día
              </h3>

              <p className="mt-0.5 text-xs text-gray-500">
                Todos los campos son opcionales y pueden registrarse de forma independiente.
              </p>

            </div>


            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              <div>

                <label className="admin-label">
                  Peso
                </label>

                <div className="relative">

                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={
                      bloqueado
                    }
                    value={peso}
                    onChange={(e) => {
                      setPeso(
                        e.target.value
                      );
                      setSucio(
                        true
                      );
                    }}
                    placeholder="Ej. 85.40"
                    className="admin-input pr-12"
                  />

                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
                    kg
                  </span>

                </div>

              </div>


              <div>

                <label className="admin-label">
                  Cintura
                </label>

                <div className="relative">

                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={
                      bloqueado
                    }
                    value={
                      cinturaCm
                    }
                    onChange={(e) => {
                      setCinturaCm(
                        e.target.value
                      );
                      setSucio(
                        true
                      );
                    }}
                    placeholder="Ej. 92.50"
                    className="admin-input pr-12"
                  />

                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
                    cm
                  </span>

                </div>

              </div>

            </div>


            <details className="group mt-5 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">

              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3">

                <div>

                  <p className="text-sm font-bold text-gray-900">
                    Glucosa del día
                  </p>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {
                      medicionesGlucosa.filter(
                        (medicion) =>
                          Boolean(
                            medicion.valor.trim()
                          )
                      ).length
                    } de 4 mediciones registradas
                  </p>

                </div>


                <div className="flex shrink-0 items-center gap-2">

                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                    Ver / registrar
                  </span>

                  <span className="text-gray-400 transition group-open:rotate-180">
                    ▾
                  </span>

                </div>

              </summary>


              <div className="border-t border-gray-200 p-3">

                <p className="mb-3 text-xs leading-5 text-gray-500">
                  Hasta 4 mediciones. Si registras un valor, la hora es obligatoria y debe ser diferente en cada medición.
                </p>


                <div className="grid gap-3 lg:grid-cols-2">

                  {medicionesGlucosa.map(
                    (
                      medicion
                    ) => (

                      <div
                        key={
                          medicion.numero
                        }
                        className="rounded-xl border border-gray-200 bg-white p-3"
                      >

                        <div className="mb-3 flex items-center justify-between gap-3">

                          <p className="text-sm font-bold text-gray-900">
                            Medición {medicion.numero}
                          </p>

                          {medicion.valor && (

                            <span className="text-xs font-semibold text-gray-500">
                              {medicion.valor} mg/dL
                            </span>

                          )}

                        </div>


                        <div className="grid grid-cols-[1fr_125px] gap-2">

                          <div>

                            <label className="admin-label">
                              Valor
                            </label>

                            <div className="relative">

                              <input
                                type="text"
                                inputMode="decimal"
                                disabled={
                                  bloqueado
                                }
                                value={
                                  medicion.valor
                                }
                                onChange={(e) =>
                                  cambiarMedicionGlucosa(
                                    medicion.numero,
                                    "valor",
                                    e.target.value
                                  )
                                }
                                placeholder="Ej. 102"
                                className="admin-input pr-16"
                              />

                              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] text-gray-500">
                                mg/dL
                              </span>

                            </div>

                          </div>


                          <div>

                            <label className="admin-label">
                              Hora *
                            </label>

                            <input
                              type="time"
                              disabled={
                                bloqueado
                              }
                              value={
                                medicion.hora
                              }
                              onChange={(e) =>
                                cambiarMedicionGlucosa(
                                  medicion.numero,
                                  "hora",
                                  e.target.value
                                )
                              }
                              className="admin-input"
                            />

                          </div>

                        </div>


                        <div className="mt-2">

                          <label className="admin-label">
                            Momento
                          </label>

                          <input
                            type="text"
                            disabled={
                              bloqueado
                            }
                            value={
                              medicion.momento
                            }
                            onChange={(e) =>
                              cambiarMedicionGlucosa(
                                medicion.numero,
                                "momento",
                                e.target.value
                              )
                            }
                            maxLength={
                              120
                            }
                            placeholder="Ej. Después del almuerzo"
                            className="admin-input"
                          />

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

            </details>

          </div>


          <div className="space-y-3">

            <div>

              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800">
                Protocolo principal
              </h3>

              <p className="mt-0.5 text-xs text-gray-500">
                Actividades programadas para el día.
              </p>

            </div>


            {principales.length >
            0 ? (
              <div className="space-y-2">
                {principales.map(
                  renderActividad
                )}
              </div>
            ) : (
              <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                No hay actividades principales para este día.
              </p>
            )}

          </div>


          {adicionales.length >
            0 && (

            <div className="space-y-3">

              <div className="border-y border-gray-200 py-3 text-center">

                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">
                  Protocolos adicionales
                </h3>

              </div>


              <div className="space-y-2">
                {adicionales.map(
                  renderActividad
                )}
              </div>

            </div>

          )}


          <div>

            <label className="admin-label">
              Observaciones del día
            </label>

            <textarea
              disabled={
                bloqueado
              }
              value={observacion}
              onChange={(e) => {
                setObservacion(
                  e.target.value
                );
                setSucio(
                  true
                );
              }}
              rows={4}
              maxLength={5000}
              placeholder="Escribe las observaciones correspondientes a este día..."
              className="admin-input resize-y"
            />

          </div>


          <div className="rounded-xl bg-gray-50 p-4">

            <div className="flex items-end justify-between gap-4">

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Calificación del día
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  {data.resumen
                    .realizadas}{" "}
                  de{" "}
                  {data.resumen.total}{" "}
                  checks realizados
                </p>

              </div>


              <p className="text-3xl font-bold text-gray-900">
                {data.resumen
                  .porcentaje}
                %
              </p>

            </div>


            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">

              <span>
                Actividades{" "}
                <strong className="text-gray-700">
                  {data.resumen.actividadesRealizadas}/
                  {data.resumen.actividadesTotal}
                </strong>
              </span>

              <span>
                Indicaciones{" "}
                <strong className="text-gray-700">
                  {data.resumen.indicacionesRealizadas}/
                  {data.resumen.indicacionesTotal}
                </strong>
              </span>

            </div>


            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">

              <div
                className="h-full rounded-full bg-violet-500 transition-all"
                style={{
                  width: `${data.resumen.porcentaje}%`,
                }}
              />

            </div>


            <div className="mt-2 flex justify-between text-xs text-gray-500">

              <span>
                {data.resumen
                  .realizadas}{" "}
                realizadas
              </span>

              <span>
                {data.resumen
                  .pendientes}{" "}
                pendientes
              </span>

            </div>

          </div>


          {!bloqueado && (

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-xs text-gray-500">
                Los estados de las actividades se guardan inmediatamente.
              </p>

              <button
                type="button"
                disabled={
                  guardando ||
                  !sucio
                }
                onClick={() =>
                  void guardarRegistro()
                }
                className="admin-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando
                  ? "Guardando..."
                  : sucio
                  ? "Guardar registro"
                  : "Registro guardado"}
              </button>

            </div>

          )}

        </div>

      ) : null}

    </section>
  );
}
