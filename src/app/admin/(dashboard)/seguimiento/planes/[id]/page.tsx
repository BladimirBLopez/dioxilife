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
import SelectorHora from "@/components/admin/seguimiento/SelectorHora";

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

  indicaciones: Array<{
    id: string;
    hora: string;
    texto: string;
    orden: number;
    activo: boolean;
  }>;
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
  | "Cena"
  | "Importante";

type IndicacionBasica = {
  hora: string;
  texto: string;
};

type ActividadBasica = {
  id:
    | string
    | null;
  nombre:
    NombreActividad;
  hora: string;
  descripcion: string;
  instrucciones: IndicacionBasica[];
};

function actividadAInstrucciones(
  actividad:
    | Actividad
    | undefined
): IndicacionBasica[] {
  const estructuradas =
    actividad?.indicaciones
      ?.filter(
        (indicacion) =>
          indicacion.activo
      )
      .sort(
        (a, b) =>
          a.hora.localeCompare(
            b.hora
          ) ||
          a.orden -
            b.orden
      ) ?? [];

  if (
    estructuradas.length >
    0
  ) {
    return estructuradas.map(
      (indicacion) => ({
        hora:
          indicacion.hora,

        texto:
          indicacion.texto,
      })
    );
  }

  /*
   * descripcion pertenece al título.
   * Ya no la convertimos automáticamente
   * en indicaciones con horario.
   */
  return [
    {
      hora: "",
      texto: "",
    },
  ];
}

function descripcionPrincipalActividad(
  actividad:
    | Actividad
    | undefined
) {
  const descripcion =
    actividad?.descripcion
      ?.trim() ?? "";

  if (!descripcion) {
    return "";
  }

  const estructuradas =
    actividad?.indicaciones
      ?.filter(
        (indicacion) =>
          indicacion.activo
      ) ?? [];

  /*
   * Compatibilidad:
   * anteriormente descripcion era una
   * copia de todas las indicaciones.
   * Si coincide exactamente, no la
   * consideramos instrucción principal.
   */
  if (
    estructuradas.length >
    0
  ) {
    const textoIndicaciones =
      estructuradas
        .map(
          (indicacion) =>
            indicacion.texto
              .trim()
        )
        .filter(Boolean)
        .join("\n");

    const normalizar = (
      valor: string
    ) =>
      valor
        .split(/\r?\n/)
        .map(
          (linea) =>
            linea.trim()
        )
        .filter(Boolean)
        .join("\n");

    if (
      normalizar(
        descripcion
      ) ===
      normalizar(
        textoIndicaciones
      )
    ) {
      return "";
    }

    return descripcion;
  }

  /*
   * Sin indicaciones estructuradas,
   * descripcion sigue siendo la
   * instrucción propia del título.
   */
  return descripcion;
}


function limpiarInstruccion(
  valor: string
) {
  return valor
    .replace(/\r?\n/g, " ")
    .trim();
}

function instruccionesATexto(
  instrucciones:
    IndicacionBasica[]
) {
  return instrucciones
    .map(
      (indicacion) =>
        limpiarInstruccion(
          indicacion.texto
        )
    )
    .filter(Boolean)
    .join("\n");
}

