export const dynamic = "force-dynamic";

import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import { prisma } from "@/lib/prisma";

import PrepararSeguimientoCliente from "@/components/admin/seguimiento/PrepararSeguimientoCliente";

import ProtocolosAdicionalesPreparacion from "@/components/admin/seguimiento/ProtocolosAdicionalesPreparacion";
import ProtocoloPrincipalPreparacion from "@/components/admin/seguimiento/ProtocoloPrincipalPreparacion";

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

            indicaciones: {
              where: {
                activo: true,
              },

              orderBy: [
                {
                  hora: "asc",
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
                hora: true,
                texto: true,
                orden: true,
              },
            },
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
          Preparar protocolo
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Prepara el protocolo personalizado de{" "}
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

        resumenPrincipales={
          principales.map(
            (actividad) => ({
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

              indicaciones:
                actividad.indicaciones,
            })
          )
        }

        resumenAdicionales={
          adicionales.map(
            (actividad) => ({
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

              indicaciones:
                actividad.indicaciones,
            })
          )
        }
      >

        <ProtocoloPrincipalPreparacion
          seguimientoId={seguimiento.id}
          duracionDias={seguimiento.duracionDias}
          actividades={principales.map(
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
              indicaciones: actividad.indicaciones,
            })
          )}
        />


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

                indicaciones:
                  actividad.indicaciones,
              })
            )
          }
        />

      </PrepararSeguimientoCliente>

    </div>
  );
}
