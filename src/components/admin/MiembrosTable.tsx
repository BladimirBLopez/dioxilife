"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Eye,
  Search,
  SlidersHorizontal,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";

import type {
  ColumnDef,
} from "@tanstack/react-table";


export type MiembroAdminRow = {
  id: string;

  nombreCompleto: string;

  nombres: string;

  apellidos: string | null;

  email: string;

  telefono: string | null;

  codigoReferido: string;

  estado: string;

  patrocinadorNombre: string | null;

  patrocinadorCodigo: string | null;

  referidosDirectos: number;

  createdAt: string;
};


const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,

  rowSortingFeature,

  rowPaginationFeature,

  filteredRowModel:
    createFilteredRowModel(),

  sortedRowModel:
    createSortedRowModel(),

  paginatedRowModel:
    createPaginatedRowModel(),

  filterFns: {
    includesString:
      filterFn_includesString,
  },
});


function estiloEstado(
  estado: string
) {
  if (
    estado === "ACTIVO"
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
  }

  return "bg-slate-100 text-slate-600 ring-slate-500/10";
}


function textoEstado(
  estado: string
) {
  if (
    estado === "ACTIVO"
  ) {
    return "Activo";
  }

  if (
    estado === "INACTIVO"
  ) {
    return "Inactivo";
  }

  return estado;
}


const columns:
  Array<
    ColumnDef<
      typeof features,
      MiembroAdminRow
    >
  > = [
  {
    id: "miembro",

    accessorFn: (row) =>
      [
        row.nombreCompleto,
        row.email,
        row.telefono,
      ]
        .filter(Boolean)
        .join(" "),

    header: "Miembro",

    cell: ({ row }) => {
      const miembro =
        row.original;

      const iniciales =
        miembro.nombreCompleto
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map(
            (parte) =>
              parte[0]
          )
          .join("")
          .toUpperCase();

      return (
        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
            {iniciales ||
              "M"}
          </div>

          <div className="min-w-0">

            <p className="truncate font-semibold text-slate-900">
              {miembro.nombreCompleto}
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-400">
              {miembro.email}
            </p>

          </div>

        </div>
      );
    },
  },


  {
    accessorKey:
      "codigoReferido",

    header: "Código",

    cell: ({ row }) => (
      <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-700">
        {
          row.original
            .codigoReferido
        }
      </span>
    ),
  },


  {
    id: "patrocinador",

    accessorFn: (row) =>
      [
        row.patrocinadorNombre,
        row.patrocinadorCodigo,
      ]
        .filter(Boolean)
        .join(" "),

    header: "Patrocinador",

    cell: ({ row }) => {
      const miembro =
        row.original;

      if (
        !miembro.patrocinadorNombre
      ) {
        return (
          <span className="text-sm font-medium text-slate-400">
            Sin patrocinador
          </span>
        );
      }

      return (
        <div>

          <p className="font-medium text-slate-800">
            {
              miembro.patrocinadorNombre
            }
          </p>

          {miembro.patrocinadorCodigo && (
            <p className="mt-1 font-mono text-xs text-blue-600">
              {
                miembro.patrocinadorCodigo
              }
            </p>
          )}

        </div>
      );
    },
  },


  {
    accessorKey:
      "referidosDirectos",

    header:
      "Directos",

    enableGlobalFilter:
      false,

    cell: ({ row }) => (
      <div className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-700">

        <UsersRound className="h-3.5 w-3.5" />

        {
          row.original
            .referidosDirectos
        }

      </div>
    ),
  },


  {
    accessorKey:
      "estado",

    header: "Estado",

    cell: ({ row }) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${estiloEstado(
          row.original.estado
        )}`}
      >
        {textoEstado(
          row.original.estado
        )}
      </span>
    ),
  },


  {
    id: "fecha",

    accessorFn: (row) =>
      new Date(
        row.createdAt
      ).getTime(),

    header:
      "Registro",

    enableGlobalFilter:
      false,

    cell: ({ row }) => (
      <div>

        <p className="text-sm text-slate-700">
          {new Date(
            row.original.createdAt
          ).toLocaleDateString(
            "es-BO"
          )}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Miembro DioxiLife
        </p>

      </div>
    ),
  },


  {
    id: "accion",

    header: "Acción",

    enableGlobalFilter:
      false,

    enableSorting:
      false,

    cell: ({ row }) => (
      <Link
        href={`/admin/multinivel/${row.original.id}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#10182D] px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
      >
        <Eye className="h-3.5 w-3.5" />
        Ver perfil
      </Link>
    ),
  },
];


type Filtro =
  | "TODOS"
  | "ACTIVO"
  | "INACTIVO"
  | "RAIZ";


const FILTROS: Array<{
  valor: Filtro;
  etiqueta: string;
}> = [
  {
    valor: "TODOS",
    etiqueta: "Todos",
  },
  {
    valor: "ACTIVO",
    etiqueta: "Activos",
  },
  {
    valor: "INACTIVO",
    etiqueta: "Inactivos",
  },
  {
    valor: "RAIZ",
    etiqueta:
      "Sin patrocinador",
  },
];


