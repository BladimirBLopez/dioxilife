"use client";

import { useState } from "react";
import Image from "next/image";
import CartDrawer from "./CartDrawer";

const LINKS_BASE = [
  { href: "#top", label: "Inicio" },
  { href: "#productos", label: "Productos" },
  { href: "#testimonios", label: "Testimonios" },
];

export default function SiteHeader({
  mostrarSucursales = true,
}: {
  mostrarSucursales?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const LINKS = mostrarSucursales
    ? [...LINKS_BASE, { href: "#sucursales", label: "Sucursales" }]
    : LINKS_BASE;

  return (
    <header id="top" className="bg-white border-b sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
        <Image
          src="/logo.png"
          alt="DioxiLife Bolivia"
          width={200}
          height={164}
          priority
          className="w-14 h-auto md:w-20"
        />

        <nav className="hidden md:flex gap-6">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-brand-gray hover:text-brand-pink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <CartDrawer />
          <button
            onClick={() => setOpen(!open)}
            aria-label="Abrir menú"
            className="text-2xl leading-none px-1 text-brand-blue md:hidden"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t bg-white flex flex-col">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 border-b text-sm font-medium text-brand-gray"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
