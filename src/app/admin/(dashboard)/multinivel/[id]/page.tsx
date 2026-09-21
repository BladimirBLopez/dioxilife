export const dynamic =
  "force-dynamic";

import Link from "next/link";
import {
  notFound,
} from "next/navigation";

import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Mail,
  Network,
  Phone,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

import {
  prisma,
} from "@/lib/prisma";

import {
  obtenerAdminActual,
} from "@/lib/admin-auth";

import ArbolMultinivel from "@/components/admin/ArbolMultinivel";
import MiembroAdministracionCard from "@/components/admin/MiembroAdministracionCard";


type NodoRed = {
  id: string;

  nombres: string;

  apellidos?: string | null;

  codigoReferido: string;

  email: string;

  nivel: number;

  hijos: NodoRed[];
};


async function obtenerRed(
  miembroId: string,
  nivel = 1,
  maxNivel = 3
): Promise<NodoRed[]> {
  if (
    nivel > maxNivel
  ) {
    return [];
  }

  const referidos =
    await prisma.miembro.findMany({
      where: {
        patrocinadorId:
          miembroId,
      },

      orderBy: {
        createdAt: "asc",
      },

      select: {
        id: true,

        nombres: true,

        apellidos: true,

        codigoReferido:
          true,

        email: true,
      },
    });


  return Promise.all(
    referidos.map(
      async (
        referido
      ) => ({
        ...referido,

        nivel,

        hijos:
          await obtenerRed(
            referido.id,
            nivel + 1,
            maxNivel
          ),
      })
    )
  );
}


function contarPorNivel(
  nodos: NodoRed[],
  nivel: number
): number {
  let total = 0;

  for (
    const nodo of nodos
  ) {
    if (
      nodo.nivel === nivel
    ) {
      total++;
    }

    total +=
      contarPorNivel(
        nodo.hijos,
        nivel
      );
  }

  return total;
}


function contarTodaLaRed(
  nodos: NodoRed[]
): number {
  return nodos.reduce(
    (
      total,
      nodo
    ) =>
      total +
      1 +
      contarTodaLaRed(
        nodo.hijos
      ),
    0
  );
}


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
        apellidos?: string | null;
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


