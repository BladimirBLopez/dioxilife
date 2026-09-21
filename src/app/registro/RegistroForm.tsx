"use client";

import Link from "next/link";

import {
  useState,
} from "react";

import {
  CheckCircle2,
  LockKeyhole,
  UserPlus,
} from "lucide-react";


type Props = {
  codigoInicial?: string;
  invitacionValida?: boolean;
  patrocinadorNombre?: string;
};


export default function RegistroForm({
  codigoInicial = "",
  invitacionValida,
  patrocinadorNombre = "",
}: Props) {

  const tieneCodigoInicial =
    Boolean(
      codigoInicial.trim()
    );

  const invitacionBloqueada =
    tieneCodigoInicial &&
    invitacionValida === true;


  const [
    nombres,
    setNombres,
  ] =
    useState("");


  const [
    apellidos,
    setApellidos,
  ] =
    useState("");


  const [
    email,
    setEmail,
  ] =
    useState("");


  const [
    telefono,
    setTelefono,
  ] =
    useState("");


  const [
    password,
    setPassword,
  ] =
    useState("");


  const [
    ref,
    setRef,
  ] =
    useState(
      codigoInicial
        .trim()
        .toUpperCase()
    );


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    mensaje,
    setMensaje,
  ] =
    useState("");


  const [
    codigoReferido,
    setCodigoReferido,
  ] =
    useState("");


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  async function registrar(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");
    setMensaje("");
    setCodigoReferido("");
    setLoading(true);


    try {

      const respuesta =
        await fetch(
          "/api/multinivel/registro",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                nombres,
                apellidos,
                email,
                telefono,
                password,
                ref,
              }),
          }
        );


      const data =
        await respuesta.json();


      if (!respuesta.ok) {

        setError(
          data.error ||
            "No se pudo realizar el registro"
        );

        return;
      }


      setMensaje(
        "Tu cuenta está activa y fue creada correctamente."
      );

      setCodigoReferido(
        data.miembro
          .codigoReferido
      );


      setNombres("");
      setApellidos("");
      setEmail("");
      setTelefono("");
      setPassword("");

    } catch {

      setError(
        "No se pudo conectar con el servidor"
      );

    } finally {

      setLoading(false);
    }
  }


  return (
    <form
      onSubmit={
        registrar
      }
      className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5"
    >

      <div className="bg-[#10182D] p-6 text-white sm:p-7">

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
          <UserPlus className="h-6 w-6" />
        </div>

        <h1 className="mt-5 text-2xl font-bold">
          Únete a DioxiLife
        </h1>

        <p className="mt-2 text-sm leading-6 text-white/55">
          Crea tu cuenta como miembro de la red DioxiLife Bolivia.
        </p>

      </div>


      <div className="p-5 sm:p-7">

        {invitacionBloqueada && (

          <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

            <div className="flex items-start gap-3">

              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

              <div>

                <p className="text-sm font-bold text-emerald-800">
                  Invitación verificada
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  Fuiste invitado por{" "}
                  <strong>
                    {patrocinadorNombre}
                  </strong>
                  {" · "}
                  {codigoInicial.toUpperCase()}.
                </p>

              </div>

            </div>

          </div>

        )}


        {tieneCodigoInicial &&
          invitacionValida === false && (

            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4">

              <p className="text-sm font-bold text-red-700">
                Invitación no válida
              </p>

              <p className="mt-1 text-xs leading-5 text-red-600">
                El código del enlace no existe o pertenece a un miembro que no está activo. Puedes escribir un código válido debajo.
              </p>

            </div>

          )}


        {error && (

          <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>

        )}


        {mensaje && (

          <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">

            <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />

            <p className="mt-3 font-bold text-emerald-800">
              {mensaje}
            </p>


            {codigoReferido && (

              <>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Tu código de referido
                </p>

                <p className="mt-1 font-mono text-xl font-bold tracking-wider text-slate-900">
                  {codigoReferido}
                </p>

              </>

            )}


            <Link
              href="/login-miembro"
              className="mt-5 inline-flex rounded-xl bg-[#10182D] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700"
            >
              Ingresar a mi cuenta
            </Link>

          </div>

        )}


        {!mensaje && (

          <>

            <div className="grid gap-4 sm:grid-cols-2">

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Nombres
                </label>

                <input
                  type="text"
                  value={
                    nombres
                  }
                  onChange={
                    (e) =>
                      setNombres(
                        e.target.value
                      )
                  }
                  maxLength={120}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  required
                />

              </div>


              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Apellidos
                </label>

                <input
                  type="text"
                  value={
                    apellidos
                  }
                  onChange={
                    (e) =>
                      setApellidos(
                        e.target.value
                      )
                  }
                  maxLength={120}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />

              </div>

            </div>


            <div className="mt-4">

              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Correo electrónico
              </label>

              <input
                type="email"
                value={
                  email
                }
                onChange={
                  (e) =>
                    setEmail(
                      e.target.value
                    )
                }
                maxLength={180}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                required
              />

            </div>


            <div className="mt-4">

              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Teléfono
              </label>

              <input
                type="tel"
                value={
                  telefono
                }
                onChange={
                  (e) =>
                    setTelefono(
                      e.target.value
                    )
                }
                maxLength={30}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />

            </div>


            <div className="mt-4">

              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Contraseña
              </label>

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
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                required
              />

              <p className="mt-1.5 text-xs text-slate-400">
                Mínimo 8 caracteres.
              </p>

            </div>


            <div className="mt-4">

              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Código de patrocinador
              </label>


              <div className="relative">

                <input
                  type="text"
                  value={
                    ref
                  }
                  onChange={
                    (e) =>
                      setRef(
                        e.target.value
                          .toUpperCase()
                      )
                  }
                  readOnly={
                    invitacionBloqueada
                  }
                  placeholder="Código de quien te invitó"
                  className={`w-full rounded-xl border px-3.5 py-2.5 uppercase text-slate-900 outline-none transition ${
                    invitacionBloqueada
                      ? "border-emerald-200 bg-emerald-50 pr-10 font-mono font-bold text-emerald-800"
                      : "border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  }`}
                  required
                />


                {invitacionBloqueada && (

                  <LockKeyhole className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />

                )}

              </div>


              <p className="mt-1.5 text-xs text-slate-400">

                {invitacionBloqueada
                  ? "El patrocinador fue definido por tu enlace de invitación."
                  : "Necesitas el código de un miembro activo para registrarte."}

              </p>

            </div>


            <button
              type="submit"
              disabled={
                loading
              }
              className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creando cuenta..."
                : "Crear mi cuenta"}
            </button>


            <p className="mt-5 text-center text-xs text-slate-400">
              ¿Ya tienes una cuenta?{" "}

              <Link
                href="/login-miembro"
                className="font-semibold text-blue-600 hover:underline"
              >
                Iniciar sesión
              </Link>
            </p>

          </>

        )}

      </div>

    </form>
  );
}
