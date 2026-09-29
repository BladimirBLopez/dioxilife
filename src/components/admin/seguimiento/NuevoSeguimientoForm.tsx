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

  const [
    enlaceTemporal,
    setEnlaceTemporal,
  ] = useState<string | null>(null);

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

    if (!/^[0-9]{8}$/.test(telefonoCliente)) {
      toast.error(
        "El WhatsApp debe tener exactamente 8 números."
      );

      return;
    }

    setProcesando(true);

    const toastId =
      toast.loading(
        "Creando seguimiento..."
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
                  telefonoCliente.replace(/\D/g, ""),

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
          "No se pudo crear el seguimiento",
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
        "Seguimiento creado correctamente",
        {
          id: toastId,

          description:
            "El enlace privado ya está listo.",
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

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

      <form
        onSubmit={crear}
        className="rounded-xl bg-white p-6 shadow"
      >

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
                  e.target.value.replace(/\D/g, "")
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
              Plan de seguimiento *
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
                      {plan.nombre} · {plan.duracionDias} días
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
              placeholder="Ej. Kit CDS, compra por WhatsApp..."
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
              ? "Creando..."
              : "Crear seguimiento"}
          </button>

        </div>

      </form>


      <aside className="space-y-4">

        <div className="rounded-xl border border-violet-100 bg-[#F8F6FF] p-5">

          <h2 className="font-semibold text-gray-900">
            Registro rápido
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            No necesitas crear un pedido. Registra al cliente, elige su plan y genera su enlace privado.
          </p>

        </div>


        {enlaceTemporal && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5">

            <p className="font-semibold text-green-800">
              Enlace privado listo
            </p>

            <p className="mt-2 text-xs leading-5 text-green-700">
              Copia este enlace antes de salir de la página.
            </p>

            <button
              type="button"
              onClick={() =>
                void copiarEnlace()
              }
              className="mt-4 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Copiar enlace
            </button>

          </div>
        )}

      </aside>

    </div>
  );
}
