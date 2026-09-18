"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {

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


  const enlace =
    `${window.location.origin}/registro?ref=${miembro.codigoReferido}`;


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

            <h2 className="mb-4 text-xl font-semibold">
              Mi enlace de invitación
            </h2>


            <div className="break-all rounded-lg bg-gray-100 p-3 text-sm">
              {enlace}
            </div>


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
