"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  UserPlus,
} from "lucide-react";

import { toast } from "sonner";
import Modal from "@/components/Modal";

export default function AgregarParticipanteGrupo({
  grupoId,
  abrirAutomatico = false,
  modoFlujo = false,
}: {
  grupoId: string;
  abrirAutomatico?: boolean;
  modoFlujo?: boolean;
}) {
  const router =
    useRouter();

  const [
    abierto,
    setAbierto,
  ] = useState(false);

  const [
    nombreCliente,
    setNombreCliente,
  ] = useState("");

  const [
    telefonoCliente,
    setTelefonoCliente,
  ] = useState("");

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    enlaceCreado,
    setEnlaceCreado,
  ] = useState<string | null>(
    null
  );

  const [
    nombreCreado,
    setNombreCreado,
  ] = useState("");

  const [
    copiado,
    setCopiado,
  ] = useState(false);

  useEffect(() => {
    if (
      abrirAutomatico
    ) {
      setNombreCliente("");
      setTelefonoCliente("");
      setEnlaceCreado(null);
      setNombreCreado("");
      setCopiado(false);
      setAbierto(true);
    }
  }, [
    abrirAutomatico,
  ]);

  function limpiar() {
    setNombreCliente("");
    setTelefonoCliente("");
  }

  function abrir() {
    limpiar();
    setEnlaceCreado(null);
    setNombreCreado("");
    setCopiado(false);
    setAbierto(true);
  }

  async function guardar(
    event: FormEvent
  ) {
    event.preventDefault();

    const nombre =
      nombreCliente.trim();

    const telefono =
      telefonoCliente.replace(
        /\D/g,
        ""
      );

    if (!nombre) {
      toast.error(
        "Escribe el nombre del participante."
      );
      return;
    }

    if (
      !/^[0-9]{8}$/.test(
        telefono
      )
    ) {
      toast.error(
        "El WhatsApp debe contener exactamente 8 números."
      );
      return;
    }

    setGuardando(true);

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/grupos/${grupoId}/miembros`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                nombreCliente:
                  nombre,

                telefonoCliente:
                  telefono,
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          data?.error ||
            "No se pudo agregar el participante."
        );
        return;
      }

      const url =
        `${window.location.origin}/seguimiento/${data.token}`;

      setNombreCreado(
        data.seguimiento
          ?.nombreCliente ||
          nombre
      );

      setEnlaceCreado(
        url
      );

      toast.success(
        "Participante agregado al grupo."
      );

      router.refresh();
    } catch {
      toast.error(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function copiar() {
    if (!enlaceCreado) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        enlaceCreado
      );

      setCopiado(true);

      toast.success(
        "Enlace copiado."
      );

      window.setTimeout(
        () =>
          setCopiado(
            false
          ),
        1800
      );
    } catch {
      toast.error(
        "No se pudo copiar el enlace."
      );
    }
  }

  function agregarOtro() {
    limpiar();
    setEnlaceCreado(null);
    setNombreCreado("");
    setCopiado(false);
  }

  function cerrar() {
    if (guardando) {
      return;
    }

    setAbierto(false);
    setEnlaceCreado(null);
    setNombreCreado("");

    if (
      modoFlujo
    ) {
      router.replace(
        `/admin/seguimiento/grupos/${grupoId}?paso=revisar`
      );
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={
          abrir
        }
        className="admin-btn-primary inline-flex items-center gap-2"
      >
        <UserPlus className="h-4 w-4" />
        Agregar participante
      </button>

      {abierto && (
        <Modal
          title={
            enlaceCreado
              ? "Participante agregado"
              : "Agregar participante"
          }
          onClose={
            cerrar
          }
          maxWidthClassName="max-w-lg"
        >
          {enlaceCreado ? (
            <div className="space-y-5">

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <Check className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900">
                      {nombreCreado}
                    </p>

                    <p className="mt-0.5 text-sm text-gray-600">
                      Ya forma parte del grupo.
                    </p>
                  </div>

                </div>

              </div>


              <div>

                <p className="text-sm font-semibold text-gray-700">
                  Enlace personal de seguimiento
                </p>

                <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3">

                  <p className="break-all text-xs leading-5 text-gray-600">
                    {enlaceCreado}
                  </p>

                </div>

              </div>


              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={
                    copiar
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50"
                >
                  {copiado ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}

                  {copiado
                    ? "Copiado"
                    : "Copiar enlace"}
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Hola ${nombreCreado}, este es tu enlace personal de seguimiento DioxiLife:\n\n${enlaceCreado}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Enviar por WhatsApp
                </a>

              </div>


              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={
                    agregarOtro
                  }
                  className="rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50"
                >
                  + Agregar otro
                </button>

                <button
                  type="button"
                  onClick={
                    cerrar
                  }
                  className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white"
                >
                  {modoFlujo
                    ? "Continuar"
                    : "Listo"}
                </button>

              </div>

            </div>
          ) : (
            <form
              onSubmit={
                guardar
              }
              className="space-y-5"
            >

              <div className="rounded-xl bg-violet-50 px-4 py-3 text-sm leading-6 text-violet-800">
                Se copiará automáticamente el protocolo común del grupo y el participante quedará sincronizado con el día actual del grupo.
              </div>


              <div>

                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Nombre completo *
                </label>

                <input
                  value={
                    nombreCliente
                  }
                  onChange={(
                    event
                  ) =>
                    setNombreCliente(
                      event.target
                        .value
                    )
                  }
                  maxLength={
                    120
                  }
                  placeholder="Nombre del participante"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />

              </div>


              <div>

                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  WhatsApp *
                </label>

                <div className="flex overflow-hidden rounded-xl border border-gray-300 bg-white focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">

                  <div className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-500">
                    +591
                  </div>

                  <input
                    inputMode="numeric"
                    value={
                      telefonoCliente
                    }
                    onChange={(
                      event
                    ) =>
                      setTelefonoCliente(
                        event.target.value.replace(
                          /\D/g,
                          ""
                        ).slice(
                          0,
                          8
                        )
                      )
                    }
                    maxLength={
                      8
                    }
                    placeholder="70000000"
                    className="min-w-0 flex-1 px-3.5 py-3 text-sm outline-none"
                  />

                </div>

              </div>


              <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  disabled={
                    guardando
                  }
                  onClick={
                    cerrar
                  }
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    guardando
                  }
                  className="admin-btn-primary"
                >
                  {guardando
                    ? "Agregando..."
                    : "Agregar participante"}
                </button>

              </div>

            </form>
          )}
        </Modal>
      )}
    </>
  );
}
