"use client";

import {
  useEffect,
  useState,
} from "react";

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
  const [
    miembro,
    setMiembro,
  ] =
    useState<Miembro | null>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    origen,
    setOrigen,
  ] =
    useState("");

  const [
    copiado,
    setCopiado,
  ] =
    useState("");

  const [
    telefono,
    setTelefono,
  ] =
    useState("");

  const [
    guardandoTelefono,
    setGuardandoTelefono,
  ] =
    useState(false);

  const [
    mensajeTelefono,
    setMensajeTelefono,
  ] =
    useState("");

  const [
    errorTelefono,
    setErrorTelefono,
  ] =
    useState(false);


  useEffect(() => {
    setOrigen(
      window.location.origin
    );

    async function cargarPerfil() {
      const res =
        await fetch(
          "/api/multinivel/perfil"
        );

      const data =
        await res.json();

      if (!res.ok) {
        setError(
          data.error ||
            "No se pudo cargar tu perfil."
        );

        return;
      }

      setMiembro(
        data.miembro
      );

      setTelefono(
        data.miembro.telefono ||
          ""
      );
    }

    cargarPerfil();
  }, []);


  if (error) {
    return (
      <div className="p-4 md:p-6">

        <div className="mx-auto max-w-6xl rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>

      </div>
    );
  }


  if (!miembro) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-gray-500">
            Cargando tu panel...
          </p>

        </div>

      </div>
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
      await navigator.clipboard.writeText(
        enlace
      );

      setCopiado(
        tipo
      );

      window.setTimeout(
        () =>
          setCopiado(""),
        2000
      );

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
      `https://wa.me/?text=${encodeURIComponent(
        mensaje
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }


  async function guardarWhatsapp() {
    if (guardandoTelefono) {
      return;
    }

    try {
      setGuardandoTelefono(
        true
      );

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

            body:
              JSON.stringify({
                telefono,
              }),
          }
        );

      const data =
        await res.json();

      if (!res.ok) {
        setErrorTelefono(
          true
        );

        setMensajeTelefono(
          data.error ||
            "No se pudo actualizar el WhatsApp."
        );

        return;
      }

      const nuevoTelefono =
        data.telefono || "";

      setTelefono(
        nuevoTelefono
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

      setMensajeTelefono(
        data.mensaje ||
          "WhatsApp actualizado correctamente."
      );

    } catch {
      setErrorTelefono(
        true
      );

      setMensajeTelefono(
        "No se pudo conectar con el servidor."
      );

    } finally {
      setGuardandoTelefono(
        false
      );
    }
  }


  return (
    <div className="p-4 md:p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <section className="overflow-hidden rounded-2xl bg-brand-navy text-white shadow">

          <div className="relative p-6 md:p-8">

            <div className="relative z-10 max-w-2xl">

              <p className="text-sm font-medium text-white/60">
                Panel del distribuidor
              </p>

              <h1 className="mt-2 text-2xl font-bold md:text-3xl">
                Hola, {miembro.nombres}
              </h1>

              <p className="mt-2 text-sm leading-6 text-white/70">
                Gestiona tus ventas, clientes, red y comisiones desde un solo lugar.
              </p>


              <div className="mt-5 flex flex-wrap items-center gap-2">

                <span className="rounded-full bg-green-500/15 px-3 py-1.5 text-xs font-semibold text-green-300">
                  ● {miembro.estado}
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1.5 font-mono text-xs text-white/80">
                  {miembro.codigoReferido}
                </span>

              </div>

            </div>


            <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/5" />

            <div className="absolute -bottom-24 right-20 h-48 w-48 rounded-full bg-brand-pink/10" />

          </div>

        </section>


        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <Link
            href="/mi-cuenta/pedidos"
            className="rounded-2xl bg-white p-5 shadow transition hover:-translate-y-0.5 hover:shadow-md"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path d="M5 7h14l-1 13H6L5 7Z" />
                <path d="M9 7V5a3 3 0 0 1 6 0v2" />
              </svg>

            </div>

            <p className="mt-4 font-semibold text-gray-900">
              Mis ventas
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Gestiona pedidos y clientes.
            </p>

          </Link>


          <Link
            href="/mi-cuenta/red"
            className="rounded-2xl bg-white p-5 shadow transition hover:-translate-y-0.5 hover:shadow-md"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <circle cx="9" cy="8" r="3" />
                <circle cx="17" cy="10" r="2.5" />
                <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" />
                <path d="M15 15c3 0 5 1.8 5 5" />
              </svg>

            </div>

            <p className="mt-4 font-semibold text-gray-900">
              Mi red
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              {miembro.referidos.length} miembro{miembro.referidos.length === 1 ? "" : "s"} directo{miembro.referidos.length === 1 ? "" : "s"}.
            </p>

          </Link>


          <Link
            href="/mi-cuenta/comisiones"
            className="rounded-2xl bg-white p-5 shadow transition hover:-translate-y-0.5 hover:shadow-md"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <circle cx="12" cy="12" r="8" />
                <path d="M12 7v10M15 9.5c-.7-1-1.7-1.5-3-1.5-1.7 0-3 1-3 2.2 0 1.3 1.1 1.8 3 2.2 1.9.4 3 1 3 2.3 0 1.3-1.3 2.3-3 2.3-1.4 0-2.6-.6-3.2-1.6" />
              </svg>

            </div>

            <p className="mt-4 font-semibold text-gray-900">
              Comisiones
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Consulta tus ganancias.
            </p>

          </Link>


          <a
            href="#enlaces"
            className="rounded-2xl bg-white p-5 shadow transition hover:-translate-y-0.5 hover:shadow-md"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
                <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
              </svg>

            </div>

            <p className="mt-4 font-semibold text-gray-900">
              Mis enlaces
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Comparte y genera ventas.
            </p>

          </a>

        </section>


        <div className="grid gap-6 xl:grid-cols-5">

          <section
            id="enlaces"
            className="rounded-2xl bg-white p-5 shadow xl:col-span-3 md:p-6"
          >

            <div className="flex items-start justify-between gap-4">

              <div>

                <h2 className="text-lg font-bold text-gray-900">
                  Mis enlaces
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Utiliza estos enlaces para vender y construir tu red.
                </p>

              </div>


              <span className="rounded-lg bg-blue-50 px-3 py-1.5 font-mono text-xs font-semibold text-blue-700">
                {miembro.codigoReferido}
              </span>

            </div>


            <div className="mt-6">

              <p className="text-sm font-semibold text-gray-700">
                Enlace de ventas
              </p>

              <div className="mt-2 break-all rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
                {enlaceVentas ||
                  "Preparando enlace..."}
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
                  onClick={
                    compartirVentas
                  }
                  className="rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Compartir por WhatsApp
                </button>

              </div>

            </div>


            <div className="mt-6 border-t border-gray-100 pt-5">

              <p className="text-sm font-semibold text-gray-700">
                Enlace para registrar miembros
              </p>

              <div className="mt-2 break-all rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
                {enlaceRegistro ||
                  "Preparando enlace..."}
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

          </section>


          <section
            id="perfil"
            className="rounded-2xl bg-white p-5 shadow xl:col-span-2 md:p-6"
          >

            <h2 className="text-lg font-bold text-gray-900">
              Mi perfil de ventas
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Información utilizada para atender a tus clientes.
            </p>


            <div className="mt-5 space-y-4">

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Correo
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {miembro.email}
                </p>

              </div>


              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Estado
                </p>

                <span className="mt-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  {miembro.estado}
                </span>

              </div>


              <div className="border-t border-gray-100 pt-4">

                <label
                  htmlFor="telefonoVentas"
                  className="text-sm font-semibold text-gray-700"
                >
                  WhatsApp de ventas
                </label>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Los clientes que compren desde tu enlace serán enviados a este número.
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
                  onClick={
                    guardarWhatsapp
                  }
                  disabled={
                    guardandoTelefono
                  }
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

              </div>

            </div>

          </section>

        </div>


        <section className="rounded-2xl bg-white p-5 shadow md:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-lg font-bold text-gray-900">
                Mi red directa
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Miembros registrados directamente mediante tu código.
              </p>

            </div>


            <Link
              href="/mi-cuenta/red"
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              Ver red completa →
            </Link>

          </div>


          {miembro.referidos.length === 0 ? (

            <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">

              <p className="font-medium text-gray-600">
                Todavía no tienes miembros directos.
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Comparte tu enlace de registro para comenzar a construir tu red.
              </p>

            </div>

          ) : (

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

              {miembro.referidos.map(
                (persona) => (

                  <div
                    key={persona.id}
                    className="rounded-xl border border-gray-100 p-4"
                  >

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                        {persona.nombres
                          .charAt(0)
                          .toUpperCase()}
                      </div>


                      <div className="min-w-0">

                        <p className="truncate text-sm font-semibold text-gray-900">
                          {persona.nombres}
                        </p>

                        <p className="mt-0.5 font-mono text-xs text-gray-400">
                          {persona.codigoReferido}
                        </p>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </div>

    </div>
  );
}
