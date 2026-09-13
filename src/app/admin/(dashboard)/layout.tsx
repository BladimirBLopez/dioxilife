import Link from "next/link";
import LogoutButton from "../LogoutButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-black text-white flex flex-col p-4">
        <h2 className="text-lg font-semibold mb-6">Panel Admin</h2>
        <nav className="flex flex-col gap-2 flex-1">
          <Link href="/admin" className="hover:underline">
            Inicio
          </Link>
          <Link href="/admin/categorias" className="hover:underline">
            Categorías
          </Link>
          <Link href="/admin/productos" className="hover:underline">
            Productos
          </Link>
        </nav>
        <LogoutButton />
      </aside>
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
