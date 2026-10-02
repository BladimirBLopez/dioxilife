export const dynamic = "force-dynamic";

import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import { prisma } from "@/lib/prisma";

import PrepararSeguimientoCliente from "@/components/admin/seguimiento/PrepararSeguimientoCliente";

import ProtocolosAdicionalesPreparacion from "@/components/admin/seguimiento/ProtocolosAdicionalesPreparacion";

export default async function PrepararSeguimientoPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        id,
      },

      select: {
        id: true,

        nombreCliente:
          true,

        telefonoCliente:
          true,

        nombrePlan:
          true,

        duracionDias:
          true,

        estado:
          true,

        preparadoAt:
          true,

        registrosDiarios: {
          where: {
            diaPlan: 1,
          },

          select: {
            peso: true,
            observacion:
              true,
          },

          take: 1,
        },

        actividades: {
          orderBy: [
            {
              diaInicio:
                "asc",
            },
            {
              hora: {
                sort: "asc",
                nulls: "last",
              },
            },
            {
              orden:
                "asc",
            },
            {
              createdAt:
                "asc",
            },
          ],

          select: {
            id: true,
            tipo: true,
            recordatorio: true,
            seccion: true,
            titulo: true,
            descripcion: true,
            momento: true,
            hora: true,
            diaInicio: true,
            diaFin: true,
            orden: true,
            activo: true,
          },
        },
      },
    });

  if (!seguimiento) {
    notFound();
  }

  if (
    seguimiento.estado !==
      "PENDIENTE" ||
    seguimiento.preparadoAt
  ) {
    redirect(
      `/admin/seguimiento/clientes/${seguimiento.id}`
    );
  }

  const registroInicial =
    seguimiento
      .registrosDiarios[0] ||
    null;

  const principales =
    seguimiento.actividades.filter(
      (actividad) =>
        actividad.activo &&
        actividad.seccion ===
          "PRINCIPAL"
    );

  const adicionales =
    seguimiento.actividades.filter(
      (actividad) =>
        actividad.activo &&
        actividad.seccion ===
          "ADICIONAL"
    );

  return (
    <div className="space-y-5">

      <div>

        <Link
          href={`/admin/seguimiento/clientes/${seguimiento.id}`}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Guardar y continuar después
        </Link>

        <h1 className="mt-3 text-2xl font-semibold text-gray-900">
          Preparar seguimiento
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Personaliza el protocolo de{" "}
          {seguimiento.nombreCliente ||
            "este cliente"} antes de enviar su acceso.
        </p>

      </div>


      <PrepararSeguimientoCliente
        seguimientoId={
          seguimiento.id
        }
        nombreCliente={
          seguimiento.nombreCliente ||
          "Cliente"
        }
        nombrePlan={
          seguimiento.nombrePlan
        }
        duracionDias={
          seguimiento.duracionDias
        }
        pesoInicial={
          registroInicial?.peso ===
            null ||
          registroInicial?.peso ===
            undefined
            ? null
            : Number(
                registroInicial.peso
              )
        }
        observacionDia1={
          registroInicial
            ?.observacion ??
          null
        }
        cantidadPrincipales={
          principales.length
        }
        cantidadAdicionales={
          adicionales.length
        }
        tieneTelefono={
          Boolean(
            seguimiento.telefonoCliente
          )
        }
      >

        <section className="rounded-xl bg-white p-5 shadow">

          <div className="flex items-start gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
              2
            </div>


            <div className="min-w-0 flex-1">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                <div>

                  <h2 className="font-semibold text-gray-900">
                    Protocolo principal
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Se cargó automáticamente desde la plantilla seleccionada.
                  </p>

                </div>


                <Link
                  href={`/admin/seguimiento/clientes/${seguimiento.id}#agenda-individual`}
                  className="shrink-0 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                >
                  Configuración avanzada
                </Link>

              </div>


              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">

                {principales.length ===
                0 ? (

                  <div className="p-5 text-sm text-gray-500">
                    No hay actividades principales activas.
                  </div>

                ) : (

                  <div className="divide-y divide-gray-100">

                    {principales.map(
                      (
                        actividad
                      ) => (

                        <div
                          key={
                            actividad.id
                          }
                          className="flex gap-3 p-3"
                        >

                          <div className="w-14 shrink-0 text-sm font-bold text-blue-700">
                            {actividad.hora ||
                              "—"}
                          </div>


                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <p className="font-medium text-gray-900">
                                {
                                  actividad.titulo
                                }
                              </p>

                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                                Día{" "}
                                {
                                  actividad.diaInicio
                                }
                                {actividad.diaFin !==
                                null
                                  ? `–${actividad.diaFin}`
                                  : ""}
                              </span>

                            </div>


                            {actividad.descripcion && (
                              <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-gray-500">
                                {
                                  actividad.descripcion
                                }
                              </p>
                            )}

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

            </div>

          </div>

        </section>


        <ProtocolosAdicionalesPreparacion
          seguimientoId={
            seguimiento.id
          }
          duracionDias={
            seguimiento.duracionDias
          }
          actividades={
            adicionales.map(
              (
                actividad
              ) => ({
                id:
                  actividad.id,

                titulo:
                  actividad.titulo,

                descripcion:
                  actividad.descripcion,

                hora:
                  actividad.hora,

                diaInicio:
                  actividad.diaInicio,

                diaFin:
                  actividad.diaFin,

                orden:
                  actividad.orden,

                recordatorio:
                  actividad.recordatorio,
              })
            )
          }
        />

      </PrepararSeguimientoCliente>

    </div>
  );
}
