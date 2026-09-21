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
        ciudadCliente: true,
        direccionCliente: true,
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

        referidoPor: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            email: true,
            codigoReferido: true,
          },
        },

        comisiones: {
          orderBy: {
            nivel: "asc",
          },

          select: {
            id: true,
            nivel: true,
            montoBase: true,
            porcentaje: true,
            monto: true,
            estado: true,
            concepto: true,

            beneficiario: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                codigoReferido: true,
              },
            },
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


      <div className="grid gap-4 lg:grid-cols-3">

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
                  WhatsApp: {pedido.telefonoCliente}
                </p>
              )}

              {pedido.ciudadCliente && (
                <p className="text-sm text-gray-500">
                  Ciudad: {pedido.ciudadCliente}
                </p>
              )}

              {pedido.direccionCliente && (
                <p className="text-sm text-gray-500">
                  Dirección: {pedido.direccionCliente}
                </p>
              )}

              <p className="pt-1 text-xs text-gray-400">
                Cliente externo sin cuenta DioxiLife.
              </p>

            </div>

          )}

        </div>


        <div className="rounded-xl bg-white p-5 shadow">

          <h2 className="mb-4 text-lg font-semibold">
            Venta referida por
          </h2>

          {pedido.referidoPor ? (

            <div className="space-y-2">

              <p className="font-semibold">
                {pedido.referidoPor.nombres}
                {pedido.referidoPor.apellidos
                  ? ` ${pedido.referidoPor.apellidos}`
                  : ""}
              </p>

              <p className="text-sm text-gray-500">
                {pedido.referidoPor.email}
              </p>

              <div className="inline-block rounded-lg bg-blue-50 px-3 py-2 font-mono text-sm font-semibold text-blue-700">
                {pedido.referidoPor.codigoReferido}
              </div>

              <div>
                <Link
                  href={`/admin/multinivel/${pedido.referidoPor.id}`}
                  className="inline-block pt-2 text-sm font-medium text-blue-600 hover:underline"
                >
                  Ver vendedor
                </Link>
              </div>

            </div>

          ) : (

            <div>

              <p className="text-sm font-medium text-gray-500">
                Venta directa DioxiLife
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Este pedido no llegó mediante el enlace de un vendedor.
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

        {pedido.referidoPor ? (

          <div className="mb-5 space-y-4">

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

              <p className="font-semibold text-blue-900">
                Venta atribuida a un distribuidor
              </p>

              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">

                <div>
                  <p className="text-blue-600">
                    Vendedor
                  </p>

                  <p className="mt-1 font-semibold text-blue-950">
                    {pedido.referidoPor.nombres}
                    {pedido.referidoPor.apellidos
                      ? ` ${pedido.referidoPor.apellidos}`
                      : ""}
                  </p>

                  <p className="mt-1 font-mono text-xs text-blue-600">
                    {pedido.referidoPor.codigoReferido}
                  </p>
                </div>


                <div>
                  <p className="text-blue-600">
                    CV del pedido
                  </p>

                  <p className="mt-1 font-semibold text-blue-950">
                    Bs {dinero(pedido.totalCV)}
                  </p>
                </div>


                <div>
                  <p className="text-blue-600">
                    PV del pedido
                  </p>

                  <p className="mt-1 font-semibold text-blue-950">
                    {dinero(pedido.totalPV)}
                  </p>
                </div>

              </div>

            </div>


            {pedido.estado === "PAGADO" &&
              pedido.comisiones.length > 0 && (

              <div className="rounded-xl border border-green-100 bg-green-50 p-4">

                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="font-semibold text-green-900">
                      Comisiones generadas
                    </p>

                    <p className="mt-1 text-sm text-green-700">
                      El pago fue aprobado y el plan de compensación fue procesado.
                    </p>

                  </div>


                  <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    {pedido.comisiones.length} comisión
                    {pedido.comisiones.length === 1
                      ? ""
                      : "es"}
                  </span>

                </div>


                <div className="mt-4 space-y-2">

                  {pedido.comisiones.map(
                    (comision) => (

                      <div
                        key={comision.id}
                        className="flex flex-col gap-2 rounded-lg bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                      >

                        <div>

                          <p className="font-semibold text-gray-900">
                            {comision.nivel === 0
                              ? "Comisión directa"
                              : `Nivel ${comision.nivel}`}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Beneficiario:{" "}
                            {comision.beneficiario.nombres}
                            {comision.beneficiario.apellidos
                              ? ` ${comision.beneficiario.apellidos}`
                              : ""}
                          </p>

                        </div>


                        <div className="text-left sm:text-right">

                          <p className="font-bold text-green-700">
                            Bs {dinero(comision.monto)}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {dinero(comision.porcentaje)}% sobre Bs{" "}
                            {dinero(comision.montoBase)}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-gray-600">
                            {comision.estado}
                          </p>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

            )}


            {pedido.estado === "PAGADO" &&
              Number(String(pedido.totalCV)) > 0 &&
              pedido.comisiones.length === 0 && (

              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                Este pedido tiene CV comisionable, pero no registra comisiones generadas. Conviene revisar el plan de compensación y el estado del vendedor.
              </div>

            )}

          </div>

        ) : (

          <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4">

            <p className="font-semibold text-gray-800">
              Venta directa DioxiLife
            </p>

            <p className="mt-1 text-sm text-gray-600">
              Este pedido no fue atribuido a un distribuidor. El CV y PV permanecen registrados como datos históricos del pedido, pero no generan comisiones de red.
            </p>

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
