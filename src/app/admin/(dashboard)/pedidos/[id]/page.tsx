export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AccionesPedido from "../AccionesPedido";

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

export default async function DetallePedidoPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const pedido =
    await prisma.pedido.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        codigo: true,
        estado: true,

        nombreCliente: true,
        telefonoCliente: true,
        observaciones: true,

        total: true,
        totalCV: true,
        totalPV: true,

        requiereCotizacion: true,

        createdAt: true,
        updatedAt: true,

        miembro: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            email: true,
            codigoReferido: true,
          },
        },

        detalles: {
          orderBy: {
            createdAt: "asc",
          },

          select: {
            id: true,
            productoId: true,
            nombreProducto: true,
            cantidad: true,

            precioUnitario: true,
            mostrarPrecio: true,

            generaComision: true,
            valorComisionable: true,
            puntosVolumen: true,

            subtotal: true,
            subtotalCV: true,
            subtotalPV: true,
          },
        },
      },
    });

  if (!pedido) {
    notFound();
  }

  return (
    <div className="space-y-6">

      <div>

        <Link
          href="/admin/pedidos"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Volver a pedidos
        </Link>


        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-semibold">
              Pedido {pedido.codigo}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Registrado el{" "}
              {new Date(
                pedido.createdAt
              ).toLocaleString("es-BO")}
            </p>
          </div>


          <span
            className={`w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${estiloEstado(
              pedido.estado
            )}`}
          >
            {pedido.estado}
          </span>

        </div>

      </div>


      <div className="grid gap-4 md:grid-cols-4">

        <div className="rounded-xl bg-white p-5 shadow">

          <p className="text-sm text-gray-500">
            Total
          </p>

          <p className="mt-2 text-2xl font-bold">
            Bs {dinero(pedido.total)}
          </p>

        </div>


        <div className="rounded-xl bg-white p-5 shadow">

          <p className="text-sm text-gray-500">
            CV total
          </p>

          <p className="mt-2 text-2xl font-bold text-green-700">
            Bs {dinero(pedido.totalCV)}
          </p>

        </div>


        <div className="rounded-xl bg-white p-5 shadow">

          <p className="text-sm text-gray-500">
            PV total
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-700">
            {dinero(pedido.totalPV)}
          </p>

        </div>


        <div className="rounded-xl bg-white p-5 shadow">

          <p className="text-sm text-gray-500">
            Productos
          </p>

          <p className="mt-2 text-2xl font-bold">
            {pedido.detalles.reduce(
              (total, detalle) =>
                total + detalle.cantidad,
              0
            )}
          </p>

        </div>

      </div>


      <div className="grid gap-4 md:grid-cols-2">

        <div className="rounded-xl bg-white p-5 shadow">

          <h2 className="mb-4 text-lg font-semibold">
            Cliente
          </h2>

          {pedido.miembro ? (

            <div className="space-y-2">

              <p className="font-semibold">
                {pedido.miembro.nombres}
                {pedido.miembro.apellidos
                  ? ` ${pedido.miembro.apellidos}`
                  : ""}
              </p>

              <p className="text-sm text-gray-500">
                {pedido.miembro.email}
              </p>

              <p className="font-mono text-sm text-gray-500">
                {pedido.miembro.codigoReferido}
              </p>

              <Link
                href={`/admin/multinivel/${pedido.miembro.id}`}
                className="inline-block pt-2 text-sm font-medium text-blue-600 hover:underline"
              >
                Ver miembro
              </Link>

            </div>

          ) : (

            <div className="space-y-2">

              <p className="font-medium">
                {pedido.nombreCliente ||
                  "Cliente anónimo"}
              </p>

              {pedido.telefonoCliente && (
                <p className="text-sm text-gray-500">
                  {pedido.telefonoCliente}
                </p>
              )}

              <p className="text-sm text-orange-600">
                Pedido no asociado a un miembro.
              </p>

            </div>

          )}

        </div>


        <div className="rounded-xl bg-white p-5 shadow">

          <h2 className="mb-4 text-lg font-semibold">
            Información del pedido
          </h2>

          <div className="space-y-3 text-sm">

            <div>
              <p className="text-gray-500">
                Código
              </p>

              <p className="font-mono font-semibold">
                {pedido.codigo}
              </p>
            </div>


            <div>
              <p className="text-gray-500">
                Cotización
              </p>

              <p className="font-medium">
                {pedido.requiereCotizacion
                  ? "Requiere revisar precios"
                  : "No requerida"}
              </p>
            </div>


            {pedido.observaciones && (
              <div>
                <p className="text-gray-500">
                  Observaciones
                </p>

                <p>
                  {pedido.observaciones}
                </p>
              </div>
            )}

          </div>

        </div>

      </div>


      <div className="overflow-hidden rounded-xl bg-white shadow">

        <div className="border-b p-5">

          <h2 className="text-lg font-semibold">
            Productos del pedido
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Los valores mostrados son históricos y corresponden al momento de la compra.
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full min-w-[1000px] text-left text-sm">

            <thead className="bg-gray-50 text-gray-600">

              <tr>

                <th className="px-4 py-3">
                  Producto
                </th>

                <th className="px-4 py-3">
                  Cantidad
                </th>

                <th className="px-4 py-3">
                  Precio
                </th>

                <th className="px-4 py-3">
                  CV unitario
                </th>

                <th className="px-4 py-3">
                  PV unitario
                </th>

                <th className="px-4 py-3">
                  Subtotal
                </th>

                <th className="px-4 py-3">
                  CV total
                </th>

                <th className="px-4 py-3">
                  PV total
                </th>

              </tr>

            </thead>


            <tbody className="divide-y">

              {pedido.detalles.map(
                (detalle) => (

                  <tr
                    key={detalle.id}
                    className="hover:bg-gray-50"
                  >

                    <td className="px-4 py-4">

                      <p className="font-medium">
                        {detalle.nombreProducto}
                      </p>

                      {detalle.generaComision ? (
                        <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          Multinivel
                        </span>
                      ) : (
                        <span className="mt-1 inline-block text-xs text-gray-400">
                          Sin comisión
                        </span>
                      )}

                    </td>


                    <td className="px-4 py-4">
                      {detalle.cantidad}
                    </td>


                    <td className="px-4 py-4">
                      {detalle.mostrarPrecio
                        ? `Bs ${dinero(
                            detalle.precioUnitario
                          )}`
                        : "A consultar"}
                    </td>


                    <td className="px-4 py-4">
                      Bs{" "}
                      {dinero(
                        detalle.valorComisionable
                      )}
                    </td>


                    <td className="px-4 py-4">
                      {dinero(
                        detalle.puntosVolumen
                      )}
                    </td>


                    <td className="px-4 py-4 font-semibold">
                      Bs{" "}
                      {dinero(
                        detalle.subtotal
                      )}
                    </td>


                    <td className="px-4 py-4 font-semibold text-green-700">
                      Bs{" "}
                      {dinero(
                        detalle.subtotalCV
                      )}
                    </td>


                    <td className="px-4 py-4 font-semibold text-blue-700">
                      {dinero(
                        detalle.subtotalPV
                      )}
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>


      <div className="rounded-xl bg-white p-5 shadow">

        <h2 className="mb-4 text-lg font-semibold">
          Gestión del pedido
        </h2>

        {pedido.estado === "PAGADO" &&
          !pedido.miembro && (
            <div className="mb-4 rounded-lg bg-orange-50 p-4 text-sm text-orange-700">
              Este pedido no está asociado a un miembro. Actualmente no generará PV ni comisiones multinivel.
            </div>
          )}


        <AccionesPedido
          id={pedido.id}
          estado={pedido.estado}
        />

      </div>

    </div>
  );
}
