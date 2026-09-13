export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

export default async function AdminHome() {
  const [totalCategorias, totalProductos] = await Promise.all([
    prisma.categoria.count(),
    prisma.producto.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Resumen</h1>
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Categorías</p>
          <p className="text-2xl font-bold">{totalCategorias}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Productos</p>
          <p className="text-2xl font-bold">{totalProductos}</p>
        </div>
      </div>
    </div>
  );
}
