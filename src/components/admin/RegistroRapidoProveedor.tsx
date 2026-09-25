"use client";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  toast,
} from "sonner";

import Modal from "@/components/Modal";

import {
  proveedorSchema,
  type ProveedorFormValues,
} from "@/lib/validations/proveedor";


type ProveedorCreado = {
  id: string;
  nombre: string;
  activo: boolean;
};


export default function RegistroRapidoProveedor({
  onClose,
  onCreado,
}: {
  onClose: () => void;
  onCreado: (
    proveedor: ProveedorCreado
  ) => void;
}) {

  const {
    register,
    handleSubmit,

    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm<ProveedorFormValues>({
      resolver:
        zodResolver(
          proveedorSchema
        ),

      defaultValues: {
        nombre: "",
        telefono: "",
        email: "",
        direccion: "",
      },
    });


  async function guardar(
    values: ProveedorFormValues
  ) {

    const toastId =
      toast.loading(
        "Registrando proveedor..."
      );


    try {

      const res =
        await fetch(
          "/api/admin/proveedores",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                values
              ),
          }
        );


      const data =
        await res.json();


      if (!res.ok) {
        throw new Error(
          data.error ||
            "No se pudo registrar el proveedor"
        );
      }


      toast.success(
        "Proveedor registrado correctamente",
        {
          id:
            toastId,
        }
      );


      onCreado({
        id:
          data.id,

        nombre:
          data.nombre,

        activo:
          data.activo,
      });


      onClose();


    } catch (error) {

      toast.error(
        "No se pudo registrar el proveedor",
        {
          id:
            toastId,

          description:
            error instanceof Error
              ? error.message
              : "Inténtalo nuevamente.",
        }
      );
    }
  }


  return (
    <Modal
      title="Nuevo proveedor"
      onClose={
        onClose
      }
    >

      <form
        onSubmit={
          handleSubmit(
            guardar
          )
        }
        className="space-y-4"
      >

        <div>

          <label className="mb-1 block text-sm font-medium">
            Nombre *
          </label>

          <input
            {...register(
              "nombre"
            )}
            className="admin-input w-full"
            placeholder="Nombre del proveedor"
            autoComplete="organization"
          />

          {errors.nombre && (

            <p className="mt-1 text-xs text-red-600">
              {errors.nombre.message}
            </p>

          )}

        </div>


        <div>

          <label className="mb-1 block text-sm font-medium">
            Teléfono
          </label>

          <input
            {...register(
              "telefono"
            )}
            className="admin-input w-full"
            placeholder="Ej. 70000000"
            autoComplete="tel"
          />

          {errors.telefono && (

            <p className="mt-1 text-xs text-red-600">
              {errors.telefono.message}
            </p>

          )}

        </div>


        <div>

          <label className="mb-1 block text-sm font-medium">
            Correo electrónico
          </label>

          <input
            {...register(
              "email"
            )}
            type="email"
            className="admin-input w-full"
            placeholder="proveedor@correo.com"
            autoComplete="email"
          />

          {errors.email && (

            <p className="mt-1 text-xs text-red-600">
              {errors.email.message}
            </p>

          )}

        </div>


        <div>

          <label className="mb-1 block text-sm font-medium">
            Dirección
          </label>

          <input
            {...register(
              "direccion"
            )}
            className="admin-input w-full"
            placeholder="Dirección del proveedor"
            autoComplete="street-address"
          />

          {errors.direccion && (

            <p className="mt-1 text-xs text-red-600">
              {errors.direccion.message}
            </p>

          )}

        </div>


        <div className="flex gap-3 pt-2">

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              isSubmitting
            }
            className="flex-1 rounded-xl border px-4 py-3 text-sm font-semibold"
          >
            Cancelar
          </button>


          <button
            type="submit"
            disabled={
              isSubmitting
            }
            className="admin-btn-primary flex-1"
          >
            {isSubmitting
              ? "Guardando..."
              : "Guardar proveedor"}
          </button>

        </div>

      </form>

    </Modal>
  );
}
