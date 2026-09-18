"use client";

import { useState } from "react";

type Props = {
  codigoInicial?: string;
};

export default function RegistroForm({ codigoInicial = "" }: Props) {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [ref, setRef] = useState(codigoInicial.toUpperCase());

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [codigoReferido, setCodigoReferido] = useState("");
  const [loading, setLoading] = useState(false);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMensaje("");
    setCodigoReferido("");
    setLoading(true);

    try {
      const respuesta = await fetch("/api/multinivel/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombres,
          apellidos,
          email,
          telefono,
          password,
          ref,
        }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        setError(data.error || "No se pudo realizar el registro");
        setLoading(false);
        return;
      }

      setMensaje("Tu cuenta fue creada correctamente.");
      setCodigoReferido(data.miembro.codigoReferido);

      setNombres("");
      setApellidos("");
      setEmail("");
      setTelefono("");
      setPassword("");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={registrar}
      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
    >
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Crear mi cuenta
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Regístrate como miembro de DioxiLife
        </p>
      </div>

      {codigoInicial && (
        <div className="mb-5 rounded-lg bg-green-50 p-3 text-center text-sm text-green-700">
          Has sido invitado con el código{" "}
          <strong>{codigoInicial.toUpperCase()}</strong>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="mb-5 rounded-lg bg-green-50 p-4 text-center text-green-700">
          <p className="font-semibold">{mensaje}</p>

          {codigoReferido && (
            <>
              <p className="mt-2 text-sm">Tu código de referido es:</p>

              <p className="mt-1 text-xl font-bold tracking-wider">
                {codigoReferido}
              </p>
            </>
          )}
        </div>
      )}

      <label className="mb-1 block text-sm font-medium text-gray-700">
        Nombres
      </label>

      <input
        type="text"
        value={nombres}
        onChange={(e) => setNombres(e.target.value)}
        className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        required
      />

      <label className="mb-1 block text-sm font-medium text-gray-700">
        Apellidos
      </label>

      <input
        type="text"
        value={apellidos}
        onChange={(e) => setApellidos(e.target.value)}
        className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
      />

      <label className="mb-1 block text-sm font-medium text-gray-700">
        Correo electrónico
      </label>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        required
      />

      <label className="mb-1 block text-sm font-medium text-gray-700">
        Teléfono
      </label>

      <input
        type="tel"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
      />

      <label className="mb-1 block text-sm font-medium text-gray-700">
        Contraseña
      </label>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        required
      />

      <label className="mb-1 block text-sm font-medium text-gray-700">
        Código de patrocinador
      </label>

      <input
        type="text"
        value={ref}
        onChange={(e) => setRef(e.target.value.toUpperCase())}
        placeholder="Opcional"
        className="mb-6 w-full rounded-lg border border-gray-300 px-3 py-2 uppercase text-gray-900"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}
