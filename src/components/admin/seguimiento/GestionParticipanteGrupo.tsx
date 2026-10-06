"use client";

import {
  useState,
} from "react";

import {
  UserMinus,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import { toast } from "sonner";

type EstadoGrupo =
  | "BORRADOR"
  | "ACTIVO"
  | "FINALIZADO"
  | "CANCELADO";

export default function GestionParticipanteGrupo({
  grupoId,
  miembroId,
  nombre,
  estadoGrupo,
  estadoMiembro,
  programado = false,
}: {
  grupoId: string;
  miembroId: string;
  nombre: string;
  estadoGrupo: EstadoGrupo;
  estadoMiembro:
    | "ACTIVO"
    | "RETIRADO";
  programado?: boolean;
}) {
  const router =
    useRouter();

  const [
    confirmando,
    setConfirmando,
  ] = useState(false);

  const [
    procesando,
    setProcesando,
  ] = useState(false);

  if (
    estadoMiembro !==
      "ACTIVO" ||
    estadoGrupo ===
      "FINALIZADO" ||
    estadoGrupo ===
      "CANCELADO"
  ) {
    return null;
  }

  const quitar =
    estadoGrupo ===
      "BORRADOR" ||
    programado;

  const accion =
    quitar
      ? "Quitar"
      : "Retirar";

  async function ejecutar() {
    if (procesando) {
      return;
    }

    setProcesando(true);

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/grupos/${grupoId}/miembros/${miembroId}`,
          {
            method:
              "PATCH",
          }
        );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        toast.error(
          data?.error ||
            "No se pudo actualizar el participante."
        );

        return;
      }

      toast.success(
        data?.eliminado
          ? "Participante quitado del grupo."
          : "Participante retirado del grupo."
      );

      setConfirmando(
        false
      );

      router.refresh();
    } catch {
      toast.error(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setProcesando(
        false
      );
    }
  }

  if (confirmando) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">

        <span className="text-xs font-medium text-gray-500">
          ¿{accion} a {nombre}?
        </span>

        <button
          type="button"
          disabled={procesando}
          onClick={() =>
            void ejecutar()
          }
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {procesando
            ? "Procesando..."
            : "Confirmar"}
        </button>

        <button
          type="button"
          disabled={procesando}
          onClick={() =>
            setConfirmando(
              false
            )
          }
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
          aria-label="Cancelar"
        >
          <X className="h-4 w-4" />
        </button>

      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        setConfirmando(
          true
        )
      }
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 transition hover:text-red-700"
    >
      <UserMinus className="h-4 w-4" />

      {accion}
    </button>
  );
}
