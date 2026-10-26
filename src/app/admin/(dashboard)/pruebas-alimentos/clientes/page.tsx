import { pruebasAlimentosHabilitadas } from "@/lib/pruebas-alimentos/activacion";
import Link from "next/link";
import VistaPreviaGestionClientes from
  "@/components/pruebas-alimentos/VistaPreviaGestionClientes";

import GestionEnlacesCliente from
  "@/components/pruebas-alimentos/GestionEnlacesCliente";

export const dynamic = "force-dynamic";

/**
 * La interfaz real permanece deshabilitada.
 * No cambiar a true antes de las pruebas finales
 * y de autorizar la activación del backend.
 */
const GESTION_ENLACES_REAL_HABILITADA = pruebasAlimentosHabilitadas();

export default function PruebasAlimentosClientesPage() {
  if (GESTION_ENLACES_REAL_HABILITADA) {
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
            DioxiLife Bolivia · Administración
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Gestionar enlaces privados
          </h1>
        </header>

        <GestionEnlacesCliente />
      </main>
    );
  }

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
          DioxiLife Bolivia · Administración
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Clientes y enlaces privados
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Prepara el acceso personalizado que
          posteriormente podrás compartir
          por WhatsApp, sin exigir inicio de sesión.
        </p>
      </header>

      <VistaPreviaGestionClientes />
    </main>
  );
}
