"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  toast,
} from "sonner";

import {
  proveedorSchema,
  type ProveedorFormValues,
} from "@/lib/validations/proveedor";


type Proveedor = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  activo: boolean;
};


export default function ProveedoresPage() {

  const [
    proveedores,
    setProveedores,
  ] =
    useState<Proveedor[]>([]);




  const {
    register,
    handleSubmit,
    reset,

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


  async function cargar() {

    const res =
      await fetch(
        "/api/admin/proveedores"
      );


    const data =
      await res.json();


    setProveedores(
      data
    );
  }


  useEffect(
    () => {
      cargar();
    },
    []
  );


  async function cambiarEstadoProveedor(
    proveedor: Proveedor
  ) {

    const nuevoEstado =
      !proveedor.activo;


    const toastId =
      toast.loading(
        nuevoEstado
          ? "Activando proveedor..."
          : "Desactivando proveedor..."
      );


    try {

      const res =
        await fetch(
          `/api/admin/proveedores/${proveedor.id}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                activo:
                  nuevoEstado,
              }),
          }
        );


      const data =
        await res.json();


      if (!res.ok) {
        throw new Error(
          data.error ||
            "No se pudo actualizar proveedor"
        );
      }


      toast.success(
        nuevoEstado
          ? "Proveedor activado correctamente"
          : "Proveedor desactivado correctamente",
        {
          id:
            toastId,
        }
      );


      await cargar();


    } catch (e) {

      toast.error(
        "No se pudo actualizar el proveedor",
        {
          id:
            toastId,

          description:
            e instanceof Error
              ? e.message
              : "Inténtalo nuevamente.",
        }
      );
    }
  }


  async function registrarProveedor(
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
            "No se pudo registrar proveedor"
        );
      }


      toast.success(
        "Proveedor registrado correctamente",
        {
          id:
            toastId,
        }
      );


      reset();


      await cargar();


    } catch (e) {

      toast.error(
        "No se pudo registrar el proveedor",
        {
          id:
            toastId,

          description:
            e instanceof Error
              ? e.message
              : "Inténtalo nuevamente.",
        }
      );
    }
  }


  return (
    <div className="space-y-6">

      <div>

        <p className="text-xs font-semibold uppercase tracking-wider text-brand-pink">
          Abastecimiento
        </p>

        <h1 className="text-2xl font-bold text-[#1F1B24]">
          Proveedores
        </h1>

        <p className="text-sm text-[#77737D]">
          Administra proveedores para registrar compras.
        </p>

      </div>


      <form
        onSubmit={
          handleSubmit(
            registrarProveedor
          )
        }
        className="admin-card grid gap-4 p-5 md:grid-cols-2"
      >

        <div>

          <input
            {...register(
              "nombre"
            )}
            className="admin-input"
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

          <input
            {...register(
              "telefono"
            )}
            className="admin-input"
            placeholder="Teléfono"
            autoComplete="tel"
          />

          {errors.telefono && (

            <p className="mt-1 text-xs text-red-600">
              {errors.telefono.message}
            </p>

          )}

        </div>


        <div>

          <input
            {...register(
              "email"
            )}
            type="email"
            className="admin-input"
            placeholder="Correo electrónico"
            autoComplete="email"
          />

          {errors.email && (

            <p className="mt-1 text-xs text-red-600">
              {errors.email.message}
            </p>

          )}

        </div>


        <div>

          <input
            {...register(
              "direccion"
            )}
            className="admin-input"
            placeholder="Dirección"
            autoComplete="street-address"
          />

          {errors.direccion && (

            <p className="mt-1 text-xs text-red-600">
              {errors.direccion.message}
            </p>

          )}

        </div>


        <button
          type="submit"
          disabled={
            isSubmitting
          }
          className="admin-btn-primary md:col-span-2"
        >
          {isSubmitting
            ? "Guardando..."
            : "Agregar proveedor"}
        </button>

      </form>


      <div className="admin-card overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-[#F8F8FA] text-xs uppercase">

            <tr>

              <th className="p-4 text-left">
                Nombre
              </th>

              <th className="p-4 text-left">
                Contacto
              </th>

              <th className="p-4 text-left">
                Dirección
              </th>

              <th className="p-4">
                Estado
              </th>

            </tr>

          </thead>


          <tbody>

            {proveedores.map(
              (proveedor) => (

                <tr
                  key={
                    proveedor.id
                  }
                  className="border-t"
                >

                  <td className="p-4 font-medium">
                    {proveedor.nombre}
                  </td>


                  <td className="p-4 text-xs">

                    {proveedor.telefono ||
                      "—"}

                    <br />

                    {proveedor.email ||
                      ""}

                  </td>


                  <td className="p-4 text-xs">
                    {proveedor.direccion ||
                      "—"}
                  </td>


                  <td className="space-y-2 p-4 text-center">

                    <span
                      className={`block rounded-full px-3 py-1 text-xs font-semibold ${
                        proveedor.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {proveedor.activo
                        ? "Activo"
                        : "Inactivo"}
                    </span>


                    <button
                      type="button"
                      onClick={() =>
                        cambiarEstadoProveedor(
                          proveedor
                        )
                      }
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {proveedor.activo
                        ? "Desactivar"
                        : "Activar"}
                    </button>

                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}
