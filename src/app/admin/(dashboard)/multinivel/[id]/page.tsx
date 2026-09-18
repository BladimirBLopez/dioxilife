export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DetalleMiembroPage({
  params,
}: {
  params: {
    id: string;
  };
}) {

  const miembro = await prisma.miembro.findUnique({
    where:{
      id: params.id
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
      },

      referidos:{
        select:{
          id:true,
          nombres:true,
          codigoReferido:true,
          estado:true
        }
      }

    }
  });


  if(!miembro){

    return (
      <div>
        <h1 className="text-xl font-semibold">
          Miembro no encontrado
        </h1>

        <Link
          href="/admin/multinivel/miembros"
          className="text-blue-600"
        >
          Volver
        </Link>

      </div>
    );

  }


  return (
    <div>


      <h1 className="text-2xl font-semibold mb-6">
        Detalle del miembro
      </h1>


      <div className="bg-white rounded-lg shadow p-5 mb-6">

        <h2 className="text-lg font-semibold mb-4">
          Información
        </h2>


        <p>
          <b>Nombre:</b> {miembro.nombres}
        </p>

        <p>
          <b>Email:</b> {miembro.email}
        </p>

        <p>
          <b>Código:</b> {miembro.codigoReferido}
        </p>

        <p>
          <b>Estado:</b> {miembro.estado}
        </p>

        <p>
          <b>Registro:</b>{" "}
          {new Date(miembro.createdAt).toLocaleDateString()}
        </p>


      </div>



      <div className="bg-white rounded-lg shadow p-5 mb-6">

        <h2 className="text-lg font-semibold mb-3">
          Patrocinador
        </h2>


        <p>
          {miembro.patrocinador?.nombres ?? "-"}
        </p>

        <p className="text-sm text-gray-500">
          {miembro.patrocinador?.codigoReferido ?? ""}
        </p>


      </div>



      <div className="bg-white rounded-lg shadow p-5">

        <h2 className="text-lg font-semibold mb-4">
          Red directa ({miembro.referidos.length})
        </h2>


        <div className="space-y-3">

        {miembro.referidos.map((r)=>(

          <div
            key={r.id}
            className="border rounded-lg p-3"
          >

            <p className="font-medium">
              {r.nombres}
            </p>

            <p className="text-sm font-mono">
              {r.codigoReferido}
            </p>

            <p className="text-xs text-green-600">
              {r.estado}
            </p>

          </div>

        ))}


        {miembro.referidos.length === 0 && (
          <p className="text-gray-500">
            No tiene referidos directos.
          </p>
        )}

        </div>


      </div>


    </div>
  );
}
