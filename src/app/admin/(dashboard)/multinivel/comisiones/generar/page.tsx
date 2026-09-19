export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generarComisiones } from "../generar";

export default async function GenerarComisionesPage() {
  const miembros = await prisma.miembro.findMany({
    where: {
      estado: "ACTIVO",
    },

    orderBy: {
      nombres: "asc",
    },

    select: {
      id: true,
      nombres: true,
      apellidos: true,
      codigoReferido: true,

      patrocinador: {
        select: {
          nombres: true,
          codigoReferido: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      <div>
        <Link
          href="/admin/multinivel/comisiones"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Volver a comisiones
        </Link>

        <h1 className="mt-2 text-2xl font-semibold">
          Generar comisiones
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Registre una operación y el sistema recorrerá
          automáticamente la línea de patrocinadores.
        </p>
      </div>


      <form
        action={generarComisiones}
        className="space-y-6 rounded-xl bg-white p-6 shadow"
      >

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Miembro que origina la operación
          </label>

          <select
            name="origenMiembroId"
            required
            defaultValue=""
            className="w-full rounded-lg border p-3"
          >
            <option value="" disabled>
              Seleccione un miembro
            </option>

            {miembros.map((miembro) => (
              <option
                key={miembro.id}
                value={miembro.id}
              >
                {miembro.nombres}
                {miembro.apellidos
                  ? ` ${miembro.apellidos}`
                  : ""}
                {" — "}
                {miembro.codigoReferido}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-gray-500">
            Este es el miembro cuya operación genera
            ganancias hacia arriba en la red.
          </p>
        </div>


        <div>
          <label className="mb-2 block text-sm font-semibold">
            Monto base
          </label>

          <div className="flex items-center rounded-lg border">
            <span className="px-3 text-gray-500">
              Bs
            </span>

            <input
              name="montoBase"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="1000.00"
              className="w-full rounded-r-lg p-3 outline-none"
            />
          </div>
        </div>


        <div>

          <h2 className="mb-3 font-semibold">
            Porcentaje por nivel
          </h2>

          <div className="grid gap-4 md:grid-cols-3">

            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Nivel 1
              </label>

              <div className="flex rounded-lg border">
                <input
                  name="nivel1"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue="10"
                  className="w-full rounded-l-lg p-3 outline-none"
                />

                <span className="flex items-center px-3 text-gray-500">
                  %
                </span>
              </div>
            </div>


            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Nivel 2
              </label>

              <div className="flex rounded-lg border">
                <input
                  name="nivel2"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue="5"
                  className="w-full rounded-l-lg p-3 outline-none"
                />

                <span className="flex items-center px-3 text-gray-500">
                  %
                </span>
              </div>
            </div>


            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Nivel 3
              </label>

              <div className="flex rounded-lg border">
                <input
                  name="nivel3"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue="3"
                  className="w-full rounded-l-lg p-3 outline-none"
                />

                <span className="flex items-center px-3 text-gray-500">
                  %
                </span>
              </div>
            </div>

          </div>

          <p className="mt-3 text-xs text-gray-500">
            Estos valores son editables. Todavía no representan
            las reglas definitivas del negocio.
          </p>

        </div>


        <div>
          <label className="mb-2 block text-sm font-semibold">
            Concepto
          </label>

          <input
            name="concepto"
            type="text"
            placeholder="Ej.: Comisión por compra de producto"
            className="w-full rounded-lg border p-3"
          />
        </div>


        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">

          <p className="font-semibold">
            ¿Qué hará el sistema?
          </p>

          <p className="mt-1">
            Buscará al patrocinador directo del miembro,
            luego al patrocinador del patrocinador y así
            hasta tres niveles. Cada comisión se registrará
            inicialmente como PENDIENTE.
          </p>

        </div>


        <button
          type="submit"
          className="w-full rounded-lg bg-black p-3 font-semibold text-white hover:bg-gray-800"
        >
          Generar comisiones de la red
        </button>

      </form>

    </div>
  );
}
