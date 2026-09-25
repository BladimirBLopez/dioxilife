export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

function dinero(valor: unknown) {
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(String(valor ?? 0)));
}

function fecha(valor: Date) {
  return valor.toLocaleDateString("es-BO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

        movimientoInventarios: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });


  if (!compra) {
    notFound();
  }


  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-xs uppercase tracking-wider text-brand-pink font-semibold">
            Abastecimiento
          </p>

          <h1 className="text-2xl font-bold text-[#1F1B24]">
            Compra {compra.codigo}
          </h1>

          <p className="text-sm text-[#77737D]">
            Detalle de compra registrada.
          </p>
        </div>


        <Link
          href="/admin/compras"
          className="admin-btn-secondary"
        >
          Volver
        </Link>

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

          <p className="mt-2 font-semibold">
            {compra.estado}
          </p>

          <p className="text-sm text-[#77737D]">
            {fecha(compra.createdAt)}
          </p>
        </div>


        <div className="admin-card p-5">
          <p className="text-xs text-[#77737D]">
            Total inversión
          </p>

          <p className="mt-2 text-xl font-bold">
            Bs {dinero(compra.total)}
          </p>
        </div>

      </div>


      <div className="admin-card overflow-hidden">

        <div className="border-b p-5">
          <h2 className="font-semibold">
            Productos comprados
          </h2>
        </div>


        <table className="w-full text-sm">

          <thead className="bg-[#F8F8FA]">
            <tr>
              <th className="p-4 text-left">
                Producto
              </th>

              <th className="p-4">
                Cantidad
              </th>

              <th className="p-4">
                Costo unitario
              </th>

              <th className="p-4">
                Subtotal
              </th>
            </tr>
          </thead>


          <tbody>

          {compra.detalles.map((detalle)=>(

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

          ))}

          </tbody>

        </table>

      </div>


      <div className="admin-card p-5">

        <h2 className="font-semibold mb-4">
          Movimientos de inventario generados
        </h2>


        {compra.movimientoInventarios.length === 0 ? (
          <p className="text-sm text-[#77737D]">
            Sin movimientos registrados.
          </p>
        ) : (

          <div className="space-y-3">

            {compra.movimientoInventarios.map((movimiento)=>(

              <div
                key={movimiento.id}
                className="rounded-xl border p-3 text-sm"
              >

                <p className="font-medium">
                  {movimiento.tipo}
                </p>

                <p>
                  Stock: {movimiento.stockAnterior}
                  {" → "}
                  {movimiento.stockNuevo}
                </p>

                <p className="text-xs text-[#77737D]">
                  {movimiento.motivo}
                </p>

              </div>

            ))}

          </div>

        )}

      </div>


    </div>
  );
}
