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
  CheckCircle2,
  Copy,
  MessageCircle,
  Save,
  UserRoundPlus,
} from "lucide-react";


type Patrocinador = {
  id: string;
  nombre: string;
  codigoReferido: string;
};


type ResultadoCreacion = {
  id: string;
  nombre: string;
  email: string;
  codigoReferido: string;
  enlaceActivacion: string;
  expira: string;
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
    direccion,
    setDireccion,
  ] =
    useState("");


  const [
    googleMapsUrl,
    setGoogleMapsUrl,
  ] =
    useState("");


  const [
    esDistribuidorPublico,
    setEsDistribuidorPublico,
  ] =
    useState(false);



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


  const [
    resultado,
    setResultado,
  ] =
    useState<ResultadoCreacion | null>(
      null
    );


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
                direccion,
                googleMapsUrl,
                esDistribuidorPublico,
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


      const nombreCompleto =
        [
          data.miembro.nombres,
          data.miembro.apellidos,
        ]
          .filter(Boolean)
          .join(" ");


      setResultado({
        id:
          data.miembro.id,

        nombre:
          nombreCompleto,

        email:
          data.miembro.email,

        codigoReferido:
          data.miembro.codigoReferido,

        enlaceActivacion:
          `${window.location.origin}${data.activacion.ruta}`,

        expira:
          data.activacion.expira,
      });


      toast.success(
        "Distribuidor creado correctamente",
        {
          id:
            toastId,
        }
      );

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


  const datosResultado =
    resultado;


  if (datosResultado) {

    const copiarEnlace = async () => {
      await navigator.clipboard.writeText(
        datosResultado.enlaceActivacion
      );

      toast.success(
        "Enlace de activación copiado"
      );
    };


    const enviarWhatsapp = () => {

      let numero =
        telefono.replace(
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
          `Hola ${datosResultado.nombre}.`,
          "",
          "Bienvenido a DioxiLife.",
          "Para activar tu cuenta de distribuidor y crear tu contraseña, ingresa al siguiente enlace:",
          "",
          datosResultado.enlaceActivacion,
          "",
          "Este enlace es personal y tiene una vigencia de 48 horas.",
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
    };


    return (
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">

        <div className="border-b border-emerald-100 bg-emerald-50 p-5 md:p-6">

          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>

              <p className="text-sm font-bold text-emerald-700">
                Distribuidor creado correctamente
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {datosResultado.nombre}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Ahora debe activar su cuenta y crear su propia contraseña.
              </p>

            </div>

          </div>

        </div>


        <div className="space-y-5 p-5 md:p-6">

          <div className="grid gap-4 sm:grid-cols-2">

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Correo
              </p>
              <p className="mt-1 break-all font-semibold text-slate-800">
                {datosResultado.email}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Código referido
              </p>
              <p className="mt-1 font-mono font-bold text-blue-700">
                {datosResultado.codigoReferido}
              </p>
            </div>

          </div>


          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

            <p className="text-sm font-bold text-slate-900">
              Enlace de activación
            </p>

            <p className="mt-2 break-all font-mono text-xs leading-5 text-blue-700">
              {datosResultado.enlaceActivacion}
            </p>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Este enlace es personal, vence en 48 horas y debe entregarse únicamente al distribuidor.
            </p>

          </div>


          <div className="grid gap-3 sm:grid-cols-3">

            <button
              type="button"
              onClick={
                copiarEnlace
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <Copy className="h-4 w-4" />
              Copiar enlace
            </button>


            <button
              type="button"
              onClick={
                enviarWhatsapp
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              Enviar WhatsApp
            </button>


            <button
              type="button"
              onClick={
                () =>
                  router.push(
                    `/admin/multinivel/${datosResultado.id}`
                  )
              }
              className="inline-flex items-center justify-center rounded-xl bg-[#10182D] px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
            >
              Ver perfil
            </button>

          </div>

        </div>

      </div>
    );
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
              La cuenta quedará pendiente hasta que el distribuidor cree su contraseña.
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
            Dirección del distribuidor
          </label>

          <input
            type="text"
            value={direccion}
            onChange={(e) =>
              setDireccion(e.target.value)
            }
            maxLength={200}
            placeholder="Ej: Av. Principal #123"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          />
        </div>


        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Enlace Google Maps
          </label>

          <input
            type="url"
            value={googleMapsUrl}
            onChange={(e) =>
              setGoogleMapsUrl(e.target.value)
            }
            placeholder="https://maps.app.goo.gl/..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          />
        </div>


        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={esDistribuidorPublico}
            onChange={(e) =>
              setEsDistribuidorPublico(e.target.checked)
            }
            className="h-4 w-4"
          />

          <label className="text-sm font-semibold text-slate-700">
            Mostrar como distribuidor público
          </label>
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
