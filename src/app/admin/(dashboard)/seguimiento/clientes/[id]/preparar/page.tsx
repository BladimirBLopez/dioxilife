export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import { prisma } from "@/lib/prisma";

import AgendaCliente from "@/components/admin/seguimiento/AgendaCliente";

import PrepararSeguimientoCliente from "@/components/admin/seguimiento/PrepararSeguimientoCliente";

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

            createdAt:
              true,

            _count: {
              select: {
                progresos:
                  true,
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

  const actividades =
    seguimiento.actividades
      .slice()
      .sort(
        (a, b) => {
          if (
            a.seccion !==
            b.seccion
          ) {
            return a.seccion ===
              "PRINCIPAL"
              ? -1
              : 1;
          }

          const horaA =
            a.hora ||
            "99:99";

          const horaB =
            b.hora ||
            "99:99";

          const porHora =
            horaA.localeCompare(
              horaB
            );

          if (porHora !== 0) {
            return porHora;
          }

          if (
            a.orden !==
            b.orden
          ) {
            return (
              a.orden -
              b.orden
            );
          }

          return (
            a.createdAt.getTime() -
            b.createdAt.getTime()
          );
        }
      );

  const cantidadPrincipales =
    actividades.filter(
      (actividad) =>
        actividad.activo &&
        actividad.seccion ===
          "PRINCIPAL"
    ).length;

  const cantidadAdicionales =
    actividades.filter(
      (actividad) =>
        actividad.activo &&
        actividad.seccion ===
          "ADICIONAL"
    ).length;

  return (
    <div className="space-y-5">

      <div>

        <Link
          href="/admin/seguimiento/clientes"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Clientes
        </Link>

        <h1 className="mt-3 text-2xl font-semibold text-gray-900">
          Preparar seguimiento
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Configura el protocolo de{" "}
          {seguimiento.nombreCliente ||
            "este cliente"} antes de enviar su enlace.
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
          cantidadPrincipales
        }
        cantidadAdicionales={
          cantidadAdicionales
        }
        tieneTelefono={
          Boolean(
            seguimiento.telefonoCliente
          )
        }
      />


      <div className="pt-2">

        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
          Configuración del protocolo
        </p>

        <AgendaCliente
          seguimientoId={
            seguimiento.id
          }
          duracionDias={
            seguimiento.duracionDias
          }
          estado={
            seguimiento.estado
          }
          diaActual={1}
          actividades={
            actividades.map(
              (actividad) => ({
                id:
                  actividad.id,

                tipo:
                  actividad.tipo,

                recordatorio:
                  actividad.recordatorio,

                seccion:
                  actividad.seccion,

                titulo:
                  actividad.titulo,

                descripcion:
                  actividad.descripcion,

                momento:
                  actividad.momento,

                hora:
                  actividad.hora,

                diaInicio:
                  actividad.diaInicio,

                diaFin:
                  actividad.diaFin,

                orden:
                  actividad.orden,

                activo:
                  actividad.activo,

                cantidadProgresos:
                  actividad._count
                    .progresos,
              })
            )
          }
        />

      </div>

    </div>
  );
}
