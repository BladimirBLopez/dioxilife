"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
} from "next/navigation";

import {
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";


type DatosMiembro = {
  nombres: string;
  apellidos: string | null;
  email: string;
};


export default function ActivarCuentaPage() {

  const params =
    useParams();


  const token =
    typeof params.token === "string"
      ? params.token
      : "";


  const [
    miembro,
    setMiembro,
  ] =
    useState<DatosMiembro | null>(
      null
    );


  const [
    password,
    setPassword,
  ] =
    useState("");


  const [
    confirmar,
    setConfirmar,
  ] =
    useState("");


  const [
    cargando,
    setCargando,
  ] =
    useState(true);


  const [
    guardando,
    setGuardando,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    activada,
    setActivada,
  ] =
    useState(false);


  useEffect(
    () => {

      if (!token) {
        setError(
          "El enlace de activación no es válido."
        );

        setCargando(false);

        return;
      }


      let cancelado =
        false;


      async function validar() {

        try {

          const respuesta =
            await fetch(
              `/api/multinivel/activar?token=${encodeURIComponent(token)}`,
              {
                cache:
                  "no-store",
              }
            );


          const data =
            await respuesta.json();


          if (cancelado) {
            return;
          }


          if (!respuesta.ok) {
            setError(
              data.error ||
                "No se pudo validar el enlace."
            );

            return;
          }


          setMiembro(
            data.miembro
          );

        } catch {

          if (!cancelado) {
            setError(
              "No se pudo validar el enlace de activación."
            );
          }

        } finally {

          if (!cancelado) {
            setCargando(
              false
            );
          }
        }
      }


      validar();


      return () => {
        cancelado =
          true;
      };
    },
    [
      token,
    ]
  );


  async function activarCuenta(
    e: FormEvent
  ) {
    e.preventDefault();


    if (guardando) {
      return;
    }


    setError("");


    if (
      password.length < 8 ||
      password.length > 128
    ) {
      setError(
        "La contraseña debe tener entre 8 y 128 caracteres."
      );

      return;
    }


    if (
      password !==
      confirmar
    ) {
      setError(
        "Las contraseñas no coinciden."
      );

      return;
    }


    setGuardando(
      true
    );


    try {

      const respuesta =
        await fetch(
          "/api/multinivel/activar",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                token,
                password,
              }),
          }
        );


      const data =
        await respuesta.json();


      if (!respuesta.ok) {
        throw new Error(
          data.error ||
            "No se pudo activar la cuenta."
        );
      }


      setActivada(
        true
      );

      setPassword("");
      setConfirmar("");

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo activar la cuenta."
      );

    } finally {

      setGuardando(
        false
      );
    }
  }


  const nombreCompleto =
    miembro
      ? [
          miembro.nombres,
          miembro.apellidos,
        ]
          .filter(Boolean)
          .join(" ")
      : "";


  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">

      <div className="mx-auto max-w-md">

        <div className="mb-6 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10182D] text-white shadow-sm">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Activación DioxiLife
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Configura tu acceso personal al panel de distribuidor.
          </p>

        </div>


        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {cargando && (

            <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">

              <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />

              <p className="mt-4 font-semibold text-slate-700">
                Validando tu enlace...
              </p>

            </div>

          )}


          {!cargando &&
            activada && (

            <div className="p-7 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                Cuenta activada
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Tu contraseña fue creada correctamente. Ya puedes ingresar a tu panel de distribuidor.
              </p>

              <Link
                href="/login-miembro"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#10182D] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
              >
                Ingresar a mi panel
              </Link>

            </div>

          )}


          {!cargando &&
            !activada &&
            !miembro && (

            <div className="p-7 text-center">

              <h2 className="text-xl font-bold text-slate-900">
                No se puede activar la cuenta
              </h2>

              <p className="mt-3 text-sm leading-6 text-red-600">
                {error}
              </p>

              <Link
                href="/login-miembro"
                className="mt-6 inline-flex items-center justify-center text-sm font-bold text-blue-600 hover:text-blue-700"
              >
                Ir al inicio de sesión
              </Link>

            </div>

          )}


          {!cargando &&
            !activada &&
            miembro && (

            <form
              onSubmit={
                activarCuenta
              }
            >

              <div className="border-b border-slate-100 p-6">

                <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                  Bienvenido a DioxiLife
                </p>

                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  {nombreCompleto}
                </h2>

                <p className="mt-1 break-all text-sm text-slate-500">
                  {miembro.email}
                </p>

              </div>


              <div className="space-y-5 p-6">

                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Crea tu contraseña
                  </label>

                  <div className="relative">

                    <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="password"
                      value={
                        password
                      }
                      onChange={
                        (e) =>
                          setPassword(
                            e.target.value
                          )
                      }
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                      required
                    />

                  </div>

                  <p className="mt-1.5 text-xs text-slate-400">
                    Utiliza al menos 8 caracteres.
                  </p>

                </div>


                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Confirmar contraseña
                  </label>

                  <input
                    type="password"
                    value={
                      confirmar
                    }
                    onChange={
                      (e) =>
                        setConfirmar(
                          e.target.value
                        )
                    }
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    required
                  />

                </div>


                {error && (

                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>

                )}


                <button
                  type="submit"
                  disabled={
                    guardando
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#10182D] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {guardando && (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  )}

                  {guardando
                    ? "Activando..."
                    : "Activar mi cuenta"}

                </button>

              </div>

            </form>

          )}

        </section>

      </div>

    </main>
  );
}
