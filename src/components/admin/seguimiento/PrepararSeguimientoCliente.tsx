"use client";

import type {
  ReactNode,
} from "react";

import {
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import Modal from "@/components/Modal";

import {
  abrirWhatsApp,
} from "@/lib/whatsapp-cliente";

type IndicacionRevision = {
  id: string;
  hora: string;
  texto: string;
  orden: number;
};

type PrincipalRevision = {
  id: string;
  titulo: string;
  descripcion: string | null;
  hora: string | null;
  diaInicio: number;
  diaFin: number | null;
  indicaciones: IndicacionRevision[];
};

type AdicionalRevision = {
  id: string;
  titulo: string;
  descripcion: string | null;
  hora: string | null;
  diaInicio: number;
  diaFin: number | null;
};

function horaValida(
  hora: string | null
) {
  return Boolean(
    hora &&
      /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
        hora
      )
  );
}

type Props = {
  seguimientoId: string;
  nombreCliente: string;
  nombrePlan: string;
  duracionDias: number;
  pesoInicial: number | null;
  observacionDia1: string | null;
  cantidadPrincipales: number;
  cantidadAdicionales: number;
  tieneTelefono: boolean;
  resumenPrincipales: PrincipalRevision[];
  resumenAdicionales: AdicionalRevision[];
  children: ReactNode;
};

