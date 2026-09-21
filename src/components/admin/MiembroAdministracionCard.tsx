"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  toast,
} from "sonner";

import {
  Ban,
  CheckCircle2,
  Copy,
  Link2,
  PauseCircle,
  ShieldCheck,
} from "lucide-react";


type EstadoMiembro =
  | "ACTIVO"
  | "INACTIVO"
  | "SUSPENDIDO";


type Props = {
  miembroId: string;
  estado: EstadoMiembro;
  codigoReferido: string;
  puedeGestionar: boolean;
};


function estiloEstado(
  estado: EstadoMiembro
) {
  switch (estado) {

    case "ACTIVO":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";

    case "SUSPENDIDO":
      return "bg-orange-50 text-orange-700 border-orange-100";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}


function textoEstado(
  estado: EstadoMiembro
) {
  switch (estado) {

    case "ACTIVO":
      return "Activo";

    case "INACTIVO":
      return "Inactivo";

    case "SUSPENDIDO":
      return "Suspendido";
  }
}


export default function MiembroAdministracionCard({
  miembroId,
  estado,
  codigoReferido,
  puedeGestionar,
}: Props) {

  const router =
    useRouter();


  const [
    cargando,
    setCargando,
  ] =
    useState(false);


  const [
    origen,
    setOrigen,
  ] =
    useState("");


  useEffect(
    () => {
      setOrigen(
        window.location.origin
      );
    },
    []
  );


  const enlaceRegistro =
    origen
      ? `${origen}/registro?ref=${codigoReferido}`
      : `/registro?ref=${codigoReferido}`;


  async function copiarInvitacion() {

    if (
      estado !==
      "ACTIVO"
    ) {
      toast.error(
        "La invitación solo funciona mientras el miembro esté activo"
      );

      return;
    }


    try {

      await navigator.clipboard.writeText(
        enlaceRegistro
      );

      toast.success(
        "Enlace de invitación copiado"
      );

    } catch {

      toast.error(
        "No se pudo copiar el enlace"
      );
    }
  }


  async function cambiarEstado(
    nuevoEstado: EstadoMiembro
  ) {

    if (
      !puedeGestionar ||
      cargando ||
      nuevoEstado === estado
    ) {
      return;
    }


    const mensajes:
      Record<
        EstadoMiembro,
        string
      > = {
        ACTIVO:
          "¿Activar nuevamente esta cuenta?",

        INACTIVO:
          "¿Desactivar esta cuenta? El miembro no podrá iniciar sesión ni registrar nuevos miembros mientras esté inactivo.",

        SUSPENDIDO:
          "¿Suspender esta cuenta? El miembro no podrá iniciar sesión ni registrar nuevos miembros mientras esté suspendido.",
      };


    if (
      !window.confirm(
        mensajes[
          nuevoEstado
        ]
      )
    ) {
      return;
    }


    setCargando(
      true
    );


    const toastId =
      toast.loading(
        "Actualizando estado..."
      );


    try {

      const respuesta =
        await fetch(
          `/api/admin/multinivel/miembros/${miembroId}/estado`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                estado:
                  nuevoEstado,
              }),
          }
        );


      const data =
        await respuesta.json();


      if (
        !respuesta.ok
      ) {
        throw new Error(
          data.error ||
            "No se pudo actualizar el estado"
        );
      }


      toast.success(
        `Estado cambiado a ${textoEstado(
          nuevoEstado
        )}`,
        {
          id:
            toastId,
        }
      );


      router.refresh();

    } catch (error) {

      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado",
        {
          id:
            toastId,
        }
      );

    } finally {

      setCargando(
        false
      );
    }
  }


  return (
    <section className="grid gap-4 lg:grid-cols-2">

      <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

        <div className="flex items-start justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Estado de la cuenta
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Control de acceso del miembro
              </p>

            </div>

          </div>


          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${estiloEstado(
              estado
            )}`}
          >
            {textoEstado(
              estado
            )}
          </span>

        </div>


        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">

          {estado ===
          "ACTIVO" ? (

            <p className="text-sm leading-6 text-slate-600">
              El miembro puede iniciar sesión, operar su cuenta y utilizar sus enlaces de invitación y venta.
            </p>

          ) : (

            <p className="text-sm leading-6 text-slate-600">
              La cuenta conserva su historial, pero el miembro no puede iniciar sesión ni utilizar su código para incorporar nuevos miembros.
            </p>

          )}

        </div>


        {puedeGestionar ? (

          <div className="mt-4 flex flex-wrap gap-2">

            {estado !==
              "ACTIVO" && (

              <button
                type="button"
                disabled={
                  cargando
                }
                onClick={
                  () =>
                    cambiarEstado(
                      "ACTIVO"
                    )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Activar
              </button>

            )}


            {estado !==
              "INACTIVO" && (

              <button
                type="button"
                disabled={
                  cargando
                }
                onClick={
                  () =>
                    cambiarEstado(
                      "INACTIVO"
                    )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <Ban className="h-4 w-4" />
                Desactivar
              </button>

            )}


            {estado !==
              "SUSPENDIDO" && (

              <button
                type="button"
                disabled={
                  cargando
                }
                onClick={
                  () =>
                    cambiarEstado(
                      "SUSPENDIDO"
                    )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2.5 text-xs font-bold text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
              >
                <PauseCircle className="h-4 w-4" />
                Suspender
              </button>

            )}

          </div>

        ) : (

          <p className="mt-4 text-xs text-slate-400">
            Solo el Super Admin puede modificar el estado de una cuenta.
          </p>

        )}

      </article>


      <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Link2 className="h-5 w-5" />
          </div>

          <div>

            <h2 className="font-bold text-slate-900">
              Invitación de miembro
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              Enlace personal para incorporar personas a su red
            </p>

          </div>

        </div>


        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">

          <p className="break-all font-mono text-xs font-semibold leading-5 text-slate-700">
            {enlaceRegistro}
          </p>

        </div>


        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-xs leading-5 text-slate-400">

            {estado ===
            "ACTIVO"
              ? "Quien se registre mediante este enlace quedará asociado automáticamente a este patrocinador."
              : "El enlace no aceptará nuevos registros mientras la cuenta no esté activa."}

          </p>


          <button
            type="button"
            onClick={
              copiarInvitacion
            }
            disabled={
              estado !==
              "ACTIVO"
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#10182D] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Copy className="h-4 w-4" />
            Copiar invitación
          </button>

        </div>

      </article>

    </section>
  );
}
