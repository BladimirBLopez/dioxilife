"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { toast } from "sonner";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";

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

type ActividadBase = {
  id: string;
  tipo: TipoActividad;
  recordatorio: RecordatorioActividad;
  titulo: string;
  descripcion: string | null;
  momento: string | null;
  hora: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
};

type FiltroEstado =
  | "TODAS"
  | "ACTIVAS"
  | "INACTIVAS";

type FormActividad = {
  tipo: TipoActividad;
  recordatorio: RecordatorioActividad;
  titulo: string;
  descripcion: string;
  momento: string;
  hora: string;
  activo: boolean;
};

const FORM_VACIO: FormActividad = {
  tipo: "TAREA",
  recordatorio: "NINGUNO",
  titulo: "",
  descripcion: "",
  momento: "",
  hora: "",
  activo: true,
};

const MOMENTOS = [
  "Ayunas",
  "Desayuno",
  "Media mañana",
  "Almuerzo",
  "Tarde",
  "Cena",
  "Noche",
  "Antes de dormir",
  "Adicional",
];

function nombreTipo(
  tipo: TipoActividad
) {
  if (tipo === "INFORMACION") {
    return "Información";
  }

  if (tipo === "CONTROL") {
    return "Control";
  }

  return "Tarea";
}

function claseTipo(
  tipo: TipoActividad
) {
  if (tipo === "INFORMACION") {
    return "bg-blue-50 text-blue-700";
  }

  if (tipo === "CONTROL") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-emerald-50 text-emerald-700";
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

export default function BibliotecaActividadesPage() {
  const [
    actividades,
    setActividades,
  ] = useState<ActividadBase[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState<FiltroEstado>("TODAS");

  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false);

  const [
    editandoId,
    setEditandoId,
  ] = useState<string | null>(null);

  const [
    form,
    setForm,
  ] = useState<FormActividad>(
    FORM_VACIO
  );

  const [
    formInicial,
    setFormInicial,
  ] = useState<FormActividad>(
    FORM_VACIO
  );

  const [
    procesando,
    setProcesando,
  ] = useState(false);

  const [
    confirmarSalir,
    setConfirmarSalir,
  ] = useState(false);

  const [
    actividadEliminar,
    setActividadEliminar,
  ] =
    useState<ActividadBase | null>(
      null
    );

  async function cargar() {
    setCargando(true);

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

  useEffect(() => {
    void cargar();
  }, []);

  const resumen = useMemo(() => {
    const activas =
      actividades.filter(
        (actividad) =>
          actividad.activo
      ).length;

    return {
      total:
        actividades.length,
      activas,
      inactivas:
        actividades.length -
        activas,
    };
  }, [actividades]);

  const actividadesFiltradas =
    useMemo(() => {
      const termino =
        busqueda
          .trim()
          .toLocaleLowerCase(
            "es"
          );

      return actividades.filter(
        (actividad) => {
          if (
            filtroEstado ===
              "ACTIVAS" &&
            !actividad.activo
          ) {
            return false;
          }

          if (
            filtroEstado ===
              "INACTIVAS" &&
            actividad.activo
          ) {
            return false;
          }

          if (!termino) {
            return true;
          }

          const texto = [
            actividad.titulo,
            actividad.descripcion ||
              "",
            actividad.momento ||
              "",
            actividad.hora ||
              "",
            nombreTipo(
              actividad.tipo
            ),
          ]
            .join(" ")
            .toLocaleLowerCase(
              "es"
            );

          return texto.includes(
            termino
          );
        }
      );
    }, [
      actividades,
      busqueda,
      filtroEstado,
    ]);

  function hayCambiosSinGuardar() {
    return (
      JSON.stringify(form) !==
      JSON.stringify(formInicial)
    );
  }

  function abrirNueva() {
    setEditandoId(null);
    setForm({
      ...FORM_VACIO,
    });
    setFormInicial({
      ...FORM_VACIO,
    });
    setModalAbierto(true);
  }

  function abrirEditar(
    actividad: ActividadBase
  ) {
    const datos: FormActividad = {
      tipo:
        actividad.tipo,

      recordatorio:
        actividad.recordatorio,

      titulo:
        actividad.titulo,

      descripcion:
        actividad.descripcion ||
        "",

      momento:
        actividad.momento ||
        "",

      hora:
        actividad.hora ||
        "",

      activo:
        actividad.activo,
    };

    setEditandoId(
      actividad.id
    );

    setForm(datos);
    setFormInicial(datos);
    setModalAbierto(true);
  }

  function pedirCerrarModal() {
    if (procesando) {
      return;
    }

    if (
      hayCambiosSinGuardar()
    ) {
      setConfirmarSalir(
        true
      );

      return;
    }

    setModalAbierto(false);
  }

  function cerrarSinGuardar() {
    setConfirmarSalir(false);
    setModalAbierto(false);
    setEditandoId(null);

    setForm({
      ...FORM_VACIO,
    });

    setFormInicial({
      ...FORM_VACIO,
    });
  }

  async function guardar(
    e: FormEvent
  ) {
    e.preventDefault();

    if (procesando) {
      return;
    }

    const titulo =
      form.titulo.trim();

    if (!titulo) {
      toast.error(
        "El nombre de la actividad es obligatorio."
      );

      return;
    }

    if (
      form.recordatorio !==
        "NINGUNO" &&
      !form.hora
    ) {
      toast.error(
        "Define una hora para utilizar el recordatorio."
      );

      return;
    }

    setProcesando(true);

    const toastId =
      toast.loading(
        editandoId
          ? "Guardando cambios..."
          : "Creando actividad..."
      );

    try {
      const res = await fetch(
        editandoId
          ? `/api/admin/seguimiento/biblioteca/${editandoId}`
          : "/api/admin/seguimiento/biblioteca",
        {
          method:
            editandoId
              ? "PUT"
              : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              tipo:
                form.tipo,

              recordatorio:
                form.recordatorio,

              titulo,

              descripcion:
                form.descripcion
                  .trim() ||
                null,

              momento:
                form.momento
                  .trim() ||
                null,

              hora:
                form.hora
                  .trim() ||
                null,

              activo:
                form.activo,
            }),
        }
      );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          editandoId
            ? "No se pudo actualizar la actividad."
            : "No se pudo crear la actividad.",
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
        editandoId
          ? "Actividad actualizada."
          : "Actividad agregada a la biblioteca.",
        {
          id: toastId,
        }
      );

      setModalAbierto(false);
      setEditandoId(null);

      setForm({
        ...FORM_VACIO,
      });

      setFormInicial({
        ...FORM_VACIO,
      });

      await cargar();
    } catch {
      toast.error(
        "No se pudo conectar con el servidor.",
        {
          id: toastId,
        }
      );
    } finally {
      setProcesando(false);
    }
  }

  async function cambiarEstado(
    actividad: ActividadBase
  ) {
    if (procesando) {
      return;
    }

    const nuevoEstado =
      !actividad.activo;

    setProcesando(true);

    const toastId =
      toast.loading(
        nuevoEstado
          ? "Activando actividad..."
          : "Desactivando actividad..."
      );

    try {
      const res = await fetch(
        `/api/admin/seguimiento/biblioteca/${actividad.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              tipo:
                actividad.tipo,

              recordatorio:
                actividad.recordatorio,

              titulo:
                actividad.titulo,

              descripcion:
                actividad.descripcion,

              momento:
                actividad.momento,

              hora:
                actividad.hora,

              activo:
                nuevoEstado,
            }),
        }
      );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          "No se pudo cambiar el estado.",
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
        nuevoEstado
          ? "Actividad activada."
          : "Actividad desactivada.",
        {
          id: toastId,
        }
      );

      await cargar();
    } catch {
      toast.error(
        "No se pudo conectar con el servidor.",
        {
          id: toastId,
        }
      );
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarEliminar() {
    if (
      !actividadEliminar ||
      procesando
    ) {
      return;
    }

    setProcesando(true);

    const toastId =
      toast.loading(
        "Eliminando actividad..."
      );

    try {
      const res = await fetch(
        `/api/admin/seguimiento/biblioteca/${actividadEliminar.id}`,
        {
          method:
            "DELETE",
        }
      );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          "No se pudo eliminar la actividad.",
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
        "Actividad eliminada de la biblioteca.",
        {
          id: toastId,
        }
      );

      setActividadEliminar(
        null
      );

      await cargar();
    } catch {
      toast.error(
        "No se pudo conectar con el servidor.",
        {
          id: toastId,
        }
      );
    } finally {
      setProcesando(false);
    }
  }

  return (
    <>
      <div className="space-y-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Biblioteca de actividades
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
              Guarda las actividades frecuentes una sola vez para reutilizarlas después en distintas plantillas de seguimiento.
            </p>
          </div>

          <button
            type="button"
            onClick={
              abrirNueva
            }
            className="admin-btn-primary shrink-0"
          >
            + Nueva actividad
          </button>

        </div>


        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

          <div className="admin-card p-4">
            <p className="text-xs text-gray-500">
              Total
            </p>

            <p className="mt-1 text-xl font-semibold text-gray-900">
              {resumen.total}
            </p>
          </div>

          <div className="admin-card p-4">
            <p className="text-xs text-gray-500">
              Activas
            </p>

            <p className="mt-1 text-xl font-semibold text-emerald-700">
              {resumen.activas}
            </p>
          </div>

          <div className="admin-card col-span-2 p-4 sm:col-span-1">
            <p className="text-xs text-gray-500">
              Inactivas
            </p>

            <p className="mt-1 text-xl font-semibold text-gray-600">
              {resumen.inactivas}
            </p>
          </div>

        </div>


        <div className="admin-card p-4">

          <div className="grid gap-3 md:grid-cols-[1fr_190px]">

            <div>
              <label className="admin-label">
                Buscar actividad
              </label>

              <input
                type="search"
                value={
                  busqueda
                }
                onChange={(e) =>
                  setBusqueda(
                    e.target
                      .value
                  )
                }
                className="admin-input"
                placeholder="Nombre, momento, hora..."
              />
            </div>

            <div>
              <label className="admin-label">
                Estado
              </label>

              <select
                value={
                  filtroEstado
                }
                onChange={(e) =>
                  setFiltroEstado(
                    e.target
                      .value as FiltroEstado
                  )
                }
                className="admin-input"
              >
                <option value="TODAS">
                  Todas
                </option>

                <option value="ACTIVAS">
                  Activas
                </option>

                <option value="INACTIVAS">
                  Inactivas
                </option>
              </select>
            </div>

          </div>

        </div>


        {cargando ? (

          <div className="admin-card p-8 text-center">
            <p className="text-sm text-gray-500">
              Cargando biblioteca...
            </p>
          </div>

        ) : actividades.length === 0 ? (

          <div className="admin-card p-8 text-center">

            <p className="font-semibold text-gray-900">
              La biblioteca está vacía
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Crea las actividades frecuentes una sola vez y luego podrás reutilizarlas en tus plantillas.
            </p>

            <button
              type="button"
              onClick={
                abrirNueva
              }
              className="admin-btn-primary mt-4"
            >
              Crear primera actividad
            </button>

          </div>

        ) : actividadesFiltradas.length === 0 ? (

          <div className="admin-card p-8 text-center">

            <p className="font-semibold text-gray-900">
              No encontramos actividades
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Prueba con otra búsqueda o cambia el filtro.
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {actividadesFiltradas.map(
              (actividad) => {
                const recordatorio =
                  textoRecordatorio(
                    actividad.recordatorio
                  );

                return (
                  <article
                    key={
                      actividad.id
                    }
                    className={`admin-card p-4 ${
                      actividad.activo
                        ? ""
                        : "opacity-60"
                    }`}
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <span
                            className={`rounded-lg px-2 py-1 text-xs font-semibold ${claseTipo(
                              actividad.tipo
                            )}`}
                          >
                            {nombreTipo(
                              actividad.tipo
                            )}
                          </span>

                          {actividad.hora && (
                            <span className="rounded-lg bg-[#F8F6FF] px-2 py-1 text-xs font-semibold text-brand-pink">
                              {actividad.hora}
                            </span>
                          )}

                          {actividad.momento && (
                            <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                              {actividad.momento}
                            </span>
                          )}

                          {recordatorio && (
                            <span className="rounded-lg bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
                              🔔 {recordatorio}
                            </span>
                          )}

                          {!actividad.activo && (
                            <span className="rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
                              INACTIVA
                            </span>
                          )}

                        </div>


                        <h2 className="mt-3 font-semibold text-gray-900">
                          {actividad.titulo}
                        </h2>


                        {actividad.descripcion && (
                          <p className="mt-1 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-gray-600">
                            {actividad.descripcion}
                          </p>
                        )}

                      </div>


                      <div className="flex shrink-0 flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            abrirEditar(
                              actividad
                            )
                          }
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          disabled={
                            procesando
                          }
                          onClick={() =>
                            void cambiarEstado(
                              actividad
                            )
                          }
                          className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                        >
                          {actividad.activo
                            ? "Desactivar"
                            : "Activar"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            procesando
                          }
                          onClick={() =>
                            setActividadEliminar(
                              actividad
                            )
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          Eliminar
                        </button>

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>

        )}

      </div>


      {modalAbierto && (

        <Modal
          title={
            editandoId
              ? "Editar actividad de biblioteca"
              : "Nueva actividad de biblioteca"
          }
          onClose={
            pedirCerrarModal
          }
        >

          <form
            onSubmit={
              guardar
            }
            className="space-y-4"
          >

            <div>
              <label className="admin-label">
                Nombre de la actividad *
              </label>

              <input
                type="text"
                value={
                  form.titulo
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    titulo:
                      e.target
                        .value,
                  })
                }
                className="admin-input"
                placeholder="Ej. Zeolita en ayunas"
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
                rows={4}
                maxLength={1500}
                placeholder="Instrucción general que luego podrá reutilizarse..."
              />
            </div>


            <div className="grid gap-3 sm:grid-cols-2">

              <div>
                <label className="admin-label">
                  Tipo
                </label>

                <select
                  value={
                    form.tipo
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tipo:
                        e.target
                          .value as TipoActividad,
                    })
                  }
                  className="admin-input"
                >
                  <option value="TAREA">
                    Tarea
                  </option>

                  <option value="INFORMACION">
                    Información
                  </option>

                  <option value="CONTROL">
                    Control
                  </option>
                </select>

                <p className="mt-1 text-xs text-gray-500">
                  {form.tipo ===
                  "TAREA"
                    ? "El cliente podrá marcarla como realizada."
                    : form.tipo ===
                      "INFORMACION"
                    ? "Solo se mostrará como información."
                    : "Se reserva para registros o controles."}
                </p>
              </div>


              <div>
                <label className="admin-label">
                  Momento sugerido
                </label>

                <select
                  value={
                    form.momento
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      momento:
                        e.target
                          .value,
                    })
                  }
                  className="admin-input"
                >
                  <option value="">
                    Sin especificar
                  </option>

                  {MOMENTOS.map(
                    (momento) => (
                      <option
                        key={
                          momento
                        }
                        value={
                          momento
                        }
                      >
                        {momento}
                      </option>
                    )
                  )}
                </select>
              </div>

            </div>


            <div className="grid gap-3 sm:grid-cols-2">

              <div>
                <label className="admin-label">
                  Hora sugerida
                </label>

                <input
                  type="time"
                  value={
                    form.hora
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      hora:
                        e.target
                          .value,
                    })
                  }
                  className="admin-input"
                />
              </div>


              <div>
                <label className="admin-label">
                  Recordatorio sugerido
                </label>

                <select
                  value={
                    form.recordatorio
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      recordatorio:
                        e.target
                          .value as RecordatorioActividad,
                    })
                  }
                  className="admin-input"
                >
                  <option value="NINGUNO">
                    Sin recordatorio
                  </option>

                  <option value="A_LA_HORA">
                    A la hora indicada
                  </option>

                  <option value="MIN_15_ANTES">
                    15 minutos antes
                  </option>

                  <option value="MIN_30_ANTES">
                    30 minutos antes
                  </option>

                  <option value="MIN_60_ANTES">
                    1 hora antes
                  </option>
                </select>

                {form.recordatorio !==
                  "NINGUNO" &&
                  !form.hora && (
                    <p className="mt-1 text-xs text-amber-600">
                      Define una hora para utilizar este recordatorio.
                    </p>
                  )}
              </div>

            </div>


            {editandoId && (

              <label className="flex items-center gap-2 text-sm text-gray-700">

                <input
                  type="checkbox"
                  checked={
                    form.activo
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      activo:
                        e.target
                          .checked,
                    })
                  }
                />

                Actividad disponible para reutilizar

              </label>

            )}


            <div className="flex justify-end gap-2 pt-2">

              <button
                type="button"
                disabled={
                  procesando
                }
                onClick={
                  pedirCerrarModal
                }
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  procesando
                }
                className="admin-btn-primary disabled:opacity-60"
              >
                {procesando
                  ? "Guardando..."
                  : editandoId
                  ? "Guardar cambios"
                  : "Crear actividad"}
              </button>

            </div>

          </form>

        </Modal>

      )}


      {confirmarSalir && (

        <ConfirmDialog
          title="Cambios sin guardar"
          message="Tienes cambios sin guardar. Si sales ahora se perderán."
          confirmLabel="Descartar cambios"
          onConfirm={
            cerrarSinGuardar
          }
          onCancel={() =>
            setConfirmarSalir(
              false
            )
          }
        />

      )}


      {actividadEliminar && (

        <ConfirmDialog
          title="Eliminar actividad"
          message={`¿Deseas eliminar "${actividadEliminar.titulo}" de la biblioteca? Las actividades ya copiadas a plantillas o clientes no se modificarán.`}
          confirmLabel="Eliminar"
          onConfirm={() =>
            void confirmarEliminar()
          }
          onCancel={() =>
            setActividadEliminar(
              null
            )
          }
        />

      )}

    </>
  );
}
