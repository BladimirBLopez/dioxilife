"use client";

import type {
  ReporteIndividualCliente,
} from "./contrato-reporte-individual-admin";

type Medicion = NonNullable<
  ReporteIndividualCliente["mediciones"]
>[number];

export default function GraficaMedicionesAdmin({
  mediciones,
}: {
  mediciones: readonly Medicion[];
}) {
  const maximo = Math.max(
    1,
    ...mediciones.flatMap(m => [
      m.glucosaAntes,
      m.glucosaDespues,
    ])
  );

  function ancho(valor: number) {
    return `${Math.min(100, Math.max(
      0,
      (valor / maximo) * 100
    ))}%`;
  }

  function numero(valor: number) {
    return valor.toLocaleString("es-BO", {
      maximumFractionDigits: 2,
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">
        Mediciones individuales
      </h3>

      <p className="mt-2 text-sm text-slate-600">
        Hasta ocho pruebas completas ordenadas por
        mayor aumento de glucosa. Valores en mg/dL.
      </p>

      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-sky-500" />
          Antes de comer
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-fuchsia-600" />
          Después de comer
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {mediciones.map((m, i) => (
          <article
            key={`${m.fecha}-${i}`}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <h4 className="font-semibold text-slate-900">
                {m.alimento}
              </h4>
              <time
                dateTime={m.fecha}
                className="text-xs text-slate-500"
              >
                {new Date(m.fecha).toLocaleString("es-BO", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </time>
            </div>

            <div className="mt-4 space-y-3">
              {([
                {
                  titulo: "Antes",
                  valor: m.glucosaAntes,
                  color: "bg-sky-500",
                },
                {
                  titulo: "Después",
                  valor: m.glucosaDespues,
                  color: "bg-fuchsia-600",
                },
              ] as const).map(b => (
                <div key={b.titulo}>
                  <div className="mb-1 flex justify-between gap-2 text-xs">
                    <span>{b.titulo}</span>
                    <span>{numero(b.valor)} mg/dL</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${b.color}`}
                      style={{ width: ancho(b.valor) }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-3 text-sm text-slate-700">
              Diferencia registrada:{" "}
              <strong>
                {m.diferencia > 0 ? "+" : ""}
                {numero(m.diferencia)} mg/dL
              </strong>
            </p>
          </article>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Comparación descriptiva. No constituye
        diagnóstico ni clasificación médica.
      </p>
    </section>
  );
}