export default function MiembrosTable({
  data,
}: {
  data: MiembroAdminRow[];
}) {
  const [
    filtro,
    setFiltro,
  ] =
    useState<Filtro>(
      "TODOS"
    );


  const datosFiltrados =
    useMemo(
      () => {
        if (
          filtro === "TODOS"
        ) {
          return data;
        }

        if (
          filtro === "RAIZ"
        ) {
          return data.filter(
            (miembro) =>
              !miembro.patrocinadorNombre
          );
        }

        return data.filter(
          (miembro) =>
            miembro.estado ===
            filtro
        );
      },
      [
        data,
        filtro,
      ]
    );


  const table =
    useTable({
      features,

      columns,

      data:
        datosFiltrados,

      globalFilterFn:
        "includesString",

      initialState: {
        pagination: {
          pageIndex: 0,
          pageSize: 10,
        },
      },
    });


  const filas =
    table
      .getRowModel()
      .rows;


  const resultados =
    table
      .getFilteredRowModel()
      .rows.length;


  function cantidadFiltro(
    valor: Filtro
  ) {
    if (
      valor === "TODOS"
    ) {
      return data.length;
    }

    if (
      valor === "RAIZ"
    ) {
      return data.filter(
        (miembro) =>
          !miembro.patrocinadorNombre
      ).length;
    }

    return data.filter(
      (miembro) =>
        miembro.estado ===
        valor
    ).length;
  }


  function cambiarFiltro(
    valor: Filtro
  ) {
    setFiltro(valor);

    table.firstPage();
  }


  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

      <div className="border-b border-slate-100 p-5 md:p-6">

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

          <div>

            <h2 className="text-lg font-bold text-slate-900">
              Directorio de miembros
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Consulta miembros, códigos de referido y estructura directa.
            </p>

          </div>


          <div className="relative w-full xl:w-[380px]">

            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={
                String(
                  table.state
                    .globalFilter ??
                    ""
                )
              }
              onChange={(event) =>
                table.setGlobalFilter(
                  event.target.value
                )
              }
              placeholder="Buscar nombre, correo, código o patrocinador..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

            {Boolean(
              table.state
                .globalFilter
            ) && (
              <button
                type="button"
                onClick={() =>
                  table.setGlobalFilter(
                    ""
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}

          </div>

        </div>


        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">

          <div className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <SlidersHorizontal className="h-4 w-4" />
          </div>


          {FILTROS.map(
            (item) => {
              const activo =
                filtro ===
                item.valor;

              return (
                <button
                  key={
                    item.valor
                  }
                  type="button"
                  onClick={() =>
                    cambiarFiltro(
                      item.valor
                    )
                  }
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${
                    activo
                      ? "bg-[#10182D] text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {
                    item.etiqueta
                  }

                  <span
                    className={`ml-1.5 ${
                      activo
                        ? "text-white/60"
                        : "text-slate-400"
                    }`}
                  >
                    {cantidadFiltro(
                      item.valor
                    )}
                  </span>

                </button>
              );
            }
          )}

        </div>

      </div>


      {resultados === 0 ? (

        <div className="p-10 text-center">

          <UserRound className="mx-auto h-9 w-9 text-slate-300" />

          <p className="mt-4 font-semibold text-slate-700">
            No encontramos miembros
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Cambia el filtro o intenta con otro término.
          </p>

        </div>

      ) : (

        <>

          {/* MÓVIL */}
          <div className="divide-y divide-slate-100 md:hidden">

            {filas.map(
              (row) => {
                const miembro =
                  row.original;

                const iniciales =
                  miembro.nombreCompleto
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(
                      (parte) =>
                        parte[0]
                    )
                    .join("")
                    .toUpperCase();

                return (
                  <article
                    key={
                      miembro.id
                    }
                    className="p-4"
                  >

                    <div className="flex items-start gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                        {iniciales ||
                          "M"}
                      </div>


                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-2">

                          <div className="min-w-0">

                            <p className="truncate font-bold text-slate-900">
                              {
                                miembro.nombreCompleto
                              }
                            </p>

                            <p className="mt-1 truncate text-xs text-slate-400">
                              {
                                miembro.email
                              }
                            </p>

                          </div>


                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${estiloEstado(
                              miembro.estado
                            )}`}
                          >
                            {textoEstado(
                              miembro.estado
                            )}
                          </span>

                        </div>

                      </div>

                    </div>


                    <div className="mt-4 grid grid-cols-2 gap-3">

                      <div className="rounded-xl bg-slate-50 p-3">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Código
                        </p>

                        <p className="mt-1 font-mono text-sm font-bold text-slate-800">
                          {
                            miembro.codigoReferido
                          }
                        </p>

                      </div>


                      <div className="rounded-xl bg-slate-50 p-3">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Directos
                        </p>

                        <div className="mt-1 flex items-center gap-1.5">

                          <UsersRound className="h-4 w-4 text-violet-600" />

                          <p className="text-sm font-bold text-slate-800">
                            {
                              miembro.referidosDirectos
                            }
                          </p>

                        </div>

                      </div>

                    </div>


                    <div className="mt-4">

                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Patrocinador
                      </p>

                      {miembro.patrocinadorNombre ? (

                        <div className="mt-1">

                          <p className="text-sm font-semibold text-slate-800">
                            {
                              miembro.patrocinadorNombre
                            }
                          </p>

                          <p className="mt-0.5 font-mono text-xs text-blue-600">
                            {
                              miembro.patrocinadorCodigo
                            }
                          </p>

                        </div>

                      ) : (

                        <p className="mt-1 text-sm font-medium text-slate-400">
                          Sin patrocinador
                        </p>

                      )}

                    </div>


                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

                      <p className="text-xs text-slate-400">
                        Registro:{" "}
                        {new Date(
                          miembro.createdAt
                        ).toLocaleDateString(
                          "es-BO"
                        )}
                      </p>


                      <Link
                        href={`/admin/multinivel/${miembro.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#10182D] px-3 py-2 text-xs font-semibold text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver perfil
                      </Link>

                    </div>

                  </article>
                );
              }
            )}

          </div>


          {/* ESCRITORIO */}
          <div className="hidden overflow-x-auto md:block">

            <table className="w-full min-w-[1050px] text-left text-sm">

              <thead className="bg-slate-50">

                {table
                  .getHeaderGroups()
                  .map(
                    (
                      headerGroup
                    ) => (

                      <tr
                        key={
                          headerGroup.id
                        }
                      >

                        {headerGroup.headers.map(
                          (
                            header
                          ) => {
                            const orden =
                              header.column.getIsSorted();

                            return (
                              <th
                                key={
                                  header.id
                                }
                                className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400"
                              >

                                {header.isPlaceholder
                                  ? null
                                  : (
                                    <button
                                      type="button"
                                      disabled={
                                        !header.column.getCanSort()
                                      }
                                      onClick={
                                        header.column.getToggleSortingHandler()
                                      }
                                      className={`inline-flex items-center gap-1.5 ${
                                        header.column.getCanSort()
                                          ? "cursor-pointer transition hover:text-slate-700"
                                          : "cursor-default"
                                      }`}
                                    >

                                      <table.FlexRender
                                        header={
                                          header
                                        }
                                      />

                                      {header.column.getCanSort() && (

                                        orden ===
                                        "asc" ? (

                                          <ChevronUp className="h-3.5 w-3.5 text-blue-600" />

                                        ) : orden ===
                                          "desc" ? (

                                          <ChevronDown className="h-3.5 w-3.5 text-blue-600" />

                                        ) : (

                                          <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" />

                                        )

                                      )}

                                    </button>
                                  )}

                              </th>
                            );
                          }
                        )}

                      </tr>

                    )
                  )}

              </thead>


              <tbody className="divide-y divide-slate-100">

                {filas.map(
                  (row) => (

                    <tr
                      key={row.id}
                      className="transition hover:bg-slate-50"
                    >

                      {row
                        .getAllCells()
                        .map(
                          (
                            cell
                          ) => (

                            <td
                              key={
                                cell.id
                              }
                              className="px-4 py-4 align-top"
                            >

                              <table.FlexRender
                                cell={
                                  cell
                                }
                              />

                            </td>

                          )
                        )}

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>


          {/* PAGINACIÓN */}
          <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">

            <p className="text-sm text-slate-500">
              Mostrando{" "}
              <span className="font-semibold text-slate-800">
                {filas.length}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-slate-800">
                {resultados}
              </span>{" "}
              miembro
              {resultados === 1
                ? ""
                : "s"}
            </p>


            <div className="flex flex-wrap items-center gap-2">

              <select
                value={
                  table.state
                    .pagination
                    .pageSize
                }
                onChange={(event) =>
                  table.setPageSize(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 outline-none"
              >

                {[10, 20, 50].map(
                  (cantidad) => (

                    <option
                      key={
                        cantidad
                      }
                      value={
                        cantidad
                      }
                    >
                      {cantidad} por página
                    </option>

                  )
                )}

              </select>


              <span className="px-2 text-xs font-medium text-slate-500">
                Página{" "}
                {table.state
                  .pagination
                  .pageIndex + 1}{" "}
                de{" "}
                {Math.max(
                  table.getPageCount(),
                  1
                )}
              </span>


              <button
                type="button"
                onClick={() =>
                  table.previousPage()
                }
                disabled={
                  !table.getCanPreviousPage()
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>


              <button
                type="button"
                onClick={() =>
                  table.nextPage()
                }
                disabled={
                  !table.getCanNextPage()
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

            </div>

          </div>

        </>

      )}

    </section>
  );
}