function textoEstadoPedido(
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


function estiloEstadoPedido(
  estado: string
) {
  switch (estado) {
    case "NUEVO":
      return "bg-yellow-50 text-yellow-700 ring-yellow-600/10";

    case "CONFIRMADO":
      return "bg-blue-50 text-blue-700 ring-blue-600/10";

    case "PAGO_REPORTADO":
      return "bg-orange-50 text-orange-700 ring-orange-600/10";

    case "PAGADO":
      return "bg-green-50 text-green-700 ring-green-600/10";

    case "COMPLETADO":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";

    case "CANCELADO":
      return "bg-red-50 text-red-700 ring-red-600/10";

    default:
      return "bg-slate-100 text-slate-600 ring-slate-500/10";
  }
}


function estiloEstadoMiembro(
  estado: string
) {
  if (
    estado === "ACTIVO"
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
  }

  if (
    estado ===
    "SUSPENDIDO"
  ) {
    return "bg-red-50 text-red-700 ring-red-600/10";
  }

  return "bg-slate-100 text-slate-600 ring-slate-500/10";
}


function textoEstadoComision(
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


function estiloEstadoComision(
  estado: string
) {
  switch (estado) {
    case "PENDIENTE":
      return "bg-yellow-50 text-yellow-700";

    case "APROBADA":
      return "bg-blue-50 text-blue-700";

    case "PAGADA":
      return "bg-emerald-50 text-emerald-700";

    case "ANULADA":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}


export default async function DetalleMiembroPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const {
    id,
  } = await params;


  const admin =
    await obtenerAdminActual();


  const miembro =
    await prisma.miembro.findUnique({
      where: {
        id,
      },

      select: {
        id: true,

        nombres: true,
        apellidos: true,

        email: true,
        telefono: true,

        codigoReferido: true,

        estado: true,

        createdAt: true,

        patrocinador: {
          select: {
            id: true,

            nombres: true,
            apellidos: true,

            codigoReferido:
              true,
          },
        },
      },
    });


  if (!miembro) {
    notFound();
  }


  const [
    red,

    ventasAtribuidas,

    ventasPagadas,

    comisionesPendientes,

    comisionesAprobadas,

    comisionesPagadas,

    ultimosPedidos,

    ultimasComisiones,
  ] = await Promise.all([

    obtenerRed(
      miembro.id
    ),


    prisma.pedido.count({
      where: {
        referidoPorId:
          miembro.id,

        estado: {
          not: "CANCELADO",
        },
      },
    }),


    prisma.pedido.aggregate({
      where: {
        referidoPorId:
          miembro.id,

        estado: {
          in: [
            "PAGADO",
            "COMPLETADO",
          ],
        },
      },

      _count: {
        _all: true,
      },

      _sum: {
        total: true,
        totalCV: true,
        totalPV: true,
      },
    }),


    prisma.comisionMultinivel.aggregate({
      where: {
        beneficiarioId:
          miembro.id,

        estado:
          "PENDIENTE",
      },

      _sum: {
        monto: true,
      },
    }),


    prisma.comisionMultinivel.aggregate({
      where: {
        beneficiarioId:
          miembro.id,

        estado:
          "APROBADA",
      },

      _sum: {
        monto: true,
      },
    }),


    prisma.comisionMultinivel.aggregate({
      where: {
        beneficiarioId:
          miembro.id,

        estado:
          "PAGADA",
      },

      _sum: {
        monto: true,
      },
    }),


    prisma.pedido.findMany({
      where: {
        referidoPorId:
          miembro.id,
      },

      orderBy: {
        createdAt:
          "desc",
      },

      take: 5,

      select: {
        id: true,

        codigo: true,

        estado: true,

        nombreCliente: true,

        total: true,

        totalCV: true,
        totalPV: true,

        createdAt: true,

        miembro: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
      },
    }),


    prisma.comisionMultinivel.findMany({
      where: {
        beneficiarioId:
          miembro.id,
      },

      orderBy: {
        createdAt:
          "desc",
      },

      take: 5,

      select: {
        id: true,

        nivel: true,

        monto: true,

        porcentaje: true,

        estado: true,

        createdAt: true,

        pedido: {
          select: {
            id: true,
            codigo: true,
          },
        },
      },
    }),

  ]);


  const nivel1 =
    contarPorNivel(
      red,
      1
    );

  const nivel2 =
    contarPorNivel(
      red,
      2
    );

  const nivel3 =
    contarPorNivel(
      red,
      3
    );

  const totalRed =
    contarTodaLaRed(
      red
    );


  const nombreCompleto =
    nombrePersona(
      miembro
    );


  const iniciales =
    nombreCompleto
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (parte) =>
          parte[0]
      )
      .join("")
      .toUpperCase();


  return (
    <div className="mx-auto max-w-[1500px] space-y-6">

      {/* CABECERA */}
      <section className="overflow-hidden rounded-3xl bg-[#10182D] text-white shadow-sm">

        <div className="p-5 md:p-7">

          <Link
            href="/admin/multinivel/miembros"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />

            Volver a miembros
          </Link>


          <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex min-w-0 items-center gap-4">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold ring-1 ring-white/15">
                {iniciales ||
                  "M"}
              </div>


              <div className="min-w-0">

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
                  Perfil de miembro
                </p>

                <h1 className="mt-1 truncate text-2xl font-bold md:text-3xl">
                  {nombreCompleto}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-2">

                  <span className="font-mono text-sm text-white/60">
                    {
                      miembro.codigoReferido
                    }
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${estiloEstadoMiembro(
                      miembro.estado
                    )}`}
                  >
                    {
                      miembro.estado
                    }
                  </span>

                </div>

              </div>

            </div>


            <div className="flex flex-wrap gap-2">

              <Link
                href="/admin/multinivel/comisiones"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#10182D] transition hover:bg-slate-100"
              >
                <WalletCards className="h-4 w-4" />

                Comisiones
              </Link>

              <Link
                href="/admin/pedidos"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <ShoppingBag className="h-4 w-4" />

                Pedidos
              </Link>

            </div>

          </div>

        </div>

      </section>


      {/* IDENTIDAD */}
      <section className="grid gap-4 lg:grid-cols-3">

        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <UserRound className="h-5 w-5" />
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Información del miembro
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Datos principales de la cuenta
              </p>

            </div>

          </div>


          <div className="mt-5 grid gap-4 sm:grid-cols-2">

            <div className="rounded-xl bg-slate-50 p-4">

              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="h-4 w-4" />

                <span className="text-xs font-semibold uppercase tracking-wide">
                  Correo
                </span>
              </div>

              <p className="mt-2 break-all text-sm font-semibold text-slate-800">
                {miembro.email}
              </p>

            </div>


            <div className="rounded-xl bg-slate-50 p-4">

              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="h-4 w-4" />

                <span className="text-xs font-semibold uppercase tracking-wide">
                  Teléfono
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                {miembro.telefono ||
                  "No registrado"}
              </p>

            </div>


            <div className="rounded-xl bg-slate-50 p-4">

              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="h-4 w-4" />

                <span className="text-xs font-semibold uppercase tracking-wide">
                  Código de referido
                </span>
              </div>

              <p className="mt-2 font-mono text-sm font-bold text-blue-700">
                {
                  miembro.codigoReferido
                }
              </p>

            </div>


            <div className="rounded-xl bg-slate-50 p-4">

              <div className="flex items-center gap-2 text-slate-400">
                <CalendarDays className="h-4 w-4" />

                <span className="text-xs font-semibold uppercase tracking-wide">
                  Fecha de registro
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                {new Date(
                  miembro.createdAt
                ).toLocaleDateString(
                  "es-BO",
                  {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </p>

            </div>

          </div>

        </article>


        {/* PATROCINADOR */}
        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Network className="h-5 w-5" />
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Patrocinador
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Línea ascendente directa
              </p>

            </div>

          </div>


          {miembro.patrocinador ? (

            <div className="mt-5">

              <p className="text-lg font-bold text-slate-900">
                {nombrePersona(
                  miembro.patrocinador
                )}
              </p>

              <p className="mt-1 font-mono text-sm font-semibold text-blue-600">
                {
                  miembro.patrocinador
                    .codigoReferido
                }
              </p>


              <Link
                href={`/admin/multinivel/${miembro.patrocinador.id}`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                <UserRound className="h-3.5 w-3.5" />

                Ver patrocinador

                <ExternalLink className="h-3.5 w-3.5" />
              </Link>

            </div>

          ) : (

            <div className="mt-5 rounded-xl bg-violet-50 p-4">

              <p className="font-semibold text-violet-800">
                Miembro raíz
              </p>

              <p className="mt-1 text-sm text-violet-600">
                No tiene patrocinador superior registrado.
              </p>

            </div>

          )}

        </article>

      </section>


      {/* ADMINISTRACIÓN E INVITACIÓN */}
      <MiembroAdministracionCard
        miembroId={
          miembro.id
        }
        estado={
          miembro.estado
        }
        codigoReferido={
          miembro.codigoReferido
        }
        puedeGestionar={
          admin?.rol ===
          "SUPER_ADMIN"
        }
      />


      {/* ACTIVIDAD COMERCIAL */}
      <section>

        <div className="mb-4">

          <h2 className="text-lg font-bold text-slate-900">
            Actividad comercial
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Ventas atribuidas directamente a este miembro.
          </p>

        </div>


        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">

          <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <ShoppingBag className="h-4 w-4" />
            </div>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {ventasAtribuidas}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Ventas atribuidas
            </p>

          </article>


          <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {
                ventasPagadas
                  ._count
                  ._all
              }
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Ventas pagadas
            </p>

          </article>


          <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <CircleDollarSign className="h-4 w-4" />
            </div>

            <p className="mt-3 text-xl font-bold text-slate-900">
              Bs{" "}
              {dinero(
                ventasPagadas
                  ._sum
                  .total
              )}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Monto pagado
            </p>

          </article>


          <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              CV
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {dinero(
                ventasPagadas
                  ._sum
                  .totalCV
              )}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Volumen comisionable
            </p>

          </article>


          <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              PV
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {dinero(
                ventasPagadas
                  ._sum
                  .totalPV
              )}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Puntos de volumen
            </p>

          </article>

        </div>

      </section>


      {/* COMISIONES */}
      <section>

        <div className="mb-4">

          <h2 className="text-lg font-bold text-slate-900">
            Estado de comisiones
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Comisiones recibidas por este miembro.
          </p>

        </div>


        <div className="grid gap-3 sm:grid-cols-3">

          <article className="rounded-2xl border border-yellow-100 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700">
                <Clock3 className="h-5 w-5" />
              </div>

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Pendiente
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  Bs{" "}
                  {dinero(
                    comisionesPendientes
                      ._sum
                      .monto
                  )}
                </p>

              </div>

            </div>

          </article>


          <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <BadgeDollarSign className="h-5 w-5" />
              </div>

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Aprobada
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  Bs{" "}
                  {dinero(
                    comisionesAprobadas
                      ._sum
                      .monto
                  )}
                </p>

              </div>

            </div>

          </article>


          <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <WalletCards className="h-5 w-5" />
              </div>

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Pagada
                </p>

                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  Bs{" "}
                  {dinero(
                    comisionesPagadas
                      ._sum
                      .monto
                  )}
                </p>

              </div>

            </div>

          </article>

        </div>

      </section>


      {/* ESTRUCTURA DE RED */}
      <section>

        <div className="mb-4">

          <h2 className="text-lg font-bold text-slate-900">
            Estructura de red
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Descendencia visible hasta tres niveles.
          </p>

        </div>


        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

          {[
            {
              titulo:
                "Nivel 1",

              valor:
                nivel1,

              clase:
                "bg-blue-50 text-blue-700",
            },

            {
              titulo:
                "Nivel 2",

              valor:
                nivel2,

              clase:
                "bg-violet-50 text-violet-700",
            },

            {
              titulo:
                "Nivel 3",

              valor:
                nivel3,

              clase:
                "bg-fuchsia-50 text-fuchsia-700",
            },

            {
              titulo:
                "Red hasta nivel 3",

              valor:
                totalRed,

              clase:
                "bg-slate-100 text-slate-700",
            },
          ].map(
            (item) => (

              <article
                key={
                  item.titulo
                }
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >

                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.clase}`}
                >
                  <UsersRound className="h-4 w-4" />
                </div>

                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {
                    item.valor
                  }
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {
                    item.titulo
                  }
                </p>

              </article>

            )
          )}

        </div>

      </section>


      {/* PEDIDOS Y COMISIONES RECIENTES */}
      <section className="grid gap-4 xl:grid-cols-2">

        <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 p-5">

            <div>

              <h2 className="font-bold text-slate-900">
                Últimos pedidos atribuidos
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Ventas generadas mediante su enlace de referido.
              </p>

            </div>

            <ShoppingBag className="h-5 w-5 text-slate-300" />

          </div>


          {ultimosPedidos.length ===
          0 ? (

            <div className="p-8 text-center">

              <p className="text-sm font-semibold text-slate-600">
                Sin pedidos atribuidos
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Todavía no registra ventas mediante su enlace.
              </p>

            </div>

          ) : (

            <div className="space-y-3 bg-slate-50/70 p-3 sm:p-4">

              {ultimosPedidos.map(
                (pedido) => {
                  const comprador =
                    pedido.miembro
                      ? nombrePersona(
                          pedido.miembro
                        )
                      : pedido.nombreCliente ||
                        "Cliente externo";

                  return (
                    <div
                      key={
                        pedido.id
                      }
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/70"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <Link
                            href={`/admin/pedidos/${pedido.id}`}
                            className="font-mono text-sm font-bold text-blue-600 hover:underline"
                          >
                            {
                              pedido.codigo
                            }
                          </Link>

                          <p className="mt-1 text-xs text-slate-400">
                            {
                              comprador
                            }
                          </p>

                        </div>


                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${estiloEstadoPedido(
                            pedido.estado
                          )}`}
                        >
                          {textoEstadoPedido(
                            pedido.estado
                          )}
                        </span>

                      </div>


                      <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">

                        <div>

                          <p className="text-[10px] uppercase text-slate-400">
                            Total
                          </p>

                          <p className="mt-1 text-xs font-bold text-slate-900">
                            Bs{" "}
                            {dinero(
                              pedido.total
                            )}
                          </p>

                        </div>


                        <div>

                          <p className="text-[10px] uppercase text-slate-400">
                            CV
                          </p>

                          <p className="mt-1 text-xs font-bold text-emerald-700">
                            {dinero(
                              pedido.totalCV
                            )}
                          </p>

                        </div>


                        <div>

                          <p className="text-[10px] uppercase text-slate-400">
                            PV
                          </p>

                          <p className="mt-1 text-xs font-bold text-blue-700">
                            {dinero(
                              pedido.totalPV
                            )}
                          </p>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </article>


        <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 p-5">

            <div>

              <h2 className="font-bold text-slate-900">
                Últimas comisiones
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Movimientos financieros recibidos por el miembro.
              </p>

            </div>

            <BadgeDollarSign className="h-5 w-5 text-slate-300" />

          </div>


          {ultimasComisiones.length ===
          0 ? (

            <div className="p-8 text-center">

              <p className="text-sm font-semibold text-slate-600">
                Sin comisiones
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Todavía no registra comisiones generadas.
              </p>

            </div>

          ) : (

            <div className="space-y-3 bg-slate-50/70 p-3 sm:p-4">

              {ultimasComisiones.map(
                (comision) => (

                  <div
                    key={
                      comision.id
                    }
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/70"
                  >

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="text-sm font-bold text-slate-900">
                          Bs{" "}
                          {dinero(
                            comision.monto
                          )}
                        </span>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${estiloEstadoComision(
                            comision.estado
                          )}`}
                        >
                          {textoEstadoComision(
                            comision.estado
                          )}
                        </span>

                      </div>


                      <p className="mt-1 text-xs text-slate-400">

                        {comision.nivel ===
                        0
                          ? "Comisión directa"
                          : `Nivel ${comision.nivel}`}

                        {comision.porcentaje
                          ? ` · ${dinero(
                              comision.porcentaje
                            )}%`
                          : ""}

                      </p>


                      {comision.pedido && (

                        <Link
                          href={`/admin/pedidos/${comision.pedido.id}`}
                          className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-blue-600 hover:underline"
                        >
                          <ReceiptText className="h-3 w-3" />

                          {
                            comision.pedido
                              .codigo
                          }
                        </Link>

                      )}

                    </div>


                    <p className="shrink-0 text-xs text-slate-400">
                      {new Date(
                        comision.createdAt
                      ).toLocaleDateString(
                        "es-BO"
                      )}
                    </p>

                  </div>

                )
              )}

            </div>

          )}

        </article>

      </section>


      {/* ÁRBOL */}
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-5 md:p-6">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Network className="h-5 w-5" />
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Árbol de red
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Visualización descendente hasta tres niveles.
              </p>

            </div>

          </div>

        </div>


        <div className="overflow-x-auto p-5 md:p-6">

          <div className="mx-auto mb-5 flex min-w-[230px] max-w-[290px] items-center gap-3 rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
              {iniciales ||
                "M"}
            </div>

            <div className="min-w-0">

              <p className="truncate font-bold text-slate-900">
                {nombreCompleto}
              </p>

              <p className="mt-0.5 font-mono text-xs text-blue-600">
                {
                  miembro.codigoReferido
                }
              </p>

              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-blue-500">
                Raíz seleccionada
              </p>

            </div>

          </div>


          {red.length >
            0 && (

            <div className="mx-auto h-6 w-px bg-slate-300" />

          )}


          <ArbolMultinivel
            red={red}
          />

        </div>

      </section>

    </div>
  );
}
