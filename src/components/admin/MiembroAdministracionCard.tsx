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
  ExternalLink,
  LogIn,
  MessageCircle,
  PauseCircle,
  RefreshCw,
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
  activado: boolean;
  fechaActivacion: string | null;
  tokenActivacionExpira: string | null;
  telefono: string | null;
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


function formatearFecha(
  valor: string
) {
  return new Date(
    valor
  ).toLocaleString(
    "es-BO",
    {
      timeZone:
        "America/La_Paz",

      day:
        "2-digit",

      month:
        "long",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  );
}


export default function MiembroAdministracionCard({
  miembroId,
  estado,
  codigoReferido,
  activado,
  fechaActivacion,
  tokenActivacionExpira,
  telefono,
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
    generando,
    setGenerando,
  ] =
    useState(false);


  const [
    origen,
    setOrigen,
  ] =
    useState("");


  const [
    enlaceActivacion,
    setEnlaceActivacion,
  ] =
    useState("");


  const [
    expira,
    setExpira,
  ] =
    useState(
      tokenActivacionExpira
    );


  useEffect(
    () => {
      setOrigen(
        window.location.origin
      );
    },
    []
  );


  const enlaceLogin =
    origen
      ? `${origen}/login-miembro`
      : "/login-miembro";


  async function copiar(
    texto: string,
    mensaje: string
  ) {
    try {

      await navigator.clipboard.writeText(
        texto
      );

      toast.success(
        mensaje
      );

    } catch {

      toast.error(
        "No se pudo copiar el enlace"
      );
    }
  }


  async function generarEnlace() {

    if (
      !puedeGestionar ||
      generando ||
      activado
    ) {
      return;
    }


    if (
      !window.confirm(
        "Se invalidará cualquier enlace de activación anterior. ¿Generar uno nuevo?"
      )
    ) {
      return;
    }


    setGenerando(
      true
    );


    const toastId =
      toast.loading(
        "Generando enlace..."
      );


    try {

      const respuesta =
        await fetch(
          `/api/admin/multinivel/miembros/${miembroId}/activacion`,
          {
            method:
              "POST",
          }
        );


      const data =
        await respuesta.json();


      if (!respuesta.ok) {
        throw new Error(
          data.error ||
            "No se pudo generar el enlace"
        );
      }


      const nuevoEnlace =
        `${window.location.origin}${data.activacion.ruta}`;


      setEnlaceActivacion(
        nuevoEnlace
      );

      setExpira(
        data.activacion.expira
      );


      toast.success(
        "Nuevo enlace generado",
        {
          id:
            toastId,
        }
      );

    } catch (error) {

      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo generar el enlace",
        {
          id:
            toastId,
        }
      );

    } finally {

      setGenerando(
        false
      );
    }
  }


  function enviarActivacionWhatsapp() {

    if (!enlaceActivacion) {
      return;
    }


    let numero =
      String(
        telefono || ""
      ).replace(
        /\D/g,
        ""
      );


    if (
      /^[67]\d{7}$/.test(
        numero
      )
    ) {
      numero =
        `591${numero}`;
    }


    const mensaje =
      [
        "Hola.",
        "",
        "Tu cuenta de distribuidor DioxiLife está lista para ser activada.",
        "Crea tu contraseña personal ingresando aquí:",
        "",
        enlaceActivacion,
        "",
        "Este enlace es personal y vence en 48 horas.",
      ].join("\n");


    const destino =
      numero
        ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
        : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;


    window.open(
      destino,
      "_blank",
      "noopener,noreferrer"
    );
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


      if (!respuesta.ok) {
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
                Control administrativo del miembro
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
            "ACTIVO" &&
          activado ? (

            <p className="text-sm leading-6 text-slate-600">
              El miembro está habilitado y puede iniciar sesión en su panel de distribuidor.
            </p>

          ) : estado ===
              "ACTIVO" &&
            !activado ? (

            <p className="text-sm leading-6 text-slate-600">
              El miembro está habilitado administrativamente, pero todavía debe activar su acceso y crear su contraseña.
            </p>

          ) : (

            <p className="text-sm leading-6 text-slate-600">
              La cuenta conserva su historial, pero el miembro no puede iniciar sesión ni operar mientras mantenga este estado.
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

        <div className="flex items-start justify-between gap-3">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <LogIn className="h-5 w-5" />
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Acceso del distribuidor
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Activación e ingreso a su panel personal
              </p>

            </div>

          </div>


          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
              activado
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-amber-100 bg-amber-50 text-amber-700"
            }`}
          >
            {activado
              ? "Activada"
              : "Pendiente"}
          </span>

        </div>


        {activado ? (

          <div className="mt-5">

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Login de distribuidor
              </p>

              <p className="mt-2 break-all font-mono text-xs font-semibold leading-5 text-slate-700">
                {enlaceLogin}
              </p>

            </div>


            {fechaActivacion && (

              <p className="mt-3 text-xs leading-5 text-slate-400">
                Cuenta activada el{" "}
                {formatearFecha(
                  fechaActivacion
                )}
              </p>

            )}


            <div className="mt-4 flex flex-wrap gap-2">

              <button
                type="button"
                onClick={
                  () =>
                    copiar(
                      enlaceLogin,
                      "Enlace de login copiado"
                    )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Copy className="h-4 w-4" />
                Copiar login
              </button>


              <a
                href={
                  enlaceLogin
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#10182D] px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir login
              </a>

            </div>

          </div>

        ) : (

          <div className="mt-5">

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">

              <p className="text-sm font-semibold text-amber-900">
                El distribuidor todavía no creó su contraseña.
              </p>

              {expira && (

                <p className="mt-2 text-xs leading-5 text-amber-700">
                  El último enlace generado vence el{" "}
                  {formatearFecha(
                    expira
                  )}.
                </p>

              )}

              <p className="mt-2 text-xs leading-5 text-amber-700">
                Por seguridad, un enlace anterior no puede volver a mostrarse. Si necesitas reenviarlo, genera uno nuevo.
              </p>

            </div>


            {enlaceActivacion && (

              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">

                <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                  Nuevo enlace de activación
                </p>

                <p className="mt-2 break-all font-mono text-xs leading-5 text-blue-700">
                  {enlaceActivacion}
                </p>

              </div>

            )}


            <div className="mt-4 flex flex-wrap gap-2">

              <button
                type="button"
                disabled={
                  !puedeGestionar ||
                  generando
                }
                onClick={
                  generarEnlace
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#10182D] px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    generando
                      ? "animate-spin"
                      : ""
                  }`}
                />

                {generando
                  ? "Generando..."
                  : "Generar nuevo enlace"}
              </button>


              {enlaceActivacion && (

                <>
                  <button
                    type="button"
                    onClick={
                      () =>
                        copiar(
                          enlaceActivacion,
                          "Enlace de activación copiado"
                        )
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar
                  </button>


                  <button
                    type="button"
                    onClick={
                      enviarActivacionWhatsapp
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </button>
                </>

              )}

            </div>


            {!puedeGestionar && (

              <p className="mt-3 text-xs text-slate-400">
                Solo el Super Admin puede generar enlaces de activación.
              </p>

            )}

          </div>

        )}

        <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
          Código de distribuidor:{" "}
          <span className="font-mono font-bold text-slate-600">
            {codigoReferido}
          </span>
        </p>

      </article>

    </section>
  );
}
