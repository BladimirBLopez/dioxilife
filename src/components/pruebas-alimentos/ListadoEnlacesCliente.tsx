"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  leerListadoEnlacesCliente,
  type EnlaceListadoCliente,
} from "./contrato-listado-enlaces";

type Propiedades = {
  version: number;
  onRevocado?: (id: string) => void;
};

type EstadoCarga =
  | "cargando"
  | "lista"
  | "error";

const API_LISTADO =
  "/api/admin/pruebas-alimentos/enlaces/lista";

const API_ENLACES =
  "/api/admin/pruebas-alimentos/enlaces";

function describirError(
  estado: number
): string {
  if (estado === 401) {
    return "Tu sesión administrativa no está activa.";
  }

  if (estado === 403) {
    return "No tienes autorización para consultar los enlaces.";
  }

  if (estado === 503) {
    return "El listado todavía no está habilitado.";
  }

  return "No se pudo consultar el listado.";
}

function formatearFecha(
  valor: string | null
): string {
  if (!valor) return "No disponible";

  return new Date(valor).toLocaleString(
    "es-BO",
    {
      timeZone: "America/La_Paz",
      dateStyle: "short",
      timeStyle: "short",
    }
  );
}

const nombresEstado = {
  vigente: "Vigente",
  vencido: "Vencido",
  revocado: "Revocado",
  sin_vigencia: "Sin vigencia",
} as const;

const estilosEstado = {
  vigente:
    "border-emerald-200 bg-emerald-50 text-emerald-800",
  vencido:
    "border-amber-200 bg-amber-50 text-amber-900",
  revocado:
    "border-slate-200 bg-slate-100 text-slate-700",
  sin_vigencia:
    "border-red-200 bg-red-50 text-red-800",
} as const;

function respuestaValidaRevocacion(
  entrada: unknown
): boolean {
  return (
    typeof entrada === "object" &&
    entrada !== null &&
    !Array.isArray(entrada) &&
    "ok" in entrada &&
    entrada.ok === true
  );
}

