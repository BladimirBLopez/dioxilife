"use client";

import { useState } from "react";

type Sucursal = {
  id: string;
  nombre: string | null;
  direccion: string | null;
  telefono: string | null;
  googleMapsUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  instagramUrl: string | null;
};

function IconoUbicacion() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
    </svg>
  );
}

function IconoTelefono() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.2c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z" />
    </svg>
  );
}

function IconoChevron({ abierto }: { abierto: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={`w-5 h-5 transition-transform ${abierto ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.9.25-1.5 1.55-1.5H16.5V4.3C16.2 4.26 15.2 4.17 14 4.17c-2.4 0-4 1.46-4 4.15V10.5H7.5v3H10V21h3.5Z" />
    </svg>
  );
}

function IconoInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 8.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Zm0 6.1a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8Zm4.7-6.25a.86.86 0 1 1-1.72 0 .86.86 0 0 1 1.72 0ZM20 7.2c-.06-1.2-.33-2.27-1.2-3.14C17.93 3.2 16.85 2.93 15.66 2.87 14.44 2.8 9.56 2.8 8.34 2.87c-1.2.06-2.27.33-3.14 1.19C4.33 4.93 4.06 6 4 7.2c-.07 1.22-.07 6.1 0 7.32.06 1.2.33 2.27 1.2 3.13.87.87 1.94 1.14 3.14 1.2 1.22.07 6.1.07 7.32 0 1.2-.06 2.27-.33 3.14-1.2.87-.86 1.14-1.93 1.2-3.13.07-1.22.07-6.09 0-7.32ZM18.4 15.9a4.1 4.1 0 0 1-2.3 2.3c-1.6.63-5.4.49-7 .49s-5.4.14-7-.49a4.1 4.1 0 0 1-2.3-2.3c-.63-1.6-.49-5.4-.49-7s-.14-5.4.49-7a4.1 4.1 0 0 1 2.3-2.3c1.6-.63 5.4-.49 7-.49s5.4-.14 7 .49a4.1 4.1 0 0 1 2.3 2.3c.63 1.6.49 5.4.49 7s.14 5.4-.49 7Z" />
    </svg>
  );
}

function IconoTikTok() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M16.6 5.82c-.9-.98-1.4-2.26-1.4-3.57h-3.03v13.4c0 1.53-1.24 2.77-2.77 2.77a2.77 2.77 0 0 1 0-5.54c.28 0 .55.04.8.12V9.9a5.9 5.9 0 0 0-.8-.06 5.83 5.83 0 1 0 5.83 5.83V9.02a8.6 8.6 0 0 0 5.03 1.62V7.6a5.6 5.6 0 0 1-3.66-1.78Z" />
    </svg>
  );
}

export default function SeccionSucursales({
  grupos,
  nombreDepartamento,
}: {
  grupos: Record<string, Sucursal[]>;
  nombreDepartamento: Record<string, string>;
}) {
  const departamentos = Object.entries(grupos);
  const [abierto, setAbierto] = useState<string | null>(
    departamentos[0]?.[0] ?? null
  );

  return (
    <div className="max-w-2xl mx-auto divide-y divide-gray-200 bg-white rounded-xl shadow-sm overflow-hidden">
      {departamentos.map(([departamento, lista]) => {
        const estaAbierto = abierto === departamento;
        return (
          <div key={departamento}>
            <button
              onClick={() => setAbierto(estaAbierto ? null : departamento)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 font-semibold text-brand-blue">
                <IconoUbicacion />
                {nombreDepartamento[departamento] || departamento}
                <span className="text-xs font-normal text-gray-400">
                  ({lista.length})
                </span>
              </span>
              <IconoChevron abierto={estaAbierto} />
            </button>

            {estaAbierto && (
              <div className="px-4 pb-4 space-y-4">
                {lista.map((s) => {
                  const consultaMaps = encodeURIComponent(
                    `${s.direccion || ""} ${nombreDepartamento[departamento] || ""} Bolivia`
                  );
                  return (
                    <div
                      key={s.id}
                      className="border rounded-lg p-3 text-sm space-y-1"
                    >
                      {s.nombre && (
                        <p className="font-medium">{s.nombre}</p>
                      )}
                      {s.direccion && (
                        <p className="text-brand-gray">{s.direccion}</p>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2">
                        {s.telefono && (
                          <a
                            href={`tel:${s.telefono.replace(/\s+/g, "")}`}
                            className="flex items-center gap-1 text-xs font-medium border border-brand-blue text-brand-blue rounded-full px-3 py-1"
                          >
                            <IconoTelefono /> Llamar
                          </a>
                        )}
                        {s.direccion && (
                          <a
                            href={
                              s.googleMapsUrl ||
                              `https://www.google.com/maps/search/?api=1&query=${consultaMaps}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-medium border border-brand-pink text-brand-pink rounded-full px-3 py-1"
                          >
                            <IconoUbicacion /> Ver en Maps
                          </a>
                        )}
                      </div>

                      {(s.facebookUrl || s.instagramUrl || s.tiktokUrl) && (
                        <div className="flex gap-3 pt-2 text-brand-blue">
                          {s.facebookUrl && (
                            <a
                              href={s.facebookUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Facebook"
                            >
                              <IconoFacebook />
                            </a>
                          )}
                          {s.instagramUrl && (
                            <a
                              href={s.instagramUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Instagram"
                            >
                              <IconoInstagram />
                            </a>
                          )}
                          {s.tiktokUrl && (
                            <a
                              href={s.tiktokUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="TikTok"
                            >
                              <IconoTikTok />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
