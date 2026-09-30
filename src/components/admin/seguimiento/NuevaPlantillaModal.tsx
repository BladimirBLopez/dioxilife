"use client";

import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { toast } from "sonner";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";

type EstadoPlantilla =
  | "BORRADOR"
  | "ACTIVO"
  | "INACTIVO";

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
};

type ActividadTemporal = {
  localId: string;
  actividadBaseId: string | null;
  tipo: TipoActividad;
  recordatorio: RecordatorioActividad;
  titulo: string;
  descripcion: string;
  momento: string;
  hora: string;
  diaInicio: number;
  diaFin: number | null;
  orden: number;
};

type FormActividad = {
  tipo: TipoActividad;
  recordatorio: RecordatorioActividad;
  titulo: string;
  descripcion: string;
  momento: string;
  hora: string;
  diaInicio: string;
  diaFin: string;
};

type Props = {
  onClose: () => void;
  onCreada: () => void | Promise<void>;
};

const FORM_PLANTILLA_INICIAL = {
  nombre: "",
  descripcion: "",
  duracionDias: "30",
  estado: "ACTIVO" as EstadoPlantilla,
};

const MOMENTOS = [
  "Ayunas",
  "Desayuno",
  "Mañana",
  "Media mañana",
  "Almuerzo",
  "Mediodía",
  "Tarde",
  "Cena",
  "Noche",
  "Antes de dormir",
  "Adicional",
];

function nuevoIdLocal() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

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
  if (recordatorio === "A_LA_HORA") {
    return "A la hora";
  }

  if (recordatorio === "MIN_15_ANTES") {
    return "15 min antes";
  }

  if (recordatorio === "MIN_30_ANTES") {
    return "30 min antes";
  }

  if (recordatorio === "MIN_60_ANTES") {
    return "1 hora antes";
  }

  return null;
}

function formActividadVacio(
  duracionDias: number
): FormActividad {
  return {
    tipo: "TAREA",
    recordatorio: "NINGUNO",
    titulo: "",
    descripcion: "",
    momento: "",
    hora: "",
    diaInicio: "1",
    diaFin: String(duracionDias),
  };
}

