import Link from "next/link";
import VistaPreviaReporteAlimentos from
  "@/components/pruebas-alimentos/VistaPreviaReporteAlimentos";

export default function ReportesAlimentosDemoPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 pb-12 sm:p-6">
      <Link
        href="/admin/pruebas-alimentos/vista-previa"
        className="text-sm font-semibold text-fuchsia-700 hover:underline"
      >
        ← Volver al formulario
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-700">
          DioxiLife Bolivia · Vista previa
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Reportes de pruebas de alimentos
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Gráficas individuales y generales,
          con los promedios debajo de cada gráfica.
        </p>
      </header>

      <VistaPreviaReporteAlimentos />
    </main>
  );
}
