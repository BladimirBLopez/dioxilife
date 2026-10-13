"use client";

import { useState } from "react";
import { toast } from "sonner";
import DuracionRapidaProtocolo from "@/components/admin/seguimiento/DuracionRapidaProtocolo";

type Protocolo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracionDias: number;
  actividades: number;
};

export default function SeleccionarProtocoloGuardado({
  seguimientoId,
  duracionDias,
  diaActual,
  onAgregada,
}: {
  seguimientoId: string;
  duracionDias: number;
  diaActual?: number | null;
  onAgregada: () => void;
}) {
  const inicioSugerido = String(
    Math.max(1, Math.min(duracionDias, diaActual ?? 1))
  );

  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [seleccionado, setSeleccionado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [inicio, setInicio] = useState(inicioSugerido);
  const [fin, setFin] = useState(String(duracionDias));

  const visibles = protocolos.filter((p) =>
    `${p.nombre} ${p.descripcion ?? ""}`
      .toLocaleLowerCase("es")
      .includes(busqueda.trim().toLocaleLowerCase("es"))
  );

  const actual = protocolos.find((p) => p.id === seleccionado);

  async function abrir() {
    setAbierto(true);
    setCargando(true);
    setSeleccionado("");
    setBusqueda("");
    setInicio(inicioSugerido);
    setFin(String(duracionDias));

    try {
      const respuesta = await fetch(
        `/api/admin/seguimiento/clientes/${seguimientoId}/actividades/importar-plantilla`,
        { cache: "no-store" }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudieron cargar los protocolos."
        );
      }

      setProtocolos(
        Array.isArray(datos.plantillas) ? datos.plantillas : []
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
    const diaFin = Number(fin);

    if (
      !Number.isInteger(diaInicio) ||
      diaInicio < 1 ||
      diaInicio > duracionDias ||
      !Number.isInteger(diaFin) ||
      diaFin < diaInicio ||
      diaFin > duracionDias
    ) {
      toast.error(
        `Elige días válidos dentro del seguimiento de ${duracionDias} días.`
      );
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch(
        `/api/admin/seguimiento/clientes/${seguimientoId}/actividades/importar-plantilla`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planId: actual.id,
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
        "Protocolo completo agregado con sus instrucciones."
      );

      setSeleccionado("");
      setInicio(inicioSugerido);
      setFin(String(duracionDias));
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
                No hay plantillas con actividades.
                Primero crea tu protocolo en Nueva plantilla.
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
                    onChange={(e) => {
                      const elegido = protocolos.find(
                        (p) => p.id === e.target.value
                      );

                      setSeleccionado(e.target.value);

                      if (elegido) {
                        setFin(
                          String(
                            Math.min(
                              duracionDias,
                              Number(inicio) + elegido.duracionDias - 1
                            )
                          )
                        );
                      }
                    }}
                    className="w-full rounded-xl border p-3 text-sm"
                  >
                    <option value="">Selecciona uno...</option>
                    {visibles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.actividades} actividades)

                      </option>
                    ))}
                  </select>
                </div>

                {actual && (
                  <div className="rounded-xl bg-purple-50 p-3 text-sm">
                    <p className="font-semibold">{actual.nombre}</p>
                    <p className="mt-1 text-xs text-purple-800">
                      Plantilla de {actual.duracionDias} días · {actual.actividades} actividades
                    </p>
                    {actual.descripcion && (
                      <p className="mt-1 whitespace-pre-wrap text-gray-700">
                        {actual.descripcion}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-purple-800">
                      Se copiarán todas sus actividades,
                      indicaciones y horarios.
                      Si alguna actividad no cabe en el
                      período elegido, el sistema te pedirá
                      ampliar los días antes de guardar.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {actual && (
                    <DuracionRapidaProtocolo
                      inicio={inicio}
                      fin={fin}
                      duracionDias={duracionDias}
                      onFinChange={setFin}
                    />
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      Día de inicio
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={duracionDias}
                      value={inicio}
                      onChange={(e) => {
                        const valor = e.target.value;
                        setInicio(valor);

                        const dia = Number(valor);

                        if (
                          actual &&
                          Number.isInteger(dia) &&
                          dia >= 1 &&
                          dia <= duracionDias
                        ) {
                          setFin(
                            String(
                              Math.min(
                                duracionDias,
                                dia + actual.duracionDias - 1
                              )
                            )
                          );
                        }
                      }}
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
                      placeholder="Día final"
                      className="w-full rounded-xl border p-3"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-600">
                  Indica el día final. Las actividades
                  deben caber en ese período.
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
