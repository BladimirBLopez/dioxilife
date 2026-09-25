"use client";

import {
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";


export default function LoginMiembroPage() {

  const router =
    useRouter();


  const [
    email,
    setEmail,
  ] =
    useState("");


  const [
    password,
    setPassword,
  ] =
    useState("");


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  async function ingresar(
    e: React.FormEvent
  ) {
    e.preventDefault();


    if (loading) {
      return;
    }


    setError("");
    setLoading(
      true
    );


    try {

      const res =
        await fetch(
          "/api/multinivel/login",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                email:
                  email
                    .trim()
                    .toLowerCase(),

                password,
              }),
          }
        );


      const data =
        await res.json();


      if (!res.ok) {
        setError(
          data.error ||
            "Error al ingresar"
        );

        return;
      }


      router.push(
        "/mi-cuenta"
      );


    } catch {

      setError(
        "Error de conexión"
      );


    } finally {

      setLoading(
        false
      );
    }
  }


  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">

      <form
        onSubmit={
          ingresar
        }
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      >

        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          Acceso Miembro
        </h1>


        {error && (

          <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </div>

        )}


        <label className="mb-1 block text-sm text-gray-700">
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
          autoComplete="email"
          className="mb-4 w-full rounded-lg border p-3 text-gray-900"
          required
        />


        <div className="mb-1 flex items-center justify-between">

          <label className="block text-sm text-gray-700">
            Contraseña
          </label>

          <Link
            href="/olvide-contrasena"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ¿Olvidaste tu contraseña?
          </Link>

        </div>


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
          autoComplete="current-password"
          className="mb-6 w-full rounded-lg border p-3 text-gray-900"
          required
        />


        <button
          type="submit"
          disabled={
            loading
          }
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading
            ? "Ingresando..."
            : "Ingresar"}
        </button>

      </form>

    </main>
  );
}
