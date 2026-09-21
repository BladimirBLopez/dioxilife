"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  toast,
} from "sonner";

import {
  Save,
  UserRoundPlus,
} from "lucide-react";


type Patrocinador = {
  id: string;
  nombre: string;
  codigoReferido: string;
};


export default function NuevoMiembroForm({
  patrocinadores,
}: {
  patrocinadores: Patrocinador[];
}) {

  const router =
    useRouter();


  const [
    nombres,
    setNombres,
  ] =
    useState("");


  const [
    apellidos,
    setApellidos,
  ] =
    useState("");


  const [
    email,
    setEmail,
  ] =
    useState("");


  const [
    telefono,
    setTelefono,
  ] =
    useState("");


  const [
    password,
    setPassword,
  ] =
    useState("");


  const [
    patrocinadorId,
    setPatrocinadorId,
  ] =
    useState("");


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  async function guardar(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);


    const toastId =
      toast.loading(
        "Creando miembro..."
      );


    try {

      const respuesta =
        await fetch(
          "/api/admin/multinivel/miembros",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                nombres,
                apellidos,
                email,
                telefono,
                password,
                patrocinadorId,
              }),
          }
        );


      const data =
        await respuesta.json();


      if (!respuesta.ok) {
        throw new Error(
          data.error ||
            "No se pudo crear el miembro"
        );
      }


      toast.success(
        "Miembro creado correctamente",
        {
          id:
            toastId,
        }
      );


      router.push(
        `/admin/multinivel/${data.miembro.id}`
      );

      router.refresh();

    } catch (error) {

      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo crear el miembro",
        {
          id:
            toastId,
        }
      );

    } finally {

      setLoading(false);
    }
  }


  return (
    <form
      onSubmit={
        guardar
      }
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >

      <div className="border-b border-slate-100 p-5 md:p-6">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <UserRoundPlus className="h-5 w-5" />
          </div>

          <div>

            <h2 className="font-bold text-slate-900">
              Datos del nuevo miembro
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              La cuenta quedará activa inmediatamente.
            </p>

          </div>

        </div>

      </div>


      <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">

        <div>

          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Nombres *
          </label>

          <input
            type="text"
            value={
              nombres
            }
            onChange={
              (e) =>
                setNombres(
                  e.target.value
                )
            }
            maxLength={120}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            required
          />

        </div>


        <div>

          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Apellidos
          </label>

          <input
            type="text"
            value={
              apellidos
            }
            onChange={
              (e) =>
                setApellidos(
                  e.target.value
                )
            }
            maxLength={120}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          />

        </div>


        <div>

          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Correo electrónico *
          </label>

          <input
            type="email"
            value={
              email
            }
            onChange={
              (e) =>
                setEmail(
                  e.target.value
                )
            }
            maxLength={180}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            required
          />

        </div>


        <div>

          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Teléfono
          </label>

          <input
            type="tel"
            value={
              telefono
            }
            onChange={
              (e) =>
                setTelefono(
                  e.target.value
                )
            }
            maxLength={30}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          />

        </div>


        <div>

          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Contraseña temporal *
          </label>

          <input
            type="password"
            value={
              password
            }
            onChange={
              (e) =>
                setPassword(
                  e.target.value
                )
            }
            minLength={8}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            required
          />

          <p className="mt-1.5 text-xs text-slate-400">
            Mínimo 8 caracteres. Entrégala de forma privada al nuevo miembro.
          </p>

        </div>


        <div>

          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Patrocinador
          </label>

          <select
            value={
              patrocinadorId
            }
            onChange={
              (e) =>
                setPatrocinadorId(
                  e.target.value
                )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          >

            <option value="">
              Sin patrocinador · miembro raíz
            </option>


            {patrocinadores.map(
              (patrocinador) => (

                <option
                  key={
                    patrocinador.id
                  }
                  value={
                    patrocinador.id
                  }
                >
                  {patrocinador.nombre} · {patrocinador.codigoReferido}
                </option>

              )
            )}

          </select>


          <p className="mt-1.5 text-xs text-slate-400">
            Solo el Super Admin puede crear un miembro raíz.
          </p>

        </div>

      </div>


      <div className="flex justify-end border-t border-slate-100 bg-slate-50 p-5 md:px-6">

        <button
          type="submit"
          disabled={
            loading
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#10182D] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Save className="h-4 w-4" />

          {loading
            ? "Creando..."
            : "Crear miembro"}
        </button>

      </div>

    </form>
  );
}
