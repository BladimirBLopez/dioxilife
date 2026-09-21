export const dynamic =
  "force-dynamic";

import Link from "next/link";

import {
  ArrowLeft,
  BadgeCheck,
  BadgeDollarSign,
  Banknote,
  CircleX,
  Clock3,
  WalletCards,
} from "lucide-react";

import {
  prisma,
} from "@/lib/prisma";

import ComisionesTable from "@/components/admin/ComisionesTable";

import type {
  ComisionAdminRow,
} from "@/components/admin/ComisionesTable";


function numero(
  valor: unknown
) {
  return Number(
    String(
      valor ?? 0
    )
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
    numero(valor)
  );
}


function nombrePersona(
  persona: {
    nombres: string;
    apellidos: string | null;
  }
) {
  return [
    persona.nombres,
    persona.apellidos,
  ]
    .filter(Boolean)
    .join(" ");
}


export default async function ComisionesMultinivelPage() {

  const [
    total,
    pendientes,
    aprobadas,
    pagadas,
    anuladas,
    montoPendiente,
    montoAprobado,
    montoPagado,
    comisiones,
  ] = await Promise.all([

    prisma.comisionMultinivel.count(),

    prisma.comisionMultinivel.count({
      where: {
        estado:
          "PENDIENTE",
      },
    }),

    prisma.comisionMultinivel.count({
      where: {
        estado:
          "APROBADA",
      },
    }),

    prisma.comisionMultinivel.count({
      where: {
        estado:
          "PAGADA",
      },
    }),

    prisma.comisionMultinivel.count({
      where: {
        estado:
          "ANULADA",
      },
    }),

    prisma.comisionMultinivel.aggregate({
      where: {
        estado:
          "PENDIENTE",
      },

      _sum: {
        monto: true,
      },
    }),

    prisma.comisionMultinivel.aggregate({
      where: {
        estado:
          "APROBADA",
      },

      _sum: {
        monto: true,
      },
    }),

    prisma.comisionMultinivel.aggregate({
      where: {
        estado:
          "PAGADA",
      },

      _sum: {
        monto: true,
      },
    }),

    prisma.comisionMultinivel.findMany({
      orderBy: {
        createdAt:
          "desc",
      },

      select: {
        id: true,

        nivel: true,

        montoBase: true,
        porcentaje: true,
        monto: true,

        concepto: true,

        estado: true,

        createdAt: true,

        beneficiario: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            codigoReferido: true,
          },
        },

        origenMiembro: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            codigoReferido: true,
          },
        },

        pedido: {
          select: {
            id: true,
            codigo: true,
          },
        },
      },
    }),
  ]);


  const filas:
    ComisionAdminRow[] =
    comisiones.map(
      (comision) => ({
        id:
          comision.id,

        beneficiarioId:
          comision
            .beneficiario
            .id,

        beneficiarioNombre:
          nombrePersona(
            comision.beneficiario
          ),

        beneficiarioCodigo:
          comision
            .beneficiario
            .codigoReferido,

        origenId:
          comision
            .origenMiembro
            .id,

        origenNombre:
          nombrePersona(
            comision.origenMiembro
          ),

        origenCodigo:
          comision
            .origenMiembro
            .codigoReferido,

        pedidoId:
          comision.pedido
            ?.id ??
          null,

        pedidoCodigo:
          comision.pedido
            ?.codigo ??
          null,

        nivel:
          comision.nivel,

        montoBase:
          comision.montoBase ===
          null
            ? null
            : numero(
                comision.montoBase
              ),

        porcentaje:
          comision.porcentaje ===
          null
            ? null
            : numero(
                comision.porcentaje
              ),

        monto:
          numero(
            comision.monto
          ),

        concepto:
          comision.concepto,

        estado:
          comision.estado,

        createdAt:
          comision.createdAt
            .toISOString(),
      })
    );


  const tarjetas = [
    {
      titulo:
        "Total",

      valor:
        String(total),

      descripcion:
        "Comisiones registradas",

      icono:
        BadgeDollarSign,

      clase:
        "bg-slate-100 text-slate-700",
    },

    {
      titulo:
        "Pendientes",

      valor:
        String(
          pendientes
        ),

      descripcion:
        "Esperando revisión",

      icono:
        Clock3,

      clase:
        "bg-yellow-50 text-yellow-700",
    },

    {
      titulo:
        "Aprobadas",

      valor:
        String(
          aprobadas
        ),

      descripcion:
        "Pendientes de pago",

      icono:
        BadgeCheck,

      clase:
        "bg-blue-50 text-blue-700",
    },

    {
      titulo:
        "Pagadas",

      valor:
        String(
          pagadas
        ),

      descripcion:
        "Pago finalizado",

      icono:
        WalletCards,

      clase:
        "bg-emerald-50 text-emerald-700",
    },

    {
      titulo:
        "Anuladas",

      valor:
        String(
          anuladas
        ),

      descripcion:
        "Sin efecto financiero",

      icono:
        CircleX,

      clase:
        "bg-red-50 text-red-700",
    },
  ];


  return (
    <div className="mx-auto max-w-[1500px] space-y-6">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>

          <Link
            href="/admin/multinivel"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Resumen multinivel
          </Link>


          <p className="mt-5 text-sm font-semibold text-blue-600">
            Finanzas de red
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
            Comisiones
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Seguimiento, aprobación y pago de las comisiones generadas por ventas de la red DioxiLife.
          </p>

        </div>

      </div>


      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">

        {tarjetas.map(
          (tarjeta) => {
            const Icono =
              tarjeta.icono;

            return (
              <article
                key={
                  tarjeta.titulo
                }
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${tarjeta.clase}`}
                >
                  <Icono className="h-5 w-5" />
                </div>

                <p className="mt-4 text-2xl font-bold text-slate-900">
                  {tarjeta.valor}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {tarjeta.titulo}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {tarjeta.descripcion}
                </p>

              </article>
            );
          }
        )}

      </section>


      <section className="grid gap-3 md:grid-cols-3">

        <article className="rounded-2xl border border-yellow-100 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700">
              <Clock3 className="h-5 w-5" />
            </div>

            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Monto pendiente
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                Bs {dinero(
                  montoPendiente
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
              <Banknote className="h-5 w-5" />
            </div>

            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Aprobado por pagar
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                Bs {dinero(
                  montoAprobado
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
                Monto pagado
              </p>

              <p className="mt-1 text-2xl font-bold text-emerald-700">
                Bs {dinero(
                  montoPagado
                    ._sum
                    .monto
                )}
              </p>

            </div>

          </div>

        </article>

      </section>


      {aprobadas > 0 && (

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">

          <div className="flex items-start gap-3">

            <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

            <div>

              <p className="font-semibold text-blue-900">
                Hay comisiones aprobadas pendientes de pago
              </p>

              <p className="mt-1 text-sm text-blue-700">
                {aprobadas} comisión
                {aprobadas === 1
                  ? ""
                  : "es"}{" "}
                por un total de Bs{" "}
                {dinero(
                  montoAprobado
                    ._sum
                    .monto
                )}.
              </p>

            </div>

          </div>

        </div>

      )}


      <ComisionesTable
        data={filas}
      />

    </div>
  );
}
