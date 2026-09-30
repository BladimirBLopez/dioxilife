"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
} from "next/navigation";
import { toast } from "sonner";

type TipoActividad =
  | "TAREA"
  | "INFORMACION"
  | "CONTROL";

type RecordatorioActividad =
  | "NINGUNO"
  | "A_LA_HORA"
  | "MIN_15_ANTES"
  | "MIN_30_ANTES"
  | "MIN_60_ANTES";

type Actividad = {
  id: string;
  tipo: TipoActividad;
  recordatorio: RecordatorioActividad;
  titulo: string;
  descripcion:
    | string
    | null;
  momento:
    | string
    | null;
  hora:
    | string
    | null;
  diaInicio: number;
  diaFin:
    | number
    | null;
  orden: number;
  activo: boolean;
};

type Plan = {
  id: string;
  nombre: string;
  descripcion:
    | string
    | null;
  duracionDias: number;
  estado:
    | "BORRADOR"
    | "ACTIVO"
    | "INACTIVO";
  actividades:
    Actividad[];
  _count: {
    seguimientos: number;
  };
};

type NombreActividad =
  | "Ayunas"
  | "Desayuno"
  | "Almuerzo"
  | "Cena";

type ActividadBasica = {
  id:
    | string
    | null;
  nombre:
    NombreActividad;
  hora: string;
  instrucciones: string[];
};

function textoAInstrucciones(
  texto:
    | string
    | null
    | undefined
) {
  if (!texto?.trim()) {
    return [""];
  }

  const instrucciones =
    texto
      .split(/\r?\n/)
      .map(
        (linea) =>
          linea.trim()
      )
      .filter(Boolean);

  return instrucciones.length
    ? instrucciones
    : [""];
}

function limpiarInstruccion(
  valor: string
) {
  return valor
    .replace(/\r?\n/g, " ")
    .trim();
}

function instruccionesATexto(
  instrucciones: string[]
) {
  return instrucciones
    .map(limpiarInstruccion)
    .filter(Boolean)
    .join("\n");
}

function totalCaracteres(
  instrucciones: string[]
) {
  return instruccionesATexto(
    instrucciones
  ).length;
}

const SECCIONES: Array<{
  nombre:
    NombreActividad;
  horaInicial: string;
  descripcion: string;
}> = [
  {
    nombre:
      "Ayunas",
    horaInicial:
      "",
    descripcion:
      "Se realiza al iniciar el día. No necesita una hora fija.",
  },
  {
    nombre:
      "Desayuno",
    horaInicial:
      "",
    descripcion:
      "Define la hora habitual del desayuno.",
  },
  {
    nombre:
      "Almuerzo",
    horaInicial:
      "13:00",
    descripcion:
      "Define la hora habitual del almuerzo.",
  },
  {
    nombre:
      "Cena",
    horaInicial:
      "18:00",
    descripcion:
      "Define la hora habitual de la cena.",
  },
];

function construirActividadesBasicas(
  plan: Plan
): ActividadBasica[] {
  const usados =
    new Set<string>();

  return SECCIONES.map(
    (seccion) => {
      const encontrada =
        plan.actividades.find(
          (actividad) =>
            !usados.has(
              actividad.id
            ) &&
            actividad.momento ===
              seccion.nombre &&
            actividad.titulo ===
              seccion.nombre
        );

      if (
        encontrada
      ) {
        usados.add(
          encontrada.id
        );
      }

      return {
        id:
          encontrada?.id ??
          null,

        nombre:
          seccion.nombre,

        hora:
          seccion.nombre ===
          "Ayunas"
            ? ""
            : encontrada?.hora ??
              seccion.horaInicial,

        instrucciones:
          textoAInstrucciones(
            encontrada
              ?.descripcion
          ),
      };
    }
  );
}

