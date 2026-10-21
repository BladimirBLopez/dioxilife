"use client";

import { type ReactNode, useEffect, useState } from "react";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { useSortable, isSortable } from "@dnd-kit/react/sortable";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import NuevaPlantillaModal from "@/components/admin/seguimiento/NuevaPlantillaModal";

type Plan = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracionDias: number;
  estado: "BORRADOR" | "ACTIVO" | "INACTIVO";
  ordenVisual: number | null;
  _count: {
    actividades: number;
    seguimientos: number;
  };
};


function PlantillaArrastrable({
  id,
  index,
  children,
}: {
  id: string;
  index: number;
  children: ReactNode;
}) {
  const {
    ref,
    handleRef,
    isDragging,
  } = useSortable({
    id,
    index,
  });

  return (
    <div
      ref={ref}
      className={`min-w-0 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          ref={handleRef}
          aria-label="Arrastrar para reordenar plantilla"
          title="Mantén pulsado y arrastra para cambiar el orden"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 cursor-grab active:cursor-grabbing touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <span aria-hidden="true">⋮⋮</span>
          Arrastrar
        </button>
      </div>
      {children}
    </div>
  );
}

export default function PlanesSeguimientoPage() {
  const router = useRouter();

  const [planes, setPlanes] = useState<Plan[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoOrden, setGuardandoOrden] = useState(false);
  const [ordenSinGuardar, setOrdenSinGuardar] = useState(false);

  const [nuevaPlantillaAbierta, setNuevaPlantillaAbierta] = useState(false);

  const [borrarId, setBorrarId] = useState<string | null>(null);

  const [
    planDuplicando,
    setPlanDuplicando,
  ] = useState<Plan | null>(null);

  const [
    nombreDuplicado,
    setNombreDuplicado,
  ] = useState("");

  const [
    duplicando,
    setDuplicando,
  ] = useState(false);

  async function cargar() {
    setCargando(true);

    try {
      const resPlanes = await fetch(
        "/api/admin/seguimiento/planes",
        { cache: "no-store" }
      );

      if (!resPlanes.ok) {
        toast.error(
          "No se pudieron cargar las plantillas."
        );
        return;
      }

      const respuesta: unknown =
        await resPlanes.json();

      if (
        !Array.isArray(respuesta) ||
        !respuesta.every(
          (dato) =>
            dato !== null &&
            typeof dato === "object" &&
            typeof dato.id === "string" &&
            typeof dato.nombre === "string"
        )
      ) {
        toast.error(
          "La respuesta de plantillas no es válida."
        );
        return;
      }

      setPlanes(respuesta as Plan[]);
      setOrdenSinGuardar(false);
    } catch {
      toast.error(
        "No hay conexión para cargar las plantillas."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    if (!ordenSinGuardar) return;

    const advertir = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
      evento.returnValue = "";
    };

    window.addEventListener(
      "beforeunload",
      advertir
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        advertir
      );
    };
  }, [ordenSinGuardar]);


  function moverPlantilla(
    indice: number,
    direccion: -1 | 1
  ) {
    if (cargando || guardandoOrden) return;

    setPlanes((anteriores) => {
      const destino = indice + direccion;

      if (
        indice < 0 ||
        indice >= anteriores.length ||
        destino < 0 ||
        destino >= anteriores.length
      ) {
        return anteriores;
      }

      const copia = [...anteriores];

      [copia[indice], copia[destino]] = [
        copia[destino],
        copia[indice]
      ];

      return copia;
    });

    setOrdenSinGuardar(true);
  }


  function manejarFinArrastre(event: DragEndEvent) {
    if (
      event.canceled ||
      cargando ||
      guardandoOrden
    ) {
      return;
    }

    const { source } = event.operation;

    if (!isSortable(source)) {
      return;
    }

    const { initialIndex, index } = source;

    if (
      !Number.isInteger(initialIndex) ||
      !Number.isInteger(index) ||
      initialIndex === index ||
      initialIndex < 0 ||
      index < 0 ||
      initialIndex >= planes.length ||
      index >= planes.length
    ) {
      return;
    }

    setPlanes((anteriores) => {
      if (
        initialIndex >= anteriores.length ||
        index >= anteriores.length
      ) {
        return anteriores;
      }

      const siguientes = [...anteriores];

      const [movida] =
        siguientes.splice(initialIndex, 1);

      siguientes.splice(index, 0, movida);

      return siguientes;
    });

    setOrdenSinGuardar(true);
  }

  async function guardarOrden() {
    if (
      !ordenSinGuardar ||
      guardandoOrden ||
      cargando
    ) {
      return;
    }

    setGuardandoOrden(true);

    try {
      const respuesta = await fetch(
        "/api/admin/seguimiento/planes/reordenar",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ids: planes.map((plan) => plan.id)
          })
        }
      );

      const resultado = await respuesta
        .json()
        .catch(() => null);

      if (!respuesta.ok) {
        toast.error(
          resultado?.error ||
          "No se pudo guardar el orden."
        );
        return;
      }

      toast.success("Orden de plantillas guardado.");
      setOrdenSinGuardar(false);

      await cargar();
    } catch {
      toast.error(
        "No se pudo conectar para guardar el orden."
      );
    } finally {
      setGuardandoOrden(false);
    }
  }

  function confirmarDescarteOrden() {
    if (!ordenSinGuardar) return true;

    return window.confirm(
      "Hay cambios de orden sin guardar. " +
      "Si continúas, podrías perderlos. " +
      "¿Continuar sin guardar?"
    );
  }

  function abrirNuevo() {
    if (!confirmarDescarteOrden()) return;

    setNuevaPlantillaAbierta(true);
  }

  function abrirDuplicar(
    plan: Plan
  ) {
    if (!confirmarDescarteOrden()) return;

    setPlanDuplicando(
      plan
    );

    setNombreDuplicado(
      `${plan.nombre} - copia`
    );
  }

  function cerrarDuplicar() {
    if (duplicando) {
      return;
    }

    setPlanDuplicando(
      null
    );

    setNombreDuplicado(
      ""
    );
  }

  async function duplicarPlantilla() {
    if (
      !planDuplicando ||
      duplicando
    ) {
      return;
    }

    const nombre =
      nombreDuplicado.trim();

    if (!nombre) {
      toast.error(
        "Escribe el nombre de la nueva plantilla."
      );
      return;
    }

    setDuplicando(
      true
    );

    const toastId =
      toast.loading(
        "Copiando plantilla..."
      );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/planes/${planDuplicando.id}/duplicar`,
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
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(
            () => null
          );

      if (!res.ok) {
        toast.error(
          data?.error ||
            "No se pudo duplicar la plantilla.",
          {
            id:
              toastId,
          }
        );

        return;
      }

      toast.success(
        "Plantilla copiada. Ya puedes personalizarla.",
        {
          id:
            toastId,
        }
      );

      setPlanDuplicando(
        null
      );

      setNombreDuplicado(
        ""
      );

      await cargar();

      router.push(
        `/admin/seguimiento/planes/${data.id}/editar`
      );
    } catch {
      toast.error(
        "No se pudo conectar con el servidor.",
        {
          id:
            toastId,
        }
      );
    } finally {
      setDuplicando(
        false
      );
    }
  }

  async function confirmarBorrar() {
    if (!borrarId) return;
    if (!confirmarDescarteOrden()) return;

    const res = await fetch(
      `/api/admin/seguimiento/planes/${borrarId}`,
      {
        method: "DELETE",
      }
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(data?.error || "No se pudo borrar la plantilla");
      setBorrarId(null);
      return;
    }

    setBorrarId(null);
    await cargar();
  }

  function claseEstado(estado: Plan["estado"]) {
    if (estado === "ACTIVO") {
      return "bg-green-100 text-green-700";
    }

    if (estado === "INACTIVO") {
      return "bg-gray-100 text-gray-600";
    }

    return "bg-amber-100 text-amber-700";
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1F1B24]">
            Plantillas de seguimiento
          </h1>
            {planes.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void guardarOrden()}
                  disabled={
                    cargando ||
                    guardandoOrden ||
                    !ordenSinGuardar
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  {guardandoOrden
                    ? "Guardando..."
                    : "Guardar orden"}
                </button>

                <span
                  role="status"
                  className="text-xs font-medium text-gray-600"
                >
                  {ordenSinGuardar
                    ? "Tienes cambios de orden sin guardar"
                    : "Usa las flechas de cada plantilla para moverla"}
                </span>
              </div>
            )}


          <p className="mt-1 text-sm text-[#6B6870]">
            Crea plantillas reutilizables que luego podrás asignar y personalizar para cada cliente.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNuevo}
          className="admin-btn-primary shrink-0"
        >
          + Nueva plantilla
        </button>
      </div>

      {cargando ? (
        <p className="text-sm text-[#8A8790]">Cargando...</p>
      ) : planes.length === 0 ? (
        <div className="admin-card p-8 text-center">
          <p className="font-semibold text-[#1F1B24]">
            Aún no hay plantillas de seguimiento
          </p>

          <p className="mt-1 text-sm text-[#8A8790]">
            Crea la primera plantilla y luego configura sus actividades.
          </p>

          <button
            type="button"
            onClick={abrirNuevo}
            className="admin-btn-primary mt-4"
          >
            Crear primera plantilla
          </button>
        </div>
      ) : (
        <DragDropProvider onDragEnd={manejarFinArrastre}>
<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {planes.map((plan, indice) => (
            <PlantillaArrastrable
        key={plan.id}
        id={plan.id}
        index={indice}
      >
<article
              key={plan.id}
              className="admin-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-[#1F1B24]">
                    {plan.nombre}
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${claseEstado(
                      plan.estado
                    )}`}
                  >
                    {plan.estado}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
  <div className="flex flex-col gap-1">
    <button
      type="button"
      onClick={() => moverPlantilla(indice, -1)}
      disabled={
        cargando ||
        guardandoOrden ||
        indice === 0
      }
      aria-label={"Subir " + plan.nombre}
      title="Subir plantilla"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-200 bg-white text-lg font-bold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
    >
      ↑
    </button>

    <button
      type="button"
      onClick={() => moverPlantilla(indice, 1)}
      disabled={
        cargando ||
        guardandoOrden ||
        indice === planes.length - 1
      }
      aria-label={"Bajar " + plan.nombre}
      title="Bajar plantilla"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-200 bg-white text-lg font-bold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
    >
      ↓
    </button>
  </div>

  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8F6FF] text-brand-pink">
                  ✓
                </div>
</div>
              </div>

              {plan.descripcion && (
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#6B6870]">
                  {plan.descripcion}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-[#F8F6FF] p-3">
                  <p className="text-xs text-[#8A8790]">
                    Duración
                  </p>
                  <p className="mt-1 font-semibold text-[#1F1B24]">
                    {plan.duracionDias} días
                  </p>
                </div>

                <div className="rounded-xl bg-[#F8F6FF] p-3">
                  <p className="text-xs text-[#8A8790]">
                    Actividades
                  </p>
                  <p className="mt-1 font-semibold text-[#1F1B24]">
                    {plan._count.actividades}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-sm">
                <a
                  href={`/admin/seguimiento/planes/${plan.id}/editar`}
                  className="font-medium text-brand-pink hover:underline"
                >
                  Administrar
                </a>

                <button
                  type="button"
                  onClick={() =>
                    abrirDuplicar(
                      plan
                    )
                  }
                  className="font-medium text-violet-600 hover:underline"
                >
                  Duplicar
                </button>

                <button
                  type="button"
                  onClick={() => setBorrarId(plan.id)}
                  className="font-medium text-red-600 hover:underline"
                >
                  Borrar
                </button>
              </div>

              {plan._count.seguimientos > 0 && (
                <p className="mt-3 text-xs text-[#8A8790]">
                  Asignado a {plan._count.seguimientos} seguimiento
                  {plan._count.seguimientos === 1 ? "" : "s"}.
                </p>
              )}
            </article>
</PlantillaArrastrable>
          ))}
        </div>
</DragDropProvider>
      )}

      {nuevaPlantillaAbierta && (
        <NuevaPlantillaModal
          onClose={() => setNuevaPlantillaAbierta(false)}
          onCreada={cargar}
        />
      )}

      {planDuplicando && (
        <Modal
          title="Usar plantilla como base"
          onClose={
            cerrarDuplicar
          }
        >
          <div className="space-y-5">

            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
              <p className="text-sm font-semibold text-violet-950">
                Se copiará toda la plantilla
              </p>

              <p className="mt-1 text-sm leading-6 text-violet-700">
                Se conservarán actividades, horarios, indicaciones, duración y protocolos adicionales. La plantilla original no será modificada.
              </p>
            </div>

            <div>
              <label className="admin-label">
                Plantilla base
              </label>

              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="font-semibold text-[#1F1B24]">
                  {
                    planDuplicando.nombre
                  }
                </p>

                <p className="mt-1 text-xs text-[#8A8790]">
                  {
                    planDuplicando.duracionDias
                  } días · {
                    planDuplicando._count.actividades
                  } actividades
                </p>
              </div>
            </div>

            <div>
              <label className="admin-label">
                Nombre de la nueva plantilla
              </label>

              <input
                type="text"
                value={
                  nombreDuplicado
                }
                onChange={(e) =>
                  setNombreDuplicado(
                    e.target.value
                  )
                }
                className="admin-input"
                maxLength={200}
                placeholder="Ej. Protocolo Juan Pérez"
                autoFocus
              />

              <p className="mt-1.5 text-xs leading-5 text-[#8A8790]">
                La nueva copia quedará en borrador hasta que termines de personalizarla.
              </p>
            </div>

            <button
              type="button"
              disabled={
                duplicando ||
                !nombreDuplicado.trim()
              }
              onClick={() =>
                void duplicarPlantilla()
              }
              className="admin-btn-primary w-full disabled:opacity-50"
            >
              {duplicando
                ? "Copiando..."
                : "Crear copia y editar"}
            </button>

          </div>
        </Modal>
      )}

      {borrarId && (
        <ConfirmDialog
          title="Borrar plantilla"
          message="¿Seguro que quieres borrar esta plantilla? Si ya fue asignada a un cliente no podrá eliminarse."
          onConfirm={confirmarBorrar}
          onCancel={() => setBorrarId(null)}
        />
      )}
    </div>
  );
}
