"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Miembro = {
  nombres: string;
  apellidos: string | null;
  email: string;
  telefono: string | null;
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
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [guardandoTelefono, setGuardandoTelefono] = useState(false);
  const [mensajeTelefono, setMensajeTelefono] = useState("");
  const [errorTelefono, setErrorTelefono] = useState(false);

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

      setTelefono(
        data.miembro.telefono || ""
      );
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


  async function guardarWhatsapp() {
    if (guardandoTelefono) {
      return;
    }

    try {
      setGuardandoTelefono(true);
      setMensajeTelefono("");
      setErrorTelefono(false);

      const res =
        await fetch(
          "/api/multinivel/perfil",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              telefono,
            }),
          }
        );

      const data =
        await res.json();

      if (!res.ok) {
        setErrorTelefono(true);

        setMensajeTelefono(
          data.error ||
            "No se pudo actualizar el WhatsApp."
        );

        return;
      }

      const telefonoActualizado =
        data.telefono || "";

      setTelefono(
        telefonoActualizado
      );

      setMiembro(
        (actual) =>
          actual
            ? {
                ...actual,
                telefono:
                  data.telefono,
              }
            : actual
      );

      setErrorTelefono(false);

      setMensajeTelefono(
        data.mensaje ||
          "WhatsApp actualizado correctamente."
      );

    } catch {
      setErrorTelefono(true);

      setMensajeTelefono(
        "No se pudo conectar con el servidor."
      );

    } finally {
      setGuardandoTelefono(false);
    }
  }


  async function cerrarSesion() {
    try {
      setCerrandoSesion(true);

      await fetch(
        "/api/multinivel/logout",
        {
          method: "POST",
        }
      );

      window.location.href =
        "/login-miembro";
    } catch {
      setCerrandoSesion(false);
    }
  }


  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">

      <div className="mx-auto max-w-4xl">

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <h1 className="text-3xl font-bold text-gray-900">
            Hola {miembro.nombres}
          </h1>

          <button
            type="button"
            onClick={cerrarSesion}
            disabled={cerrandoSesion}
            className="w-fit rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cerrandoSesion
              ? "Cerrando..."
              : "Cerrar sesión"}
          </button>

        </div>


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

            <div className="mt-5 border-t border-gray-100 pt-5">

              <label
                htmlFor="telefonoVentas"
                className="text-sm font-semibold text-gray-700"
              >
                WhatsApp de ventas
              </label>

              <p className="mt-1 text-xs text-gray-500">
                Los clientes que compren mediante tu enlace serán enviados a este WhatsApp.
              </p>

              <input
                id="telefonoVentas"
                type="text"
                inputMode="tel"
                value={telefono}
                onChange={(e) => {
                  setTelefono(
                    e.target.value
                  );

                  setMensajeTelefono("");
                }}
                placeholder="Ej. 70000000"
                className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={guardarWhatsapp}
                disabled={guardandoTelefono}
                className="mt-3 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardandoTelefono
                  ? "Guardando..."
                  : "Guardar WhatsApp"}
              </button>

              {mensajeTelefono && (
                <p
                  className={`mt-2 text-xs ${
                    errorTelefono
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {mensajeTelefono}
                </p>
              )}

              <p className="mt-2 text-xs text-gray-400">
                Puedes usar 70000000 o +591 70000000. Si lo eliminas, las ventas usarán el WhatsApp central de DioxiLife.
              </p>

            </div>

            <p className="mt-5">
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

          <h2 className="text-xl font-semibold">
            Mis ventas
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Revisa los pedidos realizados mediante tu enlace personal y reporta los pagos de tus clientes.
          </p>

          <Link
            href="/mi-cuenta/pedidos"
            className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-700"
          >
            Ver mis ventas
          </Link>

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
