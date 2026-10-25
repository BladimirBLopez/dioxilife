import Link from "next/link";
import VistaPreviaPruebaAlimento from
  "@/components/pruebas-alimentos/VistaPreviaPruebaAlimento";

export default function PruebasAlimentosVistaPreviaPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 pb-12 sm:p-6">
      <Link
        href="/admin/pruebas-alimentos"
        className="text-sm font-semibold text-fuchsia-700 hover:underline"
      >
        ← Volver a Pruebas de alimentos
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-700">
          DioxiLife Bolivia · Vista previa
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Mi respuesta a los alimentos
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Prototipo del formulario que utilizará el cliente
          cuando reciba su enlace privado.
        </p>
      </header>

      <div>
        <Link
          href="/admin/pruebas-alimentos/vista-previa/reportes"
          className="inline-flex rounded-xl bg-fuchsia-700 px-5 py-3 text-sm font-bold text-white hover:bg-fuchsia-800"
        >
          Ver gráficas y reportes de demostración →
        </Link>
      </div>

      <VistaPreviaPruebaAlimento />
    </main>
  );
}
