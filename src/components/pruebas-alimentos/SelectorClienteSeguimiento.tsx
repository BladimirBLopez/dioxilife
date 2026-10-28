"use client";

import { useEffect, useState } from "react";

type Cliente = {
  id: string;
  nombre: string;
  programa: string;
  estado: string;
};

export default function SelectorClienteSeguimiento({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (id: string) => void;
  disabled: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [seleccionado, setSeleccionado] = useState<Cliente | null>(null);
  const [cargando, setCargando] = useState(false);
  const [consultado, setConsultado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = busqueda.trim();

    if (disabled || seleccionado || q.length === 1) {
      setCargando(false);
      setResultados([]);
      return;
    }

    const controlador = new AbortController();

    setCargando(true);
    setConsultado(false);
    setError("");

    const temporizador = setTimeout(() => {
      void (async () => {
        try {
          const respuesta = await fetch(
            "/api/admin/pruebas-alimentos/clientes-seguimiento?q=" +
              encodeURIComponent(q),
            {
              cache: "no-store",
              credentials: "same-origin",
              signal: controlador.signal,
            }
          );

          if (!respuesta.ok) {
            throw new Error("No se pudo consultar clientes.");
          }

          const datos = (await respuesta.json()) as {
            clientes?: Cliente[];
          };

          if (!Array.isArray(datos.clientes)) {
            throw new Error("Respuesta no valida.");
          }

          if (!controlador.signal.aborted) {
            setResultados(datos.clientes);
            setConsultado(true);
          }
        } catch {
          if (!controlador.signal.aborted) {
            setError("No se pudo cargar la lista de clientes.");
            setResultados([]);
          }
        } finally {
          if (!controlador.signal.aborted) {
            setCargando(false);
          }
        }
      })();
    }, 300);

    return () => {
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, [busqueda, seleccionado, disabled]);

  const elegido =
    seleccionado?.id === value ? seleccionado : null;

  return (
    <div className="space-y-3">
      <label
        htmlFor="pa-buscar-seguimiento"
        className="block text-sm font-semibold text-slate-700"
      >
        Buscar cliente del seguimiento
      </label>

      <input
        id="pa-buscar-seguimiento"
        type="search"
        autoComplete="off"
        maxLength={80}
        disabled={disabled}
        value={busqueda}
        placeholder="Escribe el nombre del cliente"
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900"
        onChange={e => {
          onChange("");
          setSeleccionado(null);
          setResultados([]);
          setConsultado(false);
          setBusqueda(e.target.value);
        }}
      />

      {cargando && (
        <p role="status" className="text-sm text-slate-500">
          Buscando clientes...
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {elegido && (
        <p role="status" className="text-sm font-semibold text-green-700">
          Cliente seleccionado: {elegido.nombre}
        </p>
      )}

      {!elegido && busqueda.trim().length === 1 && (
        <p className="text-xs text-slate-500">
          Escribe una letra más para buscar.
        </p>
      )}

      {!elegido && !cargando && consultado &&
        resultados.length === 0 && !error && (
        <p className="text-sm text-slate-500">
          No se encontraron clientes.
        </p>
      )}

      {!elegido && resultados.length > 0 && (
        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
          <ul className="divide-y divide-slate-100">
            {resultados.map(cliente => (
              <li key={cliente.id}>
                <button
                  type="button"
                  disabled={disabled}
                  className="w-full px-4 py-3 text-left hover:bg-fuchsia-50 focus-visible:bg-fuchsia-50"
                  onClick={() => {
                    onChange(cliente.id);
                    setSeleccionado(cliente);
                    setBusqueda(cliente.nombre);
                    setResultados([]);
                  }}
                >
                  <span className="block font-semibold text-slate-900">
                    {cliente.nombre}
                  </span>
                  <span className="block text-xs text-slate-600">
                    {cliente.programa} · {cliente.estado}
                  </span>
                  {resultados.some(otro =>
                    otro.id !== cliente.id &&
                    otro.nombre === cliente.nombre &&
                    otro.programa === cliente.programa
                  ) && (
                    <span className="block text-xs text-slate-500">
                      Referencia: {cliente.id.slice(-6)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Se muestran hasta 20 clientes por búsqueda.
        El identificador se utiliza automáticamente.
      </p>
    </div>
  );
}
