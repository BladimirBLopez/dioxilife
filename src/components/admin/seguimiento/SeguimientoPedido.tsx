"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Plan = {
  id: string;
  nombre: string;
  duracionDias: number;
};

type Seguimiento = {
  id: string;

  estado:
    | "PENDIENTE"
    | "ACTIVO"
    | "PAUSADO"
    | "COMPLETADO"
    | "CANCELADO";

  fechaInicioPrevista: string | Date | null;
  fechaInicio: string | Date | null;
  fechaFinalizado: string | Date | null;
  ultimoAccesoAt: string | Date | null;
  observacionInterna: string | null;

  nombrePlan: string;
  duracionDias: number;

  plan: {
    id: string;
    nombre: string;
    duracionDias: number;
  };
};

type Props = {
  pedidoId: string;
  estadoPedido: string;
  planes: Plan[];
  seguimientos: Seguimiento[];
};

export default function SeguimientoPedido({
  pedidoId,
  estadoPedido,
  planes,
  seguimientos,
}: Props) {
  const router = useRouter();

  const vigente =
    seguimientos.find(
      (seguimiento) =>
        seguimiento.estado === "PENDIENTE" ||
        seguimiento.estado === "ACTIVO" ||
        seguimiento.estado === "PAUSADO"
    ) || null;

  const [planId, setPlanId] = useState(
    planes[0]?.id || ""
  );

  const [
    fechaInicioPrevista,
    setFechaInicioPrevista,
  ] = useState("");

  const [
    observacionInterna,
    setObservacionInterna,
  ] = useState("");

  const [procesando, setProcesando] =
    useState(false);

  const [enlaceTemporal, setEnlaceTemporal] =
    useState<string | null>(null);

  const pedidoHabilitado =
    estadoPedido === "PAGADO" ||
    estadoPedido === "COMPLETADO";

  async function asignar() {
    if (
      procesando ||
      !planId
    ) {
      return;
    }

    const confirmar =
      window.confirm(
        "¿Deseas asignar esta plantilla de seguimiento al cliente?"
      );

    if (!confirmar) {
      return;
    }

    setProcesando(true);

    const toastId =
      toast.loading(
        "Asignando seguimiento..."
      );

    try {
      const res = await fetch(
        "/api/admin/seguimiento/clientes",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            pedidoId,
            planId,
            fechaInicioPrevista:
              fechaInicioPrevista || null,
            observacionInterna:
              observacionInterna.trim() ||
              null,
          }),
        }
      );

      const data =
        await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(
          "No se pudo asignar el seguimiento",
          {
            id: toastId,
            description:
              data?.error ||
              "Inténtalo nuevamente.",
          }
        );

        return;
      }

      const url =
        `${window.location.origin}/seguimiento/${data.token}`;

      setEnlaceTemporal(url);

      toast.success(
        "Seguimiento asignado correctamente",
        {
          id: toastId,
          description:
            "El acceso privado fue generado.",
        }
      );

      router.refresh();
    } catch {
      toast.error(
        "No se pudo conectar con el servidor",
        {
          id: toastId,
        }
      );
    } finally {
      setProcesando(false);
    }
  }

  async function copiarEnlace() {
    if (!enlaceTemporal) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        enlaceTemporal
      );

      toast.success(
        "Enlace privado copiado"
      );
    } catch {
      toast.error(
        "No se pudo copiar el enlace"
      );
    }
  }

  async function regenerarEnlace(
    seguimientoId: string
  ) {
    if (procesando) {
      return;
    }

    const confirmar =
      window.confirm(
        "El enlace anterior dejará de funcionar. ¿Deseas generar uno nuevo?"
      );

    if (!confirmar) {
      return;
    }

    setProcesando(true);

    const toastId =
      toast.loading(
        "Generando nuevo enlace..."
      );

    try {
      const res = await fetch(
        `/api/admin/seguimiento/clientes/${seguimientoId}/regenerar`,
        {
          method: "POST",
        }
      );

      const data =
        await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(
          "No se pudo regenerar el enlace",
          {
            id: toastId,
            description:
              data?.error ||
              "Inténtalo nuevamente.",
          }
        );

        return;
      }

      const url =
        `${window.location.origin}/seguimiento/${data.token}`;

      setEnlaceTemporal(url);

      toast.success(
        "Nuevo enlace privado generado",
        {
          id: toastId,
          description:
            "El enlace anterior dejó de funcionar.",
        }
      );
    } catch {
      toast.error(
        "No se pudo conectar con el servidor",
        {
          id: toastId,
        }
      );
    } finally {
      setProcesando(false);
    }
  }

  function formatoFecha(
    fecha: string | Date | null
  ) {
    if (!fecha) {
      return null;
    }

    return new Date(fecha).toLocaleDateString(
      "es-BO",
      {
        timeZone: "UTC",
      }
    );
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow">

      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Seguimiento del cliente
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          La asignación es manual. Administración decide qué plan corresponde a cada pedido.
        </p>
      </div>


      {!pedidoHabilitado ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">

          <p className="text-sm font-medium text-gray-700">
            Seguimiento todavía no disponible
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Primero debe aprobarse el pago del pedido.
          </p>

        </div>

      ) : vigente ? (

        <div className="mt-4 space-y-4">

          <div className="rounded-xl border border-violet-100 bg-[#F8F6FF] p-4">

            <div className="flex flex-wrap items-start justify-between gap-3">

              <div>
                <p className="text-xs font-medium text-gray-500">
                  Plantilla asignada
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {vigente.nombrePlan}
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  {vigente.duracionDias} días
                </p>
              </div>

              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                {vigente.estado}
              </span>

            </div>


            {vigente.fechaInicioPrevista && (
              <div className="mt-4">

                <p className="text-xs text-gray-500">
                  Inicio previsto
                </p>

                <p className="mt-1 text-sm font-medium text-gray-800">
                  {formatoFecha(
                    vigente.fechaInicioPrevista
                  )}
                </p>

              </div>
            )}


            {vigente.observacionInterna && (
              <div className="mt-4">

                <p className="text-xs text-gray-500">
                  Observación interna
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {vigente.observacionInterna}
                </p>

              </div>
            )}


            <div className="mt-4 flex flex-wrap gap-2 border-t border-violet-100 pt-4">

              <Link
                href={`/admin/seguimiento/clientes/${vigente.id}`}
                className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Administrar agenda
              </Link>

            </div>

            <div className="mt-4 border-t border-violet-100 pt-4">

              {vigente.ultimoAccesoAt ? (
                <p className="text-xs text-green-700">
                  Último acceso del cliente:{" "}
                  {new Date(
                    vigente.ultimoAccesoAt
                  ).toLocaleString(
                    "es-BO",
                    {
                      timeZone:
                        "America/La_Paz",
                    }
                  )}
                </p>
              ) : (
                <p className="text-xs text-amber-700">
                  El cliente todavía no ha abierto su seguimiento.
                </p>
              )}

            </div>

          </div>


          {enlaceTemporal ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">

              <p className="text-sm font-semibold text-green-800">
                Enlace privado generado
              </p>

              <p className="mt-1 text-xs leading-5 text-green-700">
                Por seguridad el token original no se guarda en la base de datos. Copia este enlace antes de salir de la página.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() =>
                    void copiarEnlace()
                  }
                  className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Copiar enlace privado
                </button>

                <button
                  type="button"
                  disabled={procesando}
                  onClick={() =>
                    void regenerarEnlace(
                      vigente.id
                    )
                  }
                  className="rounded-xl border border-green-200 bg-white px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-60"
                >
                  Generar otro enlace
                </button>

              </div>

            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

              <p className="text-sm font-semibold text-amber-800">
                Enlace privado protegido
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700">
                El token original no se almacena. Si necesitas volver a compartir el seguimiento, genera un nuevo enlace.
              </p>

              <button
                type="button"
                disabled={procesando}
                onClick={() =>
                  void regenerarEnlace(
                    vigente.id
                  )
                }
                className="mt-3 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
              >
                {procesando
                  ? "Generando..."
                  : "Regenerar enlace privado"}
              </button>

            </div>
          )}

        </div>

      ) : planes.length === 0 ? (

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">

          <p className="text-sm font-semibold text-amber-800">
            No hay planes activos
          </p>

          <p className="mt-1 text-xs text-amber-700">
            Primero crea y activa un plan con actividades.
          </p>

        </div>

      ) : (

        <div className="mt-5 space-y-4">

          <div>
            <label className="admin-label">
              Plantilla de seguimiento
            </label>

            <select
              value={planId}
              onChange={(e) =>
                setPlanId(e.target.value)
              }
              className="admin-input"
            >
              {planes.map((plan) => (
                <option
                  key={plan.id}
                  value={plan.id}
                >
                  {plan.nombre} ·{" "}
                  {plan.duracionDias} días
                </option>
              ))}
            </select>
          </div>


          <div>
            <label className="admin-label">
              Fecha prevista de inicio
            </label>

            <input
              type="date"
              value={fechaInicioPrevista}
              onChange={(e) =>
                setFechaInicioPrevista(
                  e.target.value
                )
              }
              className="admin-input"
            />

            <p className="mt-1 text-xs text-gray-500">
              Es informativa. El seguimiento no comenzará automáticamente.
            </p>
          </div>


          <div>
            <label className="admin-label">
              Observación interna
            </label>

            <textarea
              value={observacionInterna}
              onChange={(e) =>
                setObservacionInterna(
                  e.target.value
                )
              }
              rows={3}
              maxLength={1500}
              className="admin-input"
              placeholder="Ej. Cliente indicó que desea comenzar el lunes."
            />

            <p className="mt-1 text-xs text-gray-500">
              Solo visible para administración.
            </p>
          </div>


          <button
            type="button"
            disabled={
              procesando ||
              !planId
            }
            onClick={() =>
              void asignar()
            }
            className="admin-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {procesando
              ? "Asignando..."
              : "Asignar seguimiento"}
          </button>

        </div>

      )}

    </section>
  );
}
