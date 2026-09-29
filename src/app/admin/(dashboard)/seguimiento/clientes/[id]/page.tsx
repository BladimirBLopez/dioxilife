export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

function estiloEstado(estado: string) {
  switch (estado) {
    case "PENDIENTE":
      return "bg-amber-100 text-amber-700";

    case "ACTIVO":
      return "bg-green-100 text-green-700";

    case "PAUSADO":
      return "bg-orange-100 text-orange-700";

    case "COMPLETADO":
      return "bg-blue-100 text-blue-700";

    case "CANCELADO":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function fecha(valor: Date | null) {
  if (!valor) {
    return "—";
  }

  return valor.toLocaleDateString("es-BO", {
    timeZone: "UTC",
  });
}

export default async function SeguimientoClientePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        nombreCliente: true,
        telefonoCliente: true,

        nombrePlan: true,
        duracionDias: true,

        estado: true,

        fechaInicioPrevista: true,
        fechaInicio: true,
        fechaFinalizado: true,

        ultimoAccesoAt: true,
        observacionInterna: true,

        createdAt: true,

        pedido: {
          select: {
            id: true,
            codigo: true,
            estado: true,
          },
        },

        actividades: {
          orderBy: [
            {
              diaInicio: "asc",
            },
            {
              orden: "asc",
            },
            {
              createdAt: "asc",
            },
          ],

          select: {
            id: true,
            titulo: true,
            descripcion: true,
            momento: true,
            hora: true,
            diaInicio: true,
            diaFin: true,
            orden: true,
            activo: true,

            _count: {
              select: {
                progresos: true,
              },
            },
          },
        },

        progresos: {
          where: {
            completado: true,
          },

          select: {
            id: true,
          },
        },
      },
    });

  if (!seguimiento) {
    notFound();
  }

  return (
    <div className="space-y-6">

      <div>

        <Link
          href="/admin/seguimiento/clientes"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Volver a clientes
        </Link>


        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <h1 className="text-2xl font-semibold text-gray-900">
              {seguimiento.nombreCliente ||
                "Cliente sin nombre"}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Agenda individual de seguimiento
            </p>

          </div>


          <span
            className={`w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${estiloEstado(
              seguimiento.estado
            )}`}
          >
            {seguimiento.estado}
          </span>

        </div>

      </div>


      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl bg-white p-5 shadow">

          <p className="text-sm text-gray-500">
            Plan asignado
          </p>

          <p className="mt-2 font-semibold text-gray-900">
            {seguimiento.nombrePlan}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {seguimiento.duracionDias} días
          </p>

        </div>


        <div className="rounded-xl bg-white p-5 shadow">

          <p className="text-sm text-gray-500">
            Inicio previsto
          </p>

          <p className="mt-2 font-semibold text-gray-900">
            {fecha(
              seguimiento.fechaInicioPrevista
            )}
          </p>

        </div>


        <div className="rounded-xl bg-white p-5 shadow">

          <p className="text-sm text-gray-500">
            Inicio real
          </p>

          <p className="mt-2 font-semibold text-gray-900">
            {seguimiento.fechaInicio
              ? new Date(
                  seguimiento.fechaInicio
                ).toLocaleString("es-BO", {
                  timeZone:
                    "America/La_Paz",
                })
              : "Todavía no iniciado"}
          </p>

        </div>


        <div className="rounded-xl bg-white p-5 shadow">

          <p className="text-sm text-gray-500">
            Actividades
          </p>

          <p className="mt-2 text-2xl font-bold text-violet-700">
            {seguimiento.actividades.length}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {seguimiento.progresos.length} registros completados
          </p>

        </div>

      </div>


      <div className="grid gap-4 lg:grid-cols-3">

        <div className="rounded-xl bg-white p-5 shadow">

          <h2 className="text-lg font-semibold text-gray-900">
            Cliente
          </h2>

          <div className="mt-4 space-y-3 text-sm">

            <div>
              <p className="text-gray-500">
                Nombre
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {seguimiento.nombreCliente ||
                  "No registrado"}
              </p>
            </div>


            <div>
              <p className="text-gray-500">
                WhatsApp
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {seguimiento.telefonoCliente ||
                  "No registrado"}
              </p>
            </div>

          </div>

        </div>


        <div className="rounded-xl bg-white p-5 shadow">

          <h2 className="text-lg font-semibold text-gray-900">
            Pedido de origen
          </h2>

          <div className="mt-4">

            <Link
              href={`/admin/pedidos/${seguimiento.pedido.id}`}
              className="font-mono font-semibold text-blue-600 hover:underline"
            >
              {seguimiento.pedido.codigo}
            </Link>

            <p className="mt-2 text-sm text-gray-500">
              Estado: {seguimiento.pedido.estado}
            </p>

          </div>

        </div>


        <div className="rounded-xl bg-white p-5 shadow">

          <h2 className="text-lg font-semibold text-gray-900">
            Acceso del cliente
          </h2>

          {seguimiento.ultimoAccesoAt ? (

            <p className="mt-4 text-sm text-green-700">
              Último acceso:{" "}
              {new Date(
                seguimiento.ultimoAccesoAt
              ).toLocaleString("es-BO", {
                timeZone:
                  "America/La_Paz",
              })}
            </p>

          ) : (

            <p className="mt-4 text-sm text-amber-700">
              El cliente todavía no ha abierto su seguimiento.
            </p>

          )}

        </div>

      </div>


      {seguimiento.observacionInterna && (

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">

          <p className="text-sm font-semibold text-amber-900">
            Observación interna
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm text-amber-800">
            {seguimiento.observacionInterna}
          </p>

        </div>

      )}


      <div className="rounded-xl bg-white shadow">

        <div className="border-b border-gray-100 p-5">

          <h2 className="text-lg font-semibold text-gray-900">
            Agenda individual
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Estas actividades pertenecen exclusivamente a este cliente.
          </p>

        </div>


        {seguimiento.actividades.length === 0 ? (

          <div className="p-6 text-sm text-gray-500">
            Esta agenda no tiene actividades.
          </div>

        ) : (

          <div className="divide-y">

            {seguimiento.actividades.map(
              (actividad) => (

                <div
                  key={actividad.id}
                  className="p-5"
                >

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          Día {actividad.diaInicio}
                          {actividad.diaFin &&
                          actividad.diaFin !==
                            actividad.diaInicio
                            ? ` al ${actividad.diaFin}`
                            : ""}
                        </span>

                        {actividad.hora && (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {actividad.hora}
                          </span>
                        )}

                        {actividad.momento && (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {actividad.momento}
                          </span>
                        )}

                        {!actividad.activo && (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                            Inactiva
                          </span>
                        )}

                      </div>


                      <h3 className="mt-3 font-semibold text-gray-900">
                        {actividad.titulo}
                      </h3>


                      {actividad.descripcion && (
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                          {actividad.descripcion}
                        </p>
                      )}

                    </div>


                    <div className="text-sm text-gray-500">
                      {actividad._count.progresos} progreso
                      {actividad._count.progresos === 1
                        ? ""
                        : "s"}
                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>
  );
}
