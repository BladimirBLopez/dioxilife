import type {
  prepararAvisosGlucosa,
} from "@/lib/pruebas-alimentos/avisos-glucosa";

type Resultado = ReturnType<typeof prepararAvisosGlucosa>;

type Aviso = Resultado["avisos"][number];

type Propiedades = {
  resultado?: Resultado;
  avisosDirectos?: readonly Aviso[];
};

export default function AvisosGlucosa({
  resultado,
  avisosDirectos,
}: Propiedades) {
  const pendiente = resultado?.pendiente ?? false;
  const avisos = avisosDirectos ?? resultado?.avisos ?? [];

  const sinParametros = resultado !== undefined && (
    resultado.antes === "sin_parametros" ||
    resultado.despues === "sin_parametros"
  );

  if (
    !pendiente &&
    !sinParametros &&
    avisos.length === 0
  ) {
    return null;
  }

  return (
    <section
      aria-label="Avisos de mediciones de glucosa"
      className="space-y-3"
    >
      {pendiente && (
        <div
          role="status"
          className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-800"
        >
          <strong>Registro pendiente</strong>
          <p className="mt-1">
            Falta la medición después de comer.
          </p>
        </div>
      )}

      {sinParametros && (
        <p className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
          Una o más mediciones todavía no tienen
          rangos aprobados. No se clasifican
          esas mediciones.
        </p>
      )}

      {avisos.map((aviso, i) => {
        if (
          aviso.rango === null ||
          aviso.valor === null
        ) {
          return null;
        }

        const alto = aviso.estado === "por_encima";

        return (
          <div
            key={`${aviso.etapa}-${i}`}
            role="status"
            className={
              alto
                ? "rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
                : "rounded-xl border border-sky-300 bg-sky-50 p-4 text-sm text-sky-950"
            }
          >
            <p className="font-bold">
              {alto ? "↑" : "↓"} Valor{" "}
              {alto ? "por encima" : "por debajo"}{" "}
              del rango aprobado
            </p>

            <p className="mt-2">
              <strong>Momento:</strong>{" "}
              {aviso.etapa === "antes"
                ? "Antes de comer"
                : "Después de comer"}
            </p>

            <p>
              <strong>Alimento:</strong>{" "}
              {aviso.alimento}
            </p>

            <p>
              <strong>Valor:</strong>{" "}
              {aviso.valor} mg/dL
            </p>

            <p>
              <strong>Rango aprobado:</strong>{" "}
              {aviso.rango.minimo} a{" "}
              {aviso.rango.maximo} mg/dL
            </p>

            <p className="mt-2 text-xs">
              Aviso informativo. No constituye
              un diagnóstico médico.
            </p>
          </div>
        );
      })}
    </section>
  );
}
