import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import ProtocoloPrincipalPreparacion from "@/components/admin/seguimiento/ProtocoloPrincipalPreparacion";
import ProtocolosAdicionalesPreparacion from "@/components/admin/seguimiento/ProtocolosAdicionalesPreparacion";
import EditarDatosPlantilla from "@/components/admin/seguimiento/EditarDatosPlantilla";

export default async function EditarPlantillaPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  /*
   * Esta pantalla solo trabaja con
   * plantillas maestras de la biblioteca.
   *
   * Las copias internas de grupos se
   * administran desde el grupo correspondiente.
   */
  const plan =
    await prisma.planSeguimiento.findFirst({
      where: {
        id,
        esCopiaGrupo:
          false,
      },

      select: {
        id: true,
        nombre: true,
        descripcion: true,
        duracionDias: true,
        estado: true,

        actividades: {
          where: {
            activo:
              true,
          },

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
              hora: {
                sort:
                  "asc",
                nulls:
                  "last",
              },
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
    });

  if (!plan) {
    notFound();
  }

  const principales =
    plan.actividades
      .filter(
        (actividad) =>
          actividad.seccion ===
          "PRINCIPAL"
      )
      .map(
        ({
          seccion:
            _seccion,
          ...actividad
        }) =>
          actividad
      );

  const adicionales =
    plan.actividades
      .filter(
        (actividad) =>
          actividad.seccion ===
          "ADICIONAL"
      )
      .map(
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

          orden:
            actividad.orden,

          recordatorio:
            actividad.recordatorio,

          indicaciones:
            actividad.indicaciones,
        })
      );

  const apiBase =
    `/api/admin/seguimiento/planes/${plan.id}`;

  return (
    <div className="pb-24">

      <div className="mb-5">
        <Link
          href="/admin/seguimiento/planes"
          className="text-sm font-medium text-brand-blue hover:underline"
        >
          ← Volver a plantillas
        </Link>
      </div>


      <section className="admin-card overflow-hidden">

        <div className="border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white px-5 py-5 sm:px-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

            <div className="min-w-0">

              <p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-600">
                Plantilla maestra
              </p>

              <h1 className="mt-1 text-xl font-bold text-[#1F1B24] sm:text-2xl">
                {plan.nombre}
              </h1>

              {plan.descripcion && (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B6870]">
                  {plan.descripcion}
                </p>
              )}

            </div>


            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  plan.estado ===
                  "ACTIVO"
                    ? "bg-emerald-50 text-emerald-700"
                    : plan.estado ===
                      "INACTIVO"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {plan.estado}
              </span>

              <EditarDatosPlantilla
                id={plan.id}
                nombre={plan.nombre}
                descripcion={plan.descripcion}
                duracionDias={plan.duracionDias}
                estado={plan.estado}
              />

            </div>

          </div>


          <div className="mt-4 flex flex-wrap gap-2">

            <span className="rounded-xl border border-violet-100 bg-white px-3 py-2 text-xs font-semibold text-[#6B6870]">
              Duración:{" "}
              <strong className="text-[#1F1B24]">
                {plan.duracionDias} días
              </strong>
            </span>

            <span className="rounded-xl border border-violet-100 bg-white px-3 py-2 text-xs font-semibold text-[#6B6870]">
              Principal:{" "}
              <strong className="text-[#1F1B24]">
                {principales.length}
              </strong>
            </span>

            <span className="rounded-xl border border-violet-100 bg-white px-3 py-2 text-xs font-semibold text-[#6B6870]">
              Adicionales:{" "}
              <strong className="text-[#1F1B24]">
                {adicionales.length}
              </strong>
            </span>

          </div>

        </div>


        <div className="bg-white px-5 py-4 sm:px-6">

          <p className="text-sm leading-6 text-[#6B6870]">
            Los cambios realizados aquí se aplicarán a futuros clientes y futuros grupos que utilicen esta plantilla. Los clientes y grupos que ya fueron creados conservan su propia copia.
          </p>

        </div>

      </section>


      <div className="mt-6">

        <ProtocoloPrincipalPreparacion
          apiBase={
            apiBase
          }
          bibliotecaPlanId={
            plan.id
          }
          duracionDias={
            plan.duracionDias
          }
          actividades={
            principales
          }
        />

      </div>


      <div className="mt-6">

        <ProtocolosAdicionalesPreparacion
          apiBase={
            apiBase
          }
          bibliotecaPlanId={
            plan.id
          }
          duracionDias={
            plan.duracionDias
          }
          actividades={
            adicionales
          }
        />

      </div>

    </div>
  );
}
