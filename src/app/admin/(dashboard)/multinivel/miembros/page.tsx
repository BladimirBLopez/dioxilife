export const dynamic =
  "force-dynamic";

import Link from "next/link";

import {
  Network,
  Plus,
  UserCheck,
  UserRoundX,
  UsersRound,
} from "lucide-react";

import {
  prisma,
} from "@/lib/prisma";

import {
  obtenerAdminActual,
} from "@/lib/admin-auth";

import MiembrosTable from "@/components/admin/MiembrosTable";

import type {
  MiembroAdminRow,
} from "@/components/admin/MiembrosTable";


function nombrePersona(
  persona:
    | {
        nombres: string;
        apellidos: string | null;
      }
    | null
) {
  if (!persona) {
    return "";
  }

  return [
    persona.nombres,
    persona.apellidos,
  ]
    .filter(Boolean)
    .join(" ");
}


export default async function MiembrosMultinivelPage() {

  const admin =
    await obtenerAdminActual();

  const miembros =
    await prisma.miembro.findMany({
      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,

        nombres: true,
        apellidos: true,

        email: true,
        telefono: true,

        codigoReferido: true,

        estado: true,

        createdAt: true,

        patrocinador: {
          select: {
            nombres: true,
            apellidos: true,
            codigoReferido: true,
          },
        },

        _count: {
          select: {
            referidos: true,
          },
        },
      },
    });


  const filas:
    MiembroAdminRow[] =
    miembros.map(
      (miembro) => ({
        id:
          miembro.id,

        nombres:
          miembro.nombres,

        apellidos:
          miembro.apellidos,

        nombreCompleto:
          nombrePersona(
            miembro
          ),

        email:
          miembro.email,

        telefono:
          miembro.telefono,

        codigoReferido:
          miembro.codigoReferido,

        estado:
          miembro.estado,

        patrocinadorNombre:
          miembro.patrocinador
            ? nombrePersona(
                miembro.patrocinador
              )
            : null,

        patrocinadorCodigo:
          miembro.patrocinador
            ?.codigoReferido ??
          null,

        referidosDirectos:
          miembro._count
            .referidos,

        createdAt:
          miembro.createdAt
            .toISOString(),
      })
    );


  const total =
    filas.length;

  const activos =
    filas.filter(
      (miembro) =>
        miembro.estado ===
        "ACTIVO"
    ).length;

  const inactivos =
    total - activos;

  const raices =
    filas.filter(
      (miembro) =>
        !miembro
          .patrocinadorNombre
    ).length;


  const tarjetas = [
    {
      titulo:
        "Total miembros",

      valor:
        total,

      descripcion:
        "Registrados en la red",

      icono:
        UsersRound,

      clase:
        "bg-blue-50 text-blue-700",
    },

    {
      titulo:
        "Miembros activos",

      valor:
        activos,

      descripcion:
        "Habilitados actualmente",

      icono:
        UserCheck,

      clase:
        "bg-emerald-50 text-emerald-700",
    },

    {
      titulo:
        "Miembros inactivos",

      valor:
        inactivos,

      descripcion:
        "Fuera de actividad",

      icono:
        UserRoundX,

      clase:
        "bg-slate-100 text-slate-600",
    },

    {
      titulo:
        "Raíces de red",

      valor:
        raices,

      descripcion:
        "Sin patrocinador superior",

      icono:
        Network,

      clase:
        "bg-violet-50 text-violet-700",
    },
  ];


  return (
    <div className="mx-auto max-w-[1500px] space-y-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-sm font-semibold text-blue-600">
            Multinivel
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
            Miembros
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Administración y consulta de los miembros que forman parte de la red DioxiLife.
          </p>

        </div>


        {admin?.rol === "SUPER_ADMIN" && (

          <Link
            href="/admin/multinivel/miembros/nuevo"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#10182D] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo miembro
          </Link>

        )}

      </div>


      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        {tarjetas.map(
          (tarjeta) => {
            const Icono =
              tarjeta.icono;

            return (
              <article
                key={
                  tarjeta.titulo
                }
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-5"
              >

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${tarjeta.clase}`}
                >
                  <Icono className="h-5 w-5" />
                </div>


                <p className="mt-4 text-2xl font-bold text-slate-900">
                  {
                    tarjeta.valor
                  }
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {
                    tarjeta.titulo
                  }
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {
                    tarjeta.descripcion
                  }
                </p>

              </article>
            );
          }
        )}

      </section>


      <MiembrosTable
        data={filas}
      />

    </div>
  );
}
