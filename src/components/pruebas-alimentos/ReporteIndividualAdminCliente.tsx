"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  leerReporteIndividualAdmin,
  type ReporteIndividualCliente,
} from "./contrato-reporte-individual-admin";

import { ordenarAlimentosPorAumento } from "@/lib/pruebas-alimentos/analisis-mejoras";
import AvisosGlucosa from "./AvisosGlucosa";
import GraficaMedicionesAdmin from "./GraficaMedicionesAdmin";

type Propiedades = {
  clienteId: string;
};

type EstadoCarga =
  | "cargando"
  | "lista"
  | "error";

function numero(valor: number): string {
  return valor.toLocaleString("es-BO", {
    maximumFractionDigits: 2,
  });
}

function errorHTTP(estado: number): string {
  if (estado === 401) {
    return "Tu sesión administrativa no está activa.";
  }

  if (estado === 403) {
    return "No tienes autorización para consultar este reporte.";
  }

  if (estado === 404) {
    return "No se encontró el cliente.";
  }

  if (estado === 503) {
    return "Los reportes todavía no están habilitados.";
  }

  return "No se pudo cargar el reporte.";
}

export default function ReporteIndividualAdminCliente({
  clienteId,
}: Propiedades) {
  const [recarga, setRecarga] = useState(0);

  const [estado, setEstado] =
    useState<EstadoCarga>("cargando");

  const [reporte, setReporte] =
    useState<ReporteIndividualCliente | null>(null);

  const [error, setError] = useState("");

  const [ordenAlimentos, setOrdenAlimentos] =
    useState<"frecuencia" | "aumento">("frecuencia");

  useEffect(() => {
    const controlador = new AbortController();
    let activo = true;

    async function cargar() {
      setEstado("cargando");
      setError("");
      setReporte(null);

      try {
        const respuesta = await fetch(
          `/api/admin/pruebas-alimentos/reportes/${encodeURIComponent(clienteId)}`,
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
            errorHTTP(respuesta.status)
          );
        }

        const contenido: unknown =
          await respuesta.json();

        const datos = leerReporteIndividualAdmin(
          contenido
        );

        if (!datos || datos.cliente.id !== clienteId) {
          throw new Error(
            "El servidor devolvió un reporte no válido."
          );
        }

        if (!activo) return;

        setReporte(datos);
        setEstado("lista");
      } catch (fallo) {
        if (!activo) return;

        setEstado("error");

        setError(
          fallo instanceof Error
            ? fallo.message
            : "No se pudo consultar el reporte."
        );
      }
    }

    void cargar();

    return () => {
      activo = false;
      controlador.abort();
    };
  }, [clienteId, recarga]);

  const alimentosOrdenados = reporte
    ? ordenAlimentos === "aumento"
      ? ordenarAlimentosPorAumento(reporte.alimentos)
      : reporte.alimentos.slice(0, 8)
    : [];

  const maximo = reporte
    ? Math.max(
        1,
        ...alimentosOrdenados.flatMap(alimento => [
          alimento.promedioAntes,
          alimento.promedioDespues,
        ])
      )
    : 1;

  function ancho(valor: number): string {
    return `${Math.min(
      100,
      Math.max(0, (valor / maximo) * 100)
    )}%`;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Reporte individual
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Comparación descriptiva de glucosa
            antes y después de comer.
          </p>
        </div>

        <button
          type="button"
          disabled={estado === "cargando"}
          onClick={() =>
            setRecarga(valor => valor + 1)
          }
          className="rounded-xl border border-fuchsia-300 px-4 py-2 text-sm font-bold text-fuchsia-800 disabled:opacity-50"
        >
          Actualizar reporte
        </button>
      </div>

      {estado === "cargando" && (
        <p role="status" className="text-sm text-slate-600">
          Cargando reporte...
        </p>
      )}

      {estado === "error" && (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          {error}
        </p>
      )}

      {estado === "lista" && reporte && (
        <>
          {reporte.alertasActivas &&
            reporte.avisos &&
            reporte.avisos.length > 0 && (
              <AvisosGlucosa
                avisosDirectos={reporte.avisos
                  .slice(0, 20)
                  .map(item => item.aviso)}
              />
            )}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              {reporte.cliente.nombre}
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-600">
                  Registros revisados
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {reporte.registrosRevisados}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-600">
                  Pruebas completas
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {reporte.pruebasCompletas}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Se analizan hasta 50 registros recientes.
              Las pruebas incompletas no forman parte
              de los promedios.
            </p>
          </section>

          {reporte.alimentos.length === 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-600">
                Este cliente todavía no tiene pruebas
                completas para generar gráficas.
              </p>
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">
                Comparación por alimento
              </h3>

              <div className="mt-4 space-y-2">
                <label
                  htmlFor="orden-alimentos"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Ordenar alimentos
                </label>
                <select
                  id="orden-alimentos"
                  value={ordenAlimentos}
                  onChange={(evento) =>
                    setOrdenAlimentos(
                      evento.target.value as "frecuencia" | "aumento"
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 sm:max-w-sm"
                >
                  <option value="frecuencia">
                    Mayor cantidad de pruebas
                  </option>
                  <option value="aumento">
                    Mayor aumento promedio de glucosa
                  </option>
                </select>
                <p className="text-xs text-slate-500">
                  Se muestran hasta 8 alimentos de los
                  50 registros recientes. Este orden
                  no constituye una clasificación médica.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-sky-500" />
                  Antes de comer
                </span>

                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-fuchsia-600" />
                  Después de comer
                </span>
              </div>

              <div className="mt-5 space-y-5">
                {alimentosOrdenados.map(alimento => (
                  <article
                    key={alimento.alimento}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-semibold text-slate-900">
                        {alimento.alimento}
                      </h4>

                      <span className="text-xs text-slate-500">
                        {alimento.pruebas}{" "}
                        {alimento.pruebas === 1
                          ? "prueba"
                          : "pruebas"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="mb-1 flex justify-between gap-3 text-xs">
                          <span>Antes</span>
                          <span>
                            {numero(alimento.promedioAntes)} mg/dL
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            aria-hidden="true"
                            className="h-full rounded-full bg-sky-500"
                            style={{
                              width: ancho(alimento.promedioAntes),
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between gap-3 text-xs">
                          <span>Después</span>
                          <span>
                            {numero(alimento.promedioDespues)} mg/dL
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            aria-hidden="true"
                            className="h-full rounded-full bg-fuchsia-600"
                            style={{
                              width: ancho(alimento.promedioDespues),
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-slate-700">
                      Diferencia promedio:{" "}
                      <strong>
                        {alimento.diferencia > 0 ? "+" : ""}
                        {numero(alimento.diferencia)} mg/dL
                      </strong>
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {reporte.mediciones && reporte.mediciones.length > 0 && (
        <GraficaMedicionesAdmin
          mediciones={reporte.mediciones}
        />
      )}
      <p className="text-xs leading-5 text-slate-500">
            Los resultados describen mediciones
            registradas. No constituyen un diagnóstico
            ni permiten determinar por sí solos
            si un alimento es saludable o perjudicial.
          </p>
        </>
      )}
    </section>
  );
}
