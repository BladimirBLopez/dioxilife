"use client";

import {
  useState,
  type FormEvent,
} from "react";

import { toast } from "sonner";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";

type EstadoPlantilla =
  | "BORRADOR"
  | "ACTIVO";

type NombreActividad =
  | "Ayunas"
  | "Desayuno"
  | "Almuerzo"
  | "Cena"
  | "Importante";

type ActividadPlantilla = {
  nombre: NombreActividad;
  hora: string;
  instrucciones: string[];
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
      instrucciones: [""],
    },
    {
      nombre: "Desayuno",
      hora: "",
      instrucciones: [""],
    },
    {
      nombre: "Almuerzo",
      hora: "13:00",
      instrucciones: [""],
    },
    {
      nombre: "Cena",
      hora: "18:00",
      instrucciones: [""],
    },
    {
      nombre: "Importante",
      hora: "",
      instrucciones: [""],
    },
  ];
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
                      instruccionesATexto(
                        actividad.instrucciones
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
