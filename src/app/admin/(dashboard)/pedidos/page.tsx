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

function nombrePersona(
  persona:
    | {
        nombres: string;
        apellidos: string | null;
      }
    | null
) {
  if (!persona) {
    return "";
  }

  return [
    persona.nombres,
    persona.apellidos,
  ]
    .filter(Boolean)
    .join(" ");
}

export default async function PedidosAdminPage() {
  const [
    total,
    montoPedidos,
    nuevos,
    confirmados,
    pagosReportados,
    pagados,
    completados,
    cancelados,
    pedidos,
  ] = await Promise.all([
    prisma.pedido.count(),

    prisma.pedido.aggregate({
      where: {
        estado: {
          not: "CANCELADO",
        },
      },

      _sum: {
        total: true,
      },
    }),

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

        referidoPor: {
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
            Control general de los pedidos registrados en DioxiLife.
          </p>
        </div>

      </div>


      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Total pedidos
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {total}
          </p>
        </div>


        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Monto pedidos
          </p>

          <p className="mt-1 text-xl font-bold text-gray-900">
            Bs {dinero(
              montoPedidos._sum.total
            )}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            No incluye cancelados
          </p>
        </div>


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
            Comprador y vendedor se muestran por separado para evitar confusiones.
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

          <>
            <div className="divide-y md:hidden">

              {pedidos.map((pedido) => (

                <div
                  key={pedido.id}
                  className="p-4"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <p className="font-mono font-bold text-gray-900">
                        {pedido.codigo}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(
                          pedido.createdAt
                        ).toLocaleDateString(
                          "es-BO"
                        )}
                      </p>

                    </div>


                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${estiloEstado(
                        pedido.estado
                      )}`}
                    >
                      {pedido.estado}
                    </span>

                  </div>


                  {pedido.requiereCotizacion && (

                    <p className="mt-2 text-xs font-semibold text-orange-600">
                      Requiere cotización
                    </p>

                  )}


                  <div className="mt-4 grid grid-cols-2 gap-4">

                    <div>

                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Comprador
                      </p>

                      {pedido.miembro ? (

                        <>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {nombrePersona(
                              pedido.miembro
                            )}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500">
                            Miembro DioxiLife
                          </p>
                        </>

                      ) : pedido.nombreCliente ? (

                        <>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {pedido.nombreCliente}
                          </p>

                          {pedido.telefonoCliente && (
                            <p className="mt-0.5 text-xs text-gray-500">
                              {pedido.telefonoCliente}
                            </p>
                          )}
                        </>

                      ) : (

                        <p className="mt-1 text-sm text-gray-500">
                          Cliente externo
                        </p>

                      )}

                    </div>


                    <div>

                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Vendedor
                      </p>

                      {pedido.referidoPor ? (

                        <>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {nombrePersona(
                              pedido.referidoPor
                            )}
                          </p>

                          <p className="mt-0.5 font-mono text-xs text-blue-600">
                            {pedido.referidoPor.codigoReferido}
                          </p>
                        </>

                      ) : (

                        <p className="mt-1 text-sm text-gray-500">
                          Venta directa DioxiLife
                        </p>

                      )}

                    </div>

                  </div>


                  <div className="mt-4 grid grid-cols-4 gap-2 rounded-xl bg-gray-50 p-3">

                    <div>
                      <p className="text-[11px] text-gray-400">
                        Productos
                      </p>

                      <p className="mt-1 text-sm font-bold">
                        {pedido._count.detalles}
                      </p>
                    </div>


                    <div>
                      <p className="text-[11px] text-gray-400">
                        Total
                      </p>

                      <p className="mt-1 text-sm font-bold">
                        Bs {dinero(
                          pedido.total
                        )}
                      </p>
                    </div>


                    <div>
                      <p className="text-[11px] text-gray-400">
                        CV
                      </p>

                      <p className="mt-1 text-sm font-bold">
                        {dinero(
                          pedido.totalCV
                        )}
                      </p>
                    </div>


                    <div>
                      <p className="text-[11px] text-gray-400">
                        PV
                      </p>

                      <p className="mt-1 text-sm font-bold">
                        {dinero(
                          pedido.totalPV
                        )}
                      </p>
                    </div>

                  </div>


                  <Link
                    href={`/admin/pedidos/${pedido.id}`}
                    className="mt-4 flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Ver detalle
                  </Link>

                </div>

              ))}

            </div>


            <div className="hidden overflow-x-auto md:block">

              <table className="w-full min-w-[1200px] text-left text-sm">

                <thead className="bg-gray-50 text-gray-600">

                  <tr>

                    <th className="px-4 py-3">
                      Pedido
                    </th>

                    <th className="px-4 py-3">
                      Comprador
                    </th>

                    <th className="px-4 py-3">
                      Vendedor
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
                              {nombrePersona(
                                pedido.miembro
                              )}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              Miembro DioxiLife
                            </p>

                          </div>

                        ) : pedido.nombreCliente ? (

                          <div>

                            <p className="font-medium">
                              {pedido.nombreCliente}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {pedido.telefonoCliente ||
                                "Cliente externo"}
                            </p>

                          </div>

                        ) : (

                          <span className="text-gray-400">
                            Cliente externo
                          </span>

                        )}

                      </td>


                      <td className="px-4 py-4">

                        {pedido.referidoPor ? (

                          <div>

                            <p className="font-medium">
                              {nombrePersona(
                                pedido.referidoPor
                              )}
                            </p>

                            <p className="mt-1 font-mono text-xs text-blue-600">
                              {pedido.referidoPor.codigoReferido}
                            </p>

                          </div>

                        ) : (

                          <span className="text-gray-400">
                            Venta directa DioxiLife
                          </span>

                        )}

                      </td>


                      <td className="px-4 py-4">
                        {pedido._count.detalles}
                      </td>


                      <td className="px-4 py-4 font-semibold">
                        Bs {dinero(
                          pedido.total
                        )}
                      </td>


                      <td className="px-4 py-4">
                        {dinero(
                          pedido.totalCV
                        )}
                      </td>


                      <td className="px-4 py-4">
                        {dinero(
                          pedido.totalPV
                        )}
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
                        ).toLocaleDateString(
                          "es-BO"
                        )}

                      </td>


                      <td className="px-4 py-4">

                        <Link
                          href={`/admin/pedidos/${pedido.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          Ver detalle
                        </Link>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </>

        )}

      </div>

    </div>
  );
}
