"use client";

import type {
  ReporteIndividualCliente,
} from "./contrato-reporte-individual-admin";

import GraficaComparativaGlucosa, {
  type FilaComparacionGlucosa,
} from "./GraficaComparativaGlucosa";

type Medicion = NonNullable<
  ReporteIndividualCliente["mediciones"]
>[number];

function mostrarFecha(fecha: string): string {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return valor.toLocaleString("es-BO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function GraficaMedicionesAdmin({
  mediciones,
}: {
  mediciones: readonly Medicion[];
}) {
  const filas: FilaComparacionGlucosa[] =
    [...mediciones]
      .sort((a, b) => b.diferencia - a.diferencia)
      .slice(0, 8)
      .map((medicion) => ({
        alimento: medicion.alimento,
        detalle: mostrarFecha(medicion.fecha),
        pruebas: 1,
        antes: medicion.glucosaAntes,
        despues: medicion.glucosaDespues,
        diferencia: medicion.diferencia,
      }));

  return (
    <GraficaComparativaGlucosa
      titulo="Mediciones individuales"
      descripcion="Hasta ocho pruebas completas ordenadas por mayor aumento de glucosa. Valores en mg/dL."
      filas={filas}
      nivelTitulo={3}
      mensajeVacio="Este cliente todavía no tiene pruebas completas para comparar."
    />
  );
}