export default function PlanActividadesPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const id =
    params.id;

  const [
    plan,
    setPlan,
  ] =
    useState<Plan | null>(
      null
    );

  const [
    actividades,
    setActividades,
  ] = useState<
    ActividadBasica[]
  >([]);

  const [
    actividadesIniciales,
    setActividadesIniciales,
  ] = useState<
    ActividadBasica[]
  >([]);

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

  async function cargar() {
    setCargando(
      true
    );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/planes/${id}/actividades`
        );

      if (!res.ok) {
        setPlan(
          null
        );

        return;
      }

      const data: Plan =
        await res.json();

      const basicas =
        construirActividadesBasicas(
          data
        );

      setPlan(
        data
      );

      setActividades(
        basicas
      );

      setActividadesIniciales(
        basicas
      );
    } catch {
      setPlan(
        null
      );
    } finally {
      setCargando(
        false
      );
    }
  }

  useEffect(() => {
    if (id) {
      void cargar();
    }
  }, [id]);

  function actualizarActividad(
    nombre:
      NombreActividad,
    cambios:
      Partial<ActividadBasica>
  ) {
    setActividades(
      (actuales) =>
        actuales.map(
          (actividad) =>
            actividad.nombre ===
            nombre
              ? {
                  ...actividad,
                  ...cambios,
                }
              : actividad
        )
    );
  }

  function actualizarInstruccion(
    nombre: NombreActividad,
    indice: number,
    valor: string
  ) {
    setActividades(
      (actuales) =>
        actuales.map(
          (actividad) => {
            if (
              actividad.nombre !==
              nombre
            ) {
              return actividad;
            }

            const instrucciones = [
              ...actividad.instrucciones,
            ];

            instrucciones[indice] =
              valor.replace(
                /\r?\n/g,
                " "
              );

            return {
              ...actividad,
              instrucciones,
            };
          }
        )
    );
  }

  function agregarInstruccion(
    nombre: NombreActividad
  ) {
    setActividades(
      (actuales) =>
        actuales.map(
          (actividad) =>
            actividad.nombre ===
            nombre
              ? {
                  ...actividad,
                  instrucciones: [
                    ...actividad.instrucciones,
                    "",
                  ],
                }
              : actividad
        )
    );
  }

  function eliminarInstruccion(
    nombre: NombreActividad,
    indice: number
  ) {
    setActividades(
      (actuales) =>
        actuales.map(
          (actividad) => {
            if (
              actividad.nombre !==
                nombre ||
              actividad.instrucciones
                .length <= 1
            ) {
              return actividad;
            }

            return {
              ...actividad,
              instrucciones:
                actividad.instrucciones.filter(
                  (
                    _item,
                    posicion
                  ) =>
                    posicion !==
                    indice
                ),
            };
          }
        )
    );
  }

  const hayCambios =
    JSON.stringify(
      actividades
    ) !==
    JSON.stringify(
      actividadesIniciales
    );

  const faltanActividades =
    actividades.some(
      (actividad) =>
        !actividad.id
    );

  const pendienteGuardar =
    hayCambios ||
    faltanActividades;

  const idsBasicas =
    new Set(
      actividades
        .map(
          (actividad) =>
            actividad.id
        )
        .filter(
          (
            actividadId
          ): actividadId is string =>
            Boolean(
              actividadId
            )
        )
    );

  const actividadesAnteriores =
    plan
      ? plan.actividades.filter(
          (actividad) =>
            !idsBasicas.has(
              actividad.id
            )
        )
      : [];

  async function guardar() {
    if (
      !plan ||
      guardando
    ) {
      return;
    }

    const sinHora =
      actividades.find(
        (actividad) =>
          actividad.nombre !==
            "Ayunas" &&
          !actividad.hora
      );

    if (sinHora) {
      toast.error(
        `Define la hora de ${sinHora.nombre}.`
      );

      return;
    }

    const actividadDemasiadoLarga =
      actividades.find(
        (actividad) =>
          totalCaracteres(
            actividad.instrucciones
          ) > 5000
      );

    if (actividadDemasiadoLarga) {
      toast.error(
        `Las instrucciones de ${actividadDemasiadoLarga.nombre} superan los 5000 caracteres.`
      );

      return;
    }

    setGuardando(
      true
    );

    const toastId =
      toast.loading(
        "Guardando actividades..."
      );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/planes/${id}/actividades/basicas`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                actividades:
                  actividades.map(
                    (
                      actividad
                    ) => ({
                      id:
                        actividad.id,

                      nombre:
                        actividad.nombre,

                      hora:
                        actividad.nombre ===
                        "Ayunas"
                          ? null
                          : actividad.hora,

                      instrucciones:
                        instruccionesATexto(
                          actividad.instrucciones
                        ),
                    })
                  ),
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(
            () =>
              null
          );

      if (!res.ok) {
        toast.error(
          "No se pudieron guardar las actividades.",
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

      toast.success(
        "Actividades guardadas correctamente.",
        {
          id:
            toastId,
        }
      );

      await cargar();
    } catch {
      toast.error(
        "No se pudo conectar con el servidor.",
        {
          id:
            toastId,
        }
      );
    } finally {
      setGuardando(
        false
      );
    }
  }

  if (cargando) {
    return (
      <p className="text-sm text-[#8A8790]">
        Cargando plantilla...
      </p>
    );
  }

  if (!plan) {
    return (
      <div className="admin-card p-6">
        <p className="font-semibold text-[#1F1B24]">
          Plantilla no encontrada
        </p>

        <Link
          href="/admin/seguimiento/planes"
          className="mt-3 inline-block text-sm font-medium text-brand-blue hover:underline"
        >
          Volver a plantillas
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24">

      <div className="mb-5">
        <Link
          href="/admin/seguimiento/planes"
          className="text-sm font-medium text-brand-blue hover:underline"
        >
          ← Volver a plantillas
        </Link>
      </div>


      <div className="admin-card p-5">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <div className="flex flex-wrap items-center gap-2">

              <h1 className="text-xl font-semibold text-[#1F1B24]">
                {plan.nombre}
              </h1>

              <span className="rounded-full bg-[#F8F6FF] px-2.5 py-1 text-[10px] font-bold text-brand-pink">
                {plan.estado}
              </span>

            </div>


            {plan.descripcion && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6870]">
                {plan.descripcion}
              </p>
            )}


            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">

              <span className="text-[#6B6870]">
                Duración:{" "}
                <strong className="text-[#1F1B24]">
                  {
                    plan.duracionDias
                  }{" "}
                  días
                </strong>
              </span>

              <span className="text-[#6B6870]">
                Seguimientos:{" "}
                <strong className="text-[#1F1B24]">
                  {
                    plan._count
                      .seguimientos
                  }
                </strong>
              </span>

            </div>

          </div>


          {pendienteGuardar && (
            <span className="self-start rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              Cambios sin guardar
            </span>
          )}

        </div>

      </div>


      <section className="mt-6">

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <h2 className="text-lg font-semibold text-[#1F1B24]">
              Actividades del día
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#8A8790]">
              Configura las instrucciones de Ayunas, Desayuno, Almuerzo y Cena. Se aplicarán del día 1 al día{" "}
              {plan.duracionDias}.
            </p>
          </div>

          <button
            type="button"
            onClick={
              guardar
            }
            disabled={
              guardando ||
              !pendienteGuardar
            }
            className="admin-btn-primary hidden disabled:opacity-50 sm:block"
          >
            {guardando
              ? "Guardando..."
              : "Guardar cambios"}
          </button>

        </div>


        <div className="space-y-4">

          {actividades.map(
            (actividad) => {
              const seccion =
                SECCIONES.find(
                  (item) =>
                    item.nombre ===
                    actividad.nombre
                )!;

              const esAyunas =
                actividad.nombre ===
                "Ayunas";

              return (
                <article
                  key={
                    actividad.nombre
                  }
                  className="admin-card overflow-hidden"
                >

                  <div className="border-b border-gray-100 bg-[#FAFAFC] px-4 py-4 sm:px-5">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <h3 className="text-base font-bold text-[#1F1B24]">
                          {
                            actividad.nombre
                          }
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-[#8A8790]">
                          {
                            seccion.descripcion
                          }
                        </p>

                      </div>


                      {esAyunas ? (
                        <span className="self-start rounded-xl bg-[#F8F6FF] px-3 py-2 text-xs font-semibold text-brand-pink">
                          Sin hora fija
                        </span>
                      ) : (
                        <div className="w-full sm:w-36">

                          <label className="mb-1 block text-xs font-semibold text-[#6B6870]">
                            Hora
                          </label>

                          <input
                            type="time"
                            value={
                              actividad.hora
                            }
                            onChange={(e) =>
                              actualizarActividad(
                                actividad.nombre,
                                {
                                  hora:
                                    e.target
                                      .value,
                                }
                              )
                            }
                            className="admin-input"
                            required
                          />

                        </div>
                      )}

                    </div>

                  </div>


                  <div className="p-4 sm:p-5">

                    <label className="admin-label">
                      Instrucciones
                    </label>

                    <div className="space-y-3">
                      {actividad.instrucciones.map(
                        (
                          instruccion,
                          indice
                        ) => (
                          <div
                            key={indice}
                            className="flex items-start gap-2"
                          >
                            <span className="mt-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F8F6FF] text-xs font-bold text-brand-pink">
                              {indice + 1}
                            </span>

                            <textarea
                              value={
                                instruccion
                              }
                              onChange={(e) =>
                                actualizarInstruccion(
                                  actividad.nombre,
                                  indice,
                                  e.target.value
                                )
                              }
                              className="admin-input min-h-20 flex-1"
                              rows={2}
                              maxLength={5000}
                              placeholder={`Instrucción ${indice + 1}...`}
                            />

                            {actividad.instrucciones.length >
                              1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  eliminarInstruccion(
                                    actividad.nombre,
                                    indice
                                  )
                                }
                                className="mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-lg font-bold text-red-500 transition hover:bg-red-100"
                                aria-label={`Eliminar instrucción ${indice + 1}`}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          agregarInstruccion(
                            actividad.nombre
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-brand-pink bg-white px-3 py-2 text-sm font-semibold text-brand-pink transition hover:bg-brand-pink/5"
                      >
                        <span className="text-lg leading-none">
                          +
                        </span>
                        Agregar instrucción
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3">

                      <p className="text-xs text-[#8A8790]">
                        Cada indicación se guardará como un punto independiente.
                      </p>

                      <span className="shrink-0 text-[11px] text-[#AAA7AF]">
                        {totalCaracteres(
                          actividad.instrucciones
                        )}
                        /5000
                      </span>

                    </div>

                  </div>

                </article>
              );
            }
          )}

        </div>

      </section>


      {actividadesAnteriores.length >
        0 && (
        <section className="mt-8">

          <div className="mb-3">

            <h2 className="font-semibold text-[#1F1B24]">
              Actividades anteriores conservadas
            </h2>

            <p className="mt-1 text-sm leading-6 text-[#8A8790]">
              Estas actividades pertenecen a la estructura anterior. No se eliminarán ni modificarán automáticamente.
            </p>

          </div>


          <div className="space-y-3">

            {actividadesAnteriores.map(
              (
                actividad
              ) => (
                <article
                  key={
                    actividad.id
                  }
                  className="admin-card p-4 opacity-75"
                >

                  <div className="flex flex-wrap items-center gap-2">

                    {actividad.hora && (
                      <span className="rounded-lg bg-[#F8F6FF] px-2 py-1 text-xs font-semibold text-brand-pink">
                        {
                          actividad.hora
                        }
                      </span>
                    )}

                    {actividad.momento && (
                      <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                        {
                          actividad.momento
                        }
                      </span>
                    )}

                    {!actividad.activo && (
                      <span className="rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
                        INACTIVA
                      </span>
                    )}

                  </div>


                  <p className="mt-2 font-semibold text-[#1F1B24]">
                    {
                      actividad.titulo
                    }
                  </p>


                  {actividad.descripcion && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#6B6870]">
                      {
                        actividad.descripcion
                      }
                    </p>
                  )}

                </article>
              )
            )}

          </div>

        </section>
      )}


      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur sm:hidden">

        <button
          type="button"
          onClick={
            guardar
          }
          disabled={
            guardando ||
            !pendienteGuardar
          }
          className="admin-btn-primary w-full disabled:opacity-50"
        >
          {guardando
            ? "Guardando..."
            : pendienteGuardar
            ? "Guardar cambios"
            : "Todo guardado"}
        </button>

      </div>

    </div>
  );
}
