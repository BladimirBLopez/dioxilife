"use client";

type Nodo = {
  id: string;
  nombres: string;
  codigoReferido: string;
  email: string;
  nivel: number;
  hijos: Nodo[];
};

function NodoMiembro({ nodo }: { nodo: Nodo }) {
  return (
    <div className="flex flex-col items-center">

      <div className="bg-white shadow rounded-xl border p-4 min-w-[220px] text-center">
        <p className="font-bold text-lg">
          {nodo.nombres}
        </p>

        <p className="text-sm text-gray-500">
          {nodo.codigoReferido}
        </p>

        <p className="text-xs text-green-600 mt-1">
          Nivel {nodo.nivel}
        </p>
      </div>


      {nodo.hijos.length > 0 && (
        <>

          <div className="h-6 border-l-2 border-gray-300" />

          <div className="flex gap-6 flex-wrap justify-center">

            {nodo.hijos.map((hijo) => (
              <NodoMiembro
                key={hijo.id}
                nodo={hijo}
              />
            ))}

          </div>

        </>
      )}

    </div>
  );
}


export default function ArbolMultinivel({
  red,
}: {
  red: Nodo[];
}) {

  if (!red.length) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-gray-500">
          Este miembro todavía no tiene red.
        </p>
      </div>
    );
  }


  return (
    <div className="bg-gray-50 rounded-xl p-6 overflow-auto">

      <div className="flex justify-center gap-8">

        {red.map((nodo) => (
          <NodoMiembro
            key={nodo.id}
            nodo={nodo}
          />
        ))}

      </div>

    </div>
  );
}
