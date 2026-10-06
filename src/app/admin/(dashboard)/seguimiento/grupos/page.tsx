"use client";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { toast } from "sonner";

import Modal from "@/components/Modal";
import SelectorFecha from "@/components/admin/seguimiento/SelectorFecha";

type Plan = {
  id: string;
  nombre: string;
  duracionDias: number;
  _count: {
    actividades: number;
  };
};

type Grupo = {
  id: string;
  nombre: string;
  objetivo: string;
  descripcion: string | null;
  fechaInicio: string;
  duracionDias: number;
  estado:
    | "BORRADOR"
    | "ACTIVO"
    | "FINALIZADO"
    | "CANCELADO";

  plan: {
    id: string;
    nombre: string;
    duracionDias: number;
  };

  _count: {
    miembros: number;
  };
};

type ModoInicio =
  | "CERO"
  | "PLANTILLA";

type FormGrupo = {
  nombre: string;
  objetivo: string;
  descripcion: string;
  modoInicio: ModoInicio;
  planId: string;
  fechaInicio: string;
  duracionDias: string;
};

const FORM_VACIO: FormGrupo = {
  nombre: "",
  objetivo: "",
  descripcion: "",
  modoInicio: "CERO",
  planId: "",
  fechaInicio: "",
  duracionDias: "21",
};

function hoyValor() {
  const fecha =
    new Date();

  return [
    fecha.getFullYear(),
    String(
      fecha.getMonth() + 1
    ).padStart(2, "0"),
    String(
      fecha.getDate()
    ).padStart(2, "0"),
  ].join("-");
}

function fechaVisible(
  valor: string
) {
  const parte =
    valor.slice(0, 10);

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      parte
    );

  if (!match) {
    return "—";
  }

  return `${match[3]}/${match[2]}/${match[1]}`;
}

function claseEstado(
  estado: Grupo["estado"]
) {
  switch (estado) {
    case "ACTIVO":
      return "bg-emerald-100 text-emerald-700";

    case "FINALIZADO":
      return "bg-blue-100 text-blue-700";

    case "CANCELADO":
      return "bg-red-100 text-red-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

function textoEstado(
  estado: Grupo["estado"]
) {
  switch (estado) {
    case "ACTIVO":
      return "Activo";

    case "FINALIZADO":
      return "Finalizado";

    case "CANCELADO":
      return "Cancelado";

    default:
      return "Borrador";
  }
}

function diaGrupo(
  fechaInicio: string,
  duracionDias: number
) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})/.exec(
      fechaInicio
    );

  if (!match) {
    return null;
  }

  const inicio =
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );

  const hoy =
    new Date();

  const actual =
    Date.UTC(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate()
    );

  const dia =
    Math.floor(
      (
        actual -
        inicio
      ) /
        86400000
    ) + 1;

  if (dia < 1) {
    return 0;
  }

  return Math.min(
    dia,
    duracionDias
  );
}