export default function NuevaPlantillaModal({
  onClose,
  onCreada,
}: Props) {
  const [
    form,
    setForm,
  ] = useState(
    FORM_PLANTILLA_INICIAL
  );

  const [
    actividades,
    setActividades,
  ] =
    useState<ActividadTemporal[]>(
      []
    );

  const [
    biblioteca,
    setBiblioteca,
  ] = useState<ActividadBase[]>(
    []
  );

  const [
    bibliotecaCargada,
    setBibliotecaCargada,
  ] = useState(false);

  const [
    cargandoBiblioteca,
    setCargandoBiblioteca,
  ] = useState(false);

  const [
    vista,
    setVista,
  ] = useState<
    | null
    | "BIBLIOTECA"
    | "ACTIVIDAD"
  >(null);

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    seleccionadas,
    setSeleccionadas,
  ] = useState<string[]>([]);

  const [
    actividadEditandoId,
    setActividadEditandoId,
  ] =
    useState<string | null>(null);

  const [
    formActividad,
    setFormActividad,
  ] = useState<FormActividad>(
    formActividadVacio(30)
  );

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    confirmarSalir,
    setConfirmarSalir,
  ] = useState(false);

  const ultimaDuracionValida =
    useRef(30);

  const actividadesOrdenadas =
    useMemo(() => {
      return [
        ...actividades,
      ].sort((a, b) => {
        const horaA =
          a.hora || "99:99";

        const horaB =
          b.hora || "99:99";

        const porHora =
          horaA.localeCompare(
            horaB
          );

        if (porHora !== 0) {
          return porHora;
        }

        return (
          a.orden -
          b.orden
        );
      });
    }, [actividades]);

  const idsBaseYaUsados =
    useMemo(
      () =>
        new Set(
          actividades
            .map(
              (actividad) =>
                actividad.actividadBaseId
            )
            .filter(
              (
                id
              ): id is string =>
                Boolean(id)
            )
        ),
      [actividades]
    );

  const bibliotecaVisible =
    useMemo(() => {
      const termino =
        busqueda
          .trim()
          .toLocaleLowerCase(
            "es"
          );

      return biblioteca.filter(
        (actividad) => {
          if (
            !actividad.activo ||
            idsBaseYaUsados.has(
              actividad.id
            )
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
      biblioteca,
      busqueda,
      idsBaseYaUsados,
    ]);

  function hayCambios() {
    return (
      JSON.stringify(form) !==
        JSON.stringify(
          FORM_PLANTILLA_INICIAL
        ) ||
      actividades.length > 0
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

  async function cargarBiblioteca() {
    if (bibliotecaCargada) {
      return;
    }

    setCargandoBiblioteca(
      true
    );

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

      setBiblioteca(
        Array.isArray(data)
          ? data
          : []
      );

      setBibliotecaCargada(
        true
      );
    } catch {
      toast.error(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setCargandoBiblioteca(
        false
      );
    }
  }

  function abrirBiblioteca() {
    setVista("BIBLIOTECA");
    setBusqueda("");
    setSeleccionadas([]);
    void cargarBiblioteca();
  }

  function alternarSeleccion(
    id: string
  ) {
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
    const ids =
      bibliotecaVisible.map(
        (actividad) =>
          actividad.id
      );

    const todos =
      ids.length > 0 &&
      ids.every((id) =>
        seleccionadas.includes(
          id
        )
      );

    if (todos) {
      setSeleccionadas(
        (actual) =>
          actual.filter(
            (id) =>
              !ids.includes(id)
          )
      );
      return;
    }

    setSeleccionadas(
      (actual) =>
        Array.from(
          new Set([
            ...actual,
            ...ids,
          ])
        )
    );
  }

  function agregarDesdeBiblioteca() {
    if (
      seleccionadas.length === 0
    ) {
      toast.error(
        "Selecciona al menos una actividad."
      );
      return;
    }

    const duracion =
      ultimaDuracionValida.current;

    const nuevas =
      seleccionadas
        .map((id) =>
          biblioteca.find(
            (actividad) =>
              actividad.id === id
          )
        )
        .filter(
          (
            actividad
          ): actividad is ActividadBase =>
            Boolean(actividad)
        )
        .map(
          (
            actividad,
            indice
          ): ActividadTemporal => ({
            localId:
              nuevoIdLocal(),

            actividadBaseId:
              actividad.id,

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

            diaInicio:
              1,

            diaFin:
              duracion,

            orden:
              actividades.length +
              indice +
              1,
          })
        );

    setActividades(
      (actual) => [
        ...actual,
        ...nuevas,
      ]
    );

    setSeleccionadas([]);
    setVista(null);

    toast.success(
      nuevas.length === 1
        ? "1 actividad agregada."
        : `${nuevas.length} actividades agregadas.`
    );
  }

  function abrirNuevaActividad() {
    const duracion =
      ultimaDuracionValida.current;

    setActividadEditandoId(
      null
    );

    setFormActividad(
      formActividadVacio(
        duracion
      )
    );

    setVista("ACTIVIDAD");
  }

  function abrirEditarActividad(
    actividad: ActividadTemporal
  ) {
    setActividadEditandoId(
      actividad.localId
    );

    setFormActividad({
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

      diaInicio:
        String(
          actividad.diaInicio
        ),

      diaFin:
        actividad.diaFin ===
        null
          ? ""
          : String(
              actividad.diaFin
            ),
    });

    setVista("ACTIVIDAD");
  }

  function guardarActividadTemporal(
    e: FormEvent
  ) {
    e.preventDefault();

    const titulo =
      formActividad.titulo.trim();

    if (!titulo) {
      toast.error(
        "El título de la actividad es obligatorio."
      );
      return;
    }

    if (
      formActividad.recordatorio !==
        "NINGUNO" &&
      !formActividad.hora
    ) {
      toast.error(
        "Define una hora para utilizar el recordatorio."
      );
      return;
    }

    const duracion =
      ultimaDuracionValida.current;

    const diaInicio =
      Number(
        formActividad.diaInicio
      );

    const diaFin =
      formActividad.diaFin
        ? Number(
            formActividad.diaFin
          )
        : null;

    if (
      !Number.isInteger(
        diaInicio
      ) ||
      diaInicio < 1 ||
      diaInicio > duracion
    ) {
      toast.error(
        `El día inicial debe estar entre 1 y ${duracion}.`
      );
      return;
    }

    if (
      diaFin !== null &&
      (
        !Number.isInteger(
          diaFin
        ) ||
        diaFin <
          diaInicio ||
        diaFin > duracion
      )
    ) {
      toast.error(
        `El día final debe estar entre ${diaInicio} y ${duracion}.`
      );
      return;
    }

    if (
      actividadEditandoId
    ) {
      setActividades(
        (actual) =>
          actual.map(
            (actividad) =>
              actividad.localId ===
              actividadEditandoId
                ? {
                    ...actividad,

                    tipo:
                      formActividad.tipo,

                    recordatorio:
                      formActividad.recordatorio,

                    titulo,

                    descripcion:
                      formActividad.descripcion.trim(),

                    momento:
                      formActividad.momento,

                    hora:
                      formActividad.hora,

                    diaInicio,

                    diaFin,
                  }
                : actividad
          )
      );

      toast.success(
        "Actividad actualizada."
      );
    } else {
      const nuevoOrden =
        actividades.reduce(
          (
            maximo,
            actividad
          ) =>
            Math.max(
              maximo,
              actividad.orden
            ),
          0
        ) + 1;

      setActividades(
        (actual) => [
          ...actual,

          {
            localId:
              nuevoIdLocal(),

            actividadBaseId:
              null,

            tipo:
              formActividad.tipo,

            recordatorio:
              formActividad.recordatorio,

            titulo,

            descripcion:
              formActividad.descripcion.trim(),

            momento:
              formActividad.momento,

            hora:
              formActividad.hora,

            diaInicio,

            diaFin,

            orden:
              nuevoOrden,
          },
        ]
      );

      toast.success(
        "Actividad agregada."
      );
    }

    setActividadEditandoId(
      null
    );
    setVista(null);
  }

  function quitarActividad(
    localId: string
  ) {
    setActividades(
      (actual) =>
        actual.filter(
          (actividad) =>
            actividad.localId !==
            localId
        )
    );
  }

  function cambiarDuracion(
    valor: string
  ) {
    const anterior =
      ultimaDuracionValida.current;

    setForm(
      (actual) => ({
        ...actual,
        duracionDias:
          valor,
      })
    );

    const nueva =
      Number(valor);

    if (
      !Number.isInteger(nueva) ||
      nueva < 1 ||
      nueva > 365
    ) {
      return;
    }

    setActividades(
      (actual) =>
        actual.map(
          (actividad) => {
            let diaInicio =
              actividad.diaInicio;

            let diaFin =
              actividad.diaFin;

            if (
              diaInicio > nueva
            ) {
              diaInicio =
                nueva;
            }

            if (
              diaFin !== null &&
              (
                diaFin ===
                  anterior ||
                diaFin > nueva
              )
            ) {
              diaFin = nueva;
            }

            if (
              diaFin !== null &&
              diaFin <
                diaInicio
            ) {
              diaFin =
                diaInicio;
            }

            return {
              ...actividad,
              diaInicio,
              diaFin,
            };
          }
        )
    );

    ultimaDuracionValida.current =
      nueva;
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

    const duracion =
      Number(
        form.duracionDias
      );

    if (
      !Number.isInteger(
        duracion
      ) ||
      duracion < 1 ||
      duracion > 365
    ) {
      toast.error(
        "La duración debe estar entre 1 y 365 días."
      );
      return;
    }

    if (
      form.estado ===
        "ACTIVO" &&
      actividades.length === 0
    ) {
      toast.error(
        "Agrega al menos una actividad antes de activar la plantilla."
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

              duracionDias:
                duracion,

              estado:
                form.estado,

              actividades:
                actividades.map(
                  (
                    actividad
                  ) => ({
                    tipo:
                      actividad.tipo,

                    recordatorio:
                      actividad.recordatorio,

                    titulo:
                      actividad.titulo,

                    descripcion:
                      actividad.descripcion ||
                      null,

                    momento:
                      actividad.momento ||
                      null,

                    hora:
                      actividad.hora ||
                      null,

                    diaInicio:
                      actividad.diaInicio,

                    diaFin:
                      actividad.diaFin,

                    orden:
                      actividad.orden,
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
        actividades.length === 0
          ? "Plantilla creada."
          : `Plantilla creada con ${actividades.length} actividad${
              actividades.length ===
              1
                ? ""
                : "es"
            }.`,
        {
          id: toastId,
        }
      );

      await onCreada();
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
              <p className="font-semibold text-[#1F1B24]">
                Datos de la plantilla
              </p>

              <p className="mt-1 text-xs leading-5 text-[#8A8790]">
                Define la información general y luego agrega las actividades que formarán parte del seguimiento.
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
                  placeholder="Ej. Prostatitis"
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
                        e.target.checked
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
                    Déjalo marcado si la plantilla ya está lista para usarse. Desmárcalo si todavía quieres seguir preparándola.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[#1F1B24]">
                  Actividades
                </p>

                <p className="mt-1 text-xs text-[#8A8790]">
                  {actividades.length ===
                  0
                    ? "Aún no agregaste actividades."
                    : `${actividades.length} actividad${
                        actividades.length ===
                        1
                          ? ""
                          : "es"
                      } agregada${
                        actividades.length ===
                        1
                          ? ""
                          : "s"
                      }.`}
                </p>
              </div>

              <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#F8F6FF] px-3 text-sm font-bold text-brand-pink">
                {
                  actividades.length
                }
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={
                  abrirBiblioteca
                }
                className="rounded-xl border border-brand-pink bg-brand-pink/5 px-4 py-3 text-sm font-semibold text-brand-pink transition hover:bg-brand-pink/10"
              >
                + Desde biblioteca
              </button>

              <button
                type="button"
                onClick={
                  abrirNuevaActividad
                }
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                + Crear actividad
              </button>
            </div>

            {vista ===
              "BIBLIOTECA" && (
              <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Agregar desde biblioteca
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Marca todas las actividades que quieras reutilizar.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setVista(
                        null
                      );
                      setSeleccionadas(
                        []
                      );
                    }}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                  >
                    Cerrar
                  </button>
                </div>

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
                  className="admin-input mt-3"
                  placeholder="Buscar actividad..."
                />

                {cargandoBiblioteca ? (
                  <p className="py-6 text-center text-sm text-gray-500">
                    Cargando biblioteca...
                  </p>
                ) : bibliotecaVisible.length ===
                  0 ? (
                  <div className="py-6 text-center">
                    <p className="text-sm font-medium text-gray-700">
                      No hay actividades disponibles.
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Puede que ya las hayas agregado o que la biblioteca esté vacía.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={
                          seleccionarVisibles
                        }
                        className="text-xs font-semibold text-brand-blue hover:underline"
                      >
                        Seleccionar visibles
                      </button>

                      <span className="text-xs text-gray-500">
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

                    <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                      {bibliotecaVisible.map(
                        (
                          actividad
                        ) => {
                          const seleccionada =
                            seleccionadas.includes(
                              actividad.id
                            );

                          return (
                            <label
                              key={
                                actividad.id
                              }
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3 ${
                                seleccionada
                                  ? "border-brand-pink ring-1 ring-brand-pink/20"
                                  : "border-gray-200"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  seleccionada
                                }
                                onChange={() =>
                                  alternarSeleccion(
                                    actividad.id
                                  )
                                }
                                className="mt-1 h-4 w-4 accent-pink-600"
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap gap-1.5">
                                  <span
                                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${claseTipo(
                                      actividad.tipo
                                    )}`}
                                  >
                                    {nombreTipo(
                                      actividad.tipo
                                    )}
                                  </span>

                                  {actividad.hora && (
                                    <span className="rounded-md bg-[#F8F6FF] px-2 py-0.5 text-[10px] font-semibold text-brand-pink">
                                      {
                                        actividad.hora
                                      }
                                    </span>
                                  )}

                                  {actividad.momento && (
                                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                                      {
                                        actividad.momento
                                      }
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1.5 text-sm font-semibold text-gray-900">
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
                  </>
                )}

                <button
                  type="button"
                  disabled={
                    seleccionadas.length ===
                    0
                  }
                  onClick={
                    agregarDesdeBiblioteca
                  }
                  className="admin-btn-primary mt-4 w-full disabled:opacity-50"
                >
                  {seleccionadas.length ===
                  1
                    ? "Agregar 1 actividad"
                    : `Agregar ${seleccionadas.length} actividades`}
                </button>
              </div>
            )}

            {vista ===
              "ACTIVIDAD" && (
              <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {actividadEditandoId
                        ? "Editar actividad"
                        : "Nueva actividad"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Esta actividad se agregará únicamente a esta plantilla.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setVista(
                        null
                      );
                      setActividadEditandoId(
                        null
                      );
                    }}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="admin-label">
                      Título
                    </label>

                    <input
                      type="text"
                      value={
                        formActividad.titulo
                      }
                      onChange={(e) =>
                        setFormActividad({
                          ...formActividad,
                          titulo:
                            e.target
                              .value,
                        })
                      }
                      className="admin-input"
                      placeholder="Ej. Actividad de la mañana"
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label className="admin-label">
                      Descripción
                    </label>

                    <textarea
                      value={
                        formActividad.descripcion
                      }
                      onChange={(e) =>
                        setFormActividad({
                          ...formActividad,
                          descripcion:
                            e.target
                              .value,
                        })
                      }
                      className="admin-input"
                      rows={3}
                      maxLength={1500}
                      placeholder="Información que verá el cliente..."
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="admin-label">
                        Tipo
                      </label>

                      <select
                        value={
                          formActividad.tipo
                        }
                        onChange={(e) =>
                          setFormActividad({
                            ...formActividad,
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
                    </div>

                    <div>
                      <label className="admin-label">
                        Momento
                      </label>

                      <select
                        value={
                          formActividad.momento
                        }
                        onChange={(e) =>
                          setFormActividad({
                            ...formActividad,
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
                          (
                            momento
                          ) => (
                            <option
                              key={
                                momento
                              }
                              value={
                                momento
                              }
                            >
                              {
                                momento
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="admin-label">
                        Hora
                      </label>

                      <input
                        type="time"
                        value={
                          formActividad.hora
                        }
                        onChange={(e) =>
                          setFormActividad({
                            ...formActividad,
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
                        Recordatorio
                      </label>

                      <select
                        value={
                          formActividad.recordatorio
                        }
                        onChange={(e) =>
                          setFormActividad({
                            ...formActividad,
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
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="admin-label">
                        Día inicial
                      </label>

                      <input
                        type="number"
                        min={1}
                        max={
                          ultimaDuracionValida.current
                        }
                        value={
                          formActividad.diaInicio
                        }
                        onChange={(e) =>
                          setFormActividad({
                            ...formActividad,
                            diaInicio:
                              e.target
                                .value,
                          })
                        }
                        className="admin-input"
                      />
                    </div>

                    <div>
                      <label className="admin-label">
                        Día final
                      </label>

                      <input
                        type="number"
                        min={1}
                        max={
                          ultimaDuracionValida.current
                        }
                        value={
                          formActividad.diaFin
                        }
                        onChange={(e) =>
                          setFormActividad({
                            ...formActividad,
                            diaFin:
                              e.target
                                .value,
                          })
                        }
                        className="admin-input"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>

                  {formActividad.recordatorio !==
                    "NINGUNO" &&
                    !formActividad.hora && (
                      <p className="text-xs text-amber-600">
                        Define una hora para utilizar el recordatorio.
                      </p>
                    )}

                  <button
                    type="button"
                    onClick={
                      guardarActividadTemporal
                    }
                    className="admin-btn-primary w-full"
                  >
                    {actividadEditandoId
                      ? "Guardar cambios"
                      : "Agregar actividad"}
                  </button>
                </div>
              </div>
            )}

            {actividadesOrdenadas.length >
              0 && (
              <div className="mt-4 space-y-2">
                {actividadesOrdenadas.map(
                  (
                    actividad
                  ) => {
                    const recordatorio =
                      textoRecordatorio(
                        actividad.recordatorio
                      );

                    return (
                      <article
                        key={
                          actividad.localId
                        }
                        className="rounded-xl border border-gray-200 bg-white p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap gap-1.5">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${claseTipo(
                                  actividad.tipo
                                )}`}
                              >
                                {nombreTipo(
                                  actividad.tipo
                                )}
                              </span>

                              {actividad.hora && (
                                <span className="rounded-md bg-[#F8F6FF] px-2 py-0.5 text-[10px] font-bold text-brand-pink">
                                  {
                                    actividad.hora
                                  }
                                </span>
                              )}

                              {actividad.momento && (
                                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                                  {
                                    actividad.momento
                                  }
                                </span>
                              )}
                            </div>

                            <p className="mt-2 text-sm font-semibold text-gray-900">
                              {
                                actividad.titulo
                              }
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Día{" "}
                              {
                                actividad.diaInicio
                              }
                              {actividad.diaFin
                                ? ` al ${actividad.diaFin}`
                                : ""}
                              {recordatorio
                                ? ` · 🔔 ${recordatorio}`
                                : ""}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row">
                            <button
                              type="button"
                              onClick={() =>
                                abrirEditarActividad(
                                  actividad
                                )
                              }
                              className="px-2 py-1 text-xs font-semibold text-brand-blue hover:underline"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                quitarActividad(
                                  actividad.localId
                                )
                              }
                              className="px-2 py-1 text-xs font-semibold text-red-600 hover:underline"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
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
                : actividades.length ===
                  0
                ? "Crear plantilla"
                : `Crear plantilla con ${actividades.length} actividad${
                    actividades.length ===
                    1
                      ? ""
                      : "es"
                  }`}
            </button>
          </div>
        </form>
      </Modal>

      {confirmarSalir && (
        <ConfirmDialog
          title="Cambios sin guardar"
          message="La plantilla todavía no fue creada. Si sales ahora perderás los datos y las actividades agregadas."
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
