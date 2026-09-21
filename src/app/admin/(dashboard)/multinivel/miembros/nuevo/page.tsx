export const dynamic =
  "force-dynamic";

import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

import {
  prisma,
} from "@/lib/prisma";

import {
  obtenerAdminActual,
} from "@/lib/admin-auth";

import NuevoMiembroForm from "@/components/admin/NuevoMiembroForm";


function nombrePersona(
  miembro: {
    nombres: string;
    apellidos: string | null;
  }
) {
  return [
    miembro.nombres,
    miembro.apellidos,
  ]
    .filter(Boolean)
    .join(" ");
}


export default async function NuevoMiembroPage() {

  const admin =
    await obtenerAdminActual();


  if (!admin) {
    redirect(
      "/admin/login"
    );
  }


  if (
    admin.rol !==
    "SUPER_ADMIN"
  ) {
    redirect(
      "/admin/multinivel/miembros"
    );
  }


  const miembros =
    await prisma.miembro.findMany({
      where: {
        estado:
          "ACTIVO",
      },

      orderBy: [
        {
          nombres:
            "asc",
        },

        {
          apellidos:
            "asc",
        },
      ],

      select: {
        id: true,
        nombres: true,
        apellidos: true,
        codigoReferido: true,
      },
    });


  const patrocinadores =
    miembros.map(
      (miembro) => ({
        id:
          miembro.id,

        nombre:
          nombrePersona(
            miembro
          ),

        codigoReferido:
          miembro.codigoReferido,
      })
    );


  return (
    <div className="mx-auto max-w-4xl space-y-6">

      <div>

        <Link
          href="/admin/multinivel/miembros"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a miembros
        </Link>


        <div className="mt-5 flex items-start gap-3">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>

            <p className="text-sm font-semibold text-blue-600">
              Super Admin
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
              Registrar nuevo miembro
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Crea una cuenta directamente y define si pertenece a un patrocinador existente o si será una nueva raíz de la red.
            </p>

          </div>

        </div>

      </div>


      <NuevoMiembroForm
        patrocinadores={
          patrocinadores
        }
      />

    </div>
  );
}
