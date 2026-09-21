export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ArbolMultinivel from "@/components/admin/ArbolMultinivel";

type NodoRed = {
  id: string;
  nombres: string;
  codigoReferido: string;
  email: string;
  nivel: number;
  hijos: NodoRed[];
};

async function obtenerRed(
  miembroId: string,
  nivel = 1,
  maxNivel = 3
): Promise<NodoRed[]> {
  if (nivel > maxNivel) {
    return [];
  }

  const referidos = await prisma.miembro.findMany({
    where: {
      patrocinadorId: miembroId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      nombres: true,
      codigoReferido: true,
      email: true,
    },
  });

  return Promise.all(
    referidos.map(async (referido) => ({
      ...referido,
      nivel,
      hijos: await obtenerRed(
        referido.id,
        nivel + 1,
        maxNivel
      ),
    }))
  );
}

function contarPorNivel(
  nodos: NodoRed[],
  nivel: number
): number {
  let total = 0;

  for (const nodo of nodos) {
    if (nodo.nivel === nivel) {
      total++;
    }

    total += contarPorNivel(nodo.hijos, nivel);
  }

  return total;
}

function contarTodaLaRed(
  nodos: NodoRed[]
): number {
  return nodos.reduce(
    (total, nodo) =>
      total +
      1 +
      contarTodaLaRed(nodo.hijos),
    0
  );
}

export default async function DetalleMiembroPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const miembro = await prisma.miembro.findUnique({
    where: {
      id,
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
          id: true,
          nombres: true,
          codigoReferido: true,
        },
      },
    },
  });

  if (!miembro) {
    notFound();
  }

  const red = await obtenerRed(miembro.id);

  const nivel1 = contarPorNivel(red, 1);
  const nivel2 = contarPorNivel(red, 2);
  const nivel3 = contarPorNivel(red, 3);
  const totalRed = contarTodaLaRed(red);

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <Link
            href="/admin/multinivel/miembros"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Volver a miembros
          </Link>

          <h1 className="mt-2 text-2xl font-semibold">
            {miembro.nombres}
            {miembro.apellidos
              ? ` ${miembro.apellidos}`
              : ""}
          </h1>

          <p className="text-sm text-gray-500">
            Detalle de miembro multinivel
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
            miembro.estado === "ACTIVO"
              ? "bg-green-100 text-green-700"
              : miembro.estado === "SUSPENDIDO"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {miembro.estado}
        </span>

      </div>


      <div className="grid gap-4 md:grid-cols-2">

        <div className="rounded-xl bg-white p-5 shadow">

          <h2 className="mb-4 text-lg font-semibold">
            Información
          </h2>

          <div className="space-y-3 text-sm">

            <div>
              <p className="text-gray-500">
                Correo
              </p>
              <p className="font-medium">
                {miembro.email}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Teléfono
              </p>
              <p className="font-medium">
                {miembro.telefono || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Código de referido
              </p>
              <p className="font-mono font-semibold">
                {miembro.codigoReferido}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Fecha de registro
              </p>
              <p className="font-medium">
                {new Date(
                  miembro.createdAt
                ).toLocaleDateString("es-BO")}
              </p>
            </div>

          </div>

        </div>


        <div className="rounded-xl bg-white p-5 shadow">

          <h2 className="mb-4 text-lg font-semibold">
            Patrocinador
          </h2>

          {miembro.patrocinador ? (
            <div>

              <p className="font-semibold">
                {miembro.patrocinador.nombres}
              </p>

              <p className="mt-1 font-mono text-sm text-gray-500">
                {miembro.patrocinador.codigoReferido}
              </p>

              <Link
                href={`/admin/multinivel/${miembro.patrocinador.id}`}
                className="mt-4 inline-block text-sm text-blue-600 hover:underline"
              >
                Ver patrocinador
              </Link>

            </div>
          ) : (
            <div>

              <p className="font-medium">
                Sin patrocinador
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Este miembro está en la raíz de una red.
              </p>

            </div>
          )}

        </div>

      </div>


      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Nivel 1
          </p>
          <p className="text-2xl font-bold">
            {nivel1}
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Nivel 2
          </p>
          <p className="text-2xl font-bold">
            {nivel2}
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Nivel 3
          </p>
          <p className="text-2xl font-bold">
            {nivel3}
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">
            Red total
          </p>
          <p className="text-2xl font-bold">
            {totalRed}
          </p>
        </div>

      </div>


      <div className="rounded-xl bg-white p-5 shadow">

        <div className="mb-5">

          <h2 className="text-lg font-semibold">
            Árbol de red
          </h2>

          <p className="text-sm text-gray-500">
            Red descendente hasta 3 niveles.
          </p>

        </div>

        <div className="mb-5 flex justify-center">

          <div className="min-w-[220px] rounded-xl border-2 border-blue-500 bg-blue-50 p-4 text-center">

            <p className="font-bold">
              {miembro.nombres}
            </p>

            <p className="text-sm text-gray-500">
              {miembro.codigoReferido}
            </p>

            <p className="mt-1 text-xs font-semibold text-blue-600">
              Raíz seleccionada
            </p>

          </div>

        </div>

        {red.length > 0 && (
          <div className="mx-auto h-6 w-px bg-gray-300" />
        )}

        <ArbolMultinivel red={red} />

      </div>

    </div>
  );
}
