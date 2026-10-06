export const dynamic =
  "force-dynamic";

import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import { prisma } from "@/lib/prisma";

import ProtocoloPrincipalPreparacion from "@/components/admin/seguimiento/ProtocoloPrincipalPreparacion";
import ProtocolosAdicionalesPreparacion from "@/components/admin/seguimiento/ProtocolosAdicionalesPreparacion";

export default async function PrepararProtocoloGrupoPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const grupo =
    await prisma.grupoSeguimiento.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        nombre: true,
        objetivo: true,
        estado: true,
        duracionDias: true,

        plan: {
          select: {
            id: true,
            nombre: true,
            duracionDias: true,
            esCopiaGrupo: true,

            actividades: {
              orderBy: [
                {
                  diaInicio:
                    "asc",
                },
                {
                  hora: {
                    sort:
                      "asc",
                    nulls:
                      "last",
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
                    activo:
                      true,
                  },

                  orderBy: [
                    {
                      hora:
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
                    hora: true,
                    texto: true,
                    orden: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (
    !grupo ||
    !grupo.plan.esCopiaGrupo
  ) {
    notFound();
  }

  /*
   * Esta pantalla corresponde solamente
   * a la preparación. Una vez activo,
   * los cambios se harán desde la futura
   * Agenda grupal con protección histórica.
   */
  if (
    grupo.estado !==
    "BORRADOR"
  ) {
    redirect(
      `/admin/seguimiento/grupos/${grupo.id}`
    );
  }

  const principales =
    grupo.plan.actividades.filter(
      (actividad) =>
        actividad.activo &&
        actividad.seccion ===
          "PRINCIPAL"
    );

  const adicionales =
    grupo.plan.actividades.filter(
      (actividad) =>
        actividad.activo &&
        actividad.seccion ===
          "ADICIONAL"
    );

  const apiBase =
    `/api/admin/seguimiento/planes/${grupo.plan.id}`;

  return (
    <div className="space-y-6">

      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">

        <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
          Paso 2 de 4 · Protocolo
        </p>

        <p className="mt-1 font-semibold text-violet-950">
          Prepara el protocolo común del grupo
        </p>

        <p className="mt-1 text-sm leading-6 text-violet-700">
          Este protocolo será compartido por todos los participantes al iniciar el grupo.
        </p>

      </div>


      <div>

        <Link
          href={`/admin/seguimiento/grupos/${grupo.id}`}
          className="text-sm font-semibold text-violet-700 hover:text-violet-800"
        >
          ← Guardar y continuar después
        </Link>

        <h1 className="mt-3 text-2xl font-semibold text-gray-900">
          Preparar protocolo
        </h1>

        <p className="mt-1 text-sm leading-6 text-gray-500">
          Grupo:{" "}
          <strong className="font-semibold text-gray-700">
            {grupo.nombre}
          </strong>
        </p>

      </div>


      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Duración
          </p>

          <p className="mt-1 font-semibold text-gray-900">
            {grupo.duracionDias} días
          </p>
        </div>

        <div className="admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Principal
          </p>

          <p className="mt-1 font-semibold text-gray-900">
            {principales.length} actividad
            {principales.length === 1
              ? ""
              : "es"}
          </p>
        </div>

        <div className="admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Adicionales
          </p>

          <p className="mt-1 font-semibold text-gray-900">
            {adicionales.length} protocolo
            {adicionales.length === 1
              ? ""
              : "s"}
          </p>
        </div>

      </div>


      <ProtocoloPrincipalPreparacion
        apiBase={
          apiBase
        }
        duracionDias={
          grupo.plan.duracionDias
        }
        actividades={
          principales.map(
            (
              actividad
            ) => ({
              id:
                actividad.id,

              tipo:
                actividad.tipo,

              recordatorio:
                actividad.recordatorio,

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

              indicaciones:
                actividad.indicaciones,
            })
          )
        }
      />


      <ProtocolosAdicionalesPreparacion
        apiBase={
          apiBase
        }
        duracionDias={
          grupo.plan.duracionDias
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


      <div className="admin-card p-5">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="font-semibold text-gray-900">
              Continuar con el grupo
            </h2>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              Los cambios del protocolo se guardan inmediatamente. Después podrás agregar los participantes.
            </p>
          </div>

          <Link
            href={`/admin/seguimiento/grupos/${grupo.id}?paso=participantes`}
            className="admin-btn-primary shrink-0"
          >
            Continuar a participantes →
          </Link>

        </div>

      </div>

    </div>
  );
}
