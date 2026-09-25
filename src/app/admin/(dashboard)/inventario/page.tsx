"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Boxes,
  PackageCheck,
  PackageX,
  RefreshCcw,
  Search,
  TriangleAlert,
} from "lucide-react";

type ProductoInventario = {
  id: string;
  nombre: string;
  imagenUrl: string | null;
  activo: boolean;
  precio: string;
  stockActual: number;
  stockMinimo: number;
  categoria: {
    nombre: string;
  };
};

type Movimiento = {
  id: string;
  tipo:
    | "ENTRADA"
    | "SALIDA"
    | "AJUSTE"
    | "VENTA"
    | "DEVOLUCION";
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo: string | null;
  createdAt: string;
  producto: {
    id: string;
    nombre: string;
  };
  admin: {
    usuario: string;
  } | null;
};

function estadoProducto(
  producto: ProductoInventario
) {
  if (producto.stockActual <= 0) {
    return {
      texto: "Sin stock",
      clase:
        "bg-red-50 text-red-700 border-red-200",
    };
  }

  if (
    producto.stockActual <=
    producto.stockMinimo
  ) {
    return {
      texto: "Bajo stock",
      clase:
        "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  return {
    texto: "Disponible",
    clase:
      "bg-green-50 text-green-700 border-green-200",
  };
}

function signoMovimiento(
  movimiento: Movimiento
) {
  if (
    movimiento.tipo === "ENTRADA" ||
    movimiento.tipo === "DEVOLUCION"
  ) {
    return `+${Math.abs(movimiento.cantidad)}`;
  }

  if (
    movimiento.tipo === "SALIDA" ||
    movimiento.tipo === "VENTA"
  ) {
    return `-${Math.abs(movimiento.cantidad)}`;
  }

  return movimiento.cantidad > 0
    ? `+${movimiento.cantidad}`
    : `${movimiento.cantidad}`;
}

export default function InventarioPage() {
  const [productos, setProductos] =
    useState<ProductoInventario[]>([]);

  const [movimientos, setMovimientos] =
    useState<Movimiento[]>([]);

  const [busqueda, setBusqueda] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [productoSeleccionado, setProductoSeleccionado] =
    useState<ProductoInventario | null>(null);

  const [cantidad, setCantidad] =
    useState("");

  const [motivo, setMotivo] =
    useState("");

  const [minimos, setMinimos] =
    useState<Record<string, string>>({});

  async function cargar() {
    setCargando(true);
    setError("");

    try {
      const res =
        await fetch("/api/admin/inventario");

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "No se pudo cargar el inventario"
        );
      }

      setProductos(data.productos);
      setMovimientos(data.movimientos);

      const valores: Record<string, string> =
        {};

      for (const producto of data.productos) {
        valores[producto.id] =
          String(producto.stockMinimo);
      }

      setMinimos(valores);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Error al cargar"
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const productosFiltrados =
    useMemo(() => {
      const q =
        busqueda.trim().toLowerCase();

      if (!q) {
        return productos;
      }

      return productos.filter(
        (producto) =>
          producto.nombre
            .toLowerCase()
            .includes(q) ||
          producto.categoria.nombre
            .toLowerCase()
            .includes(q)
      );
    }, [productos, busqueda]);

  const totalUnidades =
    productos.reduce(
      (total, producto) =>
        total + producto.stockActual,
      0
    );

  const valorInventario =
    productos.reduce(
      (total, producto) =>
        total +
        producto.stockActual *
          Number(producto.precio),
      0
    );

  const bajoStock =
    productos.filter(
      (producto) =>
        producto.stockActual > 0 &&
        producto.stockActual <=
          producto.stockMinimo
    ).length;

  const sinStock =
    productos.filter(
      (producto) =>
        producto.stockActual <= 0
    ).length;

  function abrirAjuste(
    producto: ProductoInventario
  ) {
    setProductoSeleccionado(producto);

    setCantidad(
      String(producto.stockActual)
    );

    setMotivo("");
    setError("");
    setMensaje("");
  }

  async function registrarMovimiento() {
    if (!productoSeleccionado) {
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const res =
        await fetch(
          "/api/admin/inventario",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              productoId:
                productoSeleccionado.id,
              tipo: "AJUSTE",
              cantidad,
              motivo,
            }),
          }
        );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "No se pudo registrar el movimiento"
        );
      }

      setMensaje(
        "Movimiento registrado correctamente."
      );

      setProductoSeleccionado(null);
      setCantidad("");
      setMotivo("");

      await cargar();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Error al registrar"
      );
    } finally {
      setGuardando(false);
    }
  }

  async function guardarMinimo(
    productoId: string
  ) {
    setError("");
    setMensaje("");

    const valor =
      minimos[productoId] ?? "";

    try {
      const res =
        await fetch(
          "/api/admin/inventario",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              productoId,
              stockMinimo: valor,
            }),
          }
        );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "No se pudo guardar el mínimo"
        );
      }

      setMensaje(
        "Stock mínimo actualizado."
      );

      await cargar();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Error al actualizar"
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-pink">
          Control de existencias
        </p>

        <h1 className="mt-1 text-2xl font-bold text-[#1F1B24]">
          Inventario
        </h1>

        <p className="mt-1 text-sm text-[#77737D]">
          Consulta existencias, movimientos,
          niveles mínimos y realiza ajustes excepcionales de stock.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="admin-card p-4">
          <Boxes className="h-5 w-5 text-brand-blue" />
          <p className="mt-3 text-2xl font-bold">
            {productos.length}
          </p>
          <p className="text-xs text-[#77737D]">
            Productos
          </p>
        </div>

        <div className="admin-card p-4">
          <PackageCheck className="h-5 w-5 text-green-600" />
          <p className="mt-3 text-2xl font-bold">
            {totalUnidades}
          </p>
          <p className="text-xs text-[#77737D]">
            Unidades disponibles
          </p>
        </div>

        <div className="admin-card p-4">
          <Boxes className="h-5 w-5 text-blue-600" />
          <p className="mt-3 text-2xl font-bold">
            Bs {valorInventario.toFixed(2)}
          </p>
          <p className="text-xs text-[#77737D]">
            Valor inventario
          </p>
        </div>

        <div className="admin-card p-4">
          <TriangleAlert className="h-5 w-5 text-amber-600" />
          <p className="mt-3 text-2xl font-bold">
            {bajoStock}
          </p>
          <p className="text-xs text-[#77737D]">
            Bajo stock
          </p>
        </div>

        <div className="admin-card p-4">
          <PackageX className="h-5 w-5 text-red-600" />
          <p className="mt-3 text-2xl font-bold">
            {sinStock}
          </p>
          <p className="text-xs text-[#77737D]">
            Sin stock
          </p>
        </div>
      </div>

      {(error || mensaje) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {error || mensaje}
        </div>
      )}

      {productoSeleccionado && (
        <div className="admin-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-pink">
                Ajuste de inventario
              </p>

              <h2 className="mt-1 font-semibold text-[#1F1B24]">
                {productoSeleccionado.nombre}
              </h2>

              <p className="text-xs text-[#77737D]">
                Stock actual:{" "}
                {productoSeleccionado.stockActual}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setProductoSeleccionado(null)
              }
              className="text-sm text-[#77737D]"
            >
              Cerrar
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Utiliza el ajuste únicamente cuando el stock físico real
            sea diferente al registrado por el sistema.
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#77737D]">
                Nuevo stock real
              </label>

              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={cantidad}
                onChange={(e) =>
                  setCantidad(e.target.value)
                }
                placeholder="Nuevo stock real"
                className="admin-input"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#77737D]">
                Motivo del ajuste
              </label>

              <input
                type="text"
                value={motivo}
                onChange={(e) =>
                  setMotivo(e.target.value)
                }
                placeholder="Ej. Conteo físico, producto dañado..."
                className="admin-input"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={guardando}
            onClick={registrarMovimiento}
            className="mt-4 rounded-xl bg-[#10182D] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {guardando
              ? "Guardando..."
              : "Confirmar ajuste"}
          </button>
        </div>
      )}

      <div className="admin-card overflow-hidden">
        <div className="border-b border-black/5 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#99959F]" />

            <input
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar producto o categoría"
              className="admin-input pl-10"
            />
          </div>
        </div>

        {cargando ? (
          <div className="p-8 text-center text-sm text-[#77737D]">
            Cargando inventario...
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {productosFiltrados.map(
              (producto) => {
                const estado =
                  estadoProducto(producto);

                return (
                  <div
                    key={producto.id}
                    className="p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {producto.imagenUrl ? (
                          <img
                            src={
                              producto.imagenUrl
                            }
                            alt={producto.nombre}
                            className="h-12 w-12 shrink-0 rounded-lg bg-[#F7F7F9] object-contain p-1"
                          />
                        ) : (
                          <div className="h-12 w-12 shrink-0 rounded-lg bg-[#F7F7F9]" />
                        )}

                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#1F1B24]">
                            {producto.nombre}
                          </p>

                          <p className="text-xs text-[#77737D]">
                            {
                              producto
                                .categoria
                                .nombre
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div>
                          <p className="text-[10px] uppercase text-[#99959F]">
                            Stock
                          </p>
                          <p className="text-lg font-bold">
                            {
                              producto.stockActual
                            }
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${estado.clase}`}
                        >
                          {estado.texto}
                        </span>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            value={
                              minimos[
                                producto.id
                              ] ?? ""
                            }
                            onChange={(e) =>
                              setMinimos(
                                (actual) => ({
                                  ...actual,
                                  [producto.id]:
                                    e.target
                                      .value,
                                })
                              )
                            }
                            className="w-20 rounded-lg border border-black/10 px-2 py-2 text-sm"
                            title="Stock mínimo"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              guardarMinimo(
                                producto.id
                              )
                            }
                            className="rounded-lg border border-black/10 px-3 py-2 text-xs font-medium"
                          >
                            Mínimo
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            abrirAjuste(
                              producto
                            )
                          }
                          className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Ajustar inventario
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      <div className="admin-card overflow-hidden">
        <div className="border-b border-black/5 p-4">
          <h2 className="font-semibold text-[#1F1B24]">
            Historial de movimientos
          </h2>

          <p className="text-xs text-[#77737D]">
            Últimos 80 movimientos registrados.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#F8F8FA] text-xs uppercase text-[#77737D]">
              <tr>
                <th className="px-4 py-3">
                  Fecha
                </th>
                <th className="px-4 py-3">
                  Producto
                </th>
                <th className="px-4 py-3">
                  Tipo
                </th>
                <th className="px-4 py-3">
                  Cantidad
                </th>
                <th className="px-4 py-3">
                  Stock
                </th>
                <th className="px-4 py-3">
                  Motivo
                </th>
                <th className="px-4 py-3">
                  Usuario
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black/5">
              {movimientos.map(
                (movimiento) => (
                  <tr key={movimiento.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#77737D]">
                      {new Date(
                        movimiento.createdAt
                      ).toLocaleString(
                        "es-BO"
                      )}
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {
                        movimiento.producto
                          .nombre
                      }
                    </td>

                    <td className="px-4 py-3">
                      {movimiento.tipo}
                    </td>

                    <td className="px-4 py-3 font-semibold">
                      {signoMovimiento(
                        movimiento
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      {
                        movimiento.stockAnterior
                      }{" "}
                      →{" "}
                      {
                        movimiento.stockNuevo
                      }
                    </td>

                    <td className="max-w-[260px] px-4 py-3 text-[#77737D]">
                      {movimiento.motivo ||
                        "—"}
                    </td>

                    <td className="px-4 py-3 text-xs">
                      {movimiento.admin
                        ?.usuario ||
                        "Sistema"}
                    </td>
                  </tr>
                )
              )}

              {movimientos.length ===
                0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-[#77737D]"
                  >
                    Todavía no existen
                    movimientos de inventario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
