import type { Metadata } from "next";
import { notFound } from "next/navigation";

import FormularioClientePruebaAlimento from
  "@/components/pruebas-alimentos/FormularioClientePruebaAlimento";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bloqueo independiente de las API.
 * No activar sin autorización y auditoría final.
 */
const FORMULARIO_CLIENTE_HABILITADO = false;

export const metadata: Metadata = {
  title: "Pruebas de alimentos | DioxiLife Bolivia",
  description: "Acceso privado a pruebas de alimentos.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
  referrer: "no-referrer",
};

type Propiedades = {
  params: Promise<{
    token: string;
  }>;
};

/**
 * Página pública de acceso individual.
 *
 * La comprobación actual solo valida el formato.
 * NO autoriza todavía el acceso a datos médicos.
 *
 * Cuando se habilite Neon:
 * 1. Obtener el hash del token.
 * 2. Buscar un acceso vigente y no revocado.
 * 3. Aplicar controles de abuso.
 * 4. Mostrar exclusivamente datos del cliente.
 *
 * Por ahora ningún token permite abrir el formulario.
 */
export default async function PruebaAlimentoPublicaPage({
  params,
}: Propiedades) {
  const { token } = await params;

  if (!/^[0-9a-f]{64}$/.test(token)) {
    notFound();
  }

  /*
   * Cuando sea autorizado:
   * la API GET verificará la identidad,
   * vencimiento, revocación y cuota antes
   * de devolver cualquier medición.
   *
   * Con el bloqueo en false no se monta
   * el formulario del cliente.
   */
  if (FORMULARIO_CLIENTE_HABILITADO) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-10 sm:px-6">
        <FormularioClientePruebaAlimento
          token={token}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-700">
          DioxiLife Bolivia
        </p>

        <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
          Mi respuesta a los alimentos
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Este espacio permitirá registrar cómo cambia
          tu glucosa después de consumir alimentos.
        </p>

        <div
          role="status"
          className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4"
        >
          <h2 className="font-bold text-amber-950">
            Acceso todavía no habilitado
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-900">
            El módulo se encuentra en preparación.
            Por seguridad, todavía no es posible
            consultar ni guardar mediciones.
          </p>
        </div>

        <section className="mt-7">
          <h2 className="text-lg font-bold text-slate-900">
            ¿Qué podrás registrar?
          </h2>

          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            <li>Glucosa en ayunas.</li>
            <li>Glucosa antes de comer.</li>
            <li>Alimento y cantidad consumida.</li>
            <li>Hora de inicio de la comida.</li>
            <li>Glucosa dos horas después.</li>
            <li>Historial y gráficas de tus mediciones.</li>
          </ul>
        </section>

        <div className="mt-7 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
          Cuando esté habilitado, tu enlace será
          personal y tendrá una fecha de vencimiento.
          Evita compartirlo con otras personas.
        </div>
      </div>
    </main>
  );
}
