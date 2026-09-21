export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

type NodoRed = {
  id: string;
  nombres: string;
  apellidos: string | null;
  codigoReferido: string;
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

function contarNivel(
  nodos: NodoRed[],
  nivel: number
): number {

  let total = 0;

  for (const nodo of nodos) {

    if (nodo.nivel === nivel) {
      total++;
    }

    total += contarNivel(
      nodo.hijos,
      nivel
    );
  }

  return total;
}

function contarTotal(
  nodos: NodoRed[]
): number {

  return nodos.reduce(
    (total, nodo) =>
      total +
      1 +
      contarTotal(nodo.hijos),
    0
  );
}

function Nodo({
  nodo,
}: {
  nodo: NodoRed;
}) {

  return (
    <div className="relative">

      <div className="mx-auto w-full max-w-sm rounded-xl border bg-white p-4 shadow-sm">

        <div className="flex items-start justify-between gap-3">

          <div>
            <p className="font-semibold text-gray-900">
              {nodo.nombres}
              {nodo.apellidos
                ? ` ${nodo.apellidos}`
                : ""}
            </p>

            <p className="mt-1 font-mono text-xs text-gray-500">
              {nodo.codigoReferido}
            </p>
          </div>

          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
            Nivel {nodo.nivel}
          </span>

        </div>

      </div>


      {nodo.hijos.length > 0 && (

        <>
          <div className="mx-auto h-6 w-px bg-gray-300" />

          <div className="grid gap-4 md:grid-cols-2">

            {nodo.hijos.map((hijo) => (
              <Nodo
                key={hijo.id}
                nodo={hijo}
              />
            ))}

          </div>
        </>

      )}

    </div>
  );
}

export default async function MiRedPage() {

  const cookieStore = await cookies();

  const token =
    cookieStore.get("miembro_token")?.value;

  if (!token) {
    redirect("/login-miembro");
  }

  const sesion =
    await verificarSesion(token);

  if (!sesion) {
    redirect("/login-miembro");
  }

  const miembroId =
    typeof sesion.usuario === "string"
      ? sesion.usuario
      : "";

  if (!miembroId) {
    redirect("/login-miembro");
  }

  const miembro =
    await prisma.miembro.findUnique({

      where: {
        id: miembroId,
      },

      select: {
        id: true,
        nombres: true,
        apellidos: true,
        codigoReferido: true,
        estado: true,
      },
    });

  if (
    !miembro ||
    miembro.estado !== "ACTIVO"
  ) {
    redirect("/login-miembro");
  }

  const red =
    await obtenerRed(miembro.id);

  const nivel1 =
    contarNivel(red, 1);

  const nivel2 =
    contarNivel(red, 2);

  const nivel3 =
    contarNivel(red, 3);

  const total =
    contarTotal(red);

  return (

    <main className="min-h-screen bg-gray-50 px-4 py-8">

      <div className="mx-auto max-w-6xl space-y-6">

        <div>

          <Link
            href="/mi-cuenta"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Volver a mi cuenta
          </Link>

          <h1 className="mt-3 text-2xl font-bold">
            Mi red multinivel
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Visualiza tu organización hasta el nivel 3.
          </p>

        </div>


        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-sm text-gray-500">
              Nivel 1
            </p>

            <p className="mt-1 text-3xl font-bold">
              {nivel1}
            </p>
          </div>


          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-sm text-gray-500">
              Nivel 2
            </p>

            <p className="mt-1 text-3xl font-bold">
              {nivel2}
            </p>
          </div>


          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-sm text-gray-500">
              Nivel 3
            </p>

            <p className="mt-1 text-3xl font-bold">
              {nivel3}
            </p>
          </div>


          <div className="rounded-xl bg-white p-4 shadow">
            <p className="text-sm text-gray-500">
              Red total
            </p>

            <p className="mt-1 text-3xl font-bold text-blue-600">
              {total}
            </p>
          </div>

        </div>


        <div className="rounded-2xl bg-white p-5 shadow">

          <h2 className="mb-5 text-lg font-semibold">
            Árbol de mi red
          </h2>


          <div className="mx-auto max-w-sm rounded-xl border-2 border-blue-500 bg-blue-50 p-4 text-center">

            <p className="font-bold">
              {miembro.nombres}
              {miembro.apellidos
                ? ` ${miembro.apellidos}`
                : ""}
            </p>

            <p className="mt-1 font-mono text-sm text-gray-500">
              {miembro.codigoReferido}
            </p>

            <p className="mt-2 text-xs font-semibold text-blue-600">
              Tú
            </p>

          </div>


          {red.length > 0 ? (

            <>

              <div className="mx-auto h-8 w-px bg-gray-300" />

              <div className="space-y-6">

                {red.map((nodo) => (
                  <Nodo
                    key={nodo.id}
                    nodo={nodo}
                  />
                ))}

              </div>

            </>

          ) : (

            <div className="mt-8 rounded-xl bg-gray-50 p-8 text-center">

              <p className="font-semibold">
                Todavía no tienes miembros en tu red.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Comparte tu código o enlace de invitación para comenzar.
              </p>

            </div>

          )}

        </div>

      </div>

    </main>
  );
}
