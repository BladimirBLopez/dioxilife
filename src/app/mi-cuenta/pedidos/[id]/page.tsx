export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";
import {
  actualizarDatosCliente,
  reportarPago,
} from "../acciones";

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

type Props = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    guardado?: string;
  }>;
};

export default async function GestionarPedidoPage({
  params,
  searchParams,
}: Props) {
  const { id } =
    await params;

  const consulta =
    await searchParams;

  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "miembro_token"
    )?.value;

  if (!token) {
    redirect(
      "/login-miembro"
    );
  }

  const sesion =
    await verificarSesion(token);

  if (
    !sesion ||
    typeof sesion.usuario !==
      "string"
  ) {
    redirect(
      "/login-miembro"
    );
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
    redirect(
      "/login-miembro"
    );
  }

  const pedido =
    await prisma.pedido.findFirst({
      where: {
        id,
        referidoPorId:
          miembro.id,
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

        detalles: {
          select: {
            id: true,
            nombreProducto: true,
            cantidad: true,
            precioUnitario: true,
            mostrarPrecio: true,
            subtotal: true,
            subtotalCV: true,
            subtotalPV: true,
          },

          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

  if (!pedido) {
    redirect(
      "/mi-cuenta/pedidos"
    );
  }

  const puedeEditar =
    pedido.estado === "NUEVO" ||
    pedido.estado ===
      "CONFIRMADO" ||
    pedido.estado ===
      "PAGO_REPORTADO";

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">

      <div className="mx-auto max-w-4xl space-y-6">

        <div>

          <Link
            href="/mi-cuenta/pedidos"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Volver a mis ventas
          </Link>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Pedido {pedido.codigo}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Gestiona los datos de tu cliente y revisa el pedido.
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${estiloEstado(
                pedido.estado
              )}`}
            >
              {pedido.estado}
            </span>

          </div>

        </div>


        {consulta.guardado === "1" && (

          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            Datos del cliente guardados correctamente.
          </div>

        )}


        <section className="rounded-2xl bg-white p-5 shadow">

          <div className="mb-5">

            <h2 className="text-xl font-semibold text-gray-900">
              Datos del cliente
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Completa estos datos después de coordinar con el cliente por WhatsApp.
            </p>

          </div>


          {!puedeEditar && (

            <div className="mb-5 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">
              Este pedido ya no permite modificar los datos del cliente.
            </div>

          )}


          <form
            action={actualizarDatosCliente.bind(
              null,
              pedido.id
            )}
            className="grid gap-4"
          >

            <div>

              <label
                htmlFor="nombreCliente"
                className="text-sm font-semibold text-gray-700"
              >
                Nombre del cliente
              </label>

              <input
                id="nombreCliente"
                name="nombreCliente"
                type="text"
                defaultValue={
                  pedido.nombreCliente ||
                  ""
                }
                disabled={!puedeEditar}
                maxLength={120}
                placeholder="Ej. María López"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />

            </div>


            <div>

              <label
                htmlFor="telefonoCliente"
                className="text-sm font-semibold text-gray-700"
              >
                WhatsApp / teléfono
              </label>

              <input
                id="telefonoCliente"
                name="telefonoCliente"
                type="text"
                inputMode="tel"
                defaultValue={
                  pedido.telefonoCliente ||
                  ""
                }
                disabled={!puedeEditar}
                maxLength={30}
                placeholder="Ej. 71234567"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />

            </div>


            <div className="grid gap-4 sm:grid-cols-2">

              <div>

                <label
                  htmlFor="ciudadCliente"
                  className="text-sm font-semibold text-gray-700"
                >
                  Ciudad
                </label>

                <input
                  id="ciudadCliente"
                  name="ciudadCliente"
                  type="text"
                  defaultValue={
                    pedido.ciudadCliente ||
                    ""
                  }
                  disabled={!puedeEditar}
                  maxLength={100}
                  placeholder="Ej. La Paz"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />

              </div>


              <div>

                <label
                  htmlFor="direccionCliente"
                  className="text-sm font-semibold text-gray-700"
                >
                  Dirección / referencia
                </label>

                <input
                  id="direccionCliente"
                  name="direccionCliente"
                  type="text"
                  defaultValue={
                    pedido.direccionCliente ||
                    ""
                  }
                  disabled={!puedeEditar}
                  maxLength={250}
                  placeholder="Zona, avenida, referencia..."
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />

              </div>

            </div>


            <div>

              <label
                htmlFor="observaciones"
                className="text-sm font-semibold text-gray-700"
              >
                Observaciones
              </label>

              <textarea
                id="observaciones"
                name="observaciones"
                defaultValue={
                  pedido.observaciones ||
                  ""
                }
                disabled={!puedeEditar}
                maxLength={500}
                rows={4}
                placeholder="Ej. Entregar por la tarde..."
                className="mt-2 w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />

            </div>


            {puedeEditar && (

              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Guardar datos del cliente
              </button>

            )}

          </form>

        </section>


        <section className="rounded-2xl bg-white p-5 shadow">

          <h2 className="text-xl font-semibold text-gray-900">
            Detalle del pedido
          </h2>


          <div className="mt-5 space-y-4">

            {pedido.detalles.map(
              (detalle) => (

                <div
                  key={detalle.id}
                  className="rounded-xl border border-gray-100 p-4"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="font-semibold text-gray-900">
                        {detalle.nombreProducto}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Cantidad: {detalle.cantidad}
                      </p>

                    </div>


                    <div className="text-right">

                      {detalle.mostrarPrecio ? (

                        <>
                          <p className="font-semibold">
                            Bs {dinero(
                              detalle.subtotal
                            )}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Bs {dinero(
                              detalle.precioUnitario
                            )} c/u
                          </p>
                        </>

                      ) : (

                        <p className="text-sm text-gray-500">
                          A consultar
                        </p>

                      )}

                    </div>

                  </div>

                </div>

              )
            )}

          </div>


          <div className="mt-6 grid grid-cols-3 gap-3 border-t pt-5">

            <div>

              <p className="text-xs text-gray-500">
                Total
              </p>

              <p className="mt-1 font-bold text-gray-900">
                Bs {dinero(
                  pedido.total
                )}
              </p>

            </div>


            <div>

              <p className="text-xs text-gray-500">
                CV
              </p>

              <p className="mt-1 font-bold text-gray-900">
                {dinero(
                  pedido.totalCV
                )}
              </p>

            </div>


            <div>

              <p className="text-xs text-gray-500">
                PV
              </p>

              <p className="mt-1 font-bold text-gray-900">
                {dinero(
                  pedido.totalPV
                )}
              </p>

            </div>

          </div>

        </section>


        {pedido.estado === "CONFIRMADO" && (

          <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5">

            <h2 className="font-semibold text-orange-900">
              ¿El cliente ya realizó el pago?
            </h2>

            <p className="mt-1 text-sm text-orange-700">
              Repórtalo para que el Super Administrador pueda verificarlo.
            </p>

            <form
              action={reportarPago.bind(
                null,
                pedido.id
              )}
              className="mt-4"
            >

              <button
                type="submit"
                className="w-full rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-700"
              >
                Reportar pago
              </button>

            </form>

          </section>

        )}


        {pedido.estado ===
          "PAGO_REPORTADO" && (

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm font-medium text-orange-700">
            Pago reportado. DioxiLife está verificando el pago.
          </div>

        )}


        {(pedido.estado === "PAGADO" ||
          pedido.estado ===
            "COMPLETADO") && (

          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            Pago aprobado por DioxiLife.
          </div>

        )}

      </div>

    </main>
  );
}
