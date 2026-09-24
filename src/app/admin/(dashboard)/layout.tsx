import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";
import AdminShell from "@/components/AdminShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin =
    await obtenerAdminActual();

  if (!admin) {
    redirect("/admin/login");
  }

  const [
    pagosReportados,
    pedidosNuevos,
    productosInventario,
  ] = await Promise.all([
    prisma.pedido.count({
      where: {
        estado: "PAGO_REPORTADO",
      },
    }),

    prisma.pedido.count({
      where: {
        estado: "NUEVO",
      },
    }),

    prisma.producto.findMany({
      where: {
        activo: true,
      },
      select: {
        stockActual: true,
        stockMinimo: true,
      },
    }),
  ]);

  const stockBajo =
    productosInventario.filter(
      (producto) =>
        producto.stockActual <=
        producto.stockMinimo
    ).length;

  return (
    <AdminShell
      admin={{
        usuario: admin.usuario,
        rol: admin.rol,
      }}
      alertas={{
        pagosReportados,
        pedidosNuevos,
        stockBajo,
      }}
    >
      {children}
    </AdminShell>
  );
}
