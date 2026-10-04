"use client";

import {
  useState,
  type FormEvent,
} from "react";

import { toast } from "sonner";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import SelectorHora from "@/components/admin/seguimiento/SelectorHora";

type EstadoPlantilla =
  | "BORRADOR"
  | "ACTIVO";

type NombreActividad =
  | "Ayunas"
  | "Desayuno"
  | "Almuerzo"
  | "Cena"
  | "Importante";

type IndicacionPlantilla = {
  hora: string;
  texto: string;
};

type ActividadPlantilla = {
  nombre: NombreActividad;
  hora: string;
  instruccionesTitulo: string;
  indicaciones: IndicacionPlantilla[];
};

type Props = {
  onClose: () => void;
  onCreada: (
    planCreado?: unknown
  ) => void | Promise<void>;
};

const FORM_INICIAL = {
  nombre: "",
  descripcion: "",
  duracionDias: "90",
  estado: "ACTIVO" as EstadoPlantilla,
};

function crearActividadesIniciales():
  ActividadPlantilla[] {
  return [
    {
      nombre: "Ayunas",
      hora: "",
      instruccionesTitulo: "",
      indicaciones: [
        {
          hora: "",
          texto: "",
        },
      ],
    },
    {
      nombre: "Desayuno",
      hora: "",
      instruccionesTitulo: "",
      indicaciones: [
        {
          hora: "",
          texto: "",
        },
      ],
    },
    {
      nombre: "Almuerzo",
      hora: "13:00",
      instruccionesTitulo: "",
      indicaciones: [
        {
          hora: "",
          texto: "",
        },
      ],
    },
    {
      nombre: "Cena",
      hora: "18:00",
      instruccionesTitulo: "",
      indicaciones: [
        {
          hora: "",
          texto: "",
        },
      ],
    },
    {
      nombre: "Importante",
      hora: "",
      instruccionesTitulo: "",
      indicaciones: [
        {
          hora: "",
          texto: "",
        },
      ],
    },
  ];
}

function limpiarTexto(
  valor: string
) {
  return valor
    .replace(/\r?\n/g, " ")
    .trim();
}

