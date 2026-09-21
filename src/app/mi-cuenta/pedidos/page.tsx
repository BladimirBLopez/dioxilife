export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerMiembroActual } from "@/lib/miembro-auth";
import { reportarPago } from "./acciones";

function dinero(valor: unknown) {
  return new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    Number(String(valor ?? 0))
  );
}

function estiloEstado(
  estado: string
) {
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

function textoEstado(
  estado: string
) {
  switch (estado) {
    case "NUEVO":
      return "Nuevo";

    case "CONFIRMADO":
      return "Confirmado";

    case "PAGO_REPORTADO":
      return "Pago reportado";

    case "PAGADO":
      return "Pagado";

    case "COMPLETADO":
      return "Completado";

    case "CANCELADO":
      return "Cancelado";

    default:
      return estado;
  }
}

export default async function MisPedidosPage() {
  const miembro =
    await obtenerMiembroActual();

  if (!miembro) {
    redirect(
      "/login-miembro"
    );
  }

  const pedidos =
    await prisma.pedido.findMany({
      where: {
        referidoPorId:
          miembro.id,
      },

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        codigo: true,
        estado: true,

        nombreCliente: true,
        telefonoCliente: true,

        total: true,
        totalCV: true,
        totalPV: true,

        createdAt: true,

        _count: {
          select: {
            detalles: true,
          },
        },
      },
    });

  const pedidosActivos =
    pedidos.filter(
      (pedido) =>
        pedido.estado !==
        "CANCELADO"
    );

  const totalVentas =
    pedidosActivos.length;

  const montoPedidos =
    pedidosActivos.reduce(
      (total, pedido) =>
        total +
        Number(
          String(pedido.total)
        ),
      0
    );

  const confirmados =
    pedidos.filter(
      (pedido) =>
        pedido.estado ===
        "CONFIRMADO"
    ).length;

  const pagosReportados =
    pedidos.filter(
      (pedido) =>
        pedido.estado ===
        "PAGO_REPORTADO"
    ).length;

  const montoPagado =
    pedidos
      .filter(
        (pedido) =>
          pedido.estado ===
            "PAGADO" ||
          pedido.estado ===
            "COMPLETADO"
      )
      .reduce(
        (total, pedido) =>
          total +
          Number(
            String(pedido.total)
          ),
        0
      );

  return (
    <div className="p-4 md:p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-sm font-medium text-blue-600">
              Panel del distribuidor
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">
              Mis ventas
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Gestiona los pedidos realizados mediante tu enlace personal.
            </p>

          </div>


          <Link
            href="/mi-cuenta"
            className="w-fit rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            ← Volver al inicio
          </Link>

        </div>


        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <div className="rounded-2xl bg-white p-5 shadow">

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Ventas
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalVentas}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Pedidos no cancelados
            </p>

          </div>


          <div className="rounded-2xl bg-white p-5 shadow">

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Monto pedidos
            </p>

            <p className="mt-2 text-xl font-bold text-gray-900">
              Bs {dinero(
                montoPedidos
              )}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Antes de validar pagos
            </p>

          </div>


          <div className="rounded-2xl bg-white p-5 shadow">

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Por reportar
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600">
              {confirmados}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Pedidos confirmados
            </p>

          </div>


          <div className="rounded-2xl bg-white p-5 shadow">

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Ventas pagadas
            </p>

            <p className="mt-2 text-xl font-bold text-green-600">
              Bs {dinero(
                montoPagado
              )}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Pago aprobado
            </p>

          </div>

        </section>


        {pagosReportados > 0 && (

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">

            <p className="font-semibold text-orange-800">
              {pagosReportados} pago
              {pagosReportados === 1
                ? ""
                : "s"}{" "}
              reportado
              {pagosReportados === 1
                ? ""
                : "s"}
            </p>

            <p className="mt-1 text-sm text-orange-700">
              DioxiLife está verificando estos pagos.
            </p>

          </div>

        )}


        <section className="overflow-hidden rounded-2xl bg-white shadow">

          <div className="border-b border-gray-100 p-5">

            <h2 className="text-lg font-bold text-gray-900">
              Historial de ventas
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Los pedidos más recientes aparecen primero.
            </p>

          </div>


          {pedidos.length === 0 ? (

            <div className="p-10 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                >
                  <path d="M5 7h14l-1 13H6L5 7Z" />
                  <path d="M9 7V5a3 3 0 0 1 6 0v2" />
                </svg>

              </div>

              <p className="mt-4 font-semibold text-gray-700">
                Todavía no tienes ventas atribuidas.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Comparte tu enlace de ventas para comenzar.
              </p>

            </div>

          ) : (

            <>
              <div className="divide-y divide-gray-100 md:hidden">

                {pedidos.map(
                  (pedido) => (

                    <article
                      key={pedido.id}
                      className="p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <p className="font-mono text-sm font-bold text-gray-900">
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
                          {textoEstado(
                            pedido.estado
                          )}
                        </span>

                      </div>


                      <div className="mt-4">

                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Cliente
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {pedido.nombreCliente ||
                            "Cliente externo"}
                        </p>

                        {pedido.telefonoCliente && (

                          <p className="mt-1 text-sm text-gray-500">
                            {pedido.telefonoCliente}
                          </p>

                        )}

                      </div>


                      <div className="mt-4 grid grid-cols-4 gap-2 rounded-xl bg-gray-50 p-3">

                        <div>

                          <p className="text-[10px] uppercase text-gray-400">
                            Productos
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900">
                            {pedido._count.detalles}
                          </p>

                        </div>


                        <div>

                          <p className="text-[10px] uppercase text-gray-400">
                            Total
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900">
                            Bs {dinero(
                              pedido.total
                            )}
                          </p>

                        </div>


                        <div>

                          <p className="text-[10px] uppercase text-gray-400">
                            CV
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900">
                            {dinero(
                              pedido.totalCV
                            )}
                          </p>

                        </div>


                        <div>

                          <p className="text-[10px] uppercase text-gray-400">
                            PV
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900">
                            {dinero(
                              pedido.totalPV
                            )}
                          </p>

                        </div>

                      </div>


                      <div className="mt-4 grid gap-2">

                        <Link
                          href={`/mi-cuenta/pedidos/${pedido.id}`}
                          className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          Gestionar pedido
                        </Link>


                        {pedido.estado ===
                          "CONFIRMADO" && (

                          <form
                            action={reportarPago.bind(
                              null,
                              pedido.id
                            )}
                          >

                            <button
                              type="submit"
                              className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
                            >
                              Reportar pago
                            </button>

                          </form>

                        )}


                        {pedido.estado ===
                          "PAGO_REPORTADO" && (

                          <div className="rounded-lg bg-orange-50 px-4 py-2.5 text-center text-sm font-medium text-orange-700">
                            Pago en revisión
                          </div>

                        )}


                        {(pedido.estado ===
                          "PAGADO" ||
                          pedido.estado ===
                            "COMPLETADO") && (

                          <div className="rounded-lg bg-green-50 px-4 py-2.5 text-center text-sm font-medium text-green-700">
                            Pago aprobado
                          </div>

                        )}

                      </div>

                    </article>

                  )
                )}

              </div>


              <div className="hidden overflow-x-auto md:block">

                <table className="w-full min-w-[1000px] text-left text-sm">

                  <thead className="bg-gray-50 text-gray-600">

                    <tr>

                      <th className="px-4 py-3">
                        Pedido
                      </th>

                      <th className="px-4 py-3">
                        Cliente
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
                        Acción
                      </th>

                    </tr>

                  </thead>


                  <tbody className="divide-y divide-gray-100">

                    {pedidos.map(
                      (pedido) => (

                        <tr
                          key={pedido.id}
                          className="transition hover:bg-gray-50"
                        >

                          <td className="px-4 py-4">

                            <p className="font-mono font-semibold">
                              {pedido.codigo}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {new Date(
                                pedido.createdAt
                              ).toLocaleDateString(
                                "es-BO"
                              )}
                            </p>

                          </td>


                          <td className="px-4 py-4">

                            <p className="font-medium">
                              {pedido.nombreCliente ||
                                "Cliente externo"}
                            </p>

                            {pedido.telefonoCliente && (

                              <p className="mt-1 text-xs text-gray-500">
                                {pedido.telefonoCliente}
                              </p>

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
                              {textoEstado(
                                pedido.estado
                              )}
                            </span>

                          </td>


                          <td className="px-4 py-4">

                            <div className="flex min-w-[150px] flex-col gap-2">

                              <Link
                                href={`/mi-cuenta/pedidos/${pedido.id}`}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                              >
                                Gestionar
                              </Link>


                              {pedido.estado ===
                                "CONFIRMADO" && (

                                <form
                                  action={reportarPago.bind(
                                    null,
                                    pedido.id
                                  )}
                                >

                                  <button
                                    type="submit"
                                    className="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                                  >
                                    Reportar pago
                                  </button>

                                </form>

                              )}

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </>

          )}

        </section>

      </div>

    </div>
  );
}
