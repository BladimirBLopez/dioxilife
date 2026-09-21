export const dynamic =
  "force-dynamic";

import Link from "next/link";

import {
  ArrowLeft,
  GitBranch,
  Layers3,
  Network,
  UserCheck,
  UsersRound,
} from "lucide-react";

import {
  prisma,
} from "@/lib/prisma";

import ArbolMultinivel from "@/components/admin/ArbolMultinivel";


type Nodo = {
  id: string;
  nombres: string;
  apellidos: string | null;
  codigoReferido: string;
  email: string;
  nivel: number;
  hijos: Nodo[];
};


async function obtenerRed(
  id: string,
  nivel = 1,
  maxNivel = 3
): Promise<Nodo[]> {

  if (
    nivel > maxNivel
  ) {
    return [];
  }

  const hijos =
    await prisma.miembro.findMany({
      where: {
        patrocinadorId: id,
        estado: "ACTIVO",
      },

      orderBy: {
        createdAt: "asc",
      },

      select: {
        id: true,
        nombres: true,
        apellidos: true,
        codigoReferido: true,
        email: true,
      },
    });


  return Promise.all(
    hijos.map(
      async (hijo) => ({
        ...hijo,

        nivel,

        hijos:
          await obtenerRed(
            hijo.id,
            nivel + 1,
            maxNivel
          ),
      })
    )
  );
}


function contarNivel(
  nodos: Nodo[],
  nivel: number
): number {

  let total = 0;

  for (
    const nodo of nodos
  ) {
    if (
      nodo.nivel === nivel
    ) {
      total++;
    }

    total +=
      contarNivel(
        nodo.hijos,
        nivel
      );
  }

  return total;
}


export default async function RedMultinivelPage() {

  const [
    miembrosActivos,
    raicesBase,
  ] = await Promise.all([

    prisma.miembro.count({
      where: {
        estado: "ACTIVO",
      },
    }),

    prisma.miembro.findMany({
      where: {
        patrocinadorId: null,
        estado: "ACTIVO",
      },

      orderBy: {
        createdAt: "asc",
      },

      select: {
        id: true,
        nombres: true,
        apellidos: true,
        codigoReferido: true,
        email: true,
      },
    }),

  ]);


  const red:
    Nodo[] =
    await Promise.all(
      raicesBase.map(
        async (raiz) => ({
          ...raiz,

          nivel: 0,

          hijos:
            await obtenerRed(
              raiz.id,
              1,
              3
            ),
        })
      )
    );


  const nivel1 =
    contarNivel(
      red,
      1
    );

  const nivel2 =
    contarNivel(
      red,
      2
    );

  const nivel3 =
    contarNivel(
      red,
      3
    );


  const tarjetas = [
    {
      titulo:
        "Miembros activos",
      valor:
        miembrosActivos,
      descripcion:
        "Habilitados en la red",
      icono:
        UserCheck,
      clase:
        "bg-emerald-50 text-emerald-700",
    },

    {
      titulo:
        "Raíces activas",
      valor:
        raicesBase.length,
      descripcion:
        "Sin patrocinador superior",
      icono:
        Network,
      clase:
        "bg-blue-50 text-blue-700",
    },

    {
      titulo:
        "Nivel 1",
      valor:
        nivel1,
      descripcion:
        "Referidos directos visibles",
      icono:
        GitBranch,
      clase:
        "bg-violet-50 text-violet-700",
    },

    {
      titulo:
        "Niveles 2 y 3",
      valor:
        nivel2 + nivel3,
      descripcion:
        `${nivel2} en N2 · ${nivel3} en N3`,
      icono:
        Layers3,
      clase:
        "bg-fuchsia-50 text-fuchsia-700",
    },
  ];


  return (
    <div className="mx-auto max-w-[1600px] space-y-6">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>

          <Link
            href="/admin/multinivel"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Resumen multinivel
          </Link>


          <p className="mt-5 text-sm font-semibold text-blue-600">
            Estructura
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
            Red multinivel
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Visualización de la estructura activa de DioxiLife hasta tres niveles descendentes.
          </p>

        </div>


        <Link
          href="/admin/multinivel/miembros"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#10182D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          <UsersRound className="h-4 w-4" />
          Directorio de miembros
        </Link>

      </div>


      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        {tarjetas.map(
          (tarjeta) => {
            const Icono =
              tarjeta.icono;

            return (
              <article
                key={tarjeta.titulo}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-5"
              >

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${tarjeta.clase}`}
                >
                  <Icono className="h-5 w-5" />
                </div>

                <p className="mt-4 text-2xl font-bold text-slate-900">
                  {tarjeta.valor}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {tarjeta.titulo}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {tarjeta.descripcion}
                </p>

              </article>
            );
          }
        )}

      </section>


      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-5 md:p-6">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Network className="h-5 w-5" />
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Árbol general de la red
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Raíces activas y primeros tres niveles descendentes.
              </p>

            </div>

          </div>

        </div>


        <div className="p-4 md:p-6">

          <ArbolMultinivel
            red={red}
          />

        </div>


        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">

          <p className="text-xs text-slate-400">
            Esta vista representa la estructura activa hasta nivel 3. El directorio de Miembros conserva el registro completo.
          </p>

        </div>

      </section>

    </div>
  );
}
