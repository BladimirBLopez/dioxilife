export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ArbolMultinivel from "@/components/admin/ArbolMultinivel";

type Nodo = {
  id: string;
  nombres: string;
  apellidos: string | null;
  codigoReferido: string;
  email: string;
  nivel: number;
  hijos: Nodo[];
};

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

async function obtenerRed(
  id: string,
  nivel = 1,
  maxNivel = 3
): Promise<Nodo[]> {
  if (nivel > maxNivel) {
    return [];
  }

  const hijos =
    await prisma.miembro.findMany({
      where: {
        patrocinadorId: id,
        estado: "ACTIVO",
      },

      orderBy: {
        createdAt: "asc",
      },

      select: {
        id: true,
        nombres: true,
        apellidos: true,
        codigoReferido: true,
        email: true,
      },
    });

  return Promise.all(
    hijos.map(
      async (hijo) => ({
        ...hijo,
        nivel,

        hijos: await obtenerRed(
          hijo.id,
          nivel + 1,
          maxNivel
        ),
      })
    )
  );
}

function estiloEstado(
  estado: string
) {
  if (estado === "ACTIVO") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default async function MultinivelAdminPage() {
  const [
    totalMiembros,
    miembrosActivos,
    volumenPagado,
    montoComisionesPendientes,
    cantidadComisionesPendientes,
    pedidosPagados,
    ultimos,
    raicesBase,
  ] = await Promise.all([
    prisma.miembro.count(),

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

    prisma.comisionMultinivel.count({
      where: {
        estado: "PENDIENTE",
      },
    }),

    prisma.pedido.count({
      where: {
        estado: {
          in: [
            "PAGADO",
            "COMPLETADO",
          ],
        },
      },
    }),

    prisma.miembro.findMany({
      orderBy: {
        createdAt: "desc",
      },

      take: 8,

      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
        codigoReferido: true,
        estado: true,
        createdAt: true,

        patrocinador: {
          select: {
            nombres: true,
            apellidos: true,
            codigoReferido: true,
          },
        },
      },
    }),

    prisma.miembro.findMany({
      where: {
        patrocinadorId: null,
        estado: "ACTIVO",
      },

      orderBy: {
        createdAt: "asc",
      },

      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
        codigoReferido: true,
      },
    }),
  ]);


  const red: Nodo[] =
    await Promise.all(
      raicesBase.map(
        async (raiz) => ({
          ...raiz,
          nivel: 0,

          hijos: await obtenerRed(
            raiz.id,
            1,
            3
          ),
        })
      )
    );


  const inactivos =
    totalMiembros -
    miembrosActivos;


  return (
    <div className="mx-auto max-w-[1500px] space-y-6">

      <section className="flex flex-col gap-5 rounded-3xl bg-[#10182D] p-6 text-white shadow-sm md:p-7 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <div className="flex flex-wrap items-center gap-2">

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
              RED DIOXILIFE
            </span>

            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              {miembrosActivos} activos
            </span>

          </div>


          <h1 className="mt-4 text-2xl font-bold md:text-3xl">
            Gestión Multinivel
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            Supervisa distribuidores, estructura de patrocinio, volumen y comisiones desde una sola vista.
          </p>

        </div>


        <div className="grid grid-cols-2 gap-3 sm:flex">

          <Link
            href="/admin/multinivel/miembros"
            className="rounded-xl bg-white px-4 py-2.5 text-center text-sm font-bold text-[#10182D] transition hover:bg-slate-100"
          >
            Ver miembros
          </Link>

          <Link
            href="/admin/multinivel/comisiones"
            className="rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Comisiones
          </Link>

        </div>

      </section>


      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">

        <Link
          href="/admin/multinivel/miembros"
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >

          <div className="flex items-start justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

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

            {inactivos > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                {inactivos} no activos
              </span>
            )}

          </div>


          <p className="mt-5 text-2xl font-bold text-slate-900">
            {totalMiembros}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            Total miembros
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Distribuidores registrados
          </p>

        </Link>


        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

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

          <p className="mt-5 text-2xl font-bold text-slate-900">
            {miembrosActivos}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            Miembros activos
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Habilitados actualmente
          </p>

        </div>


        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <path d="M5 18V9M12 18V5M19 18v-6" />
            </svg>

          </div>

          <p className="mt-5 text-xl font-bold text-slate-900 md:text-2xl">
            {dinero(
              volumenPagado._sum.totalCV
            )}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            CV pagado
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {pedidosPagados} pedido
            {pedidosPagados === 1
              ? ""
              : "s"}{" "}
            aprobado
            {pedidosPagados === 1
              ? ""
              : "s"}
          </p>

        </div>


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
              montoComisionesPendientes
                ._sum.monto
            )}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            Comisiones pendientes
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {cantidadComisionesPendientes} pendiente
            {cantidadComisionesPendientes === 1
              ? ""
              : "s"}
          </p>

        </Link>

      </section>


      <section className="grid gap-4 md:grid-cols-3">

        <Link
          href="/admin/multinivel/miembros"
          className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
        >

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              👥
            </div>

            <div className="min-w-0 flex-1">

              <p className="font-bold text-slate-900">
                Gestionar miembros
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Perfiles, estados y patrocinadores
              </p>

            </div>

            <span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600">
              →
            </span>

          </div>

        </Link>


        <Link
          href="/admin/multinivel/comisiones"
          className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md"
        >

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              Bs
            </div>

            <div className="min-w-0 flex-1">

              <p className="font-bold text-slate-900">
                Control de comisiones
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Pendientes, aprobadas y pagadas
              </p>

            </div>

            <span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-600">
              →
            </span>

          </div>

        </Link>


        <Link
          href="/admin/pedidos"
          className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
        >

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

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

            <div className="min-w-0 flex-1">

              <p className="font-bold text-slate-900">
                Pedidos y volumen
              </p>

              <p className="mt-1 text-xs text-slate-400">
                CV y PV nacen de ventas aprobadas
              </p>

            </div>

            <span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600">
              →
            </span>

          </div>

        </Link>

      </section>


      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">

        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-lg font-bold text-slate-900">
              Estructura de la red
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Distribuidores raíz y sus primeros tres niveles activos.
            </p>

          </div>


          <div className="flex gap-2">

            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              PV{" "}
              {dinero(
                volumenPagado._sum.totalPV
              )}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {raicesBase.length} raíz
              {raicesBase.length === 1
                ? ""
                : "es"}
            </span>

          </div>

        </div>


        <div className="mt-5">

          <ArbolMultinivel
            red={red}
          />

        </div>


        <p className="mt-4 text-xs text-slate-400">
          La visualización muestra hasta tres niveles descendentes por cada miembro raíz activo.
        </p>

      </section>


      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 md:p-6">

          <div>

            <h2 className="text-lg font-bold text-slate-900">
              Últimos miembros registrados
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Incorporaciones recientes a la red DioxiLife.
            </p>

          </div>


          <Link
            href="/admin/multinivel/miembros"
            className="shrink-0 text-sm font-semibold text-blue-600 hover:underline"
          >
            Ver todos →
          </Link>

        </div>


        {ultimos.length === 0 ? (

          <div className="p-10 text-center text-sm text-slate-400">
            Todavía no hay miembros registrados.
          </div>

        ) : (

          <>
            <div className="divide-y divide-slate-100 md:hidden">

              {ultimos.map(
                (miembro) => (

                  <Link
                    key={miembro.id}
                    href={`/admin/multinivel/${miembro.id}`}
                    className="block p-4 transition hover:bg-slate-50"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <p className="truncate font-semibold text-slate-900">
                          {miembro.nombres}
                          {miembro.apellidos
                            ? ` ${miembro.apellidos}`
                            : ""}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-400">
                          {miembro.email}
                        </p>

                      </div>


                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${estiloEstado(
                          miembro.estado
                        )}`}
                      >
                        {miembro.estado}
                      </span>

                    </div>


                    <div className="mt-4 flex items-end justify-between gap-3">

                      <div>

                        <p className="font-mono text-xs font-semibold text-blue-600">
                          {miembro.codigoReferido}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Patrocinador:{" "}
                          {miembro.patrocinador
                            ? `${miembro.patrocinador.nombres}${
                                miembro.patrocinador.apellidos
                                  ? ` ${miembro.patrocinador.apellidos}`
                                  : ""
                              }`
                            : "Sin patrocinador"}
                        </p>

                      </div>


                      <p className="shrink-0 text-xs text-slate-400">
                        {new Date(
                          miembro.createdAt
                        ).toLocaleDateString(
                          "es-BO"
                        )}
                      </p>

                    </div>

                  </Link>

                )
              )}

            </div>


            <div className="hidden overflow-x-auto md:block">

              <table className="w-full min-w-[850px] text-left text-sm">

                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">

                  <tr>

                    <th className="px-5 py-3">
                      Miembro
                    </th>

                    <th className="px-5 py-3">
                      Código
                    </th>

                    <th className="px-5 py-3">
                      Patrocinador
                    </th>

                    <th className="px-5 py-3">
                      Estado
                    </th>

                    <th className="px-5 py-3">
                      Registro
                    </th>

                    <th className="px-5 py-3" />

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-100">

                  {ultimos.map(
                    (miembro) => (

                      <tr
                        key={miembro.id}
                        className="transition hover:bg-slate-50"
                      >

                        <td className="px-5 py-4">

                          <p className="font-semibold text-slate-900">
                            {miembro.nombres}
                            {miembro.apellidos
                              ? ` ${miembro.apellidos}`
                              : ""}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {miembro.email}
                          </p>

                        </td>


                        <td className="px-5 py-4 font-mono text-xs font-semibold text-blue-600">
                          {miembro.codigoReferido}
                        </td>


                        <td className="px-5 py-4 text-slate-600">

                          {miembro.patrocinador
                            ? (
                              <>
                                <p className="font-medium">
                                  {miembro.patrocinador.nombres}
                                  {miembro.patrocinador.apellidos
                                    ? ` ${miembro.patrocinador.apellidos}`
                                    : ""}
                                </p>

                                <p className="mt-1 font-mono text-xs text-slate-400">
                                  {miembro.patrocinador.codigoReferido}
                                </p>
                              </>
                            )
                            : (
                              <span className="text-slate-400">
                                Sin patrocinador
                              </span>
                            )}

                        </td>


                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estiloEstado(
                              miembro.estado
                            )}`}
                          >
                            {miembro.estado}
                          </span>

                        </td>


                        <td className="px-5 py-4 text-slate-500">
                          {new Date(
                            miembro.createdAt
                          ).toLocaleDateString(
                            "es-BO"
                          )}
                        </td>


                        <td className="px-5 py-4 text-right">

                          <Link
                            href={`/admin/multinivel/${miembro.id}`}
                            className="font-semibold text-blue-600 hover:underline"
                          >
                            Ver →
                          </Link>

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
  );
}
