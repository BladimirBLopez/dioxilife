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

  const referidos =
    await prisma.miembro.findMany({
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
    referidos.map(
      async (referido) => ({
        ...referido,
        nivel,

        hijos: await obtenerRed(
          referido.id,
          nivel + 1,
          maxNivel
        ),
      })
    )
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

function iniciales(
  nombres: string,
  apellidos: string | null
) {
  const primera =
    nombres.trim().charAt(0);

  const segunda =
    apellidos?.trim().charAt(0) || "";

  return `${primera}${segunda}`.toUpperCase();
}

function estiloNivel(
  nivel: number
) {
  switch (nivel) {
    case 1:
      return {
        badge:
          "bg-blue-50 text-blue-700",
        avatar:
          "bg-blue-100 text-blue-700",
        border:
          "border-blue-100",
      };

    case 2:
      return {
        badge:
          "bg-purple-50 text-purple-700",
        avatar:
          "bg-purple-100 text-purple-700",
        border:
          "border-purple-100",
      };

    default:
      return {
        badge:
          "bg-emerald-50 text-emerald-700",
        avatar:
          "bg-emerald-100 text-emerald-700",
        border:
          "border-emerald-100",
      };
  }
}

function Nodo({
  nodo,
}: {
  nodo: NodoRed;
}) {
  const estilo =
    estiloNivel(nodo.nivel);

  return (
    <div className="relative">

      <div
        className={`mx-auto w-full max-w-md rounded-2xl border bg-white p-4 shadow-sm ${estilo.border}`}
      >

        <div className="flex items-center gap-3">

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${estilo.avatar}`}
          >
            {iniciales(
              nodo.nombres,
              nodo.apellidos
            )}
          </div>


          <div className="min-w-0 flex-1">

            <p className="truncate font-semibold text-gray-900">
              {nodo.nombres}
              {nodo.apellidos
                ? ` ${nodo.apellidos}`
                : ""}
            </p>

            <p className="mt-1 truncate font-mono text-xs text-gray-400">
              {nodo.codigoReferido}
            </p>

          </div>


          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${estilo.badge}`}
          >
            Nivel {nodo.nivel}
          </span>

        </div>

      </div>


      {nodo.hijos.length > 0 && (

        <>
          <div className="mx-auto h-6 w-px bg-gray-200" />

          <div className="grid gap-4 lg:grid-cols-2">

            {nodo.hijos.map(
              (hijo) => (

                <Nodo
                  key={hijo.id}
                  nodo={hijo}
                />

              )
            )}

          </div>
        </>

      )}

    </div>
  );
}

export default async function MiRedPage() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "miembro_token"
    )?.value;

  if (!token) {
    redirect(
      "/login-miembro"
    );
  }

  const sesion =
    await verificarSesion(token);

  if (
    !sesion ||
    typeof sesion.usuario !== "string"
  ) {
    redirect(
      "/login-miembro"
    );
  }

  const miembro =
    await prisma.miembro.findUnique({
      where: {
        id: sesion.usuario,
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
    redirect(
      "/login-miembro"
    );
  }

  const red =
    await obtenerRed(
      miembro.id
    );

  const nivel1 =
    contarNivel(red, 1);

  const nivel2 =
    contarNivel(red, 2);

  const nivel3 =
    contarNivel(red, 3);

  const total =
    contarTotal(red);

  return (
    <div className="p-4 md:p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-sm font-medium text-blue-600">
              Panel del distribuidor
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">
              Mi red
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Visualiza tu organización activa hasta el nivel 3.
            </p>

          </div>


          <Link
            href="/mi-cuenta"
            className="w-fit rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            ← Volver al inicio
          </Link>

        </div>


        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <div className="rounded-2xl bg-white p-5 shadow">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              1
            </div>

            <p className="mt-4 text-2xl font-bold text-gray-900">
              {nivel1}
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              Nivel 1
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Referidos directos
            </p>

          </div>


          <div className="rounded-2xl bg-white p-5 shadow">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 font-semibold text-purple-600">
              2
            </div>

            <p className="mt-4 text-2xl font-bold text-gray-900">
              {nivel2}
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              Nivel 2
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Segunda generación
            </p>

          </div>


          <div className="rounded-2xl bg-white p-5 shadow">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 font-semibold text-emerald-600">
              3
            </div>

            <p className="mt-4 text-2xl font-bold text-gray-900">
              {nivel3}
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              Nivel 3
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Tercera generación
            </p>

          </div>


          <div className="rounded-2xl bg-brand-navy p-5 text-white shadow">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <circle
                  cx="9"
                  cy="8"
                  r="3"
                />
                <circle
                  cx="17"
                  cy="10"
                  r="2.5"
                />
                <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" />
                <path d="M15 15c3 0 5 1.8 5 5" />
              </svg>

            </div>

            <p className="mt-4 text-2xl font-bold">
              {total}
            </p>

            <p className="mt-1 text-sm font-semibold">
              Red total
            </p>

            <p className="mt-1 text-xs text-white/55">
              Miembros activos
            </p>

          </div>

        </section>


        <section className="rounded-2xl bg-white p-5 shadow md:p-6">

          <div className="flex flex-col gap-2 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-lg font-bold text-gray-900">
                Árbol de mi organización
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Tu estructura de patrocinio y sus primeros tres niveles.
              </p>

            </div>


            <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              {total} miembro
              {total === 1
                ? ""
                : "s"}
            </span>

          </div>


          <div className="mt-6">

            <div className="mx-auto max-w-md rounded-2xl border-2 border-brand-navy bg-brand-navy p-5 text-white shadow">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold">
                  {iniciales(
                    miembro.nombres,
                    miembro.apellidos
                  )}
                </div>


                <div className="min-w-0 flex-1">

                  <p className="truncate font-bold">
                    {miembro.nombres}
                    {miembro.apellidos
                      ? ` ${miembro.apellidos}`
                      : ""}
                  </p>

                  <p className="mt-1 truncate font-mono text-xs text-white/60">
                    {miembro.codigoReferido}
                  </p>

                </div>


                <span className="rounded-full bg-brand-pink px-3 py-1 text-xs font-semibold">
                  Tú
                </span>

              </div>

            </div>


            {red.length > 0 ? (

              <>

                <div className="mx-auto h-8 w-px bg-gray-200" />

                <div className="space-y-6">

                  {red.map(
                    (nodo) => (

                      <Nodo
                        key={nodo.id}
                        nodo={nodo}
                      />

                    )
                  )}

                </div>

              </>

            ) : (

              <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-6 w-6"
                  >
                    <circle
                      cx="9"
                      cy="8"
                      r="3"
                    />
                    <circle
                      cx="17"
                      cy="10"
                      r="2.5"
                    />
                    <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" />
                    <path d="M15 15c3 0 5 1.8 5 5" />
                  </svg>

                </div>

                <p className="mt-4 font-semibold text-gray-700">
                  Todavía no tienes miembros en tu red.
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Comparte tu enlace de registro desde el inicio del panel.
                </p>


                <Link
                  href="/mi-cuenta#enlaces"
                  className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Ver mis enlaces
                </Link>

              </div>

            )}

          </div>

        </section>

      </div>

    </div>
  );
}