export default function GruposSeguimientoPage() {
  const router =
    useRouter();

  const [
    grupos,
    setGrupos,
  ] = useState<Grupo[]>([]);

  const [
    planes,
    setPlanes,
  ] = useState<Plan[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState<FormGrupo>(
    FORM_VACIO
  );

  async function cargar() {
    setCargando(true);

    try {
      const res =
        await fetch(
          "/api/admin/seguimiento/grupos",
          {
            cache:
              "no-store",
          }
        );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          data?.error ||
            "No se pudieron cargar los grupos."
        );

        return;
      }

      setGrupos(
        Array.isArray(
          data?.grupos
        )
          ? data.grupos
          : []
      );

      setPlanes(
        Array.isArray(
          data?.planes
        )
          ? data.planes
          : []
      );
    } catch {
      toast.error(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  function abrirNuevo() {
    setForm({
      ...FORM_VACIO,
      fechaInicio:
        hoyValor(),
    });

    setModalAbierto(true);
  }

  function seleccionarPlan(
    planId: string
  ) {
    const plan =
      planes.find(
        (item) =>
          item.id ===
          planId
      );

    setForm(
      (actual) => ({
        ...actual,
        planId,

        duracionDias:
          plan
            ? String(
                plan.duracionDias
              )
            : actual.duracionDias,
      })
    );
  }

  async function guardar(
    event: FormEvent
  ) {
    event.preventDefault();

    const nombre =
      form.nombre.trim();

    const objetivo =
      form.objetivo.trim();

    const duracionDias =
      Number(
        form.duracionDias
      );

    if (!nombre) {
      toast.error(
        "Escribe el nombre del grupo."
      );
      return;
    }

    if (!objetivo) {
      toast.error(
        "Escribe el objetivo del grupo."
      );
      return;
    }

    if (
      form.modoInicio ===
        "PLANTILLA" &&
      !form.planId
    ) {
      toast.error(
        "Selecciona una plantilla."
      );
      return;
    }

    if (!form.fechaInicio) {
      toast.error(
        "Selecciona la fecha de inicio."
      );
      return;
    }

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

    setGuardando(true);

    try {
      const res =
        await fetch(
          "/api/admin/seguimiento/grupos",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                nombre,
                objetivo,

                descripcion:
                  form.descripcion
                    .trim() ||
                  null,

                modo:
                  form.modoInicio,

                planId:
                  form.modoInicio ===
                  "PLANTILLA"
                    ? form.planId
                    : null,

                fechaInicio:
                  form.fechaInicio,

                duracionDias,
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          data?.error ||
            "No se pudo crear el grupo."
        );
        return;
      }

      toast.success(
        "Grupo creado. Ahora configura su protocolo."
      );

      setModalAbierto(false);
      setForm(
        FORM_VACIO
      );

      const grupoId =
        data?.grupo?.id;

      const planGrupoId =
        data?.siguientePaso
          ?.planId;

      if (
        grupoId &&
        planGrupoId
      ) {
        router.push(
          `/admin/seguimiento/planes/${planGrupoId}?flujo=grupo&grupoId=${grupoId}`
        );

        return;
      }

      await cargar();
    } catch {
      toast.error(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
            <Link
              href="/admin/seguimiento/clientes"
              className="hover:text-violet-700"
            >
              Clientes
            </Link>

            <span>·</span>

            <Link
              href="/admin/seguimiento/planes"
              className="hover:text-violet-700"
            >
              Plantillas
            </Link>

            <span>·</span>

            <Link
              href="/admin/seguimiento/biblioteca"
              className="hover:text-violet-700"
            >
              Biblioteca
            </Link>

            <span>·</span>

            <span className="text-violet-700">
              Grupos
            </span>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">
            Grupos de seguimiento
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
            Organiza participantes que comparten un mismo protocolo,
            periodo y objetivo de seguimiento.
          </p>
        </div>

        <button
          type="button"
          onClick={
            abrirNuevo
          }
          className="admin-btn-primary shrink-0"
        >
          + Crear grupo
        </button>

      </div>


      {cargando ? (
        <p className="text-sm text-gray-500">
          Cargando grupos...
        </p>
      ) : grupos.length === 0 ? (
        <div className="admin-card p-8 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-xl">
            👥
          </div>

          <p className="mt-4 font-semibold text-gray-900">
            Aún no hay grupos de seguimiento
          </p>

          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-500">
            Crea el primer grupo, selecciona su protocolo común y después
            podrás añadir participantes.
          </p>

          <button
            type="button"
            onClick={
              abrirNuevo
            }
            className="admin-btn-primary mt-5"
          >
            Crear primer grupo
          </button>

        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

          {grupos.map(
            (grupo) => {
              const dia =
                diaGrupo(
                  grupo.fechaInicio,
                  grupo.duracionDias
                );

              const jornada =
                grupo.estado ===
                "BORRADOR"
                  ? "Por iniciar"
                  : grupo.estado ===
                    "FINALIZADO"
                  ? "Finalizado"
                  : grupo.estado ===
                    "CANCELADO"
                  ? "Cancelado"
                  : dia ===
                    null
                  ? "—"
                  : dia ===
                    0
                  ? "Por iniciar"
                  : `Día ${dia}/${grupo.duracionDias}`;

              return (
                <article
                  key={
                    grupo.id
                  }
                  className="admin-card p-5"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h2 className="font-semibold text-gray-900">
                          {
                            grupo.nombre
                          }
                        </h2>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${claseEstado(
                            grupo.estado
                          )}`}
                        >
                          {textoEstado(
                            grupo.estado
                          )}
                        </span>

                      </div>

                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {
                          grupo.objetivo
                        }
                      </p>

                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-lg">
                      👥
                    </div>

                  </div>


                  <div className="mt-4 rounded-xl bg-gray-50 p-3">

                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                      Protocolo común
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {
                        grupo.plan
                          .nombre
                      }
                    </p>

                  </div>


                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        Inicio
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {fechaVisible(
                          grupo.fechaInicio
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        Duración
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {
                          grupo.duracionDias
                        }{" "}
                        días
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        Participantes
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {
                          grupo._count
                            .miembros
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        Jornada
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {jornada}
                      </p>
                    </div>

                  </div>


                  <div className="mt-5 border-t border-gray-100 pt-4">

                    <Link
                      href={`/admin/seguimiento/grupos/${grupo.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-800"
                    >
                      Abrir grupo
                      <span>
                        →
                      </span>
                    </Link>

                  </div>

                </article>
              );
            }
          )}

        </div>
      )}


      {modalAbierto && (
        <Modal
          title="Paso 1 de 4 · Datos del grupo"
          onClose={() =>
            !guardando &&
            setModalAbierto(
              false
            )
          }
          maxWidthClassName="max-w-xl"
        >

          <form
            onSubmit={
              guardar
            }
            className="space-y-5"
          >

            <div>

              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Nombre del grupo *
              </label>

              <input
                value={
                  form.nombre
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      actual
                    ) => ({
                      ...actual,
                      nombre:
                        event
                          .target
                          .value,
                    })
                  )
                }
                maxLength={
                  200
                }
                placeholder="Ej. Grupo Metabólico Octubre"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />

            </div>


            <div>

              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Objetivo *
              </label>

              <textarea
                value={
                  form.objetivo
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      actual
                    ) => ({
                      ...actual,
                      objetivo:
                        event
                          .target
                          .value,
                    })
                  )
                }
                maxLength={
                  1000
                }
                rows={3}
                placeholder="Ej. Cumplir el protocolo, controlar el peso y la glucemia en ayunas."
                className="w-full resize-none rounded-xl border border-gray-300 px-3.5 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />

            </div>


            <div>

              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                ¿Cómo quieres comenzar? *
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <button
                  type="button"
                  disabled={guardando}
                  onClick={() =>
                    setForm((actual) => ({
                      ...actual,
                      modoInicio: "CERO",
                    }))
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    form.modoInicio === "CERO"
                      ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                      : "border-gray-200 bg-white hover:border-violet-200"
                  }`}
                >
                  <p className="font-semibold text-gray-900">
                    Crear protocolo desde cero
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Arma el protocolo propio de este grupo.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={
                    guardando ||
                    planes.length === 0
                  }
                  onClick={() =>
                    setForm((actual) => ({
                      ...actual,
                      modoInicio: "PLANTILLA",
                    }))
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    form.modoInicio === "PLANTILLA"
                      ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                      : "border-gray-200 bg-white hover:border-violet-200"
                  } ${
                    planes.length === 0
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  <p className="font-semibold text-gray-900">
                    Usar una plantilla
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Copia un protocolo guardado y personalízalo para el grupo.
                  </p>
                </button>

              </div>

              {form.modoInicio === "CERO" && (
                <p className="mt-3 text-xs leading-5 text-violet-700">
                  En el siguiente paso agregarás los horarios e indicaciones del protocolo.
                </p>
              )}

              {form.modoInicio === "PLANTILLA" && (
                <div className="mt-3">

                  <select
                    value={form.planId}
                    onChange={(event) =>
                      seleccionarPlan(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="">
                      Seleccionar plantilla
                    </option>

                    {planes.map((plan) => (
                      <option
                        key={plan.id}
                        value={plan.id}
                      >
                        {plan.nombre} · {plan.duracionDias} días
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Se copiará la plantilla y luego podrás personalizarla para este grupo.
                  </p>

                </div>
              )}

              {planes.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  No hay plantillas activas con actividades. Puedes crear el protocolo desde cero.
                </p>
              )}

            </div>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Fecha de inicio *
                </label>

                <SelectorFecha
                  value={
                    form.fechaInicio
                  }
                  onChange={(
                    value
                  ) =>
                    setForm(
                      (
                        actual
                      ) => ({
                        ...actual,
                        fechaInicio:
                          value,
                      })
                    )
                  }
                  disabled={
                    guardando
                  }
                />

              </div>


              <div>

                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Duración *
                </label>

                <div className="flex h-[66px] items-center rounded-xl border border-gray-300 bg-white px-3.5">

                  <input
                    type="number"
                    min={1}
                    max={
                      365
                    }
                    value={
                      form.duracionDias
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          actual
                        ) => ({
                          ...actual,
                          duracionDias:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="min-w-0 flex-1 bg-transparent text-lg font-bold text-gray-900 outline-none"
                  />

                  <span className="text-sm font-medium text-gray-400">
                    días
                  </span>

                </div>

              </div>

            </div>


            <div>

              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Descripción
              </label>

              <textarea
                value={
                  form.descripcion
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      actual
                    ) => ({
                      ...actual,
                      descripcion:
                        event
                          .target
                          .value,
                    })
                  )
                }
                maxLength={
                  3000
                }
                rows={3}
                placeholder="Información interna opcional sobre el grupo."
                className="w-full resize-none rounded-xl border border-gray-300 px-3.5 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />

            </div>


            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={
                  guardando
                }
                onClick={() =>
                  setModalAbierto(
                    false
                  )
                }
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  guardando
                }
                className="admin-btn-primary"
              >
                {guardando
                  ? "Creando..."
                  : "Continuar"}
              </button>

            </div>

          </form>

        </Modal>
      )}

    </div>
  );
}
