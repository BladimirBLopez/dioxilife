export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";

function dinero(valor: unknown) {
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(String(valor ?? 0)));
}

function estiloEstado(estado: string) {
  switch (estado) {
    case "NUEVO":
      return "bg-yellow-100 text-yellow-700";

    case "CONFIRMADO":
      return "bg-blue-100 text-blue-700";

    case "PAGO_REPORTADO":
      return "bg-orange-100 text-orange-700";

    case "PAGADO":
      return "bg-green-100 text-green-700";

    case "COMPLETADO":
      return "bg-emerald-100 text-emerald-700";

    case "CANCELADO":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default async function PedidosAdminPage() {
  const [
    total,
    nuevos,
    confirmados,
    pagosReportados,
    pagados,
    completados,
    cancelados,
    pedidos,
  ] = await Promise.all([
    prisma.pedido.count(),

    prisma.pedido.count({
      where: {
        estado: "NUEVO",
      },
    }),

    prisma.pedido.count({
      where: {
        estado: "CONFIRMADO",
      },
    }),

    prisma.pedido.count({
      where: {
        estado: "PAGO_REPORTADO",
      },
    }),

    prisma.pedido.count({
      where: {
        estado: "PAGADO",
      },
    }),

    prisma.pedido.count({
      where: {
        estado: "COMPLETADO",
      },
    }),

    prisma.pedido.count({
      where: {
        estado: "CANCELADO",
      },
    }),

    prisma.pedido.findMany({
      orderBy: {
        createdAt: "desc",
      },

      take: 100,

      select: {
        id: true,
        codigo: true,
        estado: true,

        nombreCliente: true,
        telefonoCliente: true,

        total: true,
        totalCV: true,
        totalPV: true,

        requiereCotizacion: true,

        createdAt: true,

        miembro: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            codigoReferido: true,
          },
        },

        _count: {
          select: {
            detalles: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <h1 className="text-2xl font-semibold">
            Pedidos
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Gestiona los pedidos registrados desde la tienda DioxiLife.
          </p>
        </div>

        <div className="text-sm text-gray-500">
          {total} pedido{total === 1 ? "" : "s"}
        </div>

      </div>


      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">

        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Nuevos
          </p>

          <p className="mt-1 text-2xl font-bold text-yellow-600">
            {nuevos}
          </p>
        </div>


        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Confirmados
          </p>

          <p className="mt-1 text-2xl font-bold text-blue-600">
            {confirmados}
          </p>
        </div>


        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Pagos reportados
          </p>

          <p className="mt-1 text-2xl font-bold text-orange-600">
            {pagosReportados}
          </p>
        </div>


        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Pagados
          </p>

          <p className="mt-1 text-2xl font-bold text-green-600">
            {pagados}
          </p>
        </div>


        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Completados
          </p>

          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {completados}
          </p>
        </div>


        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Cancelados
          </p>

          <p className="mt-1 text-2xl font-bold text-red-600">
            {cancelados}
          </p>
        </div>

      </div>


      <div className="overflow-hidden rounded-xl bg-white shadow">

        <div className="border-b p-5">

          <h2 className="text-lg font-semibold">
            Historial de pedidos
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Los pedidos más recientes aparecen primero.
          </p>

        </div>


        {pedidos.length === 0 ? (

          <div className="p-10 text-center">

            <p className="font-semibold">
              Todavía no existen pedidos.
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Los pedidos realizados desde la tienda aparecerán aquí.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px] text-left text-sm">

              <thead className="bg-gray-50 text-gray-600">

                <tr>

                  <th className="px-4 py-3">
                    Pedido
                  </th>

                  <th className="px-4 py-3">
                    Cliente / miembro
                  </th>

                  <th className="px-4 py-3">
                    Productos
                  </th>

                  <th className="px-4 py-3">
                    Total
                  </th>

                  <th className="px-4 py-3">
                    CV
                  </th>

                  <th className="px-4 py-3">
                    PV
                  </th>

                  <th className="px-4 py-3">
                    Estado
                  </th>

                  <th className="px-4 py-3">
                    Fecha
                  </th>

                  <th className="px-4 py-3">
                    Acción
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y">

                {pedidos.map((pedido) => (

                  <tr
                    key={pedido.id}
                    className="hover:bg-gray-50"
                  >

                    <td className="px-4 py-4">

                      <p className="font-mono font-semibold">
                        {pedido.codigo}
                      </p>

                      {pedido.requiereCotizacion && (
                        <p className="mt-1 text-xs font-medium text-orange-600">
                          Requiere cotización
                        </p>
                      )}

                    </td>


                    <td className="px-4 py-4">

                      {pedido.miembro ? (

                        <div>

                          <p className="font-medium">
                            {pedido.miembro.nombres}
                            {pedido.miembro.apellidos
                              ? ` ${pedido.miembro.apellidos}`
                              : ""}
                          </p>

                          <p className="mt-1 font-mono text-xs text-gray-400">
                            {pedido.miembro.codigoReferido}
                          </p>

                        </div>

                      ) : pedido.nombreCliente ? (

                        <div>

                          <p className="font-medium">
                            {pedido.nombreCliente}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {pedido.telefonoCliente || "Cliente"}
                          </p>

                        </div>

                      ) : (

                        <span className="text-gray-400">
                          Cliente anónimo
                        </span>

                      )}

                    </td>


                    <td className="px-4 py-4">
                      {pedido._count.detalles}
                    </td>


                    <td className="px-4 py-4 font-semibold">
                      Bs {dinero(pedido.total)}
                    </td>


                    <td className="px-4 py-4">
                      Bs {dinero(pedido.totalCV)}
                    </td>


                    <td className="px-4 py-4">
                      {dinero(pedido.totalPV)} PV
                    </td>


                    <td className="px-4 py-4">

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estiloEstado(
                          pedido.estado
                        )}`}
                      >
                        {pedido.estado}
                      </span>

                    </td>


                    <td className="px-4 py-4 text-gray-500">

                      {new Date(
                        pedido.createdAt
                      ).toLocaleDateString("es-BO")}

                    </td>


                    <td className="px-4 py-4">

                      <Link
                        href={`/admin/pedidos/${pedido.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Ver pedido
                      </Link>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}
