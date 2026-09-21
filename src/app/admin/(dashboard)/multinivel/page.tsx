export const dynamic =
  "force-dynamic";

import Link from "next/link";

import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Clock3,
  Network,
  ShoppingBag,
  UserCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";

import {
  prisma,
} from "@/lib/prisma";

import MultinivelResumenCharts from "@/components/admin/MultinivelResumenCharts";


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
    Number(
      String(
        valor ?? 0
      )
    )
  );
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


function estiloEstado(
  estado: string
) {
  if (
    estado === "ACTIVO"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-slate-100 text-slate-600";
}


export default async function MultinivelAdminPage() {

  const inicio30Dias =
    new Date();

  inicio30Dias.setHours(
    0,
    0,
    0,
    0
  );

  inicio30Dias.setDate(
    inicio30Dias.getDate() - 29
  );


  const [
    totalMiembros,
    miembrosActivos,

    volumenPagado,

    montoPendiente,
    comisionesPendientes,
    comisionesAprobadas,

    pagosReportados,
    pedidosPagados,

    miembrosPeriodo,
    ultimos,
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

    prisma.comisionMultinivel.count({
      where: {
        estado: "APROBADA",
      },
    }),


    prisma.pedido.count({
      where: {
        estado:
          "PAGO_REPORTADO",
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
      where: {
        createdAt: {
          gte: inicio30Dias,
        },
      },

      select: {
        createdAt: true,
      },
    }),


    prisma.miembro.findMany({
      orderBy: {
        createdAt: "desc",
      },

      take: 5,

      select: {
        id: true,

        nombres: true,
        apellidos: true,

        email: true,

        codigoReferido:
          true,

        estado: true,

        createdAt: true,

        patrocinador: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
      },
    }),

  ]);


  const noActivos =
    totalMiembros -
    miembrosActivos;


  const mapaCrecimiento =
    new Map<
      string,
      {
        fecha: string;
        etiqueta: string;
        nuevos: number;
      }
    >();


  for (
    let indice = 0;
    indice < 30;
    indice++
  ) {
    const fecha =
      new Date(
        inicio30Dias
      );

    fecha.setDate(
      inicio30Dias.getDate() +
        indice
    );

    const clave =
      fecha
        .toISOString()
        .slice(0, 10);

    mapaCrecimiento.set(
      clave,
      {
        fecha:
          clave,

        etiqueta:
          fecha.toLocaleDateString(
            "es-BO",
            {
              day: "2-digit",
              month: "short",
            }
          ),

        nuevos:
          0,
      }
    );
  }


  for (
    const miembro of miembrosPeriodo
  ) {
    const clave =
      miembro.createdAt
        .toISOString()
        .slice(0, 10);

    const dia =
      mapaCrecimiento.get(
        clave
      );

    if (dia) {
      dia.nuevos += 1;
    }
  }


  const crecimiento = [
    ...mapaCrecimiento.values(),
  ];


  const estados = [
    {
      estado:
        "ACTIVO",

      etiqueta:
        "Activos",

      total:
        miembrosActivos,
    },

    {
      estado:
        "NO_ACTIVOS",

      etiqueta:
        "No activos",

      total:
        noActivos,
    },
  ];


  return (
    <div className="mx-auto max-w-[1500px] space-y-6">

      <section className="rounded-3xl bg-[#10182D] p-6 text-white shadow-sm md:p-7">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex flex-wrap gap-2">

              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                RED DIOXILIFE
              </span>

              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                {miembrosActivos} activos
              </span>

            </div>


            <h1 className="mt-4 text-2xl font-bold md:text-3xl">
              Resumen multinivel
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Estado general de la red y asuntos que requieren atención.
            </p>

          </div>


          <div className="grid grid-cols-2 gap-2 sm:flex">

            <Link
              href="/admin/multinivel/red"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#10182D]"
            >
              <Network className="h-4 w-4" />
              Ver red
            </Link>

            <Link
              href="/admin/multinivel/analitica"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <BarChart3 className="h-4 w-4" />
              Analítica
            </Link>

          </div>

        </div>

      </section>


      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">

        <Link
          href="/admin/multinivel/miembros"
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md md:p-5"
        >

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <UsersRound className="h-5 w-5" />
          </div>

          <p className="mt-4 text-2xl font-bold text-slate-900">
            {totalMiembros}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Total miembros
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {noActivos} no activo
            {noActivos === 1
              ? ""
              : "s"}
          </p>

        </Link>


        <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-5">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <UserCheck className="h-5 w-5" />
          </div>

          <p className="mt-4 text-2xl font-bold text-slate-900">
            {miembrosActivos}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Miembros activos
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Habilitados actualmente
          </p>

        </article>


        <Link
          href="/admin/multinivel/analitica"
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md md:p-5"
        >

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <BarChart3 className="h-5 w-5" />
          </div>

          <p className="mt-4 text-lg font-bold text-slate-900 md:text-xl">
            CV{" "}
            {dinero(
              volumenPagado
                ._sum
                .totalCV
            )}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Volumen pagado
          </p>

          <p className="mt-1 text-xs text-slate-400">
            PV{" "}
            {dinero(
              volumenPagado
                ._sum
                .totalPV
            )}{" "}
            · {pedidosPagados} ventas
          </p>

        </Link>


        <Link
          href="/admin/multinivel/comisiones"
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md md:p-5"
        >

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
            <BadgeDollarSign className="h-5 w-5" />
          </div>

          <p className="mt-4 text-lg font-bold text-slate-900 md:text-xl">
            Bs{" "}
            {dinero(
              montoPendiente
                ._sum
                .monto
            )}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Comisiones pendientes
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {comisionesPendientes} operación
            {comisionesPendientes === 1
              ? ""
              : "es"}
          </p>

        </Link>

      </section>


      <MultinivelResumenCharts
        crecimiento={crecimiento}
        estados={estados}
      />


      <section>

        <div className="mb-3">

          <h2 className="text-lg font-bold text-slate-900">
            Atención requerida
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Operaciones que todavía requieren gestión administrativa.
          </p>

        </div>


        <div className="grid gap-3 md:grid-cols-3">

          <Link
            href="/admin/pedidos"
            className="group rounded-2xl border border-orange-100 bg-white p-4 shadow-sm transition hover:border-orange-200"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                <ShoppingBag className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-xl font-bold text-slate-900">
                  {pagosReportados}
                </p>

                <p className="text-sm font-semibold text-slate-700">
                  Pagos por revisar
                </p>

              </div>

              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1" />

            </div>

          </Link>


          <Link
            href="/admin/multinivel/comisiones"
            className="group rounded-2xl border border-yellow-100 bg-white p-4 shadow-sm transition hover:border-yellow-200"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700">
                <Clock3 className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-xl font-bold text-slate-900">
                  {comisionesPendientes}
                </p>

                <p className="text-sm font-semibold text-slate-700">
                  Comisiones pendientes
                </p>

              </div>

              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1" />

            </div>

          </Link>


          <Link
            href="/admin/multinivel/comisiones"
            className="group rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition hover:border-blue-200"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <WalletCards className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-xl font-bold text-slate-900">
                  {comisionesAprobadas}
                </p>

                <p className="text-sm font-semibold text-slate-700">
                  Aprobadas por pagar
                </p>

              </div>

              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1" />

            </div>

          </Link>

        </div>

      </section>


      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">

          <div>

            <h2 className="font-bold text-slate-900">
              Miembros recientes
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Últimas incorporaciones a la red.
            </p>

          </div>


          <Link
            href="/admin/multinivel/miembros"
            className="text-xs font-semibold text-blue-600 hover:underline sm:text-sm"
          >
            Ver todos
          </Link>

        </div>


        {ultimos.length === 0 ? (

          <div className="p-8 text-center text-sm text-slate-400">
            Todavía no hay miembros registrados.
          </div>

        ) : (

          <div className="space-y-3 bg-slate-50/70 p-3 sm:p-4">

            {ultimos.map(
              (miembro) => (

                <Link
                  key={miembro.id}
                  href={`/admin/multinivel/${miembro.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/70 transition hover:border-slate-300 hover:shadow-md md:px-5"
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                    {miembro.nombres
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>


                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <p className="truncate font-semibold text-slate-900">
                        {nombrePersona(
                          miembro
                        )}
                      </p>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${estiloEstado(
                          miembro.estado
                        )}`}
                      >
                        {miembro.estado}
                      </span>

                    </div>

                    <p className="mt-1 truncate text-xs text-slate-400">
                      {miembro.codigoReferido}
                      {" · "}
                      {miembro.patrocinador
                        ? `Patrocinador: ${nombrePersona(
                            miembro.patrocinador
                          )}`
                        : "Sin patrocinador"}
                    </p>

                  </div>


                  <p className="hidden shrink-0 text-xs text-slate-400 sm:block">
                    {new Date(
                      miembro.createdAt
                    ).toLocaleDateString(
                      "es-BO"
                    )}
                  </p>


                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />

                </Link>

              )
            )}

          </div>

        )}

      </section>

    </div>
  );
}
