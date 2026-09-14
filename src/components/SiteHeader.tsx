"use client";

import { useState } from "react";
import Image from "next/image";
import CartDrawer from "./CartDrawer";

type LinkItem = { href: string; label: string };
type NavEntry = LinkItem | { label: string; children: LinkItem[] };

const LINKS_BASE: NavEntry[] = [
  { href: "#top", label: "Inicio" },
  { href: "#productos", label: "Productos" },
  {
    label: "Protocolos",
    children: [{ href: "#aplicaciones-cds", label: "Aplicaciones del CDS" }],
  },
  { href: "#testimonios", label: "Testimonios" },
];

function esGrupo(item: NavEntry): item is { label: string; children: LinkItem[] } {
  return "children" in item;
}

export default function SiteHeader({
  mostrarSucursales = true,
}: {
  mostrarSucursales?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [submenuDesktop, setSubmenuDesktop] = useState<string | null>(null);
  const [submenuMobile, setSubmenuMobile] = useState<string | null>(null);

  const LINKS: NavEntry[] = mostrarSucursales
    ? [...LINKS_BASE, { href: "#sucursales", label: "Sucursales" }]
    : LINKS_BASE;

  function cerrarTodo() {
    setOpen(false);
    setSubmenuDesktop(null);
    setSubmenuMobile(null);
  }

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

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((item) =>
            esGrupo(item) ? (
              <div key={item.label} className="relative">
                <button
                  onClick={() =>
                    setSubmenuDesktop(
                      submenuDesktop === item.label ? null : item.label
                    )
                  }
                  className="flex items-center gap-1 text-sm font-medium text-brand-gray hover:text-brand-pink transition-colors py-1"
                >
                  {item.label}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className={`w-3.5 h-3.5 transition-transform ${
                      submenuDesktop === item.label ? "rotate-180" : ""
                    }`}
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {submenuDesktop === item.label && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[190px] z-30">
                    {item.children.map((c) => (
                      <a
                        key={c.href}
                        href={c.href}
                        onClick={cerrarTodo}
                        className="block px-4 py-2 text-sm text-brand-gray hover:bg-brand-pink/5 hover:text-brand-pink"
                      >
                        {c.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="group relative text-sm font-medium text-brand-gray hover:text-brand-pink transition-colors py-1"
              >
                {item.label}
                <span className="absolute left-0 -bottom-0.5 h-0.5 w-0 bg-brand-pink transition-all duration-200 group-hover:w-full" />
              </a>
            )
          )}
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
          {LINKS.map((item) =>
            esGrupo(item) ? (
              <div key={item.label} className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() =>
                    setSubmenuMobile(
                      submenuMobile === item.label ? null : item.label
                    )
                  }
                  className="w-full flex items-center justify-between mx-2 px-3 py-3 text-sm font-medium text-[#1F1B24] rounded-lg hover:bg-brand-pink/5"
                >
                  {item.label}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className={`w-4 h-4 transition-transform ${
                      submenuMobile === item.label ? "rotate-180" : ""
                    }`}
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {submenuMobile === item.label && (
                  <div className="pb-2">
                    {item.children.map((c) => (
                      <a
                        key={c.href}
                        href={c.href}
                        onClick={cerrarTodo}
                        className="block mx-4 px-3 py-2 text-sm text-brand-gray rounded-lg hover:bg-brand-pink/5 hover:text-brand-pink"
                      >
                        {c.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <a
                key={item.href}
                href={item.href}
                onClick={cerrarTodo}
                className="mx-2 px-3 py-3 text-sm font-medium text-[#1F1B24] rounded-lg hover:bg-brand-pink/5 active:bg-brand-pink/10 transition-colors border-b border-gray-100 last:border-b-0"
              >
                {item.label}
              </a>
            )
          )}
        </div>
      </nav>
    </header>
  );
}
