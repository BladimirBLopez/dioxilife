"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

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
  completado: boolean | null;
  completadoAt: string | null;
};

type RegistroDia = {
  id: string | null;
  diaPlan: number;
  peso: number | null;
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

  actividades: ActividadDia[];

  resumen: {
    realizadas: number;
    pendientes: number;
    total: number;
    porcentaje: number;
  };
};

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
        actividad.tipo === "TAREA"
    );

  const realizadas =
    tareas.filter(
      (actividad) =>
        actividad.completado === true
    ).length;

  const total =
    tareas.length;

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

      setObservacion(
        respuesta.registro
          .observacion ||
          ""
      );

      setSucio(false);

      if (
        mostrarMensaje
      ) {
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
            Registra el peso, observaciones y cumplimiento de cada día.
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


          <div>

            <label className="admin-label">
              Peso del día
            </label>

            <div className="relative max-w-xs">

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
                  tareas realizadas
                </p>

              </div>


              <p className="text-3xl font-bold text-gray-900">
                {data.resumen
                  .porcentaje}
                %
              </p>

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
