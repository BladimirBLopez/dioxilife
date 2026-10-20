"use client";

import { useEffect, useRef, useState } from "react";

type Indicacion = {
  id: string;
  hora: string | null;
  texto: string;
  orden: number;
};

type Actividad = {
  id: string;
  titulo: string;
  descripcion: string | null;
  momento: string | null;
  hora: string | null;
  tipo: string;
  seccion: string;
  recordatorio: string;
  diaInicio: number | null;
  diaFin: number | null;
  orden: number;
  indicaciones: Indicacion[];
};

type Respuesta = {
  etapa: {
    id: string;
    nombre: string;
    diaInicio: number;
    diaFin: number;
    estado: string;
    modoPublicacion: string;
    actividades: Actividad[];
  };
  totalActividades: number;
  huellaRevision: string;
};

type Props = {
  seguimientoId: string;
  etapaId: string;
  onAprobada?: () => void;
};

export default function VistaPreviaEtapa({
  seguimientoId,
  etapaId,
  onAprobada,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [revisionConfirmada, setRevisionConfirmada] = useState(false);
  const [aprobando, setAprobando] = useState(false);
  const [mensajeAprobacion, setMensajeAprobacion] = useState("");

  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;

    cerrarRef.current?.focus();

    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAbierto(false);
      }
    }

    document.addEventListener("keydown", tecla);

    return () => {
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;

    const controlador = new AbortController();
    let vigente = true;

    setCargando(true);
    setError("");
    setDatos(null);

    const url =
      `/api/admin/seguimiento/clientes/` +
      `${encodeURIComponent(seguimientoId)}/etapas/` +
      `${encodeURIComponent(etapaId)}/vista-previa`;

    fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controlador.signal,
    })
      .then(async (respuesta) => {
        const cuerpo = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            cuerpo.error || "No se pudo consultar la etapa."
          );
        }

        if (
          !cuerpo.etapa ||
          !Array.isArray(cuerpo.etapa.actividades)
        ) {
          throw new Error(
            "La respuesta de vista previa no es válida."
          );
        }

        return cuerpo as Respuesta;
      })
      .then((resultado) => {
        if (vigente) setDatos(resultado);
      })
      .catch((fallo) => {
        if (vigente && !controlador.signal.aborted) {
          setError(
            fallo instanceof Error
              ? fallo.message
              : "Error al cargar la vista previa."
          );
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
      controlador.abort();
    };
  }, [abierto, seguimientoId, etapaId]);


  async function aprobarEtapa() {
    if (
      !datos ||
      cargando ||
      aprobando ||
      !revisionConfirmada ||
      datos.totalActividades < 1 ||
      datos.etapa.estado !== "BORRADOR" ||
      datos.etapa.modoPublicacion !== "MANUAL" ||
      !/^[a-f0-9]{64}$/.test(datos.huellaRevision)
    ) {
      return;
    }

    setAprobando(true);
    setError("");
    setMensajeAprobacion("");

    try {
      const respuesta = await fetch(
        `/api/admin/seguimiento/clientes/${encodeURIComponent(
          seguimientoId
        )}/etapas/${encodeURIComponent(etapaId)}/aprobar`,
        {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            huellaRevision: datos.huellaRevision,
          }),
        }
      );

      const resultado = (await respuesta
        .json()
        .catch(() => ({}))) as {
        aprobada?: boolean;
        mensaje?: string;
        error?: string;
      };

      if (!respuesta.ok || resultado.aprobada !== true) {
        if (respuesta.status === 409) {
          setDatos(null);
        }

        throw new Error(
          resultado.error ||
            "No se pudo aprobar la etapa."
        );
      }

      setRevisionConfirmada(false);
      setMensajeAprobacion(
        "Etapa aprobada correctamente. Continúa en borrador hasta su publicación o programación."
      );
      onAprobada?.();
    } catch (fallo) {
      setRevisionConfirmada(false);
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo registrar la aprobación."
      );
    } finally {
      setAprobando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDatos(null);
          setError("");
          setRevisionConfirmada(false);
          setMensajeAprobacion("");
          setAbierto(true);
        }}
        className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-xs font-bold text-violet-800 hover:bg-violet-50"
      >
        Vista previa
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 px-3 py-5 sm:p-8">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`vista-etapa-${etapaId}`}
            className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-4 text-gray-900 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3 border-b pb-4">
              <div>
                <h3
                  id={`vista-etapa-${etapaId}`}
                  className="text-lg font-bold"
                >
                  Vista previa de etapa
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Revisión administrativa de solo lectura.
                </p>
              </div>

              <button
                ref={cerrarRef}
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-lg border px-3 py-2 text-sm font-semibold"
                aria-label="Cerrar vista previa"
              >
                Cerrar
              </button>
            </div>

            {cargando && (
              <p
                role="status"
                className="py-8 text-center text-sm text-gray-600"
              >
                Cargando actividades...
              </p>
            )}

            {error && (
              <p
                role="alert"
                className="my-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                {error}
              </p>
            )}

            {datos && (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-violet-50 p-4">
                  <h4 className="font-bold text-violet-950">
                    {datos.etapa.nombre}
                  </h4>

                  <p className="mt-2 text-sm text-violet-900">
                    Días {datos.etapa.diaInicio} al{" "}
                    {datos.etapa.diaFin}
                  </p>

                  <p className="mt-1 text-xs text-violet-800">
                    Estado: {datos.etapa.estado}
                  </p>

                  <p className="mt-1 text-xs text-violet-800">
                    Actividades activas:{" "}
                    {datos.etapa.actividades.length}
                  </p>
                </div>

                {datos.etapa.actividades.length === 0 && (
                  <p className="rounded-lg border p-4 text-sm text-gray-600">
                    Esta etapa todavía no tiene actividades
                    activas para revisar.
                  </p>
                )}

                {datos.etapa.actividades.map(
                  (actividad, indice) => (
                    <article
                      key={actividad.id}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <p className="text-xs font-semibold text-violet-700">
                        Actividad {indice + 1}
                      </p>

                      <h5 className="mt-1 font-bold">
                        {actividad.titulo}
                      </h5>

                      <div className="mt-2 space-y-1 text-sm text-gray-700">
                        <p>
                          Horario:{" "}
                          {actividad.hora || "Sin hora fija"}
                        </p>

                        <p>
                          Sección: {actividad.seccion}
                        </p>

                        <p>
                          Tipo: {actividad.tipo}
                        </p>

                        <p>
                          Días:{" "}
                          {actividad.diaInicio ?? "Sin definir"}
                          {" al "}
                          {actividad.diaFin ?? "Sin definir"}
                        </p>

                        <p>
                          Recordatorio: {actividad.recordatorio}
                        </p>

                        {actividad.momento && (
                          <p>
                            Momento: {actividad.momento}
                          </p>
                        )}
                      </div>

                      {actividad.descripcion && (
                        <div className="mt-3 rounded-lg bg-gray-50 p-3">
                          <p className="mb-1 text-xs font-bold">
                            Descripción
                          </p>
                          <p className="whitespace-pre-wrap text-sm">
                            {actividad.descripcion}
                          </p>
                        </div>
                      )}

                      {actividad.indicaciones.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-2 text-sm font-bold">
                            Indicaciones
                          </p>

                          <div className="space-y-2">
                            {actividad.indicaciones.map(
                              (indicacion) => (
                                <div
                                  key={indicacion.id}
                                  className="rounded-lg border bg-gray-50 p-3 text-sm"
                                >
                                  {indicacion.hora && (
                                    <p className="mb-1 font-bold text-violet-800">
                                      {indicacion.hora}
                                    </p>
                                  )}

                                  <p className="whitespace-pre-wrap">
                                    {indicacion.texto}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  )
                )}

                <p className="border-t pt-3 text-xs text-gray-500">
                  Esta vista permite revisar y aprobar una etapa.
                  Aprobarla no significa publicarla ni programarla.
                  Solo se muestran actividades e indicaciones activas;
                  la huella de seguridad también detecta modificaciones
                  en los elementos inactivos.
                </p>

                {datos.etapa.estado === "BORRADOR" &&
                  datos.etapa.modoPublicacion === "MANUAL" && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <h4 className="text-sm font-bold text-emerald-950">
                        Aprobar esta etapa
                      </h4>

                      <p className="mt-2 text-sm text-emerald-900">
                        Revisa las actividades activas, sus horarios
                        y las indicaciones visibles. Si el contenido
                        cambia después, será necesaria una nueva
                        revisión antes de publicar o programar.
                      </p>

                      {mensajeAprobacion ? (
                        <p
                          role="status"
                          className="mt-3 rounded-lg bg-white p-3 text-sm font-semibold text-emerald-800"
                        >
                          {mensajeAprobacion}
                        </p>
                      ) : (
                        <>
                          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-gray-900">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4"
                              checked={revisionConfirmada}
                              onChange={(e) =>
                                setRevisionConfirmada(e.target.checked)
                              }
                              disabled={
                                aprobando ||
                                cargando ||
                                datos.totalActividades < 1
                              }
                            />

                            <span>
                              Confirmo que revisé todas las
                              actividades e indicaciones activas
                              mostradas en esta vista previa.
                            </span>
                          </label>

                          <button
                            type="button"
                            onClick={() => void aprobarEtapa()}
                            disabled={
                              !revisionConfirmada ||
                              aprobando ||
                              cargando ||
                              datos.totalActividades < 1 ||
                              !/^[a-f0-9]{64}$/.test(
                                datos.huellaRevision
                              )
                            }
                            className="mt-4 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {aprobando
                              ? "Guardando aprobación..."
                              : "Aprobar etapa"}
                          </button>
                        </>
                      )}
                    </div>
                  )}

              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
