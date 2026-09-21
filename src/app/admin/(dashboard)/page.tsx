export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function dinero(
  valor: unknown
) {
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
      return "bg-yellow-50 text-yellow-700";

    case "CONFIRMADO":
      return "bg-blue-50 text-blue-700";

    case "PAGO_REPORTADO":
      return "bg-orange-50 text-orange-700";

    case "PAGADO":
      return "bg-green-50 text-green-700";

    case "COMPLETADO":
      return "bg-emerald-50 text-emerald-700";

    case "CANCELADO":
      return "bg-red-50 text-red-700";

    default:
      return "bg-gray-100 text-gray-600";
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

function nombrePersona(
  persona:
    | {
        nombres: string;
        apellidos: string | null;
      }
    | null
) {
  if (!persona) {
    return null;
  }

  return [
    persona.nombres,
    persona.apellidos,
  ]
    .filter(Boolean)
    .join(" ");
}

export default async function AdminHome() {
  const admin =
    await obtenerAdminActual();

  const [
    totalCategorias,
    totalProductos,
    totalPedidos,
    pedidosNuevos,
    pagosReportados,
    miembrosActivos,
    montoPagado,
    volumenPagado,
    comisionesPendientes,
    comisionesPagadas,
    ultimosPedidos,
  ] = await Promise.all([
    prisma.categoria.count(),

    prisma.producto.count(),

    prisma.pedido.count(),

    prisma.pedido.count({
      where: {
        estado: "NUEVO",
      },
    }),

    prisma.pedido.count({
      where: {
        estado: "PAGO_REPORTADO",
      },
    }),

    prisma.miembro.count({
      where: {
        estado: "ACTIVO",
      },
    }),

    prisma.pedido.aggregate({
      where: {
        estado: {
          in: [
            "PAGADO",
            "COMPLETADO",
          ],
        },
      },

      _sum: {
        total: true,
      },
    }),

    prisma.pedido.aggregate({
      where: {
        estado: {
          in: [
            "PAGADO",
            "COMPLETADO",
          ],
        },
      },

      _sum: {
        totalCV: true,
        totalPV: true,
      },
    }),

    prisma.comisionMultinivel.aggregate({
      where: {
        estado: "PENDIENTE",
      },

      _sum: {
        monto: true,
      },
    }),

    prisma.comisionMultinivel.aggregate({
      where: {
        estado: "PAGADA",
      },

      _sum: {
        monto: true,
      },
    }),

    prisma.pedido.findMany({
      orderBy: {
        createdAt: "desc",
      },

      take: 6,

      select: {
        id: true,
        codigo: true,
        estado: true,
        nombreCliente: true,
        total: true,
        totalCV: true,
        createdAt: true,

        miembro: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },

        referidoPor: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
      },
    }),
  ]);

  const nombreAdmin =
    admin?.usuario ||
    "Administrador";

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">

      <section className="overflow-hidden rounded-3xl bg-[#10182D] text-white shadow-sm">

        <div className="relative p-6 md:p-8">

          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-pink/15 blur-2xl" />

          <div className="absolute -bottom-24 right-36 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />


          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                  DIOXILIFE BOLIVIA
                </span>

                {admin?.rol ===
                  "SUPER_ADMIN" && (

                  <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">
                    SUPER ADMIN
                  </span>

                )}

              </div>


              <h1 className="mt-4 text-2xl font-bold md:text-3xl">
                Bienvenido,{" "}
                {nombreAdmin}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55 md:text-base">
                Supervisa ventas, pedidos, distribuidores, comisiones y contenido desde un solo lugar.
              </p>

            </div>


            <div className="grid grid-cols-2 gap-3 sm:flex">

              <Link
                href="/admin/pedidos"
                className="rounded-xl bg-white px-4 py-2.5 text-center text-sm font-bold text-[#10182D] transition hover:bg-slate-100"
              >
                Ver pedidos
              </Link>

              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ver tienda ↗
              </a>

            </div>

          </div>

        </div>

      </section>


      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">

        <Link
          href="/admin/pedidos"
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >

          <div className="flex items-start justify-between gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path d="M4 7h16v11H4z" />
                <path d="M8 11h8M8 15h5" />
              </svg>

            </div>

            <span className="text-xs font-medium text-slate-400">
              Pagado
            </span>

          </div>

          <p className="mt-5 text-xl font-bold text-slate-900 md:text-2xl">
            Bs{" "}
            {dinero(
              montoPagado._sum.total
            )}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            Ventas pagadas
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Pedidos con pago aprobado
          </p>

        </Link>


        <Link
          href="/admin/pedidos"
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <path d="M5 7h14l-1 13H6L5 7Z" />
              <path d="M9 7V5a3 3 0 0 1 6 0v2" />
            </svg>

          </div>

          <p className="mt-5 text-2xl font-bold text-slate-900">
            {totalPedidos}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            Pedidos
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Historial total registrado
          </p>

        </Link>


        <Link
          href="/admin/multinivel/miembros"
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <circle
                cx="9"
                cy="8"
                r="3"
              />
              <circle
                cx="17"
                cy="10"
                r="2.5"
              />
              <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" />
              <path d="M15 15c3 0 5 1.8 5 5" />
            </svg>

          </div>

          <p className="mt-5 text-2xl font-bold text-slate-900">
            {miembrosActivos}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            Miembros activos
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Red de distribuidores
          </p>

        </Link>


        <Link
          href="/admin/multinivel/comisiones"
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <circle
                cx="12"
                cy="12"
                r="8"
              />
              <path d="M12 7v10M9 10h6M9 14h6" />
            </svg>

          </div>

          <p className="mt-5 text-xl font-bold text-slate-900 md:text-2xl">
            Bs{" "}
            {dinero(
              comisionesPendientes._sum
                .monto
            )}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            Comisiones pendientes
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Pendientes de proceso
          </p>

        </Link>

      </section>


      <section className="grid gap-6 xl:grid-cols-3">

        <div className="xl:col-span-2">

          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">

            <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 md:p-6">

              <div>

                <h2 className="text-lg font-bold text-slate-900">
                  Pedidos recientes
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Últimas operaciones registradas en la tienda.
                </p>

              </div>


              <Link
                href="/admin/pedidos"
                className="shrink-0 text-sm font-semibold text-blue-600 hover:underline"
              >
                Ver todos →
              </Link>

            </div>


            {ultimosPedidos.length === 0 ? (

              <div className="p-10 text-center text-sm text-slate-400">
                Todavía no existen pedidos.
              </div>

            ) : (

              <div className="divide-y divide-slate-100">

                {ultimosPedidos.map(
                  (pedido) => {
                    const comprador =
                      nombrePersona(
                        pedido.miembro
                      ) ||
                      pedido.nombreCliente ||
                      "Cliente externo";

                    const vendedor =
                      nombrePersona(
                        pedido.referidoPor
                      ) ||
                      "Venta directa";

                    return (
                      <Link
                        key={pedido.id}
                        href={`/admin/pedidos/${pedido.id}`}
                        className="flex flex-col gap-4 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:p-5"
                      >

                        <div className="flex min-w-0 flex-1 items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">

                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-5 w-5"
                            >
                              <path d="M5 7h14l-1 13H6L5 7Z" />
                              <path d="M9 7V5a3 3 0 0 1 6 0v2" />
                            </svg>

                          </div>


                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                              <p className="font-mono text-sm font-bold text-slate-900">
                                {pedido.codigo}
                              </p>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${estiloEstado(
                                  pedido.estado
                                )}`}
                              >
                                {textoEstado(
                                  pedido.estado
                                )}
                              </span>

                            </div>

                            <p className="mt-1 truncate text-sm text-slate-500">
                              {comprador}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Vendedor:{" "}
                              {vendedor}
                            </p>

                          </div>

                        </div>


                        <div className="flex items-end justify-between gap-4 sm:block sm:text-right">

                          <div>

                            <p className="font-bold text-slate-900">
                              Bs{" "}
                              {dinero(
                                pedido.total
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              CV{" "}
                              {dinero(
                                pedido.totalCV
                              )}
                            </p>

                          </div>

                          <p className="text-xs text-slate-400 sm:mt-2">
                            {new Date(
                              pedido.createdAt
                            ).toLocaleDateString(
                              "es-BO"
                            )}
                          </p>

                        </div>

                      </Link>
                    );
                  }
                )}

              </div>

            )}

          </div>

        </div>


        <div className="space-y-6">

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-bold text-slate-900">
                  Requiere atención
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Operaciones pendientes
                </p>

              </div>

              {(pagosReportados +
                pedidosNuevos) >
                0 && (

                <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-red-50 px-2 text-xs font-bold text-red-600">
                  {pagosReportados +
                    pedidosNuevos}
                </span>

              )}

            </div>


            <div className="mt-5 space-y-3">

              <Link
                href="/admin/pedidos"
                className="flex items-center gap-3 rounded-xl bg-orange-50 p-4 transition hover:bg-orange-100"
              >

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 font-bold text-orange-700">
                  {pagosReportados}
                </div>

                <div className="min-w-0 flex-1">

                  <p className="text-sm font-semibold text-orange-900">
                    Pagos reportados
                  </p>

                  <p className="mt-0.5 text-xs text-orange-700/70">
                    Requieren aprobación del Super Admin
                  </p>

                </div>

                <span className="text-orange-600">
                  →
                </span>

              </Link>


              <Link
                href="/admin/pedidos"
                className="flex items-center gap-3 rounded-xl bg-yellow-50 p-4 transition hover:bg-yellow-100"
              >

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100 font-bold text-yellow-700">
                  {pedidosNuevos}
                </div>

                <div className="min-w-0 flex-1">

                  <p className="text-sm font-semibold text-yellow-900">
                    Pedidos nuevos
                  </p>

                  <p className="mt-0.5 text-xs text-yellow-700/70">
                    Esperando gestión
                  </p>

                </div>

                <span className="text-yellow-600">
                  →
                </span>

              </Link>

            </div>

          </section>


          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">

            <h2 className="font-bold text-slate-900">
              Rendimiento
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Pedidos pagados y completados
            </p>


            <div className="mt-5 space-y-4">

              <div>

                <div className="flex items-center justify-between text-sm">

                  <span className="text-slate-500">
                    CV generado
                  </span>

                  <span className="font-bold text-emerald-700">
                    {dinero(
                      volumenPagado._sum
                        .totalCV
                    )}
                  </span>

                </div>


              </div>


              <div>

                <div className="flex items-center justify-between text-sm">

                  <span className="text-slate-500">
                    PV generado
                  </span>

                  <span className="font-bold text-blue-700">
                    {dinero(
                      volumenPagado._sum
                        .totalPV
                    )}
                  </span>

                </div>


              </div>


              <div className="border-t border-slate-100 pt-4">

                <div className="flex items-center justify-between">

                  <span className="text-sm text-slate-500">
                    Comisiones pagadas
                  </span>

                  <span className="font-bold text-slate-900">
                    Bs{" "}
                    {dinero(
                      comisionesPagadas._sum
                        .monto
                    )}
                  </span>

                </div>

              </div>

            </div>

          </section>

        </div>

      </section>


      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">

        <div>

          <h2 className="text-lg font-bold text-slate-900">
            Accesos rápidos
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Administración de las principales áreas del sistema.
          </p>

        </div>


        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">

          <Link
            href="/admin/productos"
            className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
          >
            <p className="font-semibold text-slate-900">
              Productos
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {totalProductos} registrados
            </p>

            <p className="mt-4 text-sm font-semibold text-blue-600">
              Administrar →
            </p>
          </Link>


          <Link
            href="/admin/categorias"
            className="rounded-xl border border-slate-200 p-4 transition hover:border-violet-200 hover:bg-violet-50/50"
          >
            <p className="font-semibold text-slate-900">
              Categorías
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {totalCategorias} registradas
            </p>

            <p className="mt-4 text-sm font-semibold text-violet-600">
              Administrar →
            </p>
          </Link>


          <Link
            href="/admin/multinivel/miembros"
            className="rounded-xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/50"
          >
            <p className="font-semibold text-slate-900">
              Red multinivel
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {miembrosActivos} miembros activos
            </p>

            <p className="mt-4 text-sm font-semibold text-emerald-600">
              Ver red →
            </p>
          </Link>


          <Link
            href="/admin/multinivel/comisiones"
            className="rounded-xl border border-slate-200 p-4 transition hover:border-orange-200 hover:bg-orange-50/50"
          >
            <p className="font-semibold text-slate-900">
              Comisiones
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Control financiero
            </p>

            <p className="mt-4 text-sm font-semibold text-orange-600">
              Revisar →
            </p>
          </Link>

        </div>

      </section>

    </div>
  );
}
