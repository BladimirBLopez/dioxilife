export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AccionesComision from "./AccionesComision";

function dinero(valor: unknown) {
  const numero = Number(String(valor ?? 0));

  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero);
}

function estiloEstado(estado: string) {
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

export default async function ComisionesMultinivelPage() {

  const [
    total,
    pendientes,
    aprobadas,
    pagadas,
    anuladas,
    montoPendiente,
    montoPagado,
    comisiones,
  ] = await Promise.all([

    prisma.comisionMultinivel.count(),

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

    prisma.comisionMultinivel.count({
      where: {
        estado: "PAGADA",
      },
    }),

    prisma.comisionMultinivel.count({
      where: {
        estado: "ANULADA",
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

    prisma.comisionMultinivel.findMany({
      orderBy: {
        createdAt: "desc",
      },

      take: 50,

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
      },
    }),
  ]);


  return (
    <div className="space-y-6">

      <div>
        <Link
          href="/admin/multinivel"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Volver a Multinivel
        </Link>

        <h1 className="mt-2 text-2xl font-semibold">
          Comisiones Multinivel
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Control y seguimiento de las comisiones generadas por la red.
        </p>
      </div>


      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">

        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Total
          </p>

          <p className="mt-1 text-2xl font-bold">
            {total}
          </p>
        </div>


        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Pendientes
          </p>

          <p className="mt-1 text-2xl font-bold text-yellow-600">
            {pendientes}
          </p>
        </div>


        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Aprobadas
          </p>

          <p className="mt-1 text-2xl font-bold text-blue-600">
            {aprobadas}
          </p>
        </div>


        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Pagadas
          </p>

          <p className="mt-1 text-2xl font-bold text-green-600">
            {pagadas}
          </p>
        </div>


        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Anuladas
          </p>

          <p className="mt-1 text-2xl font-bold text-red-600">
            {anuladas}
          </p>
        </div>

      </div>


      <div className="grid gap-4 md:grid-cols-2">

        <div className="rounded-xl bg-white p-5 shadow">

          <p className="text-sm text-gray-500">
            Monto pendiente
          </p>

          <p className="mt-2 text-3xl font-bold">
            Bs {dinero(montoPendiente._sum.monto)}
          </p>

        </div>


        <div className="rounded-xl bg-white p-5 shadow">

          <p className="text-sm text-gray-500">
            Monto pagado
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            Bs {dinero(montoPagado._sum.monto)}
          </p>

        </div>

      </div>


      <div className="overflow-hidden rounded-xl bg-white shadow">

        <div className="border-b p-5">

          <h2 className="text-lg font-semibold">
            Historial de comisiones
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Últimas 50 operaciones registradas.
          </p>

        </div>


        {comisiones.length === 0 ? (

          <div className="p-10 text-center">

            <p className="font-medium">
              Todavía no existen comisiones registradas.
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Cuando el sistema genere comisiones aparecerán aquí.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1000px] text-left text-sm">

              <thead className="bg-gray-50 text-gray-600">

                <tr>
                  <th className="px-4 py-3">
                    Beneficiario
                  </th>

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
                    Fecha
                  </th>

                  <th className="px-4 py-3">
                    Acciones
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y">

                {comisiones.map((comision) => (

                  <tr
                    key={comision.id}
                    className="hover:bg-gray-50"
                  >

                    <td className="px-4 py-4">

                      <Link
                        href={`/admin/multinivel/${comision.beneficiario.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {comision.beneficiario.nombres}
                        {comision.beneficiario.apellidos
                          ? ` ${comision.beneficiario.apellidos}`
                          : ""}
                      </Link>

                      <p className="mt-1 font-mono text-xs text-gray-400">
                        {comision.beneficiario.codigoReferido}
                      </p>

                    </td>


                    <td className="px-4 py-4">

                      <Link
                        href={`/admin/multinivel/${comision.origenMiembro.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {comision.origenMiembro.nombres}
                        {comision.origenMiembro.apellidos
                          ? ` ${comision.origenMiembro.apellidos}`
                          : ""}
                      </Link>

                      <p className="mt-1 font-mono text-xs text-gray-400">
                        {comision.origenMiembro.codigoReferido}
                      </p>

                    </td>


                    <td className="px-4 py-4">
                      Nivel {comision.nivel}
                    </td>


                    <td className="px-4 py-4">
                      {comision.montoBase
                        ? `Bs ${dinero(comision.montoBase)}`
                        : "-"}
                    </td>


                    <td className="px-4 py-4">
                      {comision.porcentaje
                        ? `${dinero(comision.porcentaje)}%`
                        : "-"}
                    </td>


                    <td className="px-4 py-4 font-semibold">
                      Bs {dinero(comision.monto)}
                    </td>


                    <td className="px-4 py-4">

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estiloEstado(
                          comision.estado
                        )}`}
                      >
                        {comision.estado}
                      </span>

                    </td>


                    <td className="px-4 py-4 text-gray-500">
                      {new Date(
                        comision.createdAt
                      ).toLocaleDateString("es-BO")}
                    </td>


                    <td className="px-4 py-4">
                      <AccionesComision
                        id={comision.id}
                        estado={comision.estado}
                      />
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}
