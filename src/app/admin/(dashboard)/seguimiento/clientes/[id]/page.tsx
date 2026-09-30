export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AgendaCliente from "@/components/admin/seguimiento/AgendaCliente";
import AccionesSeguimientoCliente from "@/components/admin/seguimiento/AccionesSeguimientoCliente";
import HistorialWhatsApp from "@/components/admin/seguimiento/HistorialWhatsApp";

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
        origen: true,
        referenciaCompra: true,

        createdAt: true,

        enviosWhatsApp: {
          orderBy: {
            fechaEnvio: "desc",
          },

          select: {
            id: true,
            telefono: true,
            mensaje: true,
            fechaEnvio: true,
            enviadoPorUsuario: true,
          },

          take: 5,
        },

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
              hora: {
                sort: "asc",
                nulls: "last",
              },
            },
            {
              createdAt: "asc",
            },
          ],

          select: {
            id: true,
            tipo: true,
            recordatorio: true,
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
    <div className="w-full max-w-full overflow-hidden space-y-6">

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
            Plantilla asignada
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

              <div className="mt-4">
                <AccionesSeguimientoCliente
                  seguimientoId={seguimiento.id}
                  ultimoEnvio={
                    seguimiento.enviosWhatsApp[0] || null
                  }
                />

                <HistorialWhatsApp
                  envios={seguimiento.enviosWhatsApp}
                />
              </div>
            </div>

          </div>

        </div>


        <div className="rounded-xl bg-white p-5 shadow">

          <h2 className="text-lg font-semibold text-gray-900">
            Origen
          </h2>

          <div className="mt-4">

            <p className="font-semibold text-gray-900">
              {seguimiento.origen === "WHATSAPP"
                ? "WhatsApp"
                : seguimiento.origen === "LLAMADA"
                ? "Llamada"
                : seguimiento.origen === "TIENDA"
                ? "Tienda"
                : seguimiento.origen === "PEDIDO_WEB"
                ? "Pedido web"
                : "Otro"}
            </p>

            {seguimiento.pedido ? (
              <>
                <Link
                  href={`/admin/pedidos/${seguimiento.pedido.id}`}
                  className="mt-2 inline-block font-mono font-semibold text-blue-600 hover:underline"
                >
                  {seguimiento.pedido.codigo}
                </Link>

                <p className="mt-2 text-sm text-gray-500">
                  Estado: {seguimiento.pedido.estado}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                Sin pedido vinculado
              </p>
            )}

            {seguimiento.referenciaCompra && (
              <div className="mt-4">
                <p className="text-xs text-gray-500">
                  Referencia de compra
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                  {seguimiento.referenciaCompra}
                </p>
              </div>
            )}

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


      <AgendaCliente
        seguimientoId={seguimiento.id}
        duracionDias={seguimiento.duracionDias}
        estado={seguimiento.estado}
        actividades={seguimiento.actividades.map(
          (actividad) => ({
            id: actividad.id,
            tipo: actividad.tipo,
            recordatorio: actividad.recordatorio,
            titulo: actividad.titulo,
            descripcion: actividad.descripcion,
            momento: actividad.momento,
            hora: actividad.hora,
            diaInicio: actividad.diaInicio,
            diaFin: actividad.diaFin,
            orden: actividad.orden,
            activo: actividad.activo,
            cantidadProgresos:
              actividad._count.progresos,
          })
        )}
      />

    </div>
  );
}