export default function PrepararSeguimientoCliente({
  seguimientoId,
  nombreCliente,
  nombrePlan,
  duracionDias,
  pesoInicial,
  observacionDia1,
  cantidadPrincipales,
  cantidadAdicionales,
  tieneTelefono,
  resumenPrincipales,
  resumenAdicionales,
  children,
}: Props) {
  const router =
    useRouter();

  const [
    peso,
    setPeso,
  ] =
    useState(
      pesoInicial === null
        ? ""
        : String(
            pesoInicial
          )
    );

  const [
    pesoGuardado,
    setPesoGuardado,
  ] =
    useState<number | null>(
      pesoInicial
    );

  const [
    guardandoPeso,
    setGuardandoPeso,
  ] =
    useState(false);

  const [
    finalizando,
    setFinalizando,
  ] =
    useState(false);

  const [
    token,
    setToken,
  ] =
    useState<string | null>(
      null
    );

  const [
    enlace,
    setEnlace,
  ] =
    useState<string | null>(
      null
    );

  const [
    modalExito,
    setModalExito,
  ] =
    useState(false);

  const [
    enviando,
    setEnviando,
  ] =
    useState(false);


  const erroresRevision: string[] = [];

  for (
    const actividad of
    resumenPrincipales
  ) {
    for (
      const indicacion of
      actividad.indicaciones
    ) {
      if (
        !horaValida(
          indicacion.hora
        )
      ) {
        erroresRevision.push(
          `${actividad.titulo}: hay una indicación sin horario válido.`
        );
      }

      if (
        !indicacion.texto.trim()
      ) {
        erroresRevision.push(
          `${actividad.titulo}: hay una indicación vacía.`
        );
      }
    }
  }

  for (
    const actividad of
    resumenAdicionales
  ) {
    if (
      !horaValida(
        actividad.hora
      )
    ) {
      erroresRevision.push(
        `${actividad.titulo}: el protocolo adicional necesita un horario.`
      );
    }
  }

  const actividadesLegacy =
    resumenPrincipales.filter(
      (actividad) =>
        actividad.indicaciones.length ===
          0 &&
        Boolean(
          actividad.descripcion?.trim()
        )
    );

  const filasPrincipales =
    resumenPrincipales.flatMap(
      (actividad) => {
        if (
          actividad.indicaciones.length >
          0
        ) {
          return actividad.indicaciones.map(
            (indicacion) => ({
              id:
                `${actividad.id}-${indicacion.id}`,

              hora:
                indicacion.hora,

              titulo:
                actividad.titulo,

              texto:
                indicacion.texto,

              diaInicio:
                actividad.diaInicio,

              diaFin:
                actividad.diaFin,
            })
          );
        }

        return [
          {
            id:
              `${actividad.id}-legacy`,

            hora:
              actividad.hora,

            titulo:
              actividad.titulo,

            texto:
              actividad.descripcion ||
              "",

            diaInicio:
              actividad.diaInicio,

            diaFin:
              actividad.diaFin,
          },
        ];
      }
    )
    .filter(
      (fila) =>
        Boolean(
          fila.texto.trim()
        ) ||
        Boolean(
          fila.titulo.trim()
        )
    )
    .sort(
      (a, b) => {
        if (
          a.hora &&
          b.hora
        ) {
          return a.hora.localeCompare(
            b.hora
          );
        }

        if (a.hora) {
          return -1;
        }

        if (b.hora) {
          return 1;
        }

        return a.titulo.localeCompare(
          b.titulo
        );
      }
    );

  const filasAdicionales =
    [...resumenAdicionales].sort(
      (a, b) => {
        if (
          a.hora &&
          b.hora
        ) {
          return a.hora.localeCompare(
            b.hora
          );
        }

        if (a.hora) {
          return -1;
        }

        if (b.hora) {
          return 1;
        }

        return a.titulo.localeCompare(
          b.titulo
        );
      }
    );

  const revisionValida =
    erroresRevision.length ===
    0;


  async function guardarPeso() {
    if (guardandoPeso) {
      return;
    }

    setGuardandoPeso(
      true
    );

    const toastId =
      toast.loading(
        "Guardando peso inicial..."
      );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/registro-diario/1`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                peso:
                  peso.trim() ||
                  null,

                observacion:
                  observacionDia1,
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(
            () => null
          );

      if (!res.ok) {
        toast.error(
          "No se pudo guardar el peso",
          {
            id: toastId,

            description:
              data?.error ||
              "Revisa el dato ingresado.",
          }
        );

        return;
      }

      const valor =
        peso.trim()
          ? Number(
              peso
                .replace(
                  ",",
                  "."
                )
            )
          : null;

      setPesoGuardado(
        valor
      );

      toast.success(
        valor === null
          ? "Peso inicial pendiente"
          : "Peso inicial guardado",
        {
          id: toastId,
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
      setGuardandoPeso(
        false
      );
    }
  }


  async function finalizarPreparacion() {
    if (finalizando) {
      return;
    }

    if (
      !revisionValida
    ) {
      toast.error(
        "La revisión todavía tiene pendientes",
        {
          description:
            erroresRevision[0] ||
            "Revisa el protocolo antes de finalizar.",
        }
      );

      return;
    }

    if (
      token &&
      enlace
    ) {
      setModalExito(
        true
      );
      return;
    }

    setFinalizando(
      true
    );

    const toastId =
      toast.loading(
        "Finalizando preparación..."
      );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/finalizar-preparacion`,
          {
            method:
              "POST",
          }
        );

      const data =
        await res
          .json()
          .catch(
            () => null
          );

      if (!res.ok) {
        toast.error(
          "No se pudo finalizar la preparación",
          {
            id: toastId,

            description:
              data?.error ||
              "Inténtalo nuevamente.",
          }
        );

        return;
      }

      const nuevoToken =
        String(
          data?.token ||
          ""
        );

      if (!nuevoToken) {
        throw new Error(
          "No se recibió el enlace del seguimiento."
        );
      }

      const nuevoEnlace =
        `${window.location.origin}/seguimiento/${nuevoToken}`;

      setToken(
        nuevoToken
      );

      setEnlace(
        nuevoEnlace
      );

      setModalExito(
        true
      );

      toast.success(
        "Seguimiento preparado",
        {
          id: toastId,

          description:
            "El enlace privado ya está listo.",
        }
      );

    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo finalizar la preparación.",
        {
          id: toastId,
        }
      );

    } finally {
      setFinalizando(
        false
      );
    }
  }


  async function copiarEnlace() {
    if (!enlace) {
      return;
    }

    try {
      await navigator
        .clipboard
        .writeText(
          enlace
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


  async function enviarWhatsApp() {
    if (
      !token ||
      enviando
    ) {
      return;
    }

    setEnviando(
      true
    );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/enviar-whatsapp`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                token,
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(
            () => null
          );

      if (!res.ok) {
        throw new Error(
          data?.error ||
          "No se pudo preparar el WhatsApp."
        );
      }

      abrirWhatsApp(
        data.telefono,
        data.mensaje
      );

      toast.success(
        "WhatsApp listo y registrado"
      );

    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo preparar WhatsApp."
      );

    } finally {
      setEnviando(
        false
      );
    }
  }


  function cerrarModal() {
    setModalExito(
      false
    );

    router.push(
      `/admin/seguimiento/clientes/${seguimientoId}`
    );
  }


  return (
    <div className="space-y-4">

      <section className="overflow-hidden rounded-xl bg-white shadow">

        <div className="border-b border-gray-100 p-5">

          <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
            Paso 2 de 2
          </p>

          <h2 className="mt-1 text-xl font-semibold text-gray-900">
            Personalizar protocolo
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Revisa el protocolo antes de generar el acceso del cliente.
          </p>

        </div>


        <div className="grid gap-3 p-5 sm:grid-cols-2">

          <div className="rounded-xl bg-gray-50 p-4">

            <p className="text-xs text-gray-500">
              Cliente
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {nombreCliente}
            </p>

          </div>


          <div className="rounded-xl bg-gray-50 p-4">

            <p className="text-xs text-gray-500">
              Plan
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {nombrePlan}
            </p>

            <p className="mt-0.5 text-xs text-gray-500">
              {duracionDias} días
            </p>

          </div>

        </div>

      </section>


      <section className="rounded-xl bg-white p-5 shadow">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
            1
          </div>


          <div className="min-w-0 flex-1">

            <h2 className="font-semibold text-gray-900">
              Peso inicial
            </h2>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              Es opcional. Si no lo registras ahora, el primer peso ingresado posteriormente será tomado como peso inicial.
            </p>


            <div className="mt-4 flex max-w-sm items-end gap-2">

              <div className="flex-1">

                <label className="admin-label">
                  Peso inicial (kg)
                </label>

                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    peso
                  }
                  onChange={(e) =>
                    setPeso(
                      e.target
                        .value
                    )
                  }
                  className="admin-input"
                  placeholder="Ej. 86.0"
                />

              </div>


              <button
                type="button"
                disabled={
                  guardandoPeso
                }
                onClick={() =>
                  void guardarPeso()
                }
                className="admin-btn-primary disabled:opacity-60"
              >
                {guardandoPeso
                  ? "Guardando..."
                  : "Guardar"}
              </button>

            </div>


            <p className="mt-2 text-xs text-gray-500">
              {pesoGuardado ===
              null
                ? "Peso inicial aún no registrado."
                : `Peso inicial registrado: ${pesoGuardado} kg`}
            </p>

          </div>

        </div>

      </section>


      {children}


      <section className="rounded-xl bg-white p-5 shadow">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 font-bold text-green-700">
            4
          </div>


          <div className="min-w-0 flex-1">

            <h2 className="font-semibold text-gray-900">
              Revisar y finalizar
            </h2>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              Verifica el resumen antes de generar el enlace privado.
            </p>


            <div className="mt-4 grid gap-2 sm:grid-cols-3">

              <div className="rounded-xl bg-gray-50 p-3">

                <p className="text-xs text-gray-500">
                  Peso inicial
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {pesoGuardado ===
                  null
                    ? "Pendiente"
                    : `${pesoGuardado} kg`}
                </p>

              </div>


              <div className="rounded-xl bg-blue-50 p-3">

                <p className="text-xs text-blue-700">
                  Principal
                </p>

                <p className="mt-1 font-semibold text-blue-900">
                  {cantidadPrincipales} actividades
                </p>

              </div>


              <div className="rounded-xl bg-purple-50 p-3">

                <p className="text-xs text-purple-700">
                  Adicionales
                </p>

                <p className="mt-1 font-semibold text-purple-900">
                  {cantidadAdicionales} protocolos
                </p>

              </div>

            </div>


            <div className="mt-5 space-y-4">

              <div
                className={`rounded-xl border p-4 ${
                  revisionValida
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-red-200 bg-red-50"
                }`}
              >

                <p
                  className={`text-sm font-semibold ${
                    revisionValida
                      ? "text-emerald-800"
                      : "text-red-800"
                  }`}
                >
                  {revisionValida
                    ? "✓ Protocolo listo para finalizar"
                    : "Hay datos pendientes antes de finalizar"}
                </p>


                {erroresRevision.length >
                  0 && (

                  <div className="mt-2 space-y-1">

                    {erroresRevision.map(
                      (
                        error,
                        indice
                      ) => (

                      <p
                        key={`${error}-${indice}`}
                        className="text-xs leading-5 text-red-700"
                      >
                        • {error}
                      </p>

                    ))}

                  </div>

                )}


                {actividadesLegacy.length >
                  0 && (

                  <p className="mt-2 text-xs leading-5 text-amber-700">
                    {actividadesLegacy.length} actividad
                    {actividadesLegacy.length ===
                    1
                      ? ""
                      : "es"} todavía utiliza
                    {actividadesLegacy.length ===
                    1
                      ? ""
                      : "n"} la descripción antigua. Puede finalizarse, pero conviene convertirla a indicaciones con horario.
                  </p>

                )}

              </div>


              <div className="overflow-hidden rounded-xl border border-gray-200">

                <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">

                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
                    Vista previa del protocolo principal
                  </p>

                </div>


                <div className="divide-y divide-gray-100">

                  {filasPrincipales.map(
                    (fila) => (

                    <div
                      key={
                        fila.id
                      }
                      className="flex gap-3 px-4 py-3"
                    >

                      <div className="w-14 shrink-0">

                        <span className="inline-flex rounded-lg bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">
                          {fila.hora ||
                            "—"}
                        </span>

                      </div>


                      <div className="min-w-0 flex-1">

                        <p className="text-sm font-semibold text-gray-900">
                          {fila.titulo}
                        </p>

                        {fila.texto && (

                          <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-gray-600">
                            {fila.texto}
                          </p>

                        )}


                        <p className="mt-1 text-[11px] text-gray-400">
                          Día {fila.diaInicio}
                          {fila.diaFin &&
                          fila.diaFin !==
                            fila.diaInicio
                            ? ` al ${fila.diaFin}`
                            : ""}
                        </p>

                      </div>

                    </div>

                  ))}


                  {filasPrincipales.length ===
                    0 && (

                    <div className="px-4 py-5 text-sm text-gray-500">
                      No hay actividades principales para mostrar.
                    </div>

                  )}

                </div>

              </div>


              {filasAdicionales.length >
                0 && (

                <div className="overflow-hidden rounded-xl border border-purple-200">

                  <div className="border-b border-purple-100 bg-purple-50 px-4 py-3">

                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-purple-700">
                      Protocolos adicionales
                    </p>

                  </div>


                  <div className="divide-y divide-purple-100">

                    {filasAdicionales.map(
                      (actividad) => (

                      <div
                        key={
                          actividad.id
                        }
                        className="flex gap-3 px-4 py-3"
                      >

                        <div className="w-14 shrink-0">

                          <span className="inline-flex rounded-lg bg-purple-50 px-2 py-1 text-xs font-bold text-purple-700">
                            {actividad.hora ||
                              "—"}
                          </span>

                        </div>


                        <div className="min-w-0 flex-1">

                          <p className="text-sm font-semibold text-gray-900">
                            {actividad.titulo}
                          </p>

                          {actividad.descripcion && (

                            <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-gray-600">
                              {actividad.descripcion}
                            </p>

                          )}


                          <p className="mt-1 text-[11px] text-gray-400">
                            Desde día {actividad.diaInicio}
                            {actividad.diaFin
                              ? ` hasta día ${actividad.diaFin}`
                              : " hasta finalizar el seguimiento"}
                          </p>

                        </div>

                      </div>

                    ))}

                  </div>

                </div>

              )}

            </div>


            <button
              type="button"
              disabled={
                finalizando ||
                !revisionValida
              }
              onClick={() =>
                void finalizarPreparacion()
              }
              className="admin-btn-primary mt-5 w-full py-3 disabled:opacity-60 sm:w-auto"
            >
              {finalizando
                ? "Finalizando..."
                : token
                ? "Ver enlace generado"
                : "Finalizar y generar enlace"}
            </button>

          </div>

        </div>

      </section>


      <div className="text-center">

        <Link
          href={`/admin/seguimiento/clientes/${seguimientoId}`}
          className="text-sm font-medium text-gray-500 underline underline-offset-4 hover:text-gray-800"
        >
          Guardar y continuar después
        </Link>

      </div>


      {modalExito &&
        enlace &&
        token && (

        <Modal
          title="Seguimiento preparado"
          onClose={
            cerrarModal
          }
          maxWidthClassName="max-w-lg"
        >

          <div className="space-y-5">

            <div className="text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-700">
                ✓
              </div>

              <h3 className="mt-3 text-lg font-semibold text-gray-900">
                Preparación finalizada
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                El protocolo de {nombreCliente} está listo para ser enviado.
              </p>

            </div>


            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">

              <div className="grid gap-3 text-sm sm:grid-cols-2">

                <div>

                  <p className="text-xs text-gray-500">
                    Plan
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {nombrePlan}
                  </p>

                </div>


                <div>

                  <p className="text-xs text-gray-500">
                    Duración
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {duracionDias} días
                  </p>

                </div>


                <div>

                  <p className="text-xs text-gray-500">
                    Peso inicial
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {pesoGuardado ===
                    null
                      ? "No registrado"
                      : `${pesoGuardado} kg`}
                  </p>

                </div>


                <div>

                  <p className="text-xs text-gray-500">
                    Protocolo
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {cantidadPrincipales} principales ·{" "}
                    {cantidadAdicionales} adicionales
                  </p>

                </div>

              </div>

            </div>


            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Enlace privado
              </p>

              <div className="mt-2 rounded-xl border border-green-200 bg-green-50 p-3">

                <p className="break-all text-xs leading-5 text-green-800">
                  {enlace}
                </p>

              </div>

            </div>


            {tieneTelefono && (

              <button
                type="button"
                disabled={
                  enviando
                }
                onClick={() =>
                  void enviarWhatsApp()
                }
                className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
              >
                {enviando
                  ? "Preparando WhatsApp..."
                  : "📱 Enviar por WhatsApp"}
              </button>

            )}


            <div className="grid gap-2 sm:grid-cols-2">

              <button
                type="button"
                onClick={() =>
                  void copiarEnlace()
                }
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Copiar enlace
              </button>


              <Link
                href={`/admin/seguimiento/clientes/${seguimientoId}`}
                className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-violet-700 hover:bg-violet-50"
              >
                Ver seguimiento
              </Link>

            </div>


            <button
              type="button"
              onClick={
                cerrarModal
              }
              className="w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              Cerrar
            </button>

          </div>

        </Modal>

      )}

    </div>
  );
}
