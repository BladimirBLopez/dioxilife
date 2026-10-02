"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Plan = {
  id: string;
  nombre: string;
  duracionDias: number;
};

type Origen =
  | "WHATSAPP"
  | "LLAMADA"
  | "TIENDA"
  | "OTRO";

export default function NuevoSeguimientoForm({
  planes,
}: {
  planes: Plan[];
}) {
  const router = useRouter();

  const [nombreCliente, setNombreCliente] =
    useState("");

  const [telefonoCliente, setTelefonoCliente] =
    useState("");

  const [origen, setOrigen] =
    useState<Origen>("WHATSAPP");

  const [referenciaCompra, setReferenciaCompra] =
    useState("");

  const [planId, setPlanId] =
    useState(planes[0]?.id || "");

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

  async function crear(
    e: FormEvent
  ) {
    e.preventDefault();

    if (procesando) {
      return;
    }

    if (
      !nombreCliente.trim() ||
      !telefonoCliente.trim() ||
      !planId
    ) {
      toast.error(
        "Completa nombre, WhatsApp y plan."
      );

      return;
    }

    if (
      !/^[0-9]{8}$/.test(
        telefonoCliente
      )
    ) {
      toast.error(
        "El WhatsApp debe tener exactamente 8 números."
      );

      return;
    }

    setProcesando(true);

    const toastId =
      toast.loading(
        "Registrando cliente..."
      );

    try {
      const res =
        await fetch(
          "/api/admin/seguimiento/clientes",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                pedidoId: null,

                nombreCliente:
                  nombreCliente.trim(),

                telefonoCliente:
                  telefonoCliente.replace(
                    /\D/g,
                    ""
                  ),

                origen,

                referenciaCompra:
                  referenciaCompra.trim() ||
                  null,

                planId,

                fechaInicioPrevista:
                  fechaInicioPrevista ||
                  null,

                observacionInterna:
                  observacionInterna.trim() ||
                  null,
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          "No se pudo registrar el seguimiento",
          {
            id: toastId,

            description:
              data?.error ||
              "Inténtalo nuevamente.",
          }
        );

        return;
      }

      toast.success(
        "Cliente registrado",
        {
          id: toastId,

          description:
            "Ahora prepara su protocolo antes de enviar el enlace.",
        }
      );

      router.push(
        `/admin/seguimiento/clientes/${data.seguimiento.id}/preparar`
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

  const planSeleccionado =
    planes.find(
      (plan) =>
        plan.id === planId
    ) || null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

      <form
        onSubmit={crear}
        className="rounded-xl bg-white p-6 shadow"
      >

        <div className="mb-5">

          <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
            Paso 1 de 2
          </p>

          <h2 className="mt-1 text-lg font-semibold text-gray-900">
            Datos del cliente
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Primero registra al cliente y selecciona la plantilla que servirá de base.
          </p>

        </div>


        <div className="grid gap-5 md:grid-cols-2">

          <div>
            <label className="admin-label">
              Nombre del cliente *
            </label>

            <input
              value={nombreCliente}
              onChange={(e) =>
                setNombreCliente(
                  e.target.value
                )
              }
              className="admin-input"
              placeholder="Ej. María Pérez"
              maxLength={120}
              required
            />
          </div>


          <div>
            <label className="admin-label">
              WhatsApp *
            </label>

            <input
              type="tel"
              inputMode="numeric"
              value={telefonoCliente}
              onChange={(e) =>
                setTelefonoCliente(
                  e.target.value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
              className="admin-input"
              placeholder="Ej. 71234567"
              maxLength={8}
              required
            />
          </div>


          <div>
            <label className="admin-label">
              Origen *
            </label>

            <select
              value={origen}
              onChange={(e) =>
                setOrigen(
                  e.target.value as Origen
                )
              }
              className="admin-input"
            >
              <option value="WHATSAPP">
                WhatsApp
              </option>

              <option value="LLAMADA">
                Llamada
              </option>

              <option value="TIENDA">
                Tienda
              </option>

              <option value="OTRO">
                Otro
              </option>
            </select>
          </div>


          <div>
            <label className="admin-label">
              Plantilla de seguimiento *
            </label>

            <select
              value={planId}
              onChange={(e) =>
                setPlanId(
                  e.target.value
                )
              }
              className="admin-input"
              required
            >
              {planes.length === 0 ? (
                <option value="">
                  No hay planes activos
                </option>
              ) : (
                planes.map(
                  (plan) => (
                    <option
                      key={plan.id}
                      value={plan.id}
                    >
                      {plan.nombre} ·{" "}
                      {plan.duracionDias} días
                    </option>
                  )
                )
              )}
            </select>
          </div>


          <div className="md:col-span-2">
            <label className="admin-label">
              Producto o referencia de compra
            </label>

            <input
              value={referenciaCompra}
              onChange={(e) =>
                setReferenciaCompra(
                  e.target.value
                )
              }
              className="admin-input"
              placeholder="Ej. Kit, compra por WhatsApp..."
              maxLength={500}
            />
          </div>


          <div>
            <label className="admin-label">
              Inicio previsto
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
          </div>


          <div className="md:col-span-2">
            <label className="admin-label">
              Nota interna
            </label>

            <textarea
              value={observacionInterna}
              onChange={(e) =>
                setObservacionInterna(
                  e.target.value
                )
              }
              className="admin-input min-h-28 resize-y"
              placeholder="Información interna..."
              maxLength={1500}
            />
          </div>

        </div>


        <div className="mt-6">

          <button
            type="submit"
            disabled={
              procesando ||
              planes.length === 0
            }
            className="admin-btn-primary"
          >
            {procesando
              ? "Registrando..."
              : "Continuar y preparar →"}
          </button>

        </div>

      </form>


      <aside className="space-y-4">

        <div className="rounded-xl border border-violet-100 bg-[#F8F6FF] p-5">

          <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
            Flujo recomendado
          </p>

          <h2 className="mt-2 font-semibold text-gray-900">
            Primero registra, luego prepara
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            El enlace del cliente se mostrará después de revisar su protocolo, peso inicial y protocolos adicionales.
          </p>

        </div>


        {planSeleccionado && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">

            <p className="text-xs font-medium text-gray-500">
              Plantilla seleccionada
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {planSeleccionado.nombre}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {planSeleccionado.duracionDias} días
            </p>

          </div>
        )}

      </aside>

    </div>
  );
}