export default function NuevaPlantillaModal({
  onClose,
  onCreada,
}: Props) {
  const [
    form,
    setForm,
  ] = useState(
    FORM_INICIAL
  );

  const [
    actividades,
    setActividades,
  ] =
    useState<ActividadPlantilla[]>(
      crearActividadesIniciales
    );

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    confirmarSalir,
    setConfirmarSalir,
  ] = useState(false);

  function hayCambios() {
    const actividadesIniciales =
      crearActividadesIniciales();

    return (
      JSON.stringify(form) !==
        JSON.stringify(
          FORM_INICIAL
        ) ||
      JSON.stringify(
        actividades
      ) !==
        JSON.stringify(
          actividadesIniciales
        )
    );
  }

  function solicitarCerrar() {
    if (guardando) {
      return;
    }

    if (hayCambios()) {
      setConfirmarSalir(
        true
      );
      return;
    }

    onClose();
  }

  function actualizarActividad(
    nombre: NombreActividad,
    cambios: Partial<ActividadPlantilla>
  ) {
    setActividades(
      (actual) =>
        actual.map(
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

  function actualizarIndicacion(
    nombre: NombreActividad,
    indice: number,
    cambios: Partial<IndicacionPlantilla>
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

            const indicaciones = [
              ...actividad.indicaciones,
            ];

            indicaciones[indice] = {
              ...indicaciones[indice],
              ...cambios,
            };

            return {
              ...actividad,
              indicaciones,
            };
          }
        )
    );
  }

  function agregarIndicacion(
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
                  indicaciones: [
                    ...actividad.indicaciones,
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

  function eliminarIndicacion(
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
              actividad.indicaciones
                .length <= 1
            ) {
              return actividad;
            }

            return {
              ...actividad,
              indicaciones:
                actividad.indicaciones.filter(
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

  function cambiarDuracion(
    valor: string
  ) {
    setForm(
      (actual) => ({
        ...actual,
        duracionDias:
          valor,
      })
    );
  }

  async function crearPlantilla(
    e: FormEvent
  ) {
    e.preventDefault();

    if (guardando) {
      return;
    }

    const nombre =
      form.nombre.trim();

    if (!nombre) {
      toast.error(
        "El nombre de la plantilla es obligatorio."
      );
      return;
    }

    const duracionDias =
      Number(
        form.duracionDias
      );

    if (
      !Number.isInteger(
        duracionDias
      ) ||
      duracionDias < 1 ||
      duracionDias > 365
    ) {
      toast.error(
        "La duración debe estar entre 1 y 365 días."
      );
      return;
    }

    const actividadSinHora =
      actividades.find(
        (actividad) =>
          actividad.nombre !==
            "Ayunas" &&
          actividad.nombre !==
            "Importante" &&
          !actividad.hora
      );

    if (actividadSinHora) {
      toast.error(
        `Define la hora de ${actividadSinHora.nombre}.`
      );
      return;
    }

    for (
      const actividad of
      actividades
    ) {
      const instruccionesTitulo =
        actividad.instruccionesTitulo.trim();

      if (
        instruccionesTitulo.length >
        5000
      ) {
        toast.error(
          `Las instrucciones del título ${actividad.nombre} superan los 5000 caracteres.`
        );
        return;
      }

      for (
        let indice = 0;
        indice <
        actividad.indicaciones.length;
        indice++
      ) {
        const indicacion =
          actividad.indicaciones[
            indice
          ];

        const texto =
          indicacion.texto.trim();

        const tieneHora =
          Boolean(
            indicacion.hora
          );

        const tieneTexto =
          Boolean(
            texto
          );

        if (
          tieneTexto &&
          !tieneHora
        ) {
          toast.error(
            `Define la hora de la indicación ${indice + 1} de ${actividad.nombre}.`
          );
          return;
        }

        if (
          tieneHora &&
          !tieneTexto
        ) {
          toast.error(
            `Escribe el texto de la indicación ${indice + 1} de ${actividad.nombre}.`
          );
          return;
        }

        if (
          texto.length >
          5000
        ) {
          toast.error(
            `La indicación ${indice + 1} de ${actividad.nombre} supera los 5000 caracteres.`
          );
          return;
        }
      }
    }

    setGuardando(true);

    const toastId =
      toast.loading(
        "Creando plantilla..."
      );

    try {
      const res = await fetch(
        "/api/admin/seguimiento/planes",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              nombre,

              descripcion:
                form.descripcion
                  .trim() ||
                null,

              duracionDias,

              estado:
                form.estado,

              actividades:
                actividades.map(
                  (
                    actividad,
                    indice
                  ) => ({
                    tipo:
                      actividad.nombre ===
                      "Importante"
                        ? "INFORMACION"
                        : "TAREA",

                    recordatorio:
                      "NINGUNO",

                    titulo:
                      actividad.nombre,

                    descripcion:
                      limpiarTexto(
                        actividad.instruccionesTitulo
                      ) ||
                      null,

                    momento:
                      actividad.nombre,

                    hora:
                      actividad.nombre ===
                        "Ayunas" ||
                      actividad.nombre ===
                        "Importante"
                        ? null
                        : actividad.hora,

                    diaInicio:
                      1,

                    diaFin:
                      duracionDias,

                    orden:
                      indice + 1,

                    indicaciones:
                      actividad.indicaciones
                        .map(
                          (
                            indicacion,
                            ordenIndicacion
                          ) => ({
                            hora:
                              indicacion.hora,

                            texto:
                              limpiarTexto(
                                indicacion.texto
                              ),

                            orden:
                              ordenIndicacion,
                          })
                        )
                        .filter(
                          (indicacion) =>
                            Boolean(
                              indicacion.hora ||
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
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          "No se pudo crear la plantilla.",
          {
            id: toastId,

            description:
              data?.error ||
              "Inténtalo nuevamente.",
          }
        );

        return;
      }

      toast.success(
        "Plantilla creada con sus actividades.",
        {
          id: toastId,
        }
      );

      const planCreado =
        data?.plan &&
        typeof data.plan === "object"
          ? data.plan
          : data;

      await onCreada(
        planCreado
      );

      onClose();
    } catch {
      toast.error(
        "No se pudo conectar con el servidor.",
        {
          id: toastId,
        }
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <Modal
        title="Nueva plantilla de seguimiento"
        onClose={
          solicitarCerrar
        }
        maxWidthClassName="max-w-2xl"
      >
        <form
          onSubmit={
            crearPlantilla
          }
          className="space-y-6"
        >

          <section>
            <div className="mb-4">
              <h3 className="font-semibold text-[#1F1B24]">
                Datos de la plantilla
              </h3>

              <p className="mt-1 text-xs leading-5 text-[#8A8790]">
                Define la información general del seguimiento.
              </p>
            </div>

            <div className="space-y-4">

              <div>
                <label className="admin-label">
                  Nombre de la plantilla
                </label>

                <input
                  type="text"
                  value={
                    form.nombre
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nombre:
                        e.target
                          .value,
                    })
                  }
                  className="admin-input"
                  placeholder="Ej. Protocolo estándar"
                  maxLength={200}
                  required
                />
              </div>

              <div>
                <label className="admin-label">
                  Descripción
                </label>

                <textarea
                  value={
                    form.descripcion
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      descripcion:
                        e.target
                          .value,
                    })
                  }
                  className="admin-input"
                  rows={3}
                  maxLength={1500}
                  placeholder="Descripción interna de la plantilla..."
                />
              </div>

              <div>
                <label className="admin-label">
                  Duración
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={
                      form.duracionDias
                    }
                    onChange={(e) =>
                      cambiarDuracion(
                        e.target.value
                      )
                    }
                    className="admin-input pr-14"
                    required
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8790]">
                    días
                  </span>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 bg-[#F8F6FF] p-4">
                <input
                  type="checkbox"
                  checked={
                    form.estado ===
                    "ACTIVO"
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,

                      estado:
                        e.target
                          .checked
                          ? "ACTIVO"
                          : "BORRADOR",
                    })
                  }
                  className="mt-1 h-5 w-5 shrink-0 accent-pink-600"
                />

                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#1F1B24]">
                    Disponible para asignar a clientes
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-[#6B6870]">
                    Desmárcalo si todavía quieres seguir preparando la plantilla.
                  </span>
                </span>
              </label>

            </div>
          </section>


          <section className="border-t border-gray-100 pt-5">

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[#1F1B24]">
                Actividades del día
              </h3>

              <p className="mt-1 text-xs leading-5 text-[#8A8790]">
                Cada actividad tiene sus propias instrucciones. Ayunas no necesita una hora fija.
              </p>
            </div>


            <div className="space-y-4">

              {actividades.map(
                (actividad) => {
                  const esAyunas =
                    actividad.nombre ===
                    "Ayunas";

                  const esImportante =
                    actividad.nombre ===
                    "Importante";

                  const sinHora =
                    esAyunas ||
                    esImportante;

                  return (
                    <article
                      key={
                        actividad.nombre
                      }
                      className="rounded-2xl border border-gray-200 bg-white p-4"
                    >

                      <div className="flex items-center justify-between gap-3">

                        <div>
                          <h4 className="text-base font-bold text-[#1F1B24]">
                            {
                              actividad.nombre
                            }
                          </h4>

                          {esAyunas && (
                            <p className="mt-0.5 text-xs text-[#8A8790]">
                              Al iniciar el día, sin hora fija.
                            </p>
                          )}

                          {esImportante && (
                            <p className="mt-0.5 text-xs text-[#8A8790]">
                              Información general para el cliente. No requiere hora ni se marca como realizada.
                            </p>
                          )}
                        </div>

                        {!sinHora && (
                          <div className="w-32">
                            <label className="mb-1 block text-[11px] font-semibold text-[#6B6870]">
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


                      <div className="mt-4">

                        <label className="admin-label">
                          Instrucciones del título
                        </label>

                        <p className="mb-2 text-xs leading-5 text-[#8A8790]">
                          Estas instrucciones pertenecen directamente a {actividad.nombre} y son independientes de las indicaciones con horario.
                        </p>

                        <textarea
                          value={
                            actividad.instruccionesTitulo
                          }
                          onChange={(e) =>
                            actualizarActividad(
                              actividad.nombre,
                              {
                                instruccionesTitulo:
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


                      <div className="mt-5 border-t border-gray-100 pt-5">

                        <div className="mb-3">

                          <label className="admin-label">
                            Indicaciones con horario
                          </label>

                          <p className="mt-1 text-xs leading-5 text-[#8A8790]">
                            Cada indicación tendrá su propia hora, texto y posteriormente su propio check.
                          </p>

                        </div>


                        <div className="space-y-3">

                          {actividad.indicaciones.map(
                            (
                              indicacion,
                              indice
                            ) => (

                              <div
                                key={indice}
                                className="rounded-2xl border border-gray-200 bg-[#FAFAFC] p-4"
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
                                      Hora
                                    </label>

                                    <div className="w-full sm:max-w-48">

                                      <SelectorHora
                                        value={
                                          indicacion.hora
                                        }
                                        onChange={(hora) =>
                                          actualizarIndicacion(
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
                                        indicacion.texto
                                      }
                                      onChange={(e) =>
                                        actualizarIndicacion(
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


                                {actividad.indicaciones.length >
                                  1 && (

                                  <div className="mt-4 flex justify-end border-t border-gray-200 pt-3">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        eliminarIndicacion(
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


                          <button
                            type="button"
                            onClick={() =>
                              agregarIndicacion(
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

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          </section>


          <div className="sticky bottom-0 -mx-4 border-t border-gray-100 bg-white px-4 pb-1 pt-4 sm:-mx-5 sm:px-5">

            <button
              type="submit"
              disabled={
                guardando
              }
              className="admin-btn-primary w-full disabled:opacity-60"
            >
              {guardando
                ? "Creando plantilla..."
                : "Crear plantilla"}
            </button>

          </div>

        </form>
      </Modal>


      {confirmarSalir && (
        <ConfirmDialog
          title="Cambios sin guardar"
          message="La plantilla todavía no fue creada. Si sales ahora perderás los datos y las instrucciones ingresadas."
          confirmLabel="Salir sin guardar"
          onConfirm={() => {
            setConfirmarSalir(
              false
            );

            onClose();
          }}
          onCancel={() =>
            setConfirmarSalir(
              false
            )
          }
        />
      )}
    </>
  );
}