export default function ListadoEnlacesCliente({
  version,
  onRevocado,
}: Propiedades) {
  const [recarga, setRecarga] = useState(0);

  const [estado, setEstado] =
    useState<EstadoCarga>("cargando");

  const [enlaces, setEnlaces] =
    useState<EnlaceListadoCliente[]>([]);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [confirmarId, setConfirmarId] =
    useState<string | null>(null);

  const [revocandoId, setRevocandoId] =
    useState<string | null>(null);

  const [errorAccion, setErrorAccion] =
    useState("");

  useEffect(() => {
    const controlador = new AbortController();
    let activo = true;

    async function cargar() {
      setEstado("cargando");
      setError("");

      try {
        const respuesta = await fetch(
          API_LISTADO,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            credentials: "same-origin",
            cache: "no-store",
            referrerPolicy: "no-referrer",
            signal: controlador.signal,
          }
        );

        if (!respuesta.ok) {
          throw new Error(
            describirError(respuesta.status)
          );
        }

        const contenido: unknown =
          await respuesta.json();

        const datos =
          leerListadoEnlacesCliente(
            contenido
          );

        if (!datos) {
          throw new Error(
            "El servidor devolvió un listado no válido."
          );
        }

        if (!activo) return;

        setEnlaces(datos);
        setEstado("lista");
      } catch (fallo) {
        if (!activo) return;

        setEnlaces([]);
        setEstado("error");

        setError(
          fallo instanceof Error
            ? fallo.message
            : "No se pudo obtener el listado."
        );
      }
    }

    void cargar();

    return () => {
      activo = false;
      controlador.abort();
    };
  }, [version, recarga]);

  async function revocar(id: string) {
    if (
      revocandoId !== null ||
      confirmarId !== id
    ) {
      return;
    }

    setErrorAccion("");
    setMensaje("");
    setRevocandoId(id);

    try {
      const respuesta = await fetch(
        API_ENLACES,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          cache: "no-store",
          referrerPolicy: "no-referrer",
          body: JSON.stringify({
            clientePruebaId: id,
          }),
        }
      );

      if (!respuesta.ok) {
        throw new Error(
          describirError(respuesta.status)
        );
      }

      const contenido: unknown =
        await respuesta.json();

      if (!respuestaValidaRevocacion(
        contenido
      )) {
        throw new Error(
          "No se pudo confirmar la revocación."
        );
      }

      setConfirmarId(null);
      setMensaje(
        "Enlace revocado correctamente."
      );

      onRevocado?.(id);

      setRecarga(
        valor => valor + 1
      );
    } catch (fallo) {
      setErrorAccion(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo revocar el enlace."
      );
    } finally {
      setRevocandoId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Enlaces de clientes
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Consulta los accesos recientes y
            revócalos cuando sea necesario.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setRecarga(valor => valor + 1)
          }
          disabled={
            estado === "cargando" ||
            revocandoId !== null
          }
          className="rounded-xl border border-fuchsia-300 px-4 py-2 text-sm font-bold text-fuchsia-800 disabled:opacity-50"
        >
          Actualizar listado
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Se muestran hasta 100 accesos recientes.
        Los enlaces privados no pueden recuperarse
        de esta tabla.
      </p>

      {estado === "cargando" && (
        <p
          role="status"
          className="mt-5 text-sm text-slate-600"
        >
          Cargando enlaces...
        </p>
      )}

      {estado === "error" && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          {error}
        </p>
      )}

      {mensaje && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800"
        >
          {mensaje}
        </p>
      )}

      {errorAccion && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900"
        >
          {errorAccion}
        </p>
      )}

      {estado === "lista" &&
        enlaces.length === 0 && (
          <p className="mt-5 text-sm text-slate-600">
            Todavía no hay enlaces para mostrar.
          </p>
        )}

      {estado === "lista" &&
        enlaces.length > 0 && (
          <div className="mt-5 max-h-[36rem] space-y-3 overflow-y-auto pr-1">
            {enlaces.map(enlace => (
              <article
                key={enlace.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-semibold text-slate-900">
                      {enlace.nombre}
                    </h3>

                    <p className="mt-1 break-all text-xs text-slate-500">
                      ID: {enlace.id}
                    </p>
                  </div>

                  <span
                    className={
                      "rounded-full border px-3 py-1 text-xs font-semibold " +
                      estilosEstado[
                        enlace.estado
                      ]
                    }
                  >
                    {nombresEstado[
                      enlace.estado
                    ]}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <p>
                    Creado:{" "}
                    {formatearFecha(
                      enlace.tokenCreadoAt
                    )}
                  </p>

                  <p>
                    Vence:{" "}
                    {formatearFecha(
                      enlace.tokenExpiraAt
                    )}
                  </p>

                  {enlace.tokenRevocadoAt && (
                    <p>
                      Revocado:{" "}
                      {formatearFecha(
                        enlace.tokenRevocadoAt
                      )}
                    </p>
                  )}

                  {enlace.seguimientoId && (
                    <p className="break-all">
                      Seguimiento:{" "}
                      {enlace.seguimientoId}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <Link
                    href={`/admin/pruebas-alimentos/reportes?clienteId=${encodeURIComponent(enlace.id)}`}
                    className="inline-flex rounded-lg border border-fuchsia-300 px-3 py-2 text-xs font-bold text-fuchsia-800 hover:bg-fuchsia-50"
                  >
                    Ver reporte individual
                  </Link>
                </div>
                {enlace.estado !== "revocado" && (
                  <div className="mt-4">
                    {confirmarId === enlace.id ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="text-sm font-semibold text-red-900">
                          ¿Revocar el acceso de este cliente?
                        </p>

                        <p className="mt-1 text-xs leading-5 text-red-800">
                          El enlace dejará de permitir
                          nuevas consultas o mediciones.
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={
                              revocandoId !== null
                            }
                            onClick={() =>
                              void revocar(enlace.id)
                            }
                            className="rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                          >
                            {revocandoId === enlace.id
                              ? "Revocando..."
                              : "Confirmar revocación"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              revocandoId !== null
                            }
                            onClick={() =>
                              setConfirmarId(null)
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          revocandoId !== null
                        }
                        onClick={() => {
                          setErrorAccion("");
                          setConfirmarId(
                            enlace.id
                          );
                        }}
                        className="rounded-lg border border-red-300 px-3 py-2 text-xs font-bold text-red-800 disabled:opacity-50"
                      >
                        Revocar este enlace
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
    </section>
  );
}
