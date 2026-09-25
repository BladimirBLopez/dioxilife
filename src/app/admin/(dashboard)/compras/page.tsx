export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  CircleDollarSign,
  Clock3,
  ClipboardList,
} from "lucide-react";


function dinero(valor: unknown) {
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor ?? 0));
}


function fechaHora(valor: Date | null) {
  if (!valor) {
    return "Pendiente";
  }

  return new Intl.DateTimeFormat("es-BO", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(valor);
}


function nombreEstado(
  estado: string
) {
  if (
    estado === "RECIBIDA"
  ) {
    return "Recibida";
  }

  if (
    estado === "ANULADA"
  ) {
    return "Anulada";
  }

  return "Pendiente";
}


function claseEstado(
  estado: string
) {
  if (
    estado === "RECIBIDA"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    estado === "ANULADA"
  ) {
    return "bg-red-50 text-red-600";
  }

  return "bg-amber-50 text-amber-700";
}


export default async function ComprasPage() {

  const [
    totalCompras,
    montoRecibido,
    pendientes,
    compras,
  ] = await Promise.all([

    prisma.compra.count(),

    prisma.compra.aggregate({
      where: {
        estado: "RECIBIDA",
      },
      _sum: {
        total: true,
      },
    }),

    prisma.compra.count({
      where: {
        estado: "REGISTRADA",
      },
    }),

    prisma.compra.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      include: {
        proveedor: true,
      },
    }),

  ]);


  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-3">

        <div>

          <p className="text-xs uppercase tracking-wider text-brand-pink font-semibold">
            Abastecimiento
          </p>

          <h1 className="text-2xl font-bold text-[#1F1B24]">
            Compras
          </h1>

          <p className="text-sm text-[#77737D]">
            Compras y recepción de mercadería.
          </p>

        </div>


        <Link
          href="/admin/compras/nueva"
          className="admin-btn-primary"
        >
          Nueva compra
        </Link>

      </div>


      <div className="grid gap-4 md:grid-cols-3">

        <div className="admin-card p-4">

          <ClipboardList className="h-5 w-5 text-blue-600" />

          <p className="mt-3 text-2xl font-bold">
            {totalCompras}
          </p>

          <p className="text-xs text-[#77737D]">
            Compras registradas
          </p>

        </div>


        <div className="admin-card p-4">

          <CircleDollarSign className="h-5 w-5 text-green-600" />

          <p className="mt-3 text-2xl font-bold">
            Bs {dinero(montoRecibido._sum.total)}
          </p>

          <p className="text-xs text-[#77737D]">
            Inversión recibida
          </p>

        </div>


        <div className="admin-card p-4">

          <Clock3 className="h-5 w-5 text-orange-600" />

          <p className="mt-3 text-2xl font-bold">
            {pendientes}
          </p>

          <p className="text-xs text-[#77737D]">
            Pendientes de recibir
          </p>

        </div>

      </div>


      <div className="admin-card overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-[#F8F8FA] text-xs uppercase text-[#77737D]">

              <tr>

                <th className="p-4 text-left">
                  Código
                </th>

                <th className="p-4 text-left">
                  Proveedor
                </th>

                <th className="p-4 text-left">
                  Estado
                </th>

                <th className="p-4 text-right">
                  Total
                </th>

                <th className="p-4 text-left">
                  Registro
                </th>

                <th className="p-4 text-left">
                  Recepción
                </th>

              </tr>

            </thead>


            <tbody>

              {compras.map(
                (compra) => (

                  <tr
                    key={compra.id}
                    className="border-t"
                  >

                    <td className="p-4 font-medium">

                      <Link
                        href={`/admin/compras/${compra.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {compra.codigo}
                      </Link>

                    </td>


                    <td className="p-4">
                      {compra.proveedor.nombre}
                    </td>


                    <td className="p-4">

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${claseEstado(compra.estado)}`}
                      >
                        {nombreEstado(compra.estado)}
                      </span>

                    </td>


                    <td className="p-4 text-right font-semibold">
                      Bs {dinero(compra.total)}
                    </td>


                    <td className="p-4 whitespace-nowrap text-xs text-[#77737D]">
                      {fechaHora(compra.createdAt)}
                    </td>


                    <td className="p-4 whitespace-nowrap text-xs text-[#77737D]">
                      {fechaHora(compra.recibidaAt)}
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>


    </div>
  );
}
