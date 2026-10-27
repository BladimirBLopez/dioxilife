import type {
  AlimentoReporteAdmin,
} from "./reporte-individual-admin";

export type RangoAprobado = Readonly<{
  minimo: number;
  maximo: number;
}>;

export type EstadoMedicion =
  | "sin_medicion"
  | "sin_parametros"
  | "dentro_del_rango"
  | "por_debajo"
  | "por_encima";

function glucosaValida(valor: unknown): valor is number {
  return (
    typeof valor === "number" &&
    Number.isFinite(valor) &&
    valor > 0 &&
    valor <= 1000
  );
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

// Solo variacion descriptiva, no diagnostico.
export function calcularCambioGlucosa(
  antes: number,
  despues: number | null
): number | null {
  if (!glucosaValida(antes)) {
    throw new Error("Glucosa inicial no valida");
  }

  if (despues === null) return null;

  if (!glucosaValida(despues)) {
    throw new Error("Glucosa posterior no valida");
  }

  return redondear(despues - antes);
}

// Sin rangos aprobados nunca clasifica.
export function evaluarMedicion(
  valor: number | null,
  rango: RangoAprobado | null
): EstadoMedicion {
  if (valor === null) return "sin_medicion";

  if (!glucosaValida(valor)) {
    throw new Error("Medicion no valida");
  }

  if (rango === null) return "sin_parametros";

  if (
    !glucosaValida(rango.minimo) ||
    !glucosaValida(rango.maximo) ||
    rango.minimo > rango.maximo
  ) {
    throw new Error("Rango no valido");
  }

  if (valor < rango.minimo) return "por_debajo";
  if (valor > rango.maximo) return "por_encima";

  return "dentro_del_rango";
}

// Ordena solo los alimentos recibidos del reporte real.
// No consulta Neon ni modifica el reporte original.
export function ordenarAlimentosPorAumento(
  alimentos: readonly AlimentoReporteAdmin[],
  limite = 8
): AlimentoReporteAdmin[] {
  if (
    !Array.isArray(alimentos) ||
    !Number.isInteger(limite) ||
    limite < 1 ||
    limite > 50
  ) {
    throw new Error("Parametros de reporte invalidos");
  }

  for (const alimento of alimentos) {
    if (
      typeof alimento.alimento !== "string" ||
      !alimento.alimento.trim() ||
      !Number.isInteger(alimento.pruebas) ||
      alimento.pruebas < 1 ||
      !glucosaValida(alimento.promedioAntes) ||
      !glucosaValida(alimento.promedioDespues) ||
      !Number.isFinite(alimento.diferencia)
    ) {
      throw new Error("Datos de alimento invalidos");
    }
  }

  return [...alimentos]
    .sort(
      (a, b) =>
        b.diferencia - a.diferencia ||
        b.pruebas - a.pruebas ||
        a.alimento.localeCompare(b.alimento, "es")
    )
    .slice(0, limite);
}
