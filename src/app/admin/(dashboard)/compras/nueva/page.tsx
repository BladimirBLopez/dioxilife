"use client";

import { useEffect, useMemo, useState } from "react";

import RegistroRapidoProveedor from "@/components/admin/RegistroRapidoProveedor";

type Proveedor = {
  id: string;
  nombre: string;
  activo: boolean;
};

type Producto = {
  id: string;
  nombre: string;
  stockActual: number;
};

type Detalle = {
  productoId: string;
  cantidad: number;
  costoUnitario: number;
};

export default function NuevaCompraPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const [proveedorId, setProveedorId] = useState("");

  const [
    mostrarNuevoProveedor,
    setMostrarNuevoProveedor,
  ] = useState(false);

  const [detalles, setDetalles] = useState<Detalle[]>([]);

  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [costo, setCosto] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function cargar() {
    const [resProv, resProd] = await Promise.all([
      fetch("/api/admin/proveedores"),
      fetch("/api/admin/productos"),
    ]);

    setProveedores(await resProv.json());
    setProductos(await resProd.json());
  }

  useEffect(() => {
    cargar();
  }, []);

  function agregarProducto() {
    setError("");

    if (!productoId) {
      setError("Seleccione un producto");
      return;
    }

    const cant = Number(cantidad);
    const precio = Number(costo);

    if (!Number.isInteger(cant) || cant <= 0) {
      setError("Cantidad inválida");
      return;
    }

    if (!Number.isFinite(precio) || precio < 0) {
      setError("Costo inválido");
      return;
    }

    setDetalles((actual) => [
      ...actual,
      {
        productoId,
        cantidad: cant,
        costoUnitario: precio,
      },
    ]);

    setProductoId("");
    setCantidad("1");
    setCosto("");
  }

  function quitarProducto(index: number) {
    setDetalles((actual) =>
      actual.filter((_, i) => i !== index)
    );
  }

  const total = useMemo(() => {
    return detalles.reduce(
      (suma, item) =>
        suma + item.cantidad * item.costoUnitario,
      0
    );
  }, [detalles]);

  async function registrarCompra() {
    setError("");
    setMensaje("");

    if (!proveedorId) {
      setError("Seleccione proveedor");
      return;
    }

    if (detalles.length === 0) {
      setError("Agregue productos");
      return;
    }

    setGuardando(true);

    try {
      const res = await fetch(
        "/api/admin/compras",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            proveedorId,
            detalles,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Error al registrar"
        );
      }

      setMensaje(
        `Compra ${data.codigo} registrada correctamente`
      );

      setDetalles([]);
      setProveedorId("");

    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Error"
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-6">

      <div>
        <p className="text-xs uppercase tracking-widest text-brand-pink">
          Abastecimiento
        </p>

        <h1 className="text-2xl font-bold">
          Nueva compra
        </h1>

        <p className="text-sm text-[#77737D]">
          Registra compras a proveedores y aumenta automáticamente el inventario.
        </p>
      </div>


      {(error || mensaje) && (
        <div className="rounded-xl border p-3 text-sm">
          {error || mensaje}
        </div>
      )}


      <div className="admin-card p-5 space-y-4">

        <div className="flex items-center justify-between gap-3">

          <label className="block text-sm font-medium">
            Proveedor
          </label>

          <button
            type="button"
            onClick={() =>
              setMostrarNuevoProveedor(
                true
              )
            }
            className="text-sm font-semibold text-brand-pink hover:underline"
          >
            + Nuevo proveedor
          </button>

        </div>


        <select
          value={
            proveedorId
          }
          onChange={(e) =>
            setProveedorId(
              e.target.value
            )
          }
          className="admin-input w-full"
        >

          <option value="">
            Seleccionar proveedor
          </option>

          {proveedores
            .filter(
              (p) =>
                p.activo
            )
            .map(
              (p) => (

                <option
                  key={
                    p.id
                  }
                  value={
                    p.id
                  }
                >
                  {p.nombre}
                </option>

              )
            )}

        </select>


        {proveedores.length === 0 && (

          <p className="text-xs text-[#77737D]">
            Todavía no tienes proveedores registrados. Usa “+ Nuevo proveedor” para crear el primero.
          </p>

        )}


        <div className="grid gap-3 md:grid-cols-4">

          <select
            value={productoId}
            onChange={(e)=>setProductoId(e.target.value)}
            className="admin-input"
          >
            <option value="">
              Producto
            </option>

            {productos.map(p=>(
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}

          </select>


          <input
            className="admin-input"
            type="number"
            value={cantidad}
            onChange={(e)=>setCantidad(e.target.value)}
            placeholder="Cantidad"
          />


          <input
            className="admin-input"
            type="number"
            value={costo}
            onChange={(e)=>setCosto(e.target.value)}
            placeholder="Costo unitario"
          />


          <button
            type="button"
            onClick={agregarProducto}
            className="admin-btn-primary"
          >
            Agregar
          </button>

        </div>

      </div>


      <div className="admin-card overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-[#F8F8FA]">
            <tr>
              <th className="p-3 text-left">
                Producto
              </th>

              <th className="p-3">
                Cantidad
              </th>

              <th className="p-3">
                Costo
              </th>

              <th className="p-3">
                Subtotal
              </th>

              <th />
            </tr>
          </thead>


          <tbody>

            {detalles.map((item,index)=>{

              const producto =
                productos.find(
                  p=>p.id===item.productoId
                );

              return (
                <tr key={index}
                  className="border-t">

                  <td className="p-3">
                    {producto?.nombre}
                  </td>

                  <td className="p-3 text-center">
                    {item.cantidad}
                  </td>

                  <td className="p-3 text-center">
                    Bs {item.costoUnitario}
                  </td>

                  <td className="p-3 text-center">
                    Bs {item.cantidad * item.costoUnitario}
                  </td>

                  <td className="p-3">
                    <button
                      onClick={()=>quitarProducto(index)}
                      className="text-red-600"
                    >
                      Quitar
                    </button>
                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>


        <div className="p-5 text-right font-bold">
          Total: Bs {total.toFixed(2)}
        </div>


      </div>


      <button
        disabled={guardando}
        onClick={registrarCompra}
        className="admin-btn-primary"
      >
        {guardando
          ? "Registrando..."
          : "Registrar compra"}
      </button>


      {mostrarNuevoProveedor && (

        <RegistroRapidoProveedor
          onClose={() =>
            setMostrarNuevoProveedor(
              false
            )
          }

          onCreado={
            (proveedor) => {

              setProveedores(
                (actual) =>
                  [
                    ...actual,
                    proveedor,
                  ].sort(
                    (a, b) =>
                      a.nombre.localeCompare(
                        b.nombre
                      )
                  )
              );

              setProveedorId(
                proveedor.id
              );
            }
          }
        />

      )}


    </div>
  );
}
