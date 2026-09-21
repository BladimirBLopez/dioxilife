export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

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
    case "PENDIENTE":
      return "bg-yellow-100 text-yellow-700";

    case "APROBADA":
      return "bg-blue-100 text-blue-700";

    case "PAGADA":
      return "bg-green-100 text-green-700";

    case "ANULADA":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function textoEstado(
  estado: string
) {
  switch (estado) {
    case "PENDIENTE":
      return "Pendiente";

    case "APROBADA":
      return "Aprobada";

    case "PAGADA":
      return "Pagada";

    case "ANULADA":
      return "Anulada";

    default:
      return estado;
  }
}

export default async function MisComisionesPage() {
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
    typeof sesion.usuario !== "string"
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
        apellidos: true,
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

  const [
    pendientes,
    aprobadas,
    pagadas,
    montoPendiente,
    montoAprobado,
    montoPagado,
    comisiones,
  ] = await Promise.all([
    prisma.comisionMultinivel.count({
      where: {
        beneficiarioId:
          miembro.id,

        estado: "PENDIENTE",
      },
    }),

    prisma.comisionMultinivel.count({
      where: {
        beneficiarioId:
          miembro.id,

        estado: "APROBADA",
      },
    }),

    prisma.comisionMultinivel.count({
      where: {
        beneficiarioId:
          miembro.id,

        estado: "PAGADA",
      },
    }),

    prisma.comisionMultinivel.aggregate({
      where: {
        beneficiarioId:
          miembro.id,

        estado: "PENDIENTE",
      },

      _sum: {
        monto: true,
      },
    }),

    prisma.comisionMultinivel.aggregate({
      where: {
        beneficiarioId:
          miembro.id,

        estado: "APROBADA",
      },

      _sum: {
        monto: true,
      },
    }),

    prisma.comisionMultinivel.aggregate({
      where: {
        beneficiarioId:
          miembro.id,

        estado: "PAGADA",
      },

      _sum: {
        monto: true,
      },
    }),

    prisma.comisionMultinivel.findMany({
      where: {
        beneficiarioId:
          miembro.id,
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 100,

      select: {
        id: true,
        nivel: true,
        montoBase: true,
        porcentaje: true,
        monto: true,
        concepto: true,
        estado: true,
        createdAt: true,

        origenMiembro: {
          select: {
            nombres: true,
            apellidos: true,
            codigoReferido: true,
          },
        },
      },
    }),
  ]);

  const totalDisponible =
    Number(
      String(
        montoAprobado._sum.monto ?? 0
      )
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
              Mis comisiones
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Consulta el estado de las comisiones generadas a tu favor.
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

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">

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
                <path d="M12 7v5l3 2" />
              </svg>

            </div>

            <p className="mt-4 text-xl font-bold text-gray-900">
              Bs {dinero(
                montoPendiente._sum.monto
              )}
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              Pendientes
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {pendientes} comisión
              {pendientes === 1
                ? ""
                : "es"}
            </p>

          </div>


          <div className="rounded-2xl bg-white p-5 shadow">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

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
                <path d="m8.5 12 2.2 2.2L15.8 9" />
              </svg>

            </div>

            <p className="mt-4 text-xl font-bold text-gray-900">
              Bs {dinero(
                montoAprobado._sum.monto
              )}
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              Aprobadas
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {aprobadas} comisión
              {aprobadas === 1
                ? ""
                : "es"}
            </p>

          </div>


          <div className="rounded-2xl bg-white p-5 shadow">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">

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
                <path d="M9 12.5 11 15l4-6" />
              </svg>

            </div>

            <p className="mt-4 text-xl font-bold text-green-700">
              Bs {dinero(
                montoPagado._sum.monto
              )}
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              Pagadas
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {pagadas} comisión
              {pagadas === 1
                ? ""
                : "es"}
            </p>

          </div>


          <div className="col-span-2 rounded-2xl bg-brand-navy p-5 text-white shadow lg:col-span-1">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path d="M4 7h16v11H4z" />
                <path d="M16 11h4v4h-4a2 2 0 0 1 0-4Z" />
              </svg>

            </div>

            <p className="mt-4 text-xl font-bold">
              Bs {dinero(
                totalDisponible
              )}
            </p>

            <p className="mt-1 text-sm font-semibold">
              Saldo aprobado
            </p>

            <p className="mt-1 text-xs text-white/55">
              Próximamente disponible para retiros
            </p>

          </div>

        </section>


        <section className="overflow-hidden rounded-2xl bg-white shadow">

          <div className="border-b border-gray-100 p-5 md:p-6">

            <h2 className="text-lg font-bold text-gray-900">
              Historial de comisiones
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Últimas comisiones registradas a tu favor.
            </p>

          </div>


          {comisiones.length === 0 ? (

            <div className="p-10 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="8"
                  />
                  <path d="M12 7v10M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 1-3 2.2 0 1.3 1.1 1.8 3 2.2 1.9.4 3 1 3 2.3 0 1.3-1.3 2.3-3 2.3" />
                </svg>

              </div>

              <p className="mt-4 font-semibold text-gray-700">
                Todavía no tienes comisiones.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Las comisiones generadas aparecerán aquí.
              </p>

            </div>

          ) : (

            <>
              <div className="divide-y divide-gray-100 md:hidden">

                {comisiones.map(
                  (comision) => (

                    <article
                      key={comision.id}
                      className="p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <p className="font-semibold text-gray-900">
                            {comision.origenMiembro.nombres}
                            {comision.origenMiembro.apellidos
                              ? ` ${comision.origenMiembro.apellidos}`
                              : ""}
                          </p>

                          <p className="mt-1 font-mono text-xs text-gray-400">
                            {comision.origenMiembro.codigoReferido}
                          </p>

                        </div>


                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${estiloEstado(
                            comision.estado
                          )}`}
                        >
                          {textoEstado(
                            comision.estado
                          )}
                        </span>

                      </div>


                      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3">

                        <div>

                          <p className="text-[10px] uppercase text-gray-400">
                            Nivel
                          </p>

                          <p className="mt-1 text-sm font-bold">
                            {comision.nivel === 0
                            ? "Directa"
                            : comision.nivel}
                          </p>

                        </div>


                        <div>

                          <p className="text-[10px] uppercase text-gray-400">
                            Base
                          </p>

                          <p className="mt-1 text-sm font-bold">
                            {comision.montoBase
                              ? `Bs ${dinero(
                                  comision.montoBase
                                )}`
                              : "-"}
                          </p>

                        </div>


                        <div>

                          <p className="text-[10px] uppercase text-gray-400">
                            Comisión
                          </p>

                          <p className="mt-1 text-sm font-bold text-green-700">
                            Bs {dinero(
                              comision.monto
                            )}
                          </p>

                        </div>

                      </div>


                      <div className="mt-3 flex items-center justify-between gap-4">

                        <p className="text-xs text-gray-500">
                          {comision.concepto ||
                            "Comisión multinivel"}
                        </p>

                        <p className="shrink-0 text-xs text-gray-400">
                          {new Date(
                            comision.createdAt
                          ).toLocaleDateString(
                            "es-BO"
                          )}
                        </p>

                      </div>

                    </article>

                  )
                )}

              </div>


              <div className="hidden overflow-x-auto md:block">

                <table className="w-full min-w-[900px] text-left text-sm">

                  <thead className="bg-gray-50 text-gray-600">

                    <tr>

                      <th className="px-4 py-3">
                        Origen
                      </th>

                      <th className="px-4 py-3">
                        Nivel
                      </th>

                      <th className="px-4 py-3">
                        Base
                      </th>

                      <th className="px-4 py-3">
                        %
                      </th>

                      <th className="px-4 py-3">
                        Comisión
                      </th>

                      <th className="px-4 py-3">
                        Estado
                      </th>

                      <th className="px-4 py-3">
                        Concepto
                      </th>

                      <th className="px-4 py-3">
                        Fecha
                      </th>

                    </tr>

                  </thead>


                  <tbody className="divide-y divide-gray-100">

                    {comisiones.map(
                      (comision) => (

                        <tr
                          key={comision.id}
                          className="transition hover:bg-gray-50"
                        >

                          <td className="px-4 py-4">

                            <p className="font-medium">
                              {comision.origenMiembro.nombres}
                              {comision.origenMiembro.apellidos
                                ? ` ${comision.origenMiembro.apellidos}`
                                : ""}
                            </p>

                            <p className="mt-1 font-mono text-xs text-gray-400">
                              {comision.origenMiembro.codigoReferido}
                            </p>

                          </td>


                          <td className="px-4 py-4">
                            {comision.nivel === 0
                          ? "Comisión directa"
                          : `Nivel ${comision.nivel}`}
                          </td>


                          <td className="px-4 py-4">

                            {comision.montoBase
                              ? `Bs ${dinero(
                                  comision.montoBase
                                )}`
                              : "-"}

                          </td>


                          <td className="px-4 py-4">

                            {comision.porcentaje
                              ? `${dinero(
                                  comision.porcentaje
                                )}%`
                              : "-"}

                          </td>


                          <td className="px-4 py-4 font-bold text-green-700">
                            Bs {dinero(
                              comision.monto
                            )}
                          </td>


                          <td className="px-4 py-4">

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estiloEstado(
                                comision.estado
                              )}`}
                            >
                              {textoEstado(
                                comision.estado
                              )}
                            </span>

                          </td>


                          <td className="max-w-[240px] px-4 py-4 text-gray-600">
                            {comision.concepto ||
                              "-"}
                          </td>


                          <td className="px-4 py-4 text-gray-500">

                            {new Date(
                              comision.createdAt
                            ).toLocaleDateString(
                              "es-BO"
                            )}

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
