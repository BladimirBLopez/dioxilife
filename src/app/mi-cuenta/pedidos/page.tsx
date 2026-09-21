export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";
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

export default async function MisPedidosPage() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "miembro_token"
    )?.value;

  if (!token) {
    redirect("/login-miembro");
  }

  const sesion =
    await verificarSesion(token);

  if (
    !sesion ||
    typeof sesion.usuario !== "string"
  ) {
    redirect("/login-miembro");
  }

  const miembro =
    await prisma.miembro.findUnique({
      where: {
        id: sesion.usuario,
      },

      select: {
        id: true,
        nombres: true,
        estado: true,
      },
    });

  if (
    !miembro ||
    miembro.estado !== "ACTIVO"
  ) {
    redirect("/login-miembro");
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

  const totalVentas =
    pedidos.length;

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

  const pagados =
    pedidos.filter(
      (pedido) =>
        pedido.estado ===
        "PAGADO" ||
        pedido.estado ===
        "COMPLETADO"
    ).length;

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">

      <div className="mx-auto max-w-6xl space-y-6">

        <div>

          <Link
            href="/mi-cuenta"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Volver a mi cuenta
          </Link>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Mis ventas
          </h1>

          <p className="mt-2 text-gray-500">
            Pedidos realizados mediante tu enlace personal de ventas.
          </p>

        </div>


        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <div className="rounded-xl bg-white p-4 shadow">

            <p className="text-sm text-gray-500">
              Total
            </p>

            <p className="mt-1 text-2xl font-bold">
              {totalVentas}
            </p>

          </div>


          <div className="rounded-xl bg-white p-4 shadow">

            <p className="text-sm text-gray-500">
              Por reportar
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-600">
              {confirmados}
            </p>

          </div>


          <div className="rounded-xl bg-white p-4 shadow">

            <p className="text-sm text-gray-500">
              Pago reportado
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

        </div>


        <div className="overflow-hidden rounded-xl bg-white shadow">

          <div className="border-b p-5">

            <h2 className="text-lg font-semibold">
              Pedidos atribuidos a {miembro.nombres}
            </h2>

          </div>


          {pedidos.length === 0 ? (

            <div className="p-10 text-center">

              <p className="font-semibold">
                Todavía no tienes ventas atribuidas.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Los pedidos realizados desde tu enlace aparecerán aquí.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px] text-left text-sm">

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


                <tbody className="divide-y">

                  {pedidos.map(
                    (pedido) => (

                      <tr
                        key={pedido.id}
                        className="hover:bg-gray-50"
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
                              "Cliente"}
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
                          Bs {dinero(pedido.total)}
                        </td>


                        <td className="px-4 py-4">
                          Bs {dinero(pedido.totalCV)}
                        </td>


                        <td className="px-4 py-4">
                          {dinero(pedido.totalPV)}
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


                        <td className="px-4 py-4">

                          {pedido.estado ===
                          "CONFIRMADO" ? (

                            <form
                              action={reportarPago.bind(
                                null,
                                pedido.id
                              )}
                            >
                              <button
                                type="submit"
                                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                              >
                                Reportar pago
                              </button>
                            </form>

                          ) : pedido.estado ===
                            "PAGO_REPORTADO" ? (

                            <span className="text-sm font-medium text-orange-600">
                              En revisión
                            </span>

                          ) : pedido.estado ===
                            "PAGADO" ||
                            pedido.estado ===
                              "COMPLETADO" ? (

                            <span className="text-sm font-medium text-green-600">
                              Pago aprobado
                            </span>

                          ) : (

                            <span className="text-sm text-gray-400">
                              Sin acción
                            </span>

                          )}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </main>
  );
}
