"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import NuevaPlantillaModal from "@/components/admin/seguimiento/NuevaPlantillaModal";

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

type ModoPlantilla =
  | "EXISTENTE"
  | "NUEVA";

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

  const [
    planesDisponibles,
    setPlanesDisponibles,
  ] = useState<Plan[]>(planes);

  const [
    modoPlantilla,
    setModoPlantilla,
  ] = useState<ModoPlantilla>(
    planes.length > 0
      ? "EXISTENTE"
      : "NUEVA"
  );

  const [planId, setPlanId] =
    useState(planes[0]?.id || "");

  const [
    nuevaPlantillaAbierta,
    setNuevaPlantillaAbierta,
  ] = useState(false);

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

  async function plantillaCreada(
    valor?: unknown
  ) {
    if (
      !valor ||
      typeof valor !== "object"
    ) {
      router.refresh();
      return;
    }

    const dato =
      valor as {
        id?: unknown;
        nombre?: unknown;
        duracionDias?: unknown;
        estado?: unknown;
      };

    if (
      typeof dato.id !== "string" ||
      typeof dato.nombre !== "string" ||
      typeof dato.duracionDias !== "number"
    ) {
      router.refresh();
      return;
    }

    if (
      typeof dato.estado === "string" &&
      dato.estado !== "ACTIVO"
    ) {
      toast.info(
        "La plantilla fue creada, pero debe estar activa para usarla en un seguimiento."
      );

      router.refresh();
      return;
    }

    const nueva: Plan = {
      id: dato.id,
      nombre: dato.nombre,
      duracionDias:
        dato.duracionDias,
    };

    setPlanesDisponibles(
      (actuales) => {
        const restantes =
          actuales.filter(
            (plan) =>
              plan.id !==
              nueva.id
          );

        return [
          ...restantes,
          nueva,
        ].sort(
          (a, b) =>
            a.nombre.localeCompare(
              b.nombre,
              "es"
            )
        );
      }
    );

    setPlanId(
      nueva.id
    );

    router.refresh();
  }


  const planSeleccionado =
    planesDisponibles.find(
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


          <div className="md:col-span-2">

            <label className="admin-label">
              ¿Cómo quieres preparar el seguimiento?
            </label>

            <div className="mt-2 grid gap-3 md:grid-cols-2">

              <button
                type="button"
                disabled={
                  planesDisponibles.length === 0
                }
                onClick={() => {
                  setModoPlantilla(
                    "EXISTENTE"
                  );

                  setPlanId(
                    planesDisponibles[0]?.id ||
                      ""
                  );
                }}
                className={`rounded-xl border p-4 text-left transition ${
                  modoPlantilla ===
                  "EXISTENTE"
                    ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                    : "border-gray-200 bg-white hover:border-violet-200"
                } ${
                  planesDisponibles.length ===
                  0
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >

                <div className="flex items-start gap-3">

                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      modoPlantilla ===
                      "EXISTENTE"
                        ? "border-violet-600"
                        : "border-gray-300"
                    }`}
                  >
                    {modoPlantilla ===
                      "EXISTENTE" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-violet-600" />
                    )}
                  </span>

                  <div>

                    <p className="font-semibold text-gray-900">
                      Elegir plantilla existente
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Usa una plantilla que ya tienes preparada.
                    </p>

                  </div>

                </div>

              </button>


              <button
                type="button"
                onClick={() => {
                  setModoPlantilla(
                    "NUEVA"
                  );

                  setPlanId("");
                }}
                className={`rounded-xl border p-4 text-left transition ${
                  modoPlantilla ===
                  "NUEVA"
                    ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                    : "border-gray-200 bg-white hover:border-violet-200"
                }`}
              >

                <div className="flex items-start gap-3">

                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      modoPlantilla ===
                      "NUEVA"
                        ? "border-violet-600"
                        : "border-gray-300"
                    }`}
                  >
                    {modoPlantilla ===
                      "NUEVA" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-violet-600" />
                    )}
                  </span>

                  <div>

                    <p className="font-semibold text-gray-900">
                      Crear nueva plantilla
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Crea un nuevo protocolo sin perder los datos del cliente.
                    </p>

                  </div>

                </div>

              </button>

            </div>


            {modoPlantilla ===
              "EXISTENTE" && (

              <div className="mt-4 rounded-xl border border-violet-100 bg-[#FBFAFF] p-4">

                {planesDisponibles.length >
                0 ? (
                  <>

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

                      {planesDisponibles.map(
                        (plan) => (

                          <option
                            key={
                              plan.id
                            }
                            value={
                              plan.id
                            }
                          >
                            {plan.nombre} ·{" "}
                            {plan.duracionDias} días
                          </option>

                        )
                      )}

                    </select>


                    {planSeleccionado && (

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">

                        <span className="rounded-full bg-violet-100 px-2.5 py-1 font-semibold text-violet-700">
                          {planSeleccionado.nombre}
                        </span>

                        <span className="text-gray-500">
                          {planSeleccionado.duracionDias} días
                        </span>

                      </div>

                    )}

                  </>
                ) : (

                  <p className="text-sm text-amber-700">
                    No hay plantillas activas disponibles.
                  </p>

                )}

              </div>

            )}


            {modoPlantilla ===
              "NUEVA" && (

              <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4">

                {planSeleccionado ? (
                  <>

                    <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                      Nueva plantilla seleccionada
                    </p>

                    <p className="mt-2 font-semibold text-gray-900">
                      {planSeleccionado.nombre}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {planSeleccionado.duracionDias} días
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setNuevaPlantillaAbierta(
                          true
                        )
                      }
                      className="mt-4 rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100"
                    >
                      Crear otra plantilla
                    </button>

                  </>
                ) : (
                  <>

                    <p className="font-semibold text-gray-900">
                      Crea la plantilla que necesita este cliente
                    </p>

                    <p className="mt-1 text-sm leading-6 text-gray-500">
                      Los datos que ya escribiste del cliente permanecerán guardados en este formulario.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setNuevaPlantillaAbierta(
                          true
                        )
                      }
                      className="mt-4 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                    >
                      + Crear nueva plantilla
                    </button>

                  </>
                )}

              </div>

            )}

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
              !planId
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


      {nuevaPlantillaAbierta && (

        <NuevaPlantillaModal
          onClose={() =>
            setNuevaPlantillaAbierta(
              false
            )
          }
          onCreada={
            plantillaCreada
          }
        />

      )}

    </div>
  );
}
