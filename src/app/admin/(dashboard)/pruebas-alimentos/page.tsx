import { pruebasAlimentosHabilitadas } from "@/lib/pruebas-alimentos/activacion";
import Link from "next/link";

export const dynamic = "force-dynamic";

const secciones = [
  {
    numero: "01",
    titulo: "Clientes",
    descripcion:
      "Seleccionar a la persona que realizará las pruebas de alimentos.",
  },
  {
    numero: "02",
    titulo: "Enlaces privados",
    descripcion:
      "Generar y administrar accesos individuales para WhatsApp.",
  },
  {
    numero: "03",
    titulo: "Mediciones",
    descripcion:
      "Registrar glucosa en ayunas, antes y después de comer.",
  },
  {
    numero: "04",
    titulo: "Reportes",
    descripcion:
      "Consultar gráficas individuales y comparaciones generales.",
  },
] as const;

export default function PruebasAlimentosAdminPage() {
  const moduloActivo = pruebasAlimentosHabilitadas();
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-12 sm:p-6">
      <div>
        <Link
          href="/admin"
          className="text-sm font-medium text-fuchsia-700 hover:underline"
        >
          ← Volver al panel
        </Link>
      </div>

      <header className="rounded-3xl border border-fuchsia-100 bg-gradient-to-br from-fuchsia-50 via-white to-violet-50 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-700">
          DioxiLife Bolivia · Administración
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Pruebas de alimentos
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Gestiona las mediciones de glucosa relacionadas con
          los alimentos, mediante enlaces privados para cada cliente.
        </p>

        <div className={moduloActivo
            ? "mt-5 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900"
            : "mt-5 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900"}>
          {moduloActivo ? "Módulo habilitado" : "Módulo en preparación"}
        </div>
      </header>

      <div>
        <Link
          href="/admin/pruebas-alimentos/reportes"
          className="inline-flex rounded-xl bg-fuchsia-700 px-5 py-3 text-sm font-bold text-white hover:bg-fuchsia-800"
        >
          Consultar reportes reales →
        </Link>
      </div>

      <div>
        <Link
          href="/admin/pruebas-alimentos/clientes"
          className="inline-flex rounded-xl border border-fuchsia-200 bg-white px-5 py-3 text-sm font-bold text-fuchsia-800 hover:bg-fuchsia-50"
        >
          Gestionar clientes y enlaces →
        </Link>
      </div>

      <section aria-labelledby="secciones-titulo">
        <h2
          id="secciones-titulo"
          className="mb-4 text-xl font-bold text-slate-900"
        >
          Funciones del módulo
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {secciones.map((seccion) => (
            <article
              key={seccion.numero}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-100 text-sm font-bold text-fuchsia-800">
                {seccion.numero}
              </span>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                {seccion.titulo}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {seccion.descripcion}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Registros reales
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Las mediciones se consultarán desde Neon.
          Si todavía no existen pruebas registradas,
          no se mostrarán mediciones ni gráficas ficticias.
        </p>
      </section>

      <p className="text-xs leading-5 text-slate-500">
        {moduloActivo
          ? "El módulo está activado para uso autorizado."
          : "Las funciones reales permanecerán protegidas hasta su activación autorizada."}
      </p>
    </main>
  );
}
