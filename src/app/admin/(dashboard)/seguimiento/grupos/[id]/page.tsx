export const dynamic =
  "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import AgregarParticipanteGrupo from "@/components/admin/seguimiento/AgregarParticipanteGrupo";
import GestionGrupoSeguimiento from "@/components/admin/seguimiento/GestionGrupoSeguimiento";

function fecha(
  valor: Date
) {
  return valor.toLocaleDateString(
    "es-BO",
    {
      timeZone: "UTC",
    }
  );
}

function claseEstado(
  estado: string
) {
  switch (estado) {
    case "ACTIVO":
      return "bg-emerald-100 text-emerald-700";

    case "FINALIZADO":
      return "bg-blue-100 text-blue-700";

    case "CANCELADO":
      return "bg-red-100 text-red-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default async function GrupoSeguimientoDetallePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const {
    id,
  } = await params;

  const grupo =
    await prisma.grupoSeguimiento.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        nombre: true,
        objetivo: true,
        descripcion: true,
        fechaInicio: true,
        duracionDias: true,
        estado: true,

        plan: {
          select: {
            id: true,
            nombre: true,
            duracionDias: true,
          },
        },

        miembros: {
          orderBy: {
            createdAt: "asc",
          },

          select: {
            id: true,
            diaIngreso: true,
            fechaIngreso: true,
            estado: true,

            seguimiento: {
              select: {
                id: true,
                nombreCliente: true,
                telefonoCliente: true,
                estado: true,
              },
            },
          },
        },
      },
    });

  if (!grupo) {
    notFound();
  }

  return (
    <div className="space-y-6">

      <div>

        <Link
          href="/admin/seguimiento/grupos"
          className="text-sm font-semibold text-violet-700 hover:text-violet-800"
        >
          ← Grupos
        </Link>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <div className="flex flex-wrap items-center gap-2">

              <h1 className="text-2xl font-semibold text-gray-900">
                {grupo.nombre}
              </h1>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${claseEstado(
                  grupo.estado
                )}`}
              >
                {grupo.estado}
              </span>

            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              {grupo.objetivo}
            </p>

          </div>

          <GestionGrupoSeguimiento
            grupoId={grupo.id}
            estado={grupo.estado}
            duracionDias={grupo.duracionDias}
            participantes={grupo.miembros.length}
          />

        </div>

      </div>


      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        <div className="admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Protocolo común
          </p>

          <p className="mt-1 font-semibold text-gray-900">
            {grupo.plan.nombre}
          </p>
        </div>

        <div className="admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Inicio
          </p>

          <p className="mt-1 font-semibold text-gray-900">
            {fecha(
              grupo.fechaInicio
            )}
          </p>
        </div>

        <div className="admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Duración
          </p>

          <p className="mt-1 font-semibold text-gray-900">
            {grupo.duracionDias} días
          </p>
        </div>

      </div>


      {grupo.descripcion && (
        <div className="admin-card p-5">

          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Descripción
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
            {grupo.descripcion}
          </p>

        </div>
      )}


      <section className="admin-card p-5">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

          <div>
            <h2 className="font-semibold text-gray-900">
              Participantes
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {grupo.miembros.length ===
              0
                ? "Todavía no hay participantes en este grupo."
                : `${grupo.miembros.length} participante${
                    grupo.miembros.length ===
                    1
                      ? ""
                      : "s"
                  } en el grupo.`}
            </p>
          </div>

          <AgregarParticipanteGrupo
            grupoId={grupo.id}
          />

        </div>


        {grupo.miembros.length >
        0 ? (
          <div className="mt-4 divide-y divide-gray-100">

            {grupo.miembros.map(
              (miembro) => (
                <div
                  key={
                    miembro.id
                  }
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div>

                    <p className="font-semibold text-gray-900">
                      {miembro
                        .seguimiento
                        .nombreCliente ||
                        "Cliente sin nombre"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Ingreso día{" "}
                      {
                        miembro.diaIngreso
                      }{" "}
                      ·{" "}
                      {fecha(
                        miembro.fechaIngreso
                      )}
                    </p>

                  </div>

                  <Link
                    href={`/admin/seguimiento/clientes/${miembro.seguimiento.id}`}
                    className="text-sm font-semibold text-violet-700 hover:text-violet-800"
                  >
                    Ver seguimiento →
                  </Link>

                </div>
              )
            )}

          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-violet-200 bg-violet-50/50 p-6 text-center">

            <p className="font-semibold text-gray-800">
              Grupo listo para recibir participantes
            </p>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-500">
              En el siguiente paso agregaremos participantes y el sistema
              les asignará automáticamente este mismo protocolo.
            </p>

          </div>
        )}

      </section>

    </div>
  );
}
