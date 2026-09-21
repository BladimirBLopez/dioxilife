export const dynamic =
  "force-dynamic";

import {
  ClipboardList,
  CircleDollarSign,
  Clock3,
  CreditCard,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  XCircle,
} from "lucide-react";

import {
  prisma,
} from "@/lib/prisma";

import PedidosTable from "@/components/admin/PedidosTable";

import type {
  PedidoAdminRow,
} from "@/components/admin/PedidosTable";


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


export default async function PedidosAdminPage() {
  const [
    total,
    montoPedidos,
    nuevos,
    confirmados,
    pagosReportados,
    pagados,
    completados,
    cancelados,
    pedidos,
  ] = await Promise.all([
    prisma.pedido.count(),

    prisma.pedido.aggregate({
      where: {
        estado: {
          not: "CANCELADO",
        },
      },

      _sum: {
        total: true,
      },
    }),

    prisma.pedido.count({
      where: {
        estado: "NUEVO",
      },
    }),

    prisma.pedido.count({
      where: {
        estado:
          "CONFIRMADO",
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
        estado: "PAGADO",
      },
    }),

    prisma.pedido.count({
      where: {
        estado:
          "COMPLETADO",
      },
    }),

    prisma.pedido.count({
      where: {
        estado:
          "CANCELADO",
      },
    }),

    prisma.pedido.findMany({
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

        requiereCotizacion: true,
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
            codigoReferido: true,
          },
        },

        _count: {
          select: {
            detalles: true,
          },
        },
      },
    }),
  ]);


  const filas:
    PedidoAdminRow[] =
    pedidos.map(
      (pedido) => {
        const compradorNombre =
          pedido.miembro
            ? nombrePersona(
                pedido.miembro
              )
            : pedido.nombreCliente ||
              "Cliente externo";

        const compradorTipo =
          pedido.miembro
            ? "Miembro DioxiLife"
            : "Cliente externo";

        const vendedorNombre =
          pedido.referidoPor
            ? nombrePersona(
                pedido.referidoPor
              )
            : "Venta directa DioxiLife";

        return {
          id: pedido.id,

          codigo:
            pedido.codigo,

          estado:
            pedido.estado,

          nombreCliente:
            pedido.nombreCliente,

          telefonoCliente:
            pedido.telefonoCliente,

          compradorNombre,

          compradorTipo,

          vendedorNombre,

          vendedorCodigo:
            pedido.referidoPor
              ?.codigoReferido ??
            null,

          total:
            Number(
              String(
                pedido.total
              )
            ),

          totalCV:
            Number(
              String(
                pedido.totalCV
              )
            ),

          totalPV:
            Number(
              String(
                pedido.totalPV
              )
            ),

          productos:
            pedido._count
              .detalles,

          requiereCotizacion:
            pedido.requiereCotizacion,

          createdAt:
            pedido.createdAt
              .toISOString(),
        };
      }
    );


  const tarjetas = [
    {
      titulo:
        "Total pedidos",
      valor:
        String(total),
      descripcion:
        "Historial registrado",
      icono:
        ClipboardList,
      clase:
        "bg-slate-50 text-slate-700",
    },

    {
      titulo:
        "Monto pedidos",
      valor:
        `Bs ${dinero(
          montoPedidos._sum.total
        )}`,
      descripcion:
        "Sin cancelados",
      icono:
        CircleDollarSign,
      clase:
        "bg-violet-50 text-violet-700",
    },

    {
      titulo:
        "Nuevos",
      valor:
        String(nuevos),
      descripcion:
        "Esperando gestión",
      icono:
        ShoppingBag,
      clase:
        "bg-yellow-50 text-yellow-700",
    },

    {
      titulo:
        "Confirmados",
      valor:
        String(confirmados),
      descripcion:
        "Esperando pago",
      icono:
        ShieldCheck,
      clase:
        "bg-blue-50 text-blue-700",
    },

    {
      titulo:
        "Pagos reportados",
      valor:
        String(
          pagosReportados
        ),
      descripcion:
        "Requieren revisión",
      icono:
        Clock3,
      clase:
        "bg-orange-50 text-orange-700",
    },

    {
      titulo:
        "Pagados",
      valor:
        String(pagados),
      descripcion:
        "Pago aprobado",
      icono:
        CreditCard,
      clase:
        "bg-green-50 text-green-700",
    },

    {
      titulo:
        "Completados",
      valor:
        String(completados),
      descripcion:
        "Operación finalizada",
      icono:
        PackageCheck,
      clase:
        "bg-emerald-50 text-emerald-700",
    },

    {
      titulo:
        "Cancelados",
      valor:
        String(cancelados),
      descripcion:
        "Sin continuidad",
      icono:
        XCircle,
      clase:
        "bg-red-50 text-red-700",
    },
  ];


  return (
    <div className="mx-auto max-w-[1500px] space-y-6">

      <div>

        <p className="text-sm font-semibold text-blue-600">
          Operaciones
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
          Pedidos
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Control y seguimiento de las ventas registradas en DioxiLife.
        </p>

      </div>


      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        {tarjetas.map(
          (tarjeta) => {
            const Icono =
              tarjeta.icono;

            return (
              <div
                key={
                  tarjeta.titulo
                }
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-5"
              >

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${tarjeta.clase}`}
                >
                  <Icono className="h-5 w-5" />
                </div>

                <p className="mt-4 text-xl font-bold text-slate-900 md:text-2xl">
                  {tarjeta.valor}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {tarjeta.titulo}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {tarjeta.descripcion}
                </p>

              </div>
            );
          }
        )}

      </section>


      {pagosReportados >
        0 && (

        <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">

          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />

          <div>

            <p className="font-semibold text-orange-900">
              Hay pagos esperando revisión
            </p>

            <p className="mt-1 text-sm text-orange-700">
              {pagosReportados} pedido
              {pagosReportados === 1
                ? ""
                : "s"}{" "}
              requiere
              {pagosReportados === 1
                ? ""
                : "n"}{" "}
              validación del Super Admin.
            </p>

          </div>

        </div>

      )}


      <PedidosTable
        data={filas}
      />

    </div>
  );
}
