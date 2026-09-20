"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Miembro = {
  nombres: string;
  apellidos: string | null;
  email: string;
  codigoReferido: string;
  estado: string;
  referidos: {
    id: string;
    nombres: string;
    codigoReferido: string;
  }[];
};

export default function MiCuentaPage() {

  const [miembro, setMiembro] = useState<Miembro | null>(null);
  const [error, setError] = useState("");
  const [origen, setOrigen] = useState("");
  const [copiado, setCopiado] = useState("");

  useEffect(() => {

    setOrigen(window.location.origin);

    async function cargarPerfil() {

      const res = await fetch("/api/multinivel/perfil");

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No autorizado");
        return;
      }

      setMiembro(data.miembro);
    }

    cargarPerfil();

  }, []);


  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="rounded-xl bg-white p-8 shadow">
          <p className="text-red-600">
            {error}
          </p>
        </div>
      </main>
    );
  }


  if (!miembro) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Cargando...
      </main>
    );
  }


  const enlaceVentas =
    origen
      ? `${origen}/?ref=${miembro.codigoReferido}`
      : "";

  const enlaceRegistro =
    origen
      ? `${origen}/registro?ref=${miembro.codigoReferido}`
      : "";

  async function copiarEnlace(
    enlace: string,
    tipo: string
  ) {
    if (!enlace) {
      return;
    }

    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(tipo);

      window.setTimeout(() => {
        setCopiado("");
      }, 2000);
    } catch {
      setCopiado("");
    }
  }

  function compartirVentas() {
    if (!enlaceVentas) {
      return;
    }

    const mensaje =
      `Hola, te comparto mi enlace oficial de DioxiLife Bolivia:\n\n${enlaceVentas}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }


  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">

      <div className="mx-auto max-w-4xl">

        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Hola {miembro.nombres}
        </h1>


        <div className="grid gap-6 md:grid-cols-2">


          <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="mb-4 text-xl font-semibold">
              Mi información
            </h2>

            <p>
              <strong>Correo:</strong> {miembro.email}
            </p>

            <p className="mt-2">
              <strong>Estado:</strong> {miembro.estado}
            </p>

            <p className="mt-2">
              <strong>Mi código:</strong>
            </p>

            <div className="mt-2 rounded-lg bg-blue-100 p-3 text-center text-xl font-bold text-blue-700">
              {miembro.codigoReferido}
            </div>

          </div>



          <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="text-xl font-semibold">
              Mis enlaces
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Comparte tu enlace de ventas para que los pedidos queden asociados a ti.
            </p>


            <div className="mt-5">

              <p className="text-sm font-semibold text-gray-700">
                Enlace de ventas
              </p>

              <div className="mt-2 break-all rounded-lg bg-gray-100 p-3 text-sm">
                {enlaceVentas || "Preparando enlace..."}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={() =>
                    copiarEnlace(
                      enlaceVentas,
                      "ventas"
                    )
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  {copiado === "ventas"
                    ? "Enlace copiado"
                    : "Copiar enlace"}
                </button>

                <button
                  type="button"
                  onClick={compartirVentas}
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Compartir por WhatsApp
                </button>

              </div>

            </div>


            <div className="mt-6 border-t pt-5">

              <p className="text-sm font-semibold text-gray-700">
                Enlace para registrar miembros
              </p>

              <div className="mt-2 break-all rounded-lg bg-gray-100 p-3 text-sm">
                {enlaceRegistro || "Preparando enlace..."}
              </div>

              <button
                type="button"
                onClick={() =>
                  copiarEnlace(
                    enlaceRegistro,
                    "registro"
                  )
                }
                className="mt-3 w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                {copiado === "registro"
                  ? "Enlace copiado"
                  : "Copiar enlace de registro"}
              </button>

            </div>


          </div>


        </div>



        <div className="mt-6 grid gap-6 md:grid-cols-2">

          <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="text-xl font-semibold">
              Mi red multinivel
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Visualiza tus miembros hasta el nivel 3 y el total de tu red.
            </p>

            <Link
              href="/mi-cuenta/red"
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Ver mi red completa
            </Link>

          </div>


          <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="text-xl font-semibold">
              Mis comisiones
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Consulta tus ganancias pendientes, aprobadas y pagadas.
            </p>

            <Link
              href="/mi-cuenta/comisiones"
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
            >
              Ver mis comisiones
            </Link>

          </div>

        </div>



        <div className="mt-6 rounded-2xl bg-white p-6 shadow">

          <h2 className="mb-4 text-xl font-semibold">
            Mi red directa (Nivel 1)
          </h2>


          {
            miembro.referidos.length === 0 ? (

              <p className="text-gray-500">
                Todavía no tienes referidos.
              </p>

            ) : (

              <div className="space-y-3">

                {
                  miembro.referidos.map((persona)=>(
                    <div
                      key={persona.id}
                      className="rounded-lg border p-3"
                    >

                      <p className="font-semibold">
                        {persona.nombres}
                      </p>

                      <p className="text-sm text-gray-500">
                        Código: {persona.codigoReferido}
                      </p>

                    </div>
                  ))
                }

              </div>

            )
          }


        </div>


      </div>

    </main>
  );
}
