export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import ArbolMultinivel from "@/components/admin/ArbolMultinivel";

type Nodo = {
  id: string;
  nombres: string;
  codigoReferido: string;
  email: string;
  nivel: number;
  hijos: Nodo[];
};


async function obtenerRed(
  id: string,
  nivel = 1
): Promise<Nodo[]> {

  if (nivel > 3) {
    return [];
  }


  const hijos = await prisma.miembro.findMany({
    where:{
      patrocinadorId:id
    },
    select:{
      id:true,
      nombres:true,
      codigoReferido:true,
      email:true
    }
  });


  return Promise.all(
    hijos.map(async(hijo)=>({
      ...hijo,
      nivel,
      hijos: await obtenerRed(
        hijo.id,
        nivel + 1
      )
    }))
  );
}



export default async function MultinivelAdminPage() {


  const [
    totalMiembros,
    miembrosActivos,
    ultimos
  ] = await Promise.all([

    prisma.miembro.count(),

    prisma.miembro.count({
      where:{
        estado:"ACTIVO"
      }
    }),

    prisma.miembro.findMany({
      orderBy:{
        createdAt:"desc"
      },
      take:10,
      select:{
        id:true,
        nombres:true,
        email:true,
        codigoReferido:true,
        estado:true
      }
    })

  ]);



  const raiz = await prisma.miembro.findFirst({
    where:{
      codigoReferido:"CARLOS2026"
    },
    select:{
      id:true
    }
  });


  const red = raiz
    ? await obtenerRed(raiz.id)
    : [];



  return (
    <div>


      <h1 className="text-2xl font-semibold mb-6">
        Multinivel
      </h1>



      <div className="grid md:grid-cols-2 gap-4 max-w-xl mb-8">


        <div className="bg-white rounded-lg shadow p-5">

          <p className="text-sm text-gray-500">
            Total miembros
          </p>

          <p className="text-3xl font-bold">
            {totalMiembros}
          </p>

        </div>



        <div className="bg-white rounded-lg shadow p-5">

          <p className="text-sm text-gray-500">
            Miembros activos
          </p>

          <p className="text-3xl font-bold">
            {miembrosActivos}
          </p>

        </div>


      </div>




      <div className="bg-white rounded-lg shadow p-5 mb-8">

        <h2 className="text-lg font-semibold mb-5">
          Árbol multinivel
        </h2>

        <ArbolMultinivel red={red}/>

      </div>





      <div className="bg-white rounded-lg shadow p-5">

        <h2 className="text-lg font-semibold mb-4">
          Últimos miembros registrados
        </h2>


        <div className="space-y-3">

          {ultimos.map((m)=>(
            <div
              key={m.id}
              className="border rounded-lg p-3 flex justify-between"
            >

              <div>

                <p className="font-medium">
                  {m.nombres}
                </p>

                <p className="text-sm text-gray-500">
                  {m.email}
                </p>

              </div>


              <div className="text-right">

                <p className="font-mono text-sm">
                  {m.codigoReferido}
                </p>

                <p className="text-xs text-green-600">
                  {m.estado}
                </p>

              </div>


            </div>
          ))}

        </div>

      </div>


    </div>
  );
}
