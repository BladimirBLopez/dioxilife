"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "../LogoutButton";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Inicio",
    exact: true,
    icon: (
      <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />
    ),
  },
  {
    href: "/admin/banner",
    label: "Banner",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8.5" cy="10" r="1.5" />
        <path d="m3 16 5-4 4 3 3-2.5L21 16" />
      </>
    ),
  },
  {
    href: "/admin/categorias",
    label: "Categorías",
    icon: (
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    ),
  },
  {
    href: "/admin/productos",
    label: "Productos",
    icon: (
      <>
        <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
        <path d="M3 8l9 5 9-5M12 13v8" />
      </>
    ),
  },
  {
    href: "/admin/protocolos",
    label: "Protocolos",
    icon: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 3h6v3H9zM8 10h8M8 14h8M8 18h5" />
      </>
    ),
  },
  {
    href: "/admin/aplicaciones-cds",
    label: "Aplicaciones CDS",
    icon: (
      <>
        <path d="M19 8V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
        <rect x="3" y="8" width="18" height="13" rx="2" />
        <path d="M8 13h8M8 17h5" />
      </>
    ),
  },
  {
    href: "/admin/testimonios",
    label: "Testimonios",
    icon: (
      <path d="M12 3.5 14.2 9l6 .6-4.5 4 1.3 5.9L12 16.7 6.9 19.5 8.2 13.6l-4.5-4 6-.6L12 3.5Z" />
    ),
  },
  {
    href: "/admin/resenas",
    label: "Reseñas",
    icon: (
      <>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
      </>
    ),
  },
  {
    href: "/admin/sucursales",
    label: "Sucursales",
    icon: (
      <>
        <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
        <circle cx="12" cy="9.5" r="2.3" />
      </>
    ),
  },
];

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-[18px] h-[18px] shrink-0"
    >
      {children}
    </svg>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <header className="md:hidden flex items-center justify-between bg-brand-navy text-white px-4 py-3 sticky top-0 z-10">
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
        className={`fixed md:static top-0 left-0 h-full w-72 md:w-64 bg-brand-navy text-white flex flex-col p-4 z-30 overflow-y-auto
          transform transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex flex-col items-center gap-2 mb-5 pb-5 border-b border-white/10">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
            <Image
              src="/logo.png"
              alt="DioxiLife"
              width={56}
              height={56}
              className="object-contain"
            />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm leading-tight">
              DioxiLife Bolivia
            </p>
            <p className="text-xs text-white/55">Panel Admin</p>
          </div>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:block text-sm bg-brand-pink rounded-lg px-3 py-2 mb-5 text-center font-medium hover:opacity-90"
        >
          Ver tienda
        </a>

        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV_ITEMS.map((item) => {
            const activo = item.exact
              ? pathname === item.href
              : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm border-l-2 transition-colors ${
                  activo
                    ? "bg-white/10 border-brand-pink font-semibold text-white"
                    : "border-transparent text-white/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                <NavIcon>{item.icon}</NavIcon>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <LogoutButton />
      </aside>

      <main className="flex-1 bg-[#F7F7F9] p-4 md:p-6 min-w-0">
        {children}
      </main>
    </div>
  );
}
