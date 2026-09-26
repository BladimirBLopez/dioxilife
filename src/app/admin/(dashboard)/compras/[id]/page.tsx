export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AccionesCompra from "./AccionesCompra";
import ExportarCompraPDF from "./ExportarCompraPDF";

function dinero(valor: unknown) {
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(String(valor ?? 0)));
}

function fechaHora(valor: Date | null) {
  if (!valor) {
    return "Pendiente";
  }

  return new Intl.DateTimeFormat("es-BO", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(valor);
}

function fechaSolo(valor: Date | null) {
  if (!valor) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-BO", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(valor);
}

function nombreEstado(
  estado: string
) {
  if (
    estado === "RECIBIDA"
  ) {
    return "Recibida";
  }

  if (
    estado === "ANULADA"
  ) {
    return "Anulada";
  }

  return "Pendiente de recibir";
}

function claseEstado(
  estado: string
) {
  if (
    estado === "RECIBIDA"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    estado === "ANULADA"
  ) {
    return "bg-red-50 text-red-600";
  }

  return "bg-amber-50 text-amber-700";
}

export default async function DetalleCompraPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const compra =
    await prisma.compra.findUnique({
      where: {
        id,
      },

      include: {
        proveedor: true,

        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });


  if (!compra) {
    notFound();
  }


  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-3">

        <div>
          <p className="text-xs uppercase tracking-wider text-brand-pink font-semibold">
            Abastecimiento
          </p>

          <h1 className="text-2xl font-bold text-[#1F1B24]">
            Compra {compra.codigo}
          </h1>

          <p className="text-sm text-[#77737D]">
            Detalle de compra y recepción de mercadería.
          </p>
        </div>


        <div className="flex flex-wrap gap-2">

          <ExportarCompraPDF
            codigo={compra.codigo}
            proveedor={compra.proveedor.nombre}
            estado={compra.estado}
            fechaCompra={fechaSolo(compra.fechaCompra)}
            fechaRegistro={fechaHora(compra.createdAt)}
            fechaRecepcion={fechaHora(compra.recibidaAt)}
            total={Number(compra.total)}
            productos={compra.detalles.map((detalle) => ({
              nombre: detalle.producto.nombre,
              cantidad: detalle.cantidad,
              costoUnitario: Number(detalle.costoUnitario),
              subtotal: Number(detalle.subtotal),
            }))}
          />

          <Link
            href="/admin/compras"
            className="admin-btn-secondary"
          >
            Volver
          </Link>

        </div>

      </div>


      <div className="grid gap-4 md:grid-cols-3">

        <div className="admin-card p-5">

          <p className="text-xs text-[#77737D]">
            Proveedor
          </p>

          <p className="mt-2 font-semibold">
            {compra.proveedor.nombre}
          </p>

          <p className="text-sm text-[#77737D]">
            {compra.proveedor.telefono || "Sin teléfono"}
          </p>

        </div>


        <div className="admin-card p-5">

          <p className="text-xs text-[#77737D]">
            Estado
          </p>

          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${claseEstado(compra.estado)}`}
          >
            {nombreEstado(compra.estado)}
          </span>

        </div>


        <div className="admin-card p-5">

          <p className="text-xs text-[#77737D]">
            Total
          </p>

          <p className="mt-2 text-xl font-bold">
            Bs {dinero(compra.total)}
          </p>

        </div>

      </div>


      <div className="admin-card p-5">

        <div className="grid gap-4 md:grid-cols-3">

          <div>

            <p className="text-xs text-[#77737D]">
              Fecha de compra
            </p>

            <p className="mt-1 font-medium">
              {fechaSolo(compra.fechaCompra)}
            </p>

          </div>


          <div>

            <p className="text-xs text-[#77737D]">
              Registrada en el sistema
            </p>

            <p className="mt-1 font-medium">
              {fechaHora(compra.createdAt)}
            </p>

          </div>


          <div>

            <p className="text-xs text-[#77737D]">
              Recepción
            </p>

            <p className="mt-1 font-medium">
              {fechaHora(compra.recibidaAt)}
            </p>

          </div>

        </div>

      </div>


      <div className="admin-card overflow-hidden">

        <div className="border-b p-5">
          <h2 className="font-semibold">
            Productos
          </h2>
        </div>


        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-[#F8F8FA]">
              <tr>

                <th className="p-4 text-left">
                  Producto
                </th>

                <th className="p-4 text-center">
                  Cantidad
                </th>

                <th className="p-4 text-center">
                  Costo
                </th>

                <th className="p-4 text-center">
                  Subtotal
                </th>

              </tr>
            </thead>


            <tbody>

              {compra.detalles.map(
                (detalle) => (

                  <tr
                    key={detalle.id}
                    className="border-t"
                  >

                    <td className="p-4 font-medium">
                      {detalle.producto.nombre}
                    </td>

                    <td className="p-4 text-center">
                      {detalle.cantidad}
                    </td>

                    <td className="p-4 text-center">
                      Bs {dinero(detalle.costoUnitario)}
                    </td>

                    <td className="p-4 text-center font-semibold">
                      Bs {dinero(detalle.subtotal)}
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>


      <div className="admin-card p-5">

        <h2 className="mb-4 font-semibold">
          Recepción
        </h2>

        <AccionesCompra
          id={compra.id}
          estado={compra.estado}
        />

      </div>




    </div>
  );
}