function totalCaracteres(
  instrucciones:
    IndicacionBasica[]
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
  {
    nombre:
      "Importante",
    horaInicial:
      "",
    descripcion:
      "Información general para el cliente. No requiere hora ni se marca como realizada.",
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
            "Ayunas" ||
          seccion.nombre ===
            "Importante"
            ? ""
            : encontrada?.hora ??
              seccion.horaInicial,

        descripcion:
          descripcionPrincipalActividad(
            encontrada
          ),

        instrucciones:
          actividadAInstrucciones(
            encontrada
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
    cambios:
      Partial<IndicacionBasica>
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

            instrucciones[indice] = {
              ...instrucciones[
                indice
              ],
              ...cambios,
            };

            if (
              cambios.texto !==
              undefined
            ) {
              instrucciones[
                indice
              ].texto =
                cambios.texto.replace(
                  /\r?\n/g,
                  " "
                );
            }

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
                    {
                      hora: "",
                      texto: "",
                    },
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
          actividad.nombre !==
            "Importante" &&
          !actividad.hora
      );

    if (sinHora) {
      toast.error(
        `Define la hora de ${sinHora.nombre}.`
      );

      return;
    }

    for (
      const actividad of
      actividades
    ) {
      const indiceSinHora =
        actividad.instrucciones.findIndex(
          (indicacion) =>
            Boolean(
              indicacion.texto.trim()
            ) &&
            !indicacion.hora
        );

      if (
        indiceSinHora !==
        -1
      ) {
        toast.error(
          `Define el horario de la indicación ${indiceSinHora + 1} de ${actividad.nombre}.`
        );

        return;
      }
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

                      descripcion:
                        actividad.descripcion
                          .trim() ||
                        null,

                      indicaciones:
                        actividad.instrucciones
                          .map(
                            (
                              indicacion,
                              indice
                            ) => ({
                              hora:
                                indicacion.hora,

                              texto:
                                limpiarInstruccion(
                                  indicacion.texto
                                ),

                              orden:
                                indice,
                            })
                          )
                          .filter(
                            (indicacion) =>
                              Boolean(
                                indicacion.texto
                              )
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
              Configura las instrucciones de Ayunas, Desayuno, Almuerzo, Cena e Importante. Se aplicarán del día 1 al día{" "}
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

              const sinHora =
                actividad.nombre ===
                  "Ayunas" ||
                actividad.nombre ===
                  "Importante";

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


                      {sinHora ? (
                        <span className="self-start rounded-xl bg-[#F8F6FF] px-3 py-2 text-xs font-semibold text-brand-pink">
                          Sin hora fija
                        </span>
                      ) : (
                        <div className="w-full sm:w-36">

                          <label className="mb-1 block text-xs font-semibold text-[#6B6870]">
                            Hora
                          </label>

                          <SelectorHora
                            value={
                              actividad.hora
                            }
                            onChange={(hora) =>
                              actualizarActividad(
                                actividad.nombre,
                                {
                                  hora,
                                }
                              )
                            }
                            permitirVacio={false}
                          />

                        </div>
                      )}

                    </div>

                  </div>


                  <div className="p-4 sm:p-5">

                    <div className="mb-5">

                      <label className="admin-label">
                        Instrucciones del título
                      </label>

                      <p className="mb-2 text-xs leading-5 text-[#8A8790]">
                        Escribe las instrucciones propias de {actividad.nombre}. Son independientes de las indicaciones con horario que aparecen debajo.
                      </p>

                      <textarea
                        value={
                          actividad.descripcion
                        }
                        onChange={(e) =>
                          actualizarActividad(
                            actividad.nombre,
                            {
                              descripcion:
                                e.target.value,
                            }
                          )
                        }
                        className="admin-input min-h-24 w-full"
                        rows={3}
                        maxLength={5000}
                        placeholder={`Escribe las instrucciones de ${actividad.nombre}...`}
                      />

                    </div>


                    <label className="admin-label">
                      Indicaciones con horario
                    </label>

                    <div className="space-y-3">

                      {actividad.instrucciones.map(
                        (
                          instruccion,
                          indice
                        ) => (
                          <div
                            key={indice}
                            className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFC] p-4"
                          >

                            <div className="flex items-center justify-between gap-3">

                              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#6B6870]">
                                Indicación
                              </p>

                              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#F8F6FF] px-2 text-xs font-bold text-brand-pink">
                                #{indice + 1}
                              </span>

                            </div>


                            <div className="mt-4 space-y-4">

                              <div>

                                <label className="mb-1.5 block text-xs font-semibold text-[#6B6870]">
                                  Horario
                                </label>

                                <div className="w-full sm:max-w-48">

                                  <SelectorHora
                                    value={
                                      instruccion.hora
                                    }
                                    onChange={(hora) =>
                                      actualizarInstruccion(
                                        actividad.nombre,
                                        indice,
                                        {
                                          hora,
                                        }
                                      )
                                    }
                                    permitirVacio={false}
                                  />

                                </div>

                              </div>


                              <div>

                                <label className="mb-1.5 block text-xs font-semibold text-[#6B6870]">
                                  Texto de la indicación
                                </label>

                                <textarea
                                  value={
                                    instruccion.texto
                                  }
                                  onChange={(e) =>
                                    actualizarInstruccion(
                                      actividad.nombre,
                                      indice,
                                      {
                                        texto:
                                          e.target.value,
                                      }
                                    )
                                  }
                                  className="admin-input min-h-24 w-full"
                                  rows={3}
                                  maxLength={5000}
                                  placeholder={`Escribe la indicación ${indice + 1}...`}
                                />

                              </div>

                            </div>


                            {actividad.instrucciones.length >
                              1 && (

                              <div className="mt-4 flex justify-end border-t border-gray-200 pt-3">

                                <button
                                  type="button"
                                  onClick={() =>
                                    eliminarInstruccion(
                                      actividad.nombre,
                                      indice
                                    )
                                  }
                                  className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                >
                                  Eliminar indicación
                                </button>

                              </div>

                            )}

                          </div>
                        )
                      )}


                      {actividad.instrucciones.some(
                        (indicacion) =>
                          Boolean(
                            indicacion.texto.trim()
                          ) &&
                          !indicacion.hora
                      ) && (

                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">

                          <p className="text-xs leading-5 text-amber-800">
                            Esta plantilla contiene indicaciones antiguas. Asigna un horario a cada una antes de guardar. DioxiLife no asignará horarios automáticamente.
                          </p>

                        </div>

                      )}


                      <button
                        type="button"
                        onClick={() =>
                          agregarInstruccion(
                            actividad.nombre
                          )
                        }
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-pink bg-white px-4 py-3 text-sm font-semibold text-brand-pink transition hover:bg-brand-pink/5 sm:w-auto sm:justify-start sm:py-2"
                      >
                        <span className="text-lg leading-none">
                          +
                        </span>
                        Agregar indicación
                      </button>

                    </div>


                    <div className="mt-2 flex items-center justify-between gap-3">

                      <p className="text-xs text-[#8A8790]">
                        Cada indicación se guardará con su propio horario.
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
