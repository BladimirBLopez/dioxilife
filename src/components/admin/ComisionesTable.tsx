"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import {
  BadgeDollarSign,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Filter,
  ReceiptText,
  Search,
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

import AccionesComision from "@/app/admin/(dashboard)/multinivel/comisiones/AccionesComision";


export type ComisionAdminRow = {
  id: string;

  beneficiarioId: string;
  beneficiarioNombre: string;
  beneficiarioCodigo: string;

  origenId: string;
  origenNombre: string;
  origenCodigo: string;

  pedidoId: string | null;
  pedidoCodigo: string | null;

  nivel: number;

  montoBase: number | null;
  porcentaje: number | null;
  monto: number;

  concepto: string | null;

  estado:
    | "PENDIENTE"
    | "APROBADA"
    | "PAGADA"
    | "ANULADA";

  createdAt: string;
};


type FiltroEstado =
  | "TODOS"
  | ComisionAdminRow["estado"];

type FiltroNivel =
  | "TODOS"
  | "DIRECTA"
  | "1"
  | "2"
  | "3";


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


function dinero(
  valor: number | null
) {
  return new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    valor ?? 0
  );
}


function textoEstado(
  estado: ComisionAdminRow["estado"]
) {
  switch (estado) {
    case "PENDIENTE":
      return "Pendiente";

    case "APROBADA":
      return "Aprobada";

    case "PAGADA":
      return "Pagada";

    case "ANULADA":
      return "Anulada";
  }
}


function estiloEstado(
  estado: ComisionAdminRow["estado"]
) {
  switch (estado) {
    case "PENDIENTE":
      return "bg-yellow-50 text-yellow-700 ring-yellow-600/10";

    case "APROBADA":
      return "bg-blue-50 text-blue-700 ring-blue-600/10";

    case "PAGADA":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";

    case "ANULADA":
      return "bg-red-50 text-red-700 ring-red-600/10";
  }
}


function textoNivel(
  nivel: number
) {
  if (nivel === 0) {
    return "Directa";
  }

  return `Nivel ${nivel}`;
}


const columns:
  Array<
    ColumnDef<
      typeof features,
      ComisionAdminRow
    >
  > = [
  {
    id: "beneficiario",

    accessorFn: (row) =>
      [
        row.beneficiarioNombre,
        row.beneficiarioCodigo,
      ].join(" "),

    header: "Beneficiario",

    cell: ({ row }) => (
      <div>

        <Link
          href={`/admin/multinivel/${row.original.beneficiarioId}`}
          className="font-semibold text-slate-900 transition hover:text-blue-600"
        >
          {row.original.beneficiarioNombre}
        </Link>

        <p className="mt-1 font-mono text-xs text-blue-600">
          {row.original.beneficiarioCodigo}
        </p>

      </div>
    ),
  },


  {
    id: "origen",

    accessorFn: (row) =>
      [
        row.origenNombre,
        row.origenCodigo,
      ].join(" "),

    header: "Origen",

    cell: ({ row }) => (
      <div>

        <Link
          href={`/admin/multinivel/${row.original.origenId}`}
          className="font-medium text-slate-800 transition hover:text-blue-600"
        >
          {row.original.origenNombre}
        </Link>

        <p className="mt-1 font-mono text-xs text-slate-400">
          {row.original.origenCodigo}
        </p>

      </div>
    ),
  },


  {
    id: "pedido",

    accessorFn: (row) =>
      [
        row.pedidoCodigo,
        row.concepto,
      ]
        .filter(Boolean)
        .join(" "),

    header: "Pedido",

    cell: ({ row }) => {
      const comision =
        row.original;

      if (
        !comision.pedidoId ||
        !comision.pedidoCodigo
      ) {
        return (
          <span className="text-xs text-slate-400">
            Sin pedido vinculado
          </span>
        );
      }

      return (
        <Link
          href={`/admin/pedidos/${comision.pedidoId}`}
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-blue-600 hover:underline"
        >
          <ReceiptText className="h-3.5 w-3.5" />
          {comision.pedidoCodigo}
        </Link>
      );
    },
  },


  {
    accessorKey: "nivel",

    header: "Nivel",

    enableGlobalFilter: false,

    cell: ({ row }) => (
      <span className="inline-flex rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-700">
        {textoNivel(
          row.original.nivel
        )}
      </span>
    ),
  },


  {
    accessorKey: "montoBase",

    header: "Base",

    enableGlobalFilter: false,

    cell: ({ row }) => (
      <span className="text-sm text-slate-700">
        {row.original.montoBase === null
          ? "-"
          : `Bs ${dinero(
              row.original.montoBase
            )}`}
      </span>
    ),
  },


  {
    accessorKey: "porcentaje",

    header: "%",

    enableGlobalFilter: false,

    cell: ({ row }) => (
      <span className="font-semibold text-slate-700">
        {row.original.porcentaje === null
          ? "-"
          : `${dinero(
              row.original.porcentaje
            )}%`}
      </span>
    ),
  },


  {
    accessorKey: "monto",

    header: "Comisión",

    enableGlobalFilter: false,

    cell: ({ row }) => (
      <span className="font-bold text-emerald-700">
        Bs {dinero(
          row.original.monto
        )}
      </span>
    ),
  },


  {
    accessorKey: "estado",

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

    header: "Fecha",

    enableGlobalFilter: false,

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
          {new Date(
            row.original.createdAt
          ).toLocaleTimeString(
            "es-BO",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )}
        </p>

      </div>
    ),
  },


  {
    id: "acciones",

    header: "Acciones",

    enableSorting: false,
    enableGlobalFilter: false,

    cell: ({ row }) => (
      <AccionesComision
        id={row.original.id}
        estado={row.original.estado}
      />
    ),
  },
];


