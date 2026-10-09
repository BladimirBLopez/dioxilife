"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/Modal";

type TipoActividad =
  | "TAREA"
  | "INFORMACION"
  | "CONTROL";

type SeccionActividad =
  | "PRINCIPAL"
  | "ADICIONAL";

type ActividadBase = {
  id: string;
  tipo: TipoActividad;
  seccion: SeccionActividad;
  titulo: string;
  descripcion: string | null;
  momento: string | null;
  hora: string | null;
  activo: boolean;
};

type Props = {
  planId: string;
  seccion: SeccionActividad;
  onAgregadas: () => void | Promise<void>;
};

function nombreTipo(tipo: TipoActividad) {
  if (tipo === "INFORMACION") {
    return "Información";
  }

  if (tipo === "CONTROL") {
    return "Control";
  }

  return "Tarea";
}

function claseTipo(tipo: TipoActividad) {
  if (tipo === "INFORMACION") {
    return "bg-blue-50 text-blue-700";
  }

  if (tipo === "CONTROL") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-emerald-50 text-emerald-700";
}

export default function AgregarDesdeBiblioteca({
  planId,
  seccion,
  onAgregadas,
}: Props) {
  const [abierto, setAbierto] =
    useState(false);

  const [actividades, setActividades] =
    useState<ActividadBase[]>([]);

  const [seleccionadas, setSeleccionadas] =
    useState<string[]>([]);

  const [busqueda, setBusqueda] =
    useState("");

  const [cargando, setCargando] =
    useState(false);

  const [agregando, setAgregando] =
    useState(false);

  const actividadesVisibles =
    useMemo(() => {
      const termino =
        busqueda
          .trim()
          .toLocaleLowerCase("es");

      return actividades.filter(
        (actividad) => {
          if (!actividad.activo) {
            return false;
          }

          if (
            actividad.seccion !==
            seccion
          ) {
            return false;
          }

          if (!termino) {
            return true;
          }

          const texto = [
            actividad.titulo,
            actividad.descripcion || "",
            actividad.momento || "",
            actividad.hora || "",
            nombreTipo(actividad.tipo),
          ]
            .join(" ")
            .toLocaleLowerCase("es");

          return texto.includes(termino);
        }
      );
    }, [
      actividades,
      busqueda,
      seccion,
    ]);

  async function abrir() {
    setAbierto(true);
    setCargando(true);
    setSeleccionadas([]);
    setBusqueda("");

    try {
      const res = await fetch(
        "/api/admin/seguimiento/biblioteca",
        {
          cache: "no-store",
        }
      );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          data?.error ||
            "No se pudo cargar la biblioteca."
        );

        return;
      }

      setActividades(
        Array.isArray(data)
          ? data
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

  function alternar(id: string) {
    setSeleccionadas(
      (actual) =>
        actual.includes(id)
          ? actual.filter(
              (item) =>
                item !== id
            )
          : [
              ...actual,
              id,
            ]
    );
  }

  function seleccionarVisibles() {
    const idsVisibles =
      actividadesVisibles.map(
        (actividad) =>
          actividad.id
      );

    const todosSeleccionados =
      idsVisibles.length > 0 &&
      idsVisibles.every(
        (id) =>
          seleccionadas.includes(
            id
          )
      );

    if (todosSeleccionados) {
      setSeleccionadas(
        (actual) =>
          actual.filter(
            (id) =>
              !idsVisibles.includes(
                id
              )
          )
      );

      return;
    }

    setSeleccionadas(
      (actual) =>
        Array.from(
          new Set([
            ...actual,
            ...idsVisibles,
          ])
        )
    );
  }

  async function agregar() {
    if (agregando) {
      return;
    }

    if (
      seleccionadas.length === 0
    ) {
      toast.error(
        "Selecciona al menos una actividad."
      );

      return;
    }

    setAgregando(true);

    const toastId =
      toast.loading(
        "Agregando actividades..."
      );

    try {
      const res = await fetch(
        `/api/admin/seguimiento/planes/${planId}/actividades/biblioteca`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              actividadIds:
                seleccionadas,
            }),
        }
      );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          "No se pudieron agregar las actividades.",
          {
            id: toastId,
            description:
              data?.error ||
              "Inténtalo nuevamente.",
          }
        );

        return;
      }

      const cantidad =
        Number(
          data?.agregadas ||
            seleccionadas.length
        );

      toast.success(
        cantidad === 1
          ? "1 actividad agregada al protocolo."
          : `${cantidad} actividades agregadas al protocolo.`,
        {
          id: toastId,
        }
      );

      setAbierto(false);
      setSeleccionadas([]);
      setBusqueda("");

      await onAgregadas();
    } catch {
      toast.error(
        "No se pudo conectar con el servidor.",
        {
          id: toastId,
        }
      );
    } finally {
      setAgregando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          void abrir()
        }
        className="shrink-0 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
      >
        + Biblioteca
      </button>

      {abierto && (
        <Modal
          title="Agregar actividades desde biblioteca"
          onClose={() => {
            if (!agregando) {
              setAbierto(false);
            }
          }}
        >
          <div className="space-y-4">

            <div>
              <p className="text-sm leading-6 text-gray-600">
                Selecciona una o varias actividades de{" "}
                {seccion === "ADICIONAL"
                  ? "protocolos adicionales"
                  : "protocolo principal"}
                . Se copiarán al protocolo y después podrás modificarlas sin alterar la biblioteca.
              </p>
            </div>

            <div>
              <label className="admin-label">
                Buscar actividad
              </label>

              <input
                type="search"
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(
                    e.target.value
                  )
                }
                className="admin-input"
                placeholder="Ej. Zeolita, desayuno, almuerzo..."
              />
            </div>

            {!cargando &&
              actividadesVisibles.length >
                0 && (
                <div className="flex items-center justify-between gap-3">

                  <button
                    type="button"
                    onClick={
                      seleccionarVisibles
                    }
                    className="text-sm font-semibold text-brand-blue hover:underline"
                  >
                    Seleccionar visibles
                  </button>

                  <span className="text-xs font-medium text-gray-500">
                    {
                      seleccionadas.length
                    }{" "}
                    seleccionada
                    {seleccionadas.length ===
                    1
                      ? ""
                      : "s"}
                  </span>

                </div>
              )}

            {cargando ? (
              <div className="rounded-xl border border-gray-200 p-6 text-center">
                <p className="text-sm text-gray-500">
                  Cargando biblioteca...
                </p>
              </div>
            ) : actividades.length ===
              0 ? (
              <div className="rounded-xl border border-gray-200 p-6 text-center">
                <p className="font-semibold text-gray-900">
                  La biblioteca está vacía
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Primero crea actividades desde la sección Biblioteca.
                </p>
              </div>
            ) : actividadesVisibles.length ===
              0 ? (
              <div className="rounded-xl border border-gray-200 p-6 text-center">
                <p className="text-sm text-gray-500">
                  No encontramos actividades con esa búsqueda.
                </p>
              </div>
            ) : (
              <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">

                {actividadesVisibles.map(
                  (actividad) => {
                    const seleccionada =
                      seleccionadas.includes(
                        actividad.id
                      );

                    return (
                      <label
                        key={
                          actividad.id
                        }
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                          seleccionada
                            ? "border-brand-pink bg-brand-pink/5"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={
                            seleccionada
                          }
                          onChange={() =>
                            alternar(
                              actividad.id
                            )
                          }
                          className="mt-1 h-4 w-4 shrink-0 accent-pink-600"
                        />

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <span
                              className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${claseTipo(
                                actividad.tipo
                              )}`}
                            >
                              {nombreTipo(
                                actividad.tipo
                              )}
                            </span>

                            {actividad.hora && (
                              <span className="rounded-lg bg-[#F8F6FF] px-2 py-1 text-[11px] font-semibold text-brand-pink">
                                {
                                  actividad.hora
                                }
                              </span>
                            )}

                            {actividad.momento && (
                              <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">
                                {
                                  actividad.momento
                                }
                              </span>
                            )}

                          </div>

                          <p className="mt-2 font-semibold text-gray-900">
                            {
                              actividad.titulo
                            }
                          </p>

                          {actividad.descripcion && (
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                              {
                                actividad.descripcion
                              }
                            </p>
                          )}

                        </div>
                      </label>
                    );
                  }
                )}

              </div>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={agregando}
                onClick={() =>
                  setAbierto(false)
                }
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  agregando ||
                  seleccionadas.length ===
                    0
                }
                onClick={() =>
                  void agregar()
                }
                className="admin-btn-primary disabled:opacity-60"
              >
                {agregando
                  ? "Agregando..."
                  : seleccionadas.length ===
                    1
                  ? "Agregar 1 actividad"
                  : `Agregar ${seleccionadas.length} actividades`}
              </button>

            </div>

          </div>
        </Modal>
      )}
    </>
  );
}
