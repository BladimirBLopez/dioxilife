export const dynamic = "force-dynamic";

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

      <h1 className="text-2xl font-semibold mb-6">
        Miembros Multinivel
      </h1>


      <div className="bg-white rounded-lg shadow overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">
                Nombre
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
            </tr>
          </thead>


          <tbody>

          {miembros.map((m)=>(

            <tr
              key={m.id}
              className="border-t"
            >

              <td className="p-3">
                {m.nombres}
                <br/>
                <span className="text-gray-500 text-xs">
                  {m.email}
                </span>
              </td>


              <td className="p-3 font-mono">
                {m.codigoReferido}
              </td>


              <td className="p-3">
                {m.patrocinador?.nombres ?? "-"}
              </td>


              <td className="p-3">
                <span className="text-green-600">
                  {m.estado}
                </span>
              </td>

            </tr>

          ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}
