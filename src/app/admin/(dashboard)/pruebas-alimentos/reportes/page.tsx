import Link from "next/link";

import ReporteIndividualAdminCliente from
  "@/components/pruebas-alimentos/ReporteIndividualAdminCliente";

export const dynamic = "force-dynamic";

/**
 * Interfaz real pendiente de autorización.
 *
 * La API mantiene un bloqueo independiente.
 */
const REPORTES_REALES_UI_HABILITADOS = false;

const FORMATO_ID = /^[A-Za-z0-9_-]{5,128}$/;

type Propiedades = {
  searchParams: Promise<{
    clienteId?: string | string[];
  }>;
};

export default async function ReportesIndividualesPage({
  searchParams,
}: Propiedades) {
  if (!REPORTES_REALES_UI_HABILITADOS) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-6 p-4 pb-12 sm:p-6">
        <Link
          href="/admin/pruebas-alimentos"
          className="text-sm font-semibold text-fuchsia-700 hover:underline"
        >
          ← Volver a Pruebas de alimentos
        </Link>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Reportes individuales
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-700">
            Los reportes reales todavía no están habilitados.
            Puedes continuar revisando las gráficas
            de demostración sin utilizar datos de clientes.
          </p>

          <Link
            href="/admin/pruebas-alimentos/vista-previa/reportes"
            className="mt-4 inline-block text-sm font-bold text-fuchsia-800 underline"
          >
            Ver reportes de demostración
          </Link>
        </section>
      </main>
    );
  }

  const parametros = await searchParams;
  const clienteId = parametros.clienteId;

  if (
    typeof clienteId !== "string" ||
    !FORMATO_ID.test(clienteId)
  ) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6">
        <Link
          href="/admin/pruebas-alimentos/clientes"
          className="text-sm font-semibold text-fuchsia-700 hover:underline"
        >
          ← Volver a clientes
        </Link>

        <h1 className="text-2xl font-bold text-slate-900">
          Selecciona un cliente
        </h1>

        <p className="text-sm text-slate-600">
          Abre el reporte individual desde el
          listado de enlaces de clientes.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 pb-12 sm:p-6">
      <Link
        href="/admin/pruebas-alimentos/clientes"
        className="text-sm font-semibold text-fuchsia-700 hover:underline"
      >
        ← Volver a clientes
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-700">
          DioxiLife Bolivia · Administración
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Reporte de pruebas de alimentos
        </h1>
      </header>

      <ReporteIndividualAdminCliente
        clienteId={clienteId}
      />
    </main>
  );
}
