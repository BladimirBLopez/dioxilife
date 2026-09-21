"use client";

type Nodo = {
  id: string;
  nombres: string;
  apellidos?: string | null;
  codigoReferido: string;
  email: string;
  nivel: number;
  hijos: Nodo[];
};

function nombreCompleto(
  nodo: Nodo
) {
  return [
    nodo.nombres,
    nodo.apellidos,
  ]
    .filter(Boolean)
    .join(" ");
}

function iniciales(
  nodo: Nodo
) {
  const primera =
    nodo.nombres
      .trim()
      .charAt(0);

  const segunda =
    nodo.apellidos
      ?.trim()
      .charAt(0) || "";

  return `${primera}${segunda}`.toUpperCase();
}

function estilosNivel(
  nivel: number
) {
  if (nivel === 0) {
    return {
      tarjeta:
        "border-[#10182D] bg-[#10182D] text-white",
      avatar:
        "bg-white/10 text-white",
      codigo:
        "text-white/55",
      correo:
        "text-white/45",
      badge:
        "bg-white/10 text-white/80",
    };
  }

  if (nivel === 1) {
    return {
      tarjeta:
        "border-blue-100 bg-white text-slate-900",
      avatar:
        "bg-blue-50 text-blue-700",
      codigo:
        "text-blue-600",
      correo:
        "text-slate-400",
      badge:
        "bg-blue-50 text-blue-700",
    };
  }

  if (nivel === 2) {
    return {
      tarjeta:
        "border-violet-100 bg-white text-slate-900",
      avatar:
        "bg-violet-50 text-violet-700",
      codigo:
        "text-violet-600",
      correo:
        "text-slate-400",
      badge:
        "bg-violet-50 text-violet-700",
    };
  }

  return {
    tarjeta:
      "border-emerald-100 bg-white text-slate-900",
    avatar:
      "bg-emerald-50 text-emerald-700",
    codigo:
      "text-emerald-600",
    correo:
      "text-slate-400",
    badge:
      "bg-emerald-50 text-emerald-700",
  };
}

function NodoMiembro({
  nodo,
}: {
  nodo: Nodo;
}) {
  const estilos =
    estilosNivel(
      nodo.nivel
    );

  return (
    <div className="flex min-w-max flex-col items-center">

      <div
        className={`w-[230px] rounded-2xl border p-4 shadow-sm ${estilos.tarjeta}`}
      >

        <div className="flex items-start gap-3">

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${estilos.avatar}`}
          >
            {iniciales(nodo)}
          </div>


          <div className="min-w-0 flex-1">

            <p className="truncate text-sm font-bold">
              {nombreCompleto(
                nodo
              )}
            </p>

            <p
              className={`mt-1 truncate font-mono text-[11px] ${estilos.codigo}`}
            >
              {nodo.codigoReferido}
            </p>

          </div>


          <span
            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${estilos.badge}`}
          >
            {nodo.nivel === 0
              ? "RAÍZ"
              : `N${nodo.nivel}`}
          </span>

        </div>


        <p
          className={`mt-3 truncate text-xs ${estilos.correo}`}
        >
          {nodo.email}
        </p>


        <div
          className={`mt-3 flex items-center justify-between border-t pt-3 text-[11px] ${
            nodo.nivel === 0
              ? "border-white/10 text-white/50"
              : "border-slate-100 text-slate-400"
          }`}
        >

          <span>
            Directos
          </span>

          <span className="font-bold">
            {nodo.hijos.length}
          </span>

        </div>

      </div>


      {nodo.hijos.length > 0 && (

        <>
          <div className="h-7 w-px bg-slate-300" />

          <div className="relative flex gap-5">

            {nodo.hijos.length > 1 && (
              <div className="absolute left-[115px] right-[115px] top-0 h-px bg-slate-300" />
            )}

            {nodo.hijos.map(
              (hijo) => (

                <div
                  key={hijo.id}
                  className="relative flex flex-col items-center"
                >

                  <div className="h-5 w-px bg-slate-300" />

                  <NodoMiembro
                    nodo={hijo}
                  />

                </div>

              )
            )}

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
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
          >
            <circle
              cx="9"
              cy="8"
              r="3"
            />
            <circle
              cx="17"
              cy="10"
              r="2.5"
            />
            <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" />
            <path d="M15 15c3 0 5 1.8 5 5" />
          </svg>

        </div>

        <p className="mt-4 font-semibold text-slate-700">
          Todavía no existe una estructura de red.
        </p>

        <p className="mt-2 text-sm text-slate-400">
          Los distribuidores y sus patrocinados aparecerán aquí.
        </p>

      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/70">

      <div className="min-w-max p-6 md:p-8">

        <div className="flex items-start justify-center gap-10">

          {red.map(
            (nodo) => (

              <NodoMiembro
                key={nodo.id}
                nodo={nodo}
              />

            )
          )}

        </div>

      </div>

    </div>
  );
}
