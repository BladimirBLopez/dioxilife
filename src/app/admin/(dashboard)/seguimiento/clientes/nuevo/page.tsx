export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NuevoSeguimientoForm from "@/components/admin/seguimiento/NuevoSeguimientoForm";

export default async function NuevoSeguimientoPage() {
  const planes =
    await prisma.planSeguimiento.findMany({
      where: {
        estado: "ACTIVO",
        actividades: {
          some: {
            activo: true,
          },
        },
      },

      orderBy: {
        nombre: "asc",
      },

      select: {
        id: true,
        nombre: true,
        duracionDias: true,
      },
    });

  return (
    <div className="space-y-6">

      <div>
        <Link
          href="/admin/seguimiento/clientes"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Volver a clientes
        </Link>

        <h1 className="mt-3 text-2xl font-semibold text-gray-900">
          Nuevo seguimiento
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Registra rápidamente un cliente que llegó por WhatsApp, llamada, tienda u otro canal.
        </p>
      </div>

      <NuevoSeguimientoForm
        planes={planes}
      />

    </div>
  );
}
