export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function MiembrosMultinivelPage() {

  const miembros = await prisma.miembro.findMany({
    orderBy:{
      createdAt:"desc"
    },
    select:{
      id:true,
      nombres:true,
      email:true,
      codigoReferido:true,
      estado:true,
      createdAt:true,
      patrocinador:{
        select:{
          nombres:true,
          codigoReferido:true
        }
      }
    }
  });


  return (
    <div>

      <div className="flex justify-between items-center mb-6">

        <h1 className="text-2xl font-semibold">
          Miembros Multinivel
        </h1>

        <div className="bg-white rounded-lg shadow px-5 py-3">
          <p className="text-xs text-gray-500">
            Total miembros
          </p>
          <p className="text-2xl font-bold">
            {miembros.length}
          </p>
        </div>

      </div>


      <div className="bg-white rounded-lg shadow overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">

            <tr>

              <th className="p-3 text-left">
                Miembro
              </th>

              <th className="p-3 text-left">
                Código
              </th>

              <th className="p-3 text-left">
                Patrocinador
              </th>

              <th className="p-3 text-left">
                Estado
              </th>

              <th className="p-3 text-left">
                Registro
              </th>

              <th className="p-3 text-left">
                Acción
              </th>

            </tr>

          </thead>


          <tbody>

          {miembros.map((m)=>(

            <tr
              key={m.id}
              className="border-t hover:bg-gray-50"
            >

              <td className="p-3">

                <p className="font-medium">
                  {m.nombres}
                </p>

                <p className="text-xs text-gray-500">
                  {m.email}
                </p>

              </td>


              <td className="p-3 font-mono">
                {m.codigoReferido}
              </td>


              <td className="p-3">

                <p>
                  {m.patrocinador?.nombres ?? "-"}
                </p>

                <p className="text-xs text-gray-500">
                  {m.patrocinador?.codigoReferido ?? ""}
                </p>

              </td>


              <td className="p-3">

                <span className="text-green-600 font-medium">
                  {m.estado}
                </span>

              </td>


              <td className="p-3 text-xs">

                {new Date(m.createdAt).toLocaleDateString()}

              </td>


              <td className="p-3">

                <Link
                  href={`/admin/multinivel/${m.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Ver
                </Link>

              </td>


            </tr>

          ))}

          </tbody>

        </table>


      </div>


    </div>
  );
}
