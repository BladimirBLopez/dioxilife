"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "../LogoutButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <header className="md:hidden flex items-center justify-between bg-brand-blue text-white px-4 py-3 sticky top-0 z-10">
        <button
          onClick={() => setOpen(!open)}
          aria-label="Abrir menú"
          className="text-2xl leading-none px-2"
        >
          ☰
        </button>
        <span className="font-semibold">Panel Admin</span>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm bg-brand-pink rounded px-3 py-1"
        >
          Ver tienda
        </a>
      </header>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static top-0 left-0 h-full w-64 md:w-56 bg-brand-blue text-white flex flex-col p-4 z-30 overflow-y-auto
          transform transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="hidden md:flex justify-center mb-6">
          <Image src="/logo.png" alt="DioxiLife" width={120} height={99} />
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:block text-sm bg-brand-pink rounded px-3 py-2 mb-6 text-center font-medium hover:opacity-90"
        >
          Ver tienda
        </a>

        <nav className="flex flex-col gap-1 flex-1">
          <Link href="/admin" onClick={() => setOpen(false)} className="rounded px-3 py-2 hover:bg-white/10">
            Inicio
          </Link>
          <Link href="/admin/banner" onClick={() => setOpen(false)} className="rounded px-3 py-2 hover:bg-white/10">
            Banner
          </Link>
          <Link href="/admin/categorias" onClick={() => setOpen(false)} className="rounded px-3 py-2 hover:bg-white/10">
            Categorías
          </Link>
          <Link href="/admin/productos" onClick={() => setOpen(false)} className="rounded px-3 py-2 hover:bg-white/10">
            Productos
          </Link>
          <Link href="/admin/protocolos" onClick={() => setOpen(false)} className="rounded px-3 py-2 hover:bg-white/10">
            Protocolos
          </Link>
          <Link href="/admin/testimonios" onClick={() => setOpen(false)} className="rounded px-3 py-2 hover:bg-white/10">
            Testimonios
          </Link>
          <Link href="/admin/sucursales" onClick={() => setOpen(false)} className="rounded px-3 py-2 hover:bg-white/10">
            Sucursales
          </Link>
        </nav>

        <LogoutButton />
      </aside>

      <main className="flex-1 bg-gray-50 p-6 min-w-0">{children}</main>
    </div>
  );
}
