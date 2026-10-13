"use client";

import { useState } from "react";
import { toast } from "sonner";

type Protocolo = {
  id: string;
  titulo: string;
  descripcion: string | null;
  hora: string | null;
  diaInicio: number;
  diaFin: number | null;
  plan: {
    nombre: string;
  };
};

export default function SeleccionarProtocoloGuardado({
  seguimientoId,
  duracionDias,
  onAgregada,
}: {
  seguimientoId: string;
  duracionDias: number;
  onAgregada: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [seleccionado, setSeleccionado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [inicio, setInicio] = useState("1");
  const [fin, setFin] = useState("");

  const visibles = protocolos.filter((p) =>
    `${p.titulo} ${p.descripcion ?? ""}`
      .toLocaleLowerCase("es")
      .includes(busqueda.trim().toLocaleLowerCase("es"))
  );

  const actual = protocolos.find((p) => p.id === seleccionado);

  async function abrir() {
    setAbierto(true);
    setCargando(true);
    setSeleccionado("");
    setBusqueda("");
    setInicio("1");
    setFin("");

    try {
      const respuesta = await fetch(
        `/api/admin/seguimiento/clientes/${seguimientoId}/actividades/importar`,
        { cache: "no-store" }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudieron cargar los protocolos."
        );
      }

      setProtocolos(
        Array.isArray(datos.protocolos) ? datos.protocolos : []
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al consultar los protocolos."
      );
      setProtocolos([]);
    } finally {
      setCargando(false);
    }
  }

  async function agregar() {
    if (guardando || !actual) return;

    const diaInicio = Number(inicio);
    const diaFin = fin.trim() === "" ? null : Number(fin);

    if (
      !Number.isInteger(diaInicio) ||
      diaInicio < 1 ||
      diaInicio > duracionDias ||
      (diaFin !== null &&
        (!Number.isInteger(diaFin) ||
          diaFin < diaInicio ||
          diaFin > duracionDias))
    ) {
      toast.error(
        `Elige días válidos dentro del seguimiento de ${duracionDias} días.`
      );
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch(
        `/api/admin/seguimiento/clientes/${seguimientoId}/actividades/importar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actividadPlanId: actual.id,
            diaInicio,
            diaFin,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudo agregar el protocolo."
        );
      }

      toast.success(
        "Protocolo agregado con sus instrucciones."
      );

      setSeleccionado("");
      setInicio("1");
      setFin("");
      setAbierto(false);
      onAgregada();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo agregar el protocolo."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void abrir()}
        className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-800 hover:bg-purple-100"
      >
        Elegir protocolo guardado
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-3">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Elegir protocolo guardado"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900">
                Agregar protocolo guardado
              </h2>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                disabled={guardando}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                Cerrar
              </button>
            </div>

            <p className="mt-3 text-sm text-gray-600">
              Selecciona un protocolo existente y elige durante
              qué días lo seguirá este cliente. Puedes agregar
              varios protocolos con los mismos días.
            </p>

            {cargando ? (
              <p className="mt-5 text-sm">
                Cargando protocolos...
              </p>
            ) : protocolos.length === 0 ? (
              <p className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                No hay protocolos adicionales guardados en
                las plantillas. Primero prepara uno en una plantilla.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Buscar protocolo
                  </label>
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Ej. Protocolo C"
                    className="w-full rounded-xl border p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Seleccionar protocolo
                  </label>
                  <select
                    value={seleccionado}
                    onChange={(e) => setSeleccionado(e.target.value)}
                    className="w-full rounded-xl border p-3 text-sm"
                  >
                    <option value="">Selecciona uno...</option>
                    {visibles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.titulo} — {p.plan.nombre}
                        {p.hora ? ` - ${p.hora}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {actual && (
                  <div className="rounded-xl bg-purple-50 p-3 text-sm">
                    <p className="font-semibold">{actual.titulo}</p>
                    <p className="mt-1 text-xs text-purple-800">
                      Plantilla: {actual.plan.nombre}
                    </p>
                    {actual.descripcion && (
                      <p className="mt-1 whitespace-pre-wrap text-gray-700">
                        {actual.descripcion}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-purple-800">
                      Sus indicaciones y horarios se copiarán
                      automáticamente.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      Día de inicio
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={duracionDias}
                      value={inicio}
                      onChange={(e) => setInicio(e.target.value)}
                      className="w-full rounded-xl border p-3"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      Día final
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={duracionDias}
                      value={fin}
                      onChange={(e) => setFin(e.target.value)}
                      placeholder="Opcional"
                      className="w-full rounded-xl border p-3"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-600">
                  Si dejas vacío el día final, el protocolo
                  continuará hasta el último día del seguimiento.
                </p>

                <button
                  type="button"
                  disabled={guardando || !actual}
                  onClick={() => void agregar()}
                  className="w-full rounded-xl bg-purple-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {guardando
                    ? "Agregando..."
                    : "Agregar al seguimiento"}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
