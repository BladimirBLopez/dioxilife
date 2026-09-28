"use client";

import { useState } from "react";
import ExperienciaForm from "./ExperienciaForm";

type AplicacionOpcion = {
  id: string;
  nombre: string;
};

type ProductoOpcion = {
  id: string;
  nombre: string;
};

export default function CompartirExperienciaTestimonios({
  aplicaciones,
  productos,
  aplicacionInicialId,
}: {
  aplicaciones: AplicacionOpcion[];
  productos: ProductoOpcion[];
  aplicacionInicialId?: string;
}) {
  const aplicacionInicial =
    aplicaciones.find((a) => a.id === aplicacionInicialId)?.id || "";

  const [abierto, setAbierto] = useState(false);
  const [aplicacionId, setAplicacionId] = useState(aplicacionInicial);

  const aplicacionSeleccionada = aplicaciones.find(
    (a) => a.id === aplicacionId
  );

  if (!abierto) {
    return (
      <section className="mb-8">
        <div className="overflow-hidden rounded-3xl border border-[#E9E4F2] bg-gradient-to-br from-[#FFF7FC] via-white to-[#F8F6FF] p-5 shadow-[0_8px_28px_rgba(70,42,120,0.06)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
                Tu experiencia también cuenta
              </p>

              <h2 className="mt-1 text-xl font-bold text-[#1F1B24]">
                Comparte tu experiencia con nuestra comunidad
              </h2>

              <p className="mt-2 text-sm leading-6 text-brand-gray">
                Cuéntanos tu experiencia personal. La revisaremos antes de
                publicarla.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAbierto(true)}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-pink px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Compartir mi experiencia
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="rounded-3xl border border-[#E9E4F2] bg-white p-4 shadow-[0_8px_28px_rgba(70,42,120,0.06)] sm:p-5">
        {!aplicacionSeleccionada ? (
          <>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
                Compartir experiencia
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#1F1B24]">
                ¿Con qué aplicación está relacionada?
              </h2>

              <p className="mt-1 text-sm text-brand-gray">
                Selecciona el tema para organizar correctamente tu experiencia.
              </p>
            </div>

            <select
              value={aplicacionId}
              onChange={(e) => setAplicacionId(e.target.value)}
              className="w-full rounded-xl border border-[#DDD8E8] bg-white px-3 py-3 text-sm text-[#1F1B24] outline-none transition focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/10"
            >
              <option value="">Seleccionar aplicación...</option>
              {aplicaciones.map((aplicacion) => (
                <option key={aplicacion.id} value={aplicacion.id}>
                  {aplicacion.nombre}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="mt-3 text-sm font-semibold text-brand-gray hover:text-brand-pink"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setAplicacionId("")}
                className="text-xs font-semibold text-brand-pink hover:underline"
              >
                Cambiar aplicación
              </button>
            </div>

            <ExperienciaForm
              aplicacionId={aplicacionSeleccionada.id}
              aplicacionNombre={aplicacionSeleccionada.nombre}
              productos={productos}
              onCancelar={() => setAbierto(false)}
            />
          </>
        )}
      </div>
    </section>
  );
}
