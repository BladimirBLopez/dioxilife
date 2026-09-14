"use client";

import { useState } from "react";
import Image from "next/image";
import CartDrawer from "./CartDrawer";

const LINKS_BASE = [
  { href: "#top", label: "Inicio" },
  { href: "#productos", label: "Productos" },
  { href: "#protocolos", label: "Protocolos" },
  { href: "#aplicaciones-cds", label: "Aplicaciones del CDS" },
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
    <header id="top" className="relative bg-white/95 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.06)] sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        <Image
          src="/logo.png"
          alt="DioxiLife Bolivia"
          width={200}
          height={164}
          priority
          className="w-14 h-auto md:w-16"
        />

        <nav className="hidden md:flex items-center gap-7">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative text-sm font-medium text-brand-gray hover:text-brand-pink transition-colors py-1 whitespace-nowrap"
            >
              {l.label}
              <span className="absolute left-0 -bottom-0.5 h-0.5 w-0 bg-brand-pink transition-all duration-200 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CartDrawer />

          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-full text-brand-blue hover:bg-brand-blue/5 active:bg-brand-blue/10 transition-colors"
          >
            <span className="relative w-5 h-4 block">
              <span
                className={`absolute left-0 top-0 w-5 h-[2px] rounded-full bg-current transition-all duration-200 ${
                  open ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[7px] w-5 h-[2px] rounded-full bg-current transition-all duration-150 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 top-[14px] w-5 h-[2px] rounded-full bg-current transition-all duration-200 ${
                  open ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <nav
        className={`md:hidden absolute top-full left-0 right-0 bg-white overflow-hidden transition-[max-height,box-shadow] duration-300 ease-in-out z-30 ${
          open ? "max-h-96 shadow-[0_8px_16px_rgba(0,0,0,0.06)]" : "max-h-0"
        }`}
      >
        <div className="flex flex-col px-2 pb-2">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="mx-2 px-3 py-3 text-sm font-medium text-[#1F1B24] rounded-lg hover:bg-brand-pink/5 active:bg-brand-pink/10 transition-colors border-b border-gray-100 last:border-b-0"
            >
              {l.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
