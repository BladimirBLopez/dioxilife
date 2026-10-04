export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";

function estiloEstado(estado: string) {
  switch (estado) {
    case "PENDIENTE":
      return "bg-amber-100 text-amber-700";
    case "ACTIVO":
      return "bg-green-100 text-green-700";
    case "PAUSADO":
      return "bg-orange-100 text-orange-700";
    case "COMPLETADO":
      return "bg-blue-100 text-blue-700";
    case "CANCELADO":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function fecha(valor: Date | null) {
  if (!valor) {
    return "—";
  }

  return valor.toLocaleDateString("es-BO", {
    timeZone: "UTC",
  });
}

export default async function SeguimientosClientesPage() {
  const seguimientos =
    await prisma.seguimientoCliente.findMany({
      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        nombreCliente: true,
        telefonoCliente: true,
        nombrePlan: true,
        duracionDias: true,
        estado: true,
        fechaInicioPrevista: true,
        origen: true,
        referenciaCompra: true,

        pedido: {
          select: {
            id: true,
            codigo: true,
          },
        },

        _count: {
          select: {
            actividades: true,
          },
        },
      },
    });

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Seguimiento de clientes
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Agendas individuales asignadas a cada cliente.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/seguimiento/grupos"
            className="inline-flex items-center justify-center rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
          >
            Grupos
          </Link>

          <Link
            href="/admin/seguimiento/clientes/nuevo"
            className="inline-flex items-center justify-center rounded-xl bg-brand-pink px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            + Nuevo seguimiento
          </Link>
        </div>

      </div>

      {seguimientos.length === 0 ? (

        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow">
          <p className="font-semibold text-gray-800">
            Todavía no hay seguimientos asignados
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Aparecerán aquí los seguimientos creados desde pedidos o registrados manualmente.
          </p>
        </div>

      ) : (

        <div className="overflow-hidden rounded-xl bg-white shadow">
          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-left text-sm">

              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Plantilla</th>
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Inicio previsto</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Actividades</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>

              <tbody className="divide-y">

                {seguimientos.map((seguimiento) => (
                  <tr
                    key={seguimiento.id}
                    className="hover:bg-gray-50"
                  >

                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">
                        {seguimiento.nombreCliente || "Cliente sin nombre"}
                      </p>

                      {seguimiento.telefonoCliente && (
                        <div className="mt-2 space-y-2">

                          <p className="text-xs text-gray-500">
                            {seguimiento.telefonoCliente}
                          </p>

                          <a
                            href={`https://wa.me/591${seguimiento.telefonoCliente.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            WhatsApp
                          </a>

                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">
                        {seguimiento.nombrePlan}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {seguimiento.duracionDias} días
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      {seguimiento.pedido ? (
                        <Link
                          href={`/admin/pedidos/${seguimiento.pedido.id}`}
                          className="font-mono font-semibold text-blue-600 hover:underline"
                        >
                          {seguimiento.pedido.codigo}
                        </Link>
                      ) : (
                        <div>
                          <p className="font-medium text-gray-700">
                            {seguimiento.origen === "WHATSAPP"
                              ? "WhatsApp"
                              : seguimiento.origen === "LLAMADA"
                              ? "Llamada"
                              : seguimiento.origen === "TIENDA"
                              ? "Tienda"
                              : seguimiento.origen === "PEDIDO_WEB"
                              ? "Pedido web"
                              : "Otro"}
                          </p>

                          {seguimiento.referenciaCompra && (
                            <p className="mt-1 max-w-[220px] truncate text-xs text-gray-500">
                              {seguimiento.referenciaCompra}
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {fecha(seguimiento.fechaInicioPrevista)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estiloEstado(
                          seguimiento.estado
                        )}`}
                      >
                        {seguimiento.estado}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {seguimiento._count.actividades}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/admin/seguimiento/clientes/${seguimiento.id}`}
                        className="font-semibold text-violet-600 hover:underline"
                      >
                        Administrar
                      </Link>
                    </td>

                  </tr>
                ))}

              </tbody>
            </table>

          </div>
        </div>

      )}

    </div>
  );
}
