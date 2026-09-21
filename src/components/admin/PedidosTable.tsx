"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Eye,
  Search,
  SlidersHorizontal,
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


export type PedidoAdminRow = {
  id: string;
  codigo: string;

  estado:
    | "NUEVO"
    | "CONFIRMADO"
    | "PAGO_REPORTADO"
    | "PAGADO"
    | "COMPLETADO"
    | "CANCELADO";

  nombreCliente: string | null;
  telefonoCliente: string | null;

  compradorNombre: string;
  compradorTipo: string;

  vendedorNombre: string;
  vendedorCodigo: string | null;

  total: number;
  totalCV: number;
  totalPV: number;

  productos: number;
  requiereCotizacion: boolean;

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


function dinero(
  valor: number
) {
  return new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(valor);
}


function textoEstado(
  estado: PedidoAdminRow["estado"]
) {
  switch (estado) {
    case "NUEVO":
      return "Nuevo";

    case "CONFIRMADO":
      return "Confirmado";

    case "PAGO_REPORTADO":
      return "Pago reportado";

    case "PAGADO":
      return "Pagado";

    case "COMPLETADO":
      return "Completado";

    case "CANCELADO":
      return "Cancelado";
  }
}


function estiloEstado(
  estado: PedidoAdminRow["estado"]
) {
  switch (estado) {
    case "NUEVO":
      return "bg-yellow-50 text-yellow-700 ring-yellow-600/10";

    case "CONFIRMADO":
      return "bg-blue-50 text-blue-700 ring-blue-600/10";

    case "PAGO_REPORTADO":
      return "bg-orange-50 text-orange-700 ring-orange-600/10";

    case "PAGADO":
      return "bg-green-50 text-green-700 ring-green-600/10";

    case "COMPLETADO":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";

    case "CANCELADO":
      return "bg-red-50 text-red-700 ring-red-600/10";
  }
}


const columns:
  Array<
    ColumnDef<
      typeof features,
      PedidoAdminRow
    >
  > = [
  {
    accessorKey: "codigo",

    header: "Pedido",

    cell: ({ row }) => {
      const pedido =
        row.original;

      return (
        <div>

          <p className="font-mono text-sm font-bold text-slate-900">
            {pedido.codigo}
          </p>

          {pedido.requiereCotizacion && (
            <p className="mt-1 text-[11px] font-semibold text-orange-600">
              Requiere cotización
            </p>
          )}

        </div>
      );
    },
  },


  {
    id: "comprador",

    accessorFn: (row) =>
      [
        row.compradorNombre,
        row.telefonoCliente,
        row.compradorTipo,
      ]
        .filter(Boolean)
        .join(" "),

    header: "Comprador",

    cell: ({ row }) => {
      const pedido =
        row.original;

      return (
        <div>

          <p className="font-medium text-slate-900">
            {pedido.compradorNombre}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {pedido.telefonoCliente ||
              pedido.compradorTipo}
          </p>

        </div>
      );
    },
  },


  {
    id: "vendedor",

    accessorFn: (row) =>
      [
        row.vendedorNombre,
        row.vendedorCodigo,
      ]
        .filter(Boolean)
        .join(" "),

    header: "Vendedor",

    cell: ({ row }) => {
      const pedido =
        row.original;

      return (
        <div>

          <p className="font-medium text-slate-900">
            {pedido.vendedorNombre}
          </p>

          {pedido.vendedorCodigo && (
            <p className="mt-1 font-mono text-xs font-semibold text-blue-600">
              {pedido.vendedorCodigo}
            </p>
          )}

        </div>
      );
    },
  },


  {
    accessorKey: "productos",

    header: "Prod.",

    enableGlobalFilter: false,

    cell: ({ row }) => (
      <span className="font-semibold text-slate-700">
        {row.original.productos}
      </span>
    ),
  },


  {
    accessorKey: "total",

    header: "Total",

    enableGlobalFilter: false,

    cell: ({ row }) => (
      <span className="font-bold text-slate-900">
        Bs {dinero(
          row.original.total
        )}
      </span>
    ),
  },


  {
    accessorKey: "totalCV",

    header: "CV",

    enableGlobalFilter: false,

    cell: ({ row }) => (
      <span className="font-semibold text-emerald-700">
        {dinero(
          row.original.totalCV
        )}
      </span>
    ),
  },


  {
    accessorKey: "totalPV",

    header: "PV",

    enableGlobalFilter: false,

    cell: ({ row }) => (
      <span className="font-semibold text-blue-700">
        {dinero(
          row.original.totalPV
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
    id: "accion",

    header: "Acción",

    enableGlobalFilter: false,
    enableSorting: false,

    cell: ({ row }) => (
      <Link
        href={`/admin/pedidos/${row.original.id}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
      >
        <Eye className="h-3.5 w-3.5" />
        Ver
      </Link>
    ),
  },
];


const FILTROS: Array<{
  valor:
    | "TODOS"
    | PedidoAdminRow["estado"];
  etiqueta: string;
}> = [
  {
    valor: "TODOS",
    etiqueta: "Todos",
  },
  {
    valor: "NUEVO",
    etiqueta: "Nuevos",
  },
  {
    valor: "CONFIRMADO",
    etiqueta: "Confirmados",
  },
  {
    valor: "PAGO_REPORTADO",
    etiqueta: "Pago reportado",
  },
  {
    valor: "PAGADO",
    etiqueta: "Pagados",
  },
  {
    valor: "COMPLETADO",
    etiqueta: "Completados",
  },
  {
    valor: "CANCELADO",
    etiqueta: "Cancelados",
  },
];


export default function PedidosTable({
  data,
}: {
  data: PedidoAdminRow[];
}) {
  const [
    estadoFiltro,
    setEstadoFiltro,
  ] = useState<
    | "TODOS"
    | PedidoAdminRow["estado"]
  >("TODOS");


  const datosEstado =
    useMemo(
      () => {
        if (
          estadoFiltro ===
          "TODOS"
        ) {
          return data;
        }

        return data.filter(
          (pedido) =>
            pedido.estado ===
            estadoFiltro
        );
      },
      [
        data,
        estadoFiltro,
      ]
    );


  const table =
    useTable({
      features,

      columns,

      data:
        datosEstado,

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


  function cambiarEstado(
    valor:
      | "TODOS"
      | PedidoAdminRow["estado"]
  ) {
    setEstadoFiltro(valor);

    table.firstPage();
  }


  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

      <div className="border-b border-slate-100 p-5 md:p-6">

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

          <div>

            <h2 className="text-lg font-bold text-slate-900">
              Historial de pedidos
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Busca, filtra y ordena las operaciones registradas.
            </p>

          </div>


          <div className="relative w-full xl:w-[360px]">

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
              placeholder="Buscar código, cliente o vendedor..."
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
            (filtro) => {
              const activo =
                estadoFiltro ===
                filtro.valor;

              const cantidad =
                filtro.valor ===
                "TODOS"
                  ? data.length
                  : data.filter(
                      (pedido) =>
                        pedido.estado ===
                        filtro.valor
                    ).length;

              return (
                <button
                  key={
                    filtro.valor
                  }
                  type="button"
                  onClick={() =>
                    cambiarEstado(
                      filtro.valor
                    )
                  }
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${
                    activo
                      ? "bg-[#10182D] text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {filtro.etiqueta}

                  <span
                    className={`ml-1.5 ${
                      activo
                        ? "text-white/60"
                        : "text-slate-400"
                    }`}
                  >
                    {cantidad}
                  </span>
                </button>
              );
            }
          )}

        </div>

      </div>


      {resultados === 0 ? (

        <div className="p-10 text-center">

          <Search className="mx-auto h-8 w-8 text-slate-300" />

          <p className="mt-4 font-semibold text-slate-700">
            No encontramos pedidos
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Cambia el filtro o intenta con otra búsqueda.
          </p>

        </div>

      ) : (

        <>

          {/* MÓVIL */}
          <div className="divide-y divide-slate-100 md:hidden">

            {filas.map(
              (row) => {
                const pedido =
                  row.original;

                return (
                  <article
                    key={pedido.id}
                    className="p-4"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="font-mono text-sm font-bold text-slate-900">
                          {pedido.codigo}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(
                            pedido.createdAt
                          ).toLocaleString(
                            "es-BO"
                          )}
                        </p>

                      </div>


                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${estiloEstado(
                          pedido.estado
                        )}`}
                      >
                        {textoEstado(
                          pedido.estado
                        )}
                      </span>

                    </div>


                    {pedido.requiereCotizacion && (
                      <div className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
                        Requiere cotización
                      </div>
                    )}


                    <div className="mt-4 grid grid-cols-2 gap-4">

                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Comprador
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {pedido.compradorNombre}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {pedido.telefonoCliente ||
                            pedido.compradorTipo}
                        </p>

                      </div>


                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Vendedor
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {pedido.vendedorNombre}
                        </p>

                        {pedido.vendedorCodigo && (
                          <p className="mt-1 font-mono text-xs text-blue-600">
                            {pedido.vendedorCodigo}
                          </p>
                        )}

                      </div>

                    </div>


                    <div className="mt-4 grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3">

                      <div>

                        <p className="text-[10px] uppercase text-slate-400">
                          Prod.
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {pedido.productos}
                        </p>

                      </div>


                      <div>

                        <p className="text-[10px] uppercase text-slate-400">
                          Total
                        </p>

                        <p className="mt-1 text-xs font-bold text-slate-900">
                          Bs{" "}
                          {dinero(
                            pedido.total
                          )}
                        </p>

                      </div>


                      <div>

                        <p className="text-[10px] uppercase text-slate-400">
                          CV
                        </p>

                        <p className="mt-1 text-xs font-bold text-emerald-700">
                          {dinero(
                            pedido.totalCV
                          )}
                        </p>

                      </div>


                      <div>

                        <p className="text-[10px] uppercase text-slate-400">
                          PV
                        </p>

                        <p className="mt-1 text-xs font-bold text-blue-700">
                          {dinero(
                            pedido.totalPV
                          )}
                        </p>

                      </div>

                    </div>


                    <Link
                      href={`/admin/pedidos/${pedido.id}`}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#10182D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      <Eye className="h-4 w-4" />
                      Ver detalle
                    </Link>

                  </article>
                );
              }
            )}

          </div>


          {/* ESCRITORIO */}
          <div className="hidden overflow-x-auto md:block">

            <table className="w-full min-w-[1180px] text-left text-sm">

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

            <div>

              <p className="text-sm text-slate-500">
                Mostrando{" "}
                <span className="font-semibold text-slate-800">
                  {filas.length}
                </span>{" "}
                de{" "}
                <span className="font-semibold text-slate-800">
                  {resultados}
                </span>{" "}
                resultado
                {resultados === 1
                  ? ""
                  : "s"}
              </p>

            </div>


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
