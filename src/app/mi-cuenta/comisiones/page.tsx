export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

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

export default async function MisComisionesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("miembro_token")?.value;

  if (!token) {
    redirect("/login-miembro");
  }

  const sesion = await verificarSesion(token);

  if (!sesion) {
    redirect("/login-miembro");
  }

  const miembroId =
    typeof sesion.usuario === "string"
      ? sesion.usuario
      : "";

  if (!miembroId) {
    redirect("/login-miembro");
  }

  const miembro = await prisma.miembro.findUnique({
    where: {
      id: miembroId,
    },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      estado: true,
    },
  });

  if (!miembro || miembro.estado !== "ACTIVO") {
    redirect("/login-miembro");
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
        beneficiarioId: miembro.id,
        estado: "PENDIENTE",
      },
    }),

    prisma.comisionMultinivel.count({
      where: {
        beneficiarioId: miembro.id,
        estado: "APROBADA",
      },
    }),

    prisma.comisionMultinivel.count({
      where: {
        beneficiarioId: miembro.id,
        estado: "PAGADA",
      },
    }),

    prisma.comisionMultinivel.aggregate({
      where: {
        beneficiarioId: miembro.id,
        estado: "PENDIENTE",
      },
      _sum: {
        monto: true,
      },
    }),

    prisma.comisionMultinivel.aggregate({
      where: {
        beneficiarioId: miembro.id,
        estado: "APROBADA",
      },
      _sum: {
        monto: true,
      },
    }),

    prisma.comisionMultinivel.aggregate({
      where: {
        beneficiarioId: miembro.id,
        estado: "PAGADA",
      },
      _sum: {
        monto: true,
      },
    }),

    prisma.comisionMultinivel.findMany({
      where: {
        beneficiarioId: miembro.id,
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

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">

      <div className="mx-auto max-w-6xl space-y-6">

        <div>
          <Link
            href="/mi-cuenta"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Volver a mi cuenta
          </Link>

          <h1 className="mt-3 text-2xl font-bold">
            Mis comisiones
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Consulta tus ganancias generadas dentro de la red multinivel.
          </p>
        </div>


        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">

          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-sm text-gray-500">
              Pendientes
            </p>

            <p className="mt-1 text-2xl font-bold text-yellow-600">
              {pendientes}
            </p>

            <p className="mt-2 text-sm font-semibold">
              Bs {dinero(montoPendiente._sum.monto)}
            </p>
          </div>


          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-sm text-gray-500">
              Aprobadas
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-600">
              {aprobadas}
            </p>

            <p className="mt-2 text-sm font-semibold">
              Bs {dinero(montoAprobado._sum.monto)}
            </p>
          </div>


          <div className="col-span-2 rounded-xl bg-white p-4 shadow lg:col-span-1">
            <p className="text-sm text-gray-500">
              Pagadas
            </p>

            <p className="mt-1 text-2xl font-bold text-green-600">
              {pagadas}
            </p>

            <p className="mt-2 text-sm font-semibold text-green-700">
              Bs {dinero(montoPagado._sum.monto)}
            </p>
          </div>

        </div>


        <div className="overflow-hidden rounded-xl bg-white shadow">

          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">
              Historial
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Últimas comisiones generadas a tu favor.
            </p>
          </div>


          {comisiones.length === 0 ? (

            <div className="p-10 text-center">

              <p className="font-semibold">
                Todavía no tienes comisiones.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Cuando tu red genere ganancias aparecerán aquí.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px] text-left text-sm">

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


                <tbody className="divide-y">

                  {comisiones.map((comision) => (

                    <tr
                      key={comision.id}
                      className="hover:bg-gray-50"
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


                      <td className="px-4 py-4 font-bold">
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


                      <td className="max-w-[240px] px-4 py-4 text-gray-600">
                        {comision.concepto || "-"}
                      </td>


                      <td className="px-4 py-4 text-gray-500">
                        {new Date(
                          comision.createdAt
                        ).toLocaleDateString("es-BO")}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </main>
  );
}
