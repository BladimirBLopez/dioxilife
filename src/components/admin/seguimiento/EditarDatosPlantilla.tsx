"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import Modal from "@/components/Modal";

type EstadoPlantilla =
  | "BORRADOR"
  | "ACTIVO"
  | "INACTIVO";

type Props = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracionDias: number;
  estado: string;
};

export default function EditarDatosPlantilla({
  id,
  nombre,
  descripcion,
  duracionDias,
  estado,
}: Props) {
  const router = useRouter();

  const [abierto, setAbierto] =
    useState(false);

  const [guardando, setGuardando] =
    useState(false);

  const estadoInicial: EstadoPlantilla =
    estado === "ACTIVO" ||
    estado === "INACTIVO" ||
    estado === "BORRADOR"
      ? estado
      : "BORRADOR";

  const [form, setForm] =
    useState({
      nombre,
      descripcion:
        descripcion ?? "",
      duracionDias:
        String(duracionDias),
      estado:
        estadoInicial,
    });

  function abrir() {
    setForm({
      nombre,
      descripcion:
        descripcion ?? "",
      duracionDias:
        String(duracionDias),
      estado:
        estadoInicial,
    });

    setAbierto(true);
  }

  async function guardar() {
    if (guardando) {
      return;
    }

    const nombreLimpio =
      form.nombre.trim();

    if (!nombreLimpio) {
      toast.error(
        "El nombre de la plantilla es obligatorio."
      );
      return;
    }

    const dias =
      Number(form.duracionDias);

    if (
      !Number.isInteger(dias) ||
      dias < 1 ||
      dias > 365
    ) {
      toast.error(
        "La duración debe estar entre 1 y 365 días."
      );
      return;
    }

    setGuardando(true);

    const toastId =
      toast.loading(
        "Guardando plantilla..."
      );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/planes/${id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                nombre:
                  nombreLimpio,

                descripcion:
                  form.descripcion
                    .trim() ||
                  null,

                duracionDias:
                  dias,

                estado:
                  form.estado,
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
            "No se pudo guardar la plantilla.",
          {
            id: toastId,
          }
        );

        return;
      }

      toast.success(
        "Datos de la plantilla actualizados.",
        {
          id: toastId,
        }
      );

      setAbierto(false);

      router.refresh();
    } catch {
      toast.error(
        "No se pudo conectar con el servidor.",
        {
          id: toastId,
        }
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="rounded-xl border border-violet-200 bg-white px-3.5 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
      >
        Editar datos generales
      </button>

      {abierto && (
        <Modal
          title="Editar datos de la plantilla"
          onClose={() => {
            if (!guardando) {
              setAbierto(false);
            }
          }}
        >
          <div className="space-y-4">

            <div>
              <label className="admin-label">
                Nombre de la plantilla
              </label>

              <input
                type="text"
                value={form.nombre}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nombre:
                      e.target.value,
                  })
                }
                className="admin-input"
                maxLength={200}
              />
            </div>

            <div>
              <label className="admin-label">
                Descripción
              </label>

              <textarea
                value={
                  form.descripcion
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    descripcion:
                      e.target.value,
                  })
                }
                className="admin-input min-h-28"
                rows={4}
                maxLength={1500}
                placeholder="Descripción de esta plantilla..."
              />
            </div>

            <div>
              <label className="admin-label">
                Duración
              </label>

              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={
                    form.duracionDias
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      duracionDias:
                        e.target.value,
                    })
                  }
                  className="admin-input pr-14"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8790]">
                  días
                </span>
              </div>
            </div>

            <div>
              <label className="admin-label">
                Estado
              </label>

              <select
                value={form.estado}
                onChange={(e) =>
                  setForm({
                    ...form,
                    estado:
                      e.target
                        .value as EstadoPlantilla,
                  })
                }
                className="admin-input"
              >
                <option value="BORRADOR">
                  Borrador
                </option>

                <option value="ACTIVO">
                  Activo
                </option>

                <option value="INACTIVO">
                  Inactivo
                </option>
              </select>

              <p className="mt-2 text-xs leading-5 text-[#8A8790]">
                Cuando termines de personalizar la copia, colócala como activa para poder utilizarla en nuevos seguimientos.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void guardar()
              }
              disabled={guardando}
              className="admin-btn-primary w-full disabled:opacity-50"
            >
              {guardando
                ? "Guardando..."
                : "Guardar cambios"}
            </button>

          </div>
        </Modal>
      )}
    </>
  );
}
