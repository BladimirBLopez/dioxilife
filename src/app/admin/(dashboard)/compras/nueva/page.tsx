"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import "react-day-picker/style.css";

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

  const hoy = useMemo(() => {
    const partes = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/La_Paz",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const year = partes.find((p) => p.type === "year")?.value;
    const month = partes.find((p) => p.type === "month")?.value;
    const day = partes.find((p) => p.type === "day")?.value;

    return `${year}-${month}-${day}`;
  }, []);

  const [fechaCompra, setFechaCompra] = useState(hoy);

  const [
    mostrarCalendario,
    setMostrarCalendario,
  ] = useState(false);

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
            fechaCompra,
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
          Registra la compra y confirma la recepción cuando llegue la mercadería.
        </p>
      </div>


      {(error || mensaje) && (
        <div className="rounded-xl border p-3 text-sm">
          {error || mensaje}
        </div>
      )}


      {mostrarCalendario && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() =>
            setMostrarCalendario(false)
          }
        >

          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="mb-4 flex items-center justify-between">

              <div>

                <p className="text-sm font-semibold text-[#1F1B24]">
                  Fecha de compra
                </p>

                <p className="text-xs text-[#77737D]">
                  Selecciona cuándo realizaste la compra.
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setMostrarCalendario(false)
                }
                className="rounded-lg p-2 text-[#77737D] transition hover:bg-[#F5F5F7]"
                aria-label="Cerrar calendario"
              >
                <X className="h-5 w-5" />
              </button>

            </div>


            <div className="flex justify-center">

              <DayPicker
                mode="single"
                locale={es}
                selected={
                  parseISO(fechaCompra)
                }
                defaultMonth={
                  parseISO(fechaCompra)
                }
                endMonth={
                  parseISO(hoy)
                }
                disabled={{
                  after: parseISO(hoy),
                }}
                onSelect={(fecha) => {
                  if (!fecha) {
                    return;
                  }

                  setFechaCompra(
                    format(
                      fecha,
                      "yyyy-MM-dd"
                    )
                  );

                  setMostrarCalendario(
                    false
                  );
                }}
              />

            </div>


            <div className="mt-4 border-t pt-4">

              <button
                type="button"
                onClick={() => {
                  setFechaCompra(hoy);
                  setMostrarCalendario(false);
                }}
                className="w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-[#F8F8FA]"
              >
                Usar fecha de hoy
              </button>

            </div>

          </div>

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


        <div className="grid gap-4 md:grid-cols-2">

          <div>

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

          </div>


          <div>

            <label className="mb-1.5 block text-xs font-medium text-[#77737D]">
              Fecha de compra
            </label>

            <button
              type="button"
              onClick={() =>
                setMostrarCalendario(true)
              }
              className="admin-input flex w-full items-center justify-between text-left"
            >
              <span className="font-medium text-[#1F1B24]">
                {format(
                  parseISO(fechaCompra),
                  "dd/MM/yyyy"
                )}
              </span>

              <CalendarDays className="h-5 w-5 shrink-0 text-brand-pink" />
            </button>

            <p className="mt-1 text-xs text-[#77737D]">
              Fecha real en que se realizó la compra.
            </p>

          </div>

        </div>


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