const FILTROS_ESTADO: Array<{
  valor: FiltroEstado;
  etiqueta: string;
}> = [
  {
    valor: "TODOS",
    etiqueta: "Todas",
  },
  {
    valor: "PENDIENTE",
    etiqueta: "Pendientes",
  },
  {
    valor: "APROBADA",
    etiqueta: "Aprobadas",
  },
  {
    valor: "PAGADA",
    etiqueta: "Pagadas",
  },
  {
    valor: "ANULADA",
    etiqueta: "Anuladas",
  },
];


export default function ComisionesTable({
  data,
}: {
  data: ComisionAdminRow[];
}) {
  const [
    filtroEstado,
    setFiltroEstado,
  ] =
    useState<FiltroEstado>(
      "TODOS"
    );

  const [
    filtroNivel,
    setFiltroNivel,
  ] =
    useState<FiltroNivel>(
      "TODOS"
    );


  const datosFiltrados =
    useMemo(() => {
      return data.filter(
        (comision) => {
          const coincideEstado =
            filtroEstado ===
              "TODOS" ||
            comision.estado ===
              filtroEstado;

          let coincideNivel =
            true;

          if (
            filtroNivel ===
            "DIRECTA"
          ) {
            coincideNivel =
              comision.nivel === 0;
          } else if (
            filtroNivel !==
            "TODOS"
          ) {
            coincideNivel =
              comision.nivel ===
              Number(
                filtroNivel
              );
          }

          return (
            coincideEstado &&
            coincideNivel
          );
        }
      );
    }, [
      data,
      filtroEstado,
      filtroNivel,
    ]);


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


  function cantidadEstado(
    estado: FiltroEstado
  ) {
    if (
      estado === "TODOS"
    ) {
      return data.length;
    }

    return data.filter(
      (item) =>
        item.estado === estado
    ).length;
  }


  function cambiarEstado(
    estado: FiltroEstado
  ) {
    setFiltroEstado(
      estado
    );

    table.firstPage();
  }


  function cambiarNivel(
    nivel: FiltroNivel
  ) {
    setFiltroNivel(
      nivel
    );

    table.firstPage();
  }


  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

      <div className="border-b border-slate-100 p-5 md:p-6">

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

          <div>

            <h2 className="text-lg font-bold text-slate-900">
              Historial de comisiones
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Control financiero de las comisiones generadas por ventas de la red.
            </p>

          </div>


          <div className="relative w-full xl:w-[400px]">

            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={String(
                table.state
                  .globalFilter ??
                  ""
              )}
              onChange={(event) =>
                table.setGlobalFilter(
                  event.target.value
                )
              }
              placeholder="Buscar miembro, código o pedido..."
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
            <Filter className="h-4 w-4" />
          </div>


          {FILTROS_ESTADO.map(
            (item) => {
              const activo =
                filtroEstado ===
                item.valor;

              return (
                <button
                  key={
                    item.valor
                  }
                  type="button"
                  onClick={() =>
                    cambiarEstado(
                      item.valor
                    )
                  }
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${
                    activo
                      ? "bg-[#10182D] text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {item.etiqueta}

                  <span
                    className={`ml-1.5 ${
                      activo
                        ? "text-white/60"
                        : "text-slate-400"
                    }`}
                  >
                    {cantidadEstado(
                      item.valor
                    )}
                  </span>
                </button>
              );
            }
          )}

        </div>


        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">

          <span className="text-xs font-semibold text-slate-400">
            Tipo de comisión:
          </span>

          <select
            value={
              filtroNivel
            }
            onChange={(event) =>
              cambiarNivel(
                event.target
                  .value as FiltroNivel
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 outline-none sm:w-auto"
          >
            <option value="TODOS">
              Todos los niveles
            </option>

            <option value="DIRECTA">
              Comisión directa
            </option>

            <option value="1">
              Nivel 1
            </option>

            <option value="2">
              Nivel 2
            </option>

            <option value="3">
              Nivel 3
            </option>
          </select>

        </div>

      </div>


      {resultados === 0 ? (

        <div className="p-10 text-center">

          <BadgeDollarSign className="mx-auto h-9 w-9 text-slate-300" />

          <p className="mt-4 font-semibold text-slate-700">
            No encontramos comisiones
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Cambia los filtros o intenta con otra búsqueda.
          </p>

        </div>

      ) : (

        <>

          {/* MÓVIL */}
          <div className="divide-y divide-slate-100 md:hidden">

            {filas.map(
              (row) => {
                const comision =
                  row.original;

                return (
                  <article
                    key={
                      comision.id
                    }
                    className="p-4"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Beneficiario
                        </p>

                        <Link
                          href={`/admin/multinivel/${comision.beneficiarioId}`}
                          className="mt-1 block font-bold text-slate-900"
                        >
                          {comision.beneficiarioNombre}
                        </Link>

                        <p className="mt-1 font-mono text-xs text-blue-600">
                          {comision.beneficiarioCodigo}
                        </p>

                      </div>


                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${estiloEstado(
                          comision.estado
                        )}`}
                      >
                        {textoEstado(
                          comision.estado
                        )}
                      </span>

                    </div>


                    <div className="mt-4 grid grid-cols-2 gap-3">

                      <div className="rounded-xl bg-slate-50 p-3">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Comisión
                        </p>

                        <p className="mt-1 text-lg font-bold text-emerald-700">
                          Bs {dinero(
                            comision.monto
                          )}
                        </p>

                      </div>


                      <div className="rounded-xl bg-slate-50 p-3">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Tipo
                        </p>

                        <p className="mt-1 text-sm font-bold text-violet-700">
                          {textoNivel(
                            comision.nivel
                          )}
                        </p>

                      </div>

                    </div>


                    <div className="mt-4 grid grid-cols-2 gap-4">

                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Base
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {comision.montoBase ===
                          null
                            ? "-"
                            : `Bs ${dinero(
                                comision.montoBase
                              )}`}
                        </p>

                      </div>


                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Porcentaje
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {comision.porcentaje ===
                          null
                            ? "-"
                            : `${dinero(
                                comision.porcentaje
                              )}%`}
                        </p>

                      </div>

                    </div>


                    <div className="mt-4 border-t border-slate-100 pt-4">

                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Origen
                      </p>

                      <Link
                        href={`/admin/multinivel/${comision.origenId}`}
                        className="mt-1 block text-sm font-semibold text-slate-800"
                      >
                        {comision.origenNombre}
                      </Link>

                      <p className="mt-1 font-mono text-xs text-slate-400">
                        {comision.origenCodigo}
                      </p>

                    </div>


                    {comision.pedidoId &&
                      comision.pedidoCodigo && (

                      <div className="mt-4">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Pedido
                        </p>

                        <Link
                          href={`/admin/pedidos/${comision.pedidoId}`}
                          className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs font-bold text-blue-600"
                        >
                          <ReceiptText className="h-3.5 w-3.5" />

                          {comision.pedidoCodigo}
                        </Link>

                      </div>

                    )}


                    <div className="mt-4">

                      <AccionesComision
                        id={
                          comision.id
                        }
                        estado={
                          comision.estado
                        }
                      />

                    </div>

                  </article>
                );
              }
            )}

          </div>


          {/* ESCRITORIO */}
          <div className="hidden overflow-x-auto md:block">

            <table className="w-full min-w-[1350px] text-left text-sm">

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
                          (cell) => (

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
              comision
              {resultados === 1
                ? ""
                : "es"}
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
