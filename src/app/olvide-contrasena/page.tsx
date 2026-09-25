"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";


export default function OlvideContrasenaPage() {

  const [email, setEmail] =
    useState("");

  const [enviando, setEnviando] =
    useState(false);

  const [enviado, setEnviado] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");


  async function solicitarRecuperacion(
    e: FormEvent
  ) {
    e.preventDefault();

    if (enviando) {
      return;
    }

    setError("");
    setMensaje("");

    const correo =
      email
        .trim()
        .toLowerCase();

    if (!correo) {
      setError(
        "Ingresa tu correo electrónico."
      );
      return;
    }

    setEnviando(true);

    try {

      const respuesta =
        await fetch(
          "/api/multinivel/olvide-contrasena",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email: correo,
            }),
          }
        );

      const data =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.error ||
            "No se pudo procesar la solicitud."
        );
      }

      setMensaje(
        data.mensaje ||
          "Si existe una cuenta asociada a ese correo, recibirás las instrucciones para restablecer tu contraseña."
      );

      setEnviado(true);

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo procesar la solicitud."
      );

    } finally {

      setEnviando(false);
    }
  }


  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">

      <div className="mx-auto max-w-md">

        <div className="mb-6 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10182D] text-white shadow-sm">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Recuperar contraseña
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Te enviaremos un enlace seguro para crear una nueva contraseña.
          </p>

        </div>


        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {enviado ? (

            <div className="p-7 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                Revisa tu correo
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {mensaje}
              </p>

              <p className="mt-3 text-xs leading-5 text-slate-400">
                El enlace de recuperación vence en 30 minutos.
              </p>

              <Link
                href="/login-miembro"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#10182D] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
              >
                Volver al inicio de sesión
              </Link>

            </div>

          ) : (

            <form
              onSubmit={solicitarRecuperacion}
              className="p-6"
            >

              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Correo electrónico
              </label>

              <div className="relative">

                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  required
                />

              </div>


              {error && (

                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>

              )}


              <button
                type="submit"
                disabled={enviando}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#10182D] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {enviando && (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                )}

                {enviando
                  ? "Enviando..."
                  : "Enviar enlace de recuperación"}

              </button>


              <Link
                href="/login-miembro"
                className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </Link>

            </form>

          )}

        </section>

      </div>

    </main>
  );
}
