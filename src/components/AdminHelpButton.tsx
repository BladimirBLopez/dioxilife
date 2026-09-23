"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ayudas } from "@/components/admin-help/help-data";

export default function AdminHelpButton() {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [tutorial, setTutorial] = useState(false);
  const [paso, setPaso] = useState(0);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  useEffect(() => {
    setTutorial(false);
    setPaso(0);
  }, [pathname]);

  const actual =
    ayudas.find((a) => pathname.startsWith(a.ruta)) ||
    {
      titulo: "🌱 Panel DioxiLife",
      texto:
        "Aquí puedes administrar todas las funciones principales del negocio.",
    };

  const otros = ayudas.filter(
    (a) => a.titulo !== actual.titulo
  );

  const resultados = ayudas.filter((a) =>
    `${a.titulo} ${a.descripcion}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="fixed bottom-5 right-5 z-50 h-14 min-w-14 px-4 rounded-full bg-brand-pink text-white text-2xl shadow-lg hover:scale-105 transition flex items-center justify-center gap-2"
        aria-label="Ayuda"
      >
        <span>?</span>
        <span className="hidden sm:inline text-sm font-semibold">
          Ayuda
        </span>
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex justify-end"
          onClick={() => setAbierto(false)}
        >
          <div
            className="bg-white w-full max-w-sm h-full p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-lg">
                🌱 Ayuda DioxiLife
              </h2>

              <button
                onClick={() => setAbierto(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>


            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="🔎 Buscar tutorial..."
              className="w-full border rounded-lg px-3 py-2 text-sm mb-5"
            />


            <div className="bg-brand-pink/10 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-500">
                Estás en:
              </p>

              <h3 className="font-semibold mt-1">
                {actual.titulo}
              </h3>

              {!tutorial ? (
                <>
                  <p className="text-sm text-gray-700 mt-3">
                    {"descripcion" in actual
                      ? actual.descripcion
                      : "Ayuda del módulo DioxiLife"}
                  </p>

                  {"pasos" in actual && actual.pasos.length > 0 && (
                    <button
                      onClick={() => {
                        setTutorial(true);
                        setPaso(0);
                      }}
                      className="mt-4 w-full bg-brand-pink text-white rounded-lg py-2 text-sm font-semibold"
                    >
                      Iniciar tutorial
                    </button>
                  )}
                </>
              ) : (
                "pasos" in actual && (
                  <div className="mt-4">

                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>
                        Paso {paso + 1} de {actual.pasos.length}
                      </span>

                      <span>
                        {Math.round(((paso + 1) / actual.pasos.length) * 100)}%
                      </span>
                    </div>

                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full bg-brand-pink"
                        style={{
                          width: `${((paso + 1) / actual.pasos.length) * 100}%`,
                        }}
                      />
                    </div>

                    <h4 className="font-semibold">
                      {actual.pasos[paso].titulo}
                    </h4>

                    <p className="text-sm text-gray-700 mt-2">
                      {actual.pasos[paso].texto}
                    </p>

                    <div className="flex gap-2 mt-5">

                      <button
                        disabled={paso === 0}
                        onClick={() => setPaso(paso - 1)}
                        className="flex-1 border rounded-lg py-2 text-sm disabled:opacity-40"
                      >
                        ← Atrás
                      </button>

                      <button
                        onClick={() => {
                          if (paso < actual.pasos.length - 1) {
                            setPaso(paso + 1);
                          } else {
                            setTutorial(false);
                            setPaso(0);
                          }
                        }}
                        className="flex-1 bg-brand-pink text-white rounded-lg py-2 text-sm"
                      >
                        {paso === actual.pasos.length - 1
                          ? "Finalizar"
                          : "Siguiente →"}
                      </button>

                    </div>

                  </div>
                )
              )}
            </div>


            <h3 className="font-semibold text-sm mb-3">
              Otros módulos
            </h3>


            <div className="space-y-3">
              {resultados
                .filter((a) => a.titulo !== actual.titulo)
                .map((a) => (
                <div
                  key={a.titulo}
                  className="bg-gray-50 rounded-xl p-4"
                >
                  <h4 className="font-medium">
                    {a.titulo}
                  </h4>

                  <p className="text-sm text-gray-600 mt-1">
                    {a.descripcion}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t mt-6 pt-4 text-center">
              <p className="text-xs font-semibold text-gray-500">
                🌱 DioxiLife Admin Guide
              </p>

              <p className="text-[11px] text-gray-400 mt-1">
                Versión 1.0 · Manual interno de administración
              </p>

              <p className="text-[11px] text-gray-400">
                Actualizado: Septiembre 2026
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
