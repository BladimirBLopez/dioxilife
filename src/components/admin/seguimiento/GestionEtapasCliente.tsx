"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Etapa = {
  id: string;
  nombre: string;
  orden: number;
  diaInicio: number;
  diaFin: number;
  estado: string;
  modoPublicacion: string;
  _count: {
    actividades: number;
  };
};

type Props = {
  seguimientoId: string;
  duracionDias: number;
  estado: string;
};

export default function GestionEtapasCliente({
  seguimientoId,
  duracionDias,
  estado,
}: Props) {
  const router = useRouter();

  const [etapas, setEtapas] = useState<Etapa[]>([]);

  const [mostrarHistorial, setMostrarHistorial] =
    useState<boolean | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [recarga, setRecarga] = useState(0);

  const [nombre, setNombre] = useState("");
  const [inicio, setInicio] = useState("1");
  const [duracion, setDuracion] = useState("3");
  const [editandoId, setEditandoId] =
    useState<string | null>(null);

  const base =
    `/api/admin/seguimiento/clientes/${seguimientoId}/etapas`;

  const bloqueado =
    estado === "COMPLETADO" ||
    estado === "CANCELADO";

  useEffect(() => {
    let vigente = true;

    fetch(base, { cache: "no-store" })
      .then(async (respuesta) => {
        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            datos.error || "No se pudieron consultar las etapas."
          );
        }

        if (!Array.isArray(datos.etapas)) {
          throw new Error("Respuesta de etapas inválida.");
        }

        if (
          !datos.seguimiento ||
          typeof datos.seguimiento.mostrarEtapasAnteriores !==
            "boolean"
        ) {
          throw new Error(
            "La respuesta no incluye la configuracion del historial."
          );
        }

        if (vigente) {
          setEtapas(datos.etapas);
          setMostrarHistorial(
            datos.seguimiento.mostrarEtapasAnteriores
          );
          setErrorCarga("");
        }
      })
      .catch((error) => {
        if (vigente) {
          setErrorCarga(
            error instanceof Error
              ? error.message
              : "Error al consultar las etapas."
          );
        }
      })
      .finally(() => {
        if (vigente) {
          setCargando(false);
        }
      });

    return () => {
      vigente = false;
    };
  }, [base, recarga]);

  async function cambiarVisibilidadHistorial(
    habilitar: boolean
  ) {
    if (
      guardando ||
      cargando ||
      Boolean(errorCarga) ||
      mostrarHistorial === null ||
      mostrarHistorial === habilitar
    ) {
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch(base, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mostrarEtapasAnteriores: habilitar,
        }),
      });

      const datos = (await respuesta.json().catch(
        () => ({})
      )) as {
        error?: string;
        mensaje?: string;
        seguimiento?: {
          mostrarEtapasAnteriores?: boolean;
        };
      };

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            "No se pudo guardar la configuracion."
        );
      }

      if (
        datos.seguimiento?.mostrarEtapasAnteriores !==
        habilitar
      ) {
        throw new Error(
          "No se pudo confirmar la configuracion guardada."
        );
      }

      setMostrarHistorial(habilitar);

      toast.success(
        datos.mensaje ||
          "Configuracion del historial guardada."
      );

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al guardar el historial."
      );
    } finally {
      setGuardando(false);
    }
  }

  const desde = Number(inicio);
  const dias = Number(duracion);
  const hasta = desde + dias - 1;

  const valido =
    inicio.trim() !== "" &&
    duracion.trim() !== "" &&
    Number.isInteger(desde) &&
    Number.isInteger(dias) &&
    desde >= 1 &&
    dias >= 1 &&
    hasta <= duracionDias;

  const superpuesta =
    valido &&
    etapas.some(
      (etapa) =>
        etapa.id !== editandoId &&
        desde <= etapa.diaFin &&
        hasta >= etapa.diaInicio
    );

  const siguienteDia =
    Math.max(1, ...etapas.map((e) => e.diaFin + 1));

  async function publicar(etapa: Etapa) {
    if (
      bloqueado ||
      cargando ||
      guardando ||
      Boolean(errorCarga) ||
      editandoId !== null ||
      etapa.estado !== "BORRADOR" ||
      etapa.modoPublicacion !== "MANUAL" ||
      etapa._count.actividades < 1
    ) {
      return;
    }

    const confirmado = window.confirm(
      `¿Publicar "${etapa.nombre}" (días ${etapa.diaInicio} al ${etapa.diaFin})? Las actividades autorizadas podrán mostrarse al cliente. Esta publicación no se puede deshacer desde este panel.`
    );

    if (!confirmado) return;

    setGuardando(true);

    try {
      const respuesta = await fetch(
        `${base}/${encodeURIComponent(etapa.id)}/publicar`,
        {
          method: "POST",
          cache: "no-store",
        }
      );

      const datos = (
        await respuesta.json().catch(() => ({}))
      ) as {
        error?: string;
        mensaje?: string;
      };

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            "No se pudo publicar la etapa."
        );
      }

      toast.success(
        datos.mensaje ||
          "Etapa publicada correctamente."
      );

      router.refresh();
      setCargando(true);
      setRecarga((anterior) => anterior + 1);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al publicar la etapa."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function programar(etapa: Etapa) {
    if (
      bloqueado ||
      cargando ||
      guardando ||
      Boolean(errorCarga) ||
      editandoId !== null ||
      (
        estado !== "PENDIENTE" &&
        estado !== "ACTIVO"
      ) ||
      etapa.estado !== "BORRADOR" ||
      etapa.modoPublicacion !== "MANUAL" ||
      etapa._count.actividades < 1
    ) {
      return;
    }

    const confirmado = window.confirm(
      `¿Programar automáticamente "${etapa.nombre}" (días ${etapa.diaInicio} al ${etapa.diaFin})? La etapa quedará bloqueada para edición y se publicará cuando corresponda.`
    );

    if (!confirmado) return;

    setGuardando(true);

    try {
      const respuesta = await fetch(
        `${base}/${encodeURIComponent(etapa.id)}/programar`,
        {
          method: "POST",
          cache: "no-store",
        }
      );

      const datos = (
        await respuesta.json().catch(() => ({}))
      ) as {
        error?: string;
        mensaje?: string;
      };

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            "No se pudo programar la etapa."
        );
      }

      toast.success(
        datos.mensaje ||
          "Etapa programada correctamente."
      );

      setCargando(true);
      setRecarga((anterior) => anterior + 1);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al programar la etapa."
      );
    } finally {
      setGuardando(false);
    }
  }

  function iniciarEdicion(etapa: Etapa) {
    if (
      bloqueado ||
      cargando ||
      guardando ||
      etapa.estado !== "BORRADOR" ||
      etapa._count.actividades > 0
    ) {
      return;
    }

    setEditandoId(etapa.id);
    setNombre(etapa.nombre);
    setInicio(String(etapa.diaInicio));
    setDuracion(
      String(etapa.diaFin - etapa.diaInicio + 1)
    );

    document
      .getElementById("formulario-etapas")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  function cancelarEdicion() {
    if (guardando) return;

    setEditandoId(null);
    setNombre("");
    setInicio("1");
    setDuracion("3");
  }

  async function crear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (
      bloqueado ||
      guardando ||
      cargando ||
      Boolean(errorCarga)
    ) {
      return;
    }

    if (!valido) {
      toast.error("Revisa el día de inicio y la duración.");
      return;
    }

    if (editandoId && !nombre.trim()) {
      toast.error("Escribe el nombre de la etapa.");
      return;
    }

    if (superpuesta) {
      toast.error("Este período coincide con otra etapa.");
      return;
    }

    setGuardando(true);

    try {
      const url = editandoId
        ? `${base}/${encodeURIComponent(editandoId)}`
        : base;

      const respuesta = await fetch(url, {
        method: editandoId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: editandoId
            ? nombre.trim()
            : nombre.trim() ||
              `Etapa ${etapas.length + 1}`,
          diaInicio: desde,
          diaFin: hasta,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudo crear la etapa."
        );
      }

      toast.success(
        editandoId
          ? "Etapa actualizada correctamente."
          : "Etapa guardada como borrador."
      );

      setEditandoId(null);
      setNombre("");
      setInicio(
        String(
          Math.min(duracionDias, hasta + 1)
        )
      );

      setCargando(true);
      setRecarga((anterior) => anterior + 1);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section
      id="etapas-cliente"
      className="rounded-xl border border-violet-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-900">
              Mostrar etapas anteriores
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-600">
              Permite que el cliente consulte las actividades
              de etapas anteriores. No habilita nuevos registros.
            </span>
          </span>

          <input
            type="checkbox"
            aria-label="Mostrar etapas anteriores"
            checked={mostrarHistorial ?? false}
            disabled={
              mostrarHistorial === null ||
              cargando ||
              guardando ||
              Boolean(errorCarga)
            }
            onChange={(evento) => {
              void cambiarVisibilidadHistorial(
                evento.currentTarget.checked
              );
            }}
            className="h-5 w-5 shrink-0 cursor-pointer accent-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
          />
        </label>

        <p className="mt-2 text-xs text-slate-500">
          {mostrarHistorial === null
            ? "Consultando configuracion..."
            : guardando
              ? "Guardando configuracion..."
              : mostrarHistorial
                ? "Historial anterior visible para el cliente."
                : "Historial anterior oculto para el cliente."}
        </p>
      </div>

      <h2 className="text-lg font-bold text-gray-900">
        Etapas del seguimiento
      </h2>

      <p className="mt-2 text-sm leading-6 text-gray-600">
        Organiza las instrucciones por períodos.
        Puedes comenzar con 3, 7 y 15 días
        o elegir una duración diferente.
      </p>

      <div className="mt-4 space-y-2">
        {cargando && (
          <p className="text-sm text-gray-500">
            Cargando etapas...
          </p>
        )}

        {errorCarga && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errorCarga}
          </p>
        )}

        {!cargando &&
          !errorCarga &&
          etapas.length === 0 && (
            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              Todavía no hay etapas creadas.
            </p>
          )}

        {etapas.map((etapa) => (
          <div
            key={etapa.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-3"
          >
            <div>
              <p className="font-semibold text-gray-900">
                {etapa.nombre}
              </p>
              <p className="text-xs text-gray-600">
                Días {etapa.diaInicio} al {etapa.diaFin}
                {" · "}
                {etapa.diaFin - etapa.diaInicio + 1} días
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {etapa._count.actividades} actividades
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                {etapa.estado}
              </span>

              {!bloqueado &&
                etapa.estado === "BORRADOR" &&
                etapa._count.actividades === 0 && (
                  <button
                    type="button"
                    disabled={cargando || guardando}
                    onClick={() => iniciarEdicion(etapa)}
                    className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-800 disabled:opacity-40"
                  >
                    Editar etapa
                  </button>
                )}

              {!bloqueado &&
                etapa.estado === "BORRADOR" &&
                etapa.modoPublicacion === "MANUAL" &&
                etapa._count.actividades > 0 && (
                  <button
                    type="button"
                    disabled={
                      cargando ||
                      guardando ||
                      editandoId !== null ||
                      Boolean(errorCarga)
                    }
                    onClick={() => void publicar(etapa)}
                    className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-40"
                  >
                    Publicar etapa
                  </button>
                )}

              {!bloqueado &&
                (
                  estado === "PENDIENTE" ||
                  estado === "ACTIVO"
                ) &&
                etapa.estado === "BORRADOR" &&
                etapa.modoPublicacion === "MANUAL" &&
                etapa._count.actividades > 0 && (
                  <button
                    type="button"
                    disabled={
                      cargando ||
                      guardando ||
                      editandoId !== null ||
                      Boolean(errorCarga)
                    }
                    onClick={() => void programar(etapa)}
                    className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800 hover:bg-sky-100 disabled:opacity-40"
                  >
                    Programar automáticamente
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>

      {!bloqueado && (
        <form
          id="formulario-etapas"
          onSubmit={(e) => void crear(e)}
          className="mt-5 space-y-4 rounded-xl bg-violet-50/60 p-4"
        >
          <h3 className="font-bold text-violet-950">
            {editandoId
              ? "Editar etapa en borrador"
              : "Crear una etapa"}
          </h3>

          {editandoId && (
            <button
              type="button"
              onClick={cancelarEdicion}
              disabled={guardando}
              className="text-sm font-semibold text-violet-800 underline disabled:opacity-40"
            >
              Cancelar edición
            </button>
          )}

          <div>
            <label
              htmlFor="etapa-nombre"
              className="mb-1 block text-sm font-semibold"
            >
              Nombre (opcional)
            </label>

            <input
              id="etapa-nombre"
              value={nombre}
              maxLength={100}
              onChange={(e) => setNombre(e.target.value)}
              className="admin-input"
              placeholder="Ej. Primera etapa"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">
              Duración rápida
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[3, 7, 15].map((valor) => (
                <button
                  type="button"
                  key={valor}
                  onClick={() =>
                    setDuracion(String(valor))
                  }
                  aria-pressed={
                    duracion === String(valor)
                  }
                  className={
                    duracion === String(valor)
                      ? "rounded-lg bg-violet-700 px-2 py-3 text-sm font-bold text-white"
                      : "rounded-lg border border-violet-200 bg-white px-2 py-3 text-sm font-bold text-violet-800"
                  }
                >
                  {valor} días
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="etapa-inicio"
                className="mb-1 block text-sm font-semibold"
              >
                Desde el día
              </label>

              <input
                id="etapa-inicio"
                type="number"
                min={1}
                max={duracionDias}
                value={inicio}
                onChange={(e) =>
                  setInicio(e.target.value)
                }
                className="admin-input"
                required
              />
            </div>

            <div>
              <label
                htmlFor="etapa-duracion"
                className="mb-1 block text-sm font-semibold"
              >
                Cantidad de días
              </label>

              <input
                id="etapa-duracion"
                type="number"
                min={1}
                max={duracionDias}
                value={duracion}
                onChange={(e) =>
                  setDuracion(e.target.value)
                }
                className="admin-input"
                required
              />
            </div>
          </div>

          {!editandoId &&
            siguienteDia <= duracionDias &&
            etapas.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setInicio(String(siguienteDia))
                }
                className="text-xs font-semibold text-violet-800 underline"
              >
                Usar siguiente inicio sugerido:
                día {siguienteDia}
              </button>
            )}

          <div className="rounded-lg bg-white p-3 text-sm">
            {valido && !superpuesta ? (
              <p className="font-bold text-violet-900">
                Período: día {desde} al {hasta}
              </p>
            ) : (
              <p className="text-red-700">
                {superpuesta
                  ? "Este período coincide con otra etapa."
                  : `Los días deben estar dentro del seguimiento de ${duracionDias} días.`}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              guardando ||
              cargando ||
              Boolean(errorCarga) ||
              !valido ||
              Boolean(superpuesta) ||
              (editandoId !== null && !nombre.trim())
            }
            className="w-full rounded-xl bg-violet-700 px-4 py-3 font-bold text-white disabled:opacity-40"
          >
            {guardando
              ? "Guardando..."
              : editandoId
                ? "Guardar cambios"
                : "Crear etapa en borrador"}
          </button>
        </form>
      )}

      <p className="mt-4 text-xs leading-5 text-gray-500">
        Las etapas comienzan en borrador.
        Para publicar manualmente, agrega actividades
        y confirma la publicación. El servidor comprobará
        que el seguimiento esté activo y que corresponda
        al período de la etapa. Para la publicación automática,
        utiliza el botón de programación.
        La ejecución necesitará configurar
        cron-job.org después de las pruebas.
      </p>
    </section>
  );
}
