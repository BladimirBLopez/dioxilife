"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  children: ReactNode;

  miembro: {
    nombres: string;
    apellidos: string | null;
    codigoReferido: string;
  };
};

const NAV_ITEMS = [
  {
    href: "/mi-cuenta",
    label: "Inicio",
    exact: true,
    icon: (
      <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />
    ),
  },

  {
    href: "/mi-cuenta/pedidos",
    label: "Mis ventas",
    icon: (
      <>
        <path d="M5 7h14l-1 13H6L5 7Z" />
        <path d="M9 7V5a3 3 0 0 1 6 0v2" />
      </>
    ),
  },

  {
    href: "/mi-cuenta/red",
    label: "Mi red",
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" />
        <path d="M15 15c3 0 5 1.8 5 5" />
      </>
    ),
  },

  {
    href: "/mi-cuenta/comisiones",
    label: "Mis comisiones",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 1-3 2.2 0 1.3 1.1 1.8 3 2.2 1.9.4 3 1 3 2.3 0 1.3-1.3 2.3-3 2.3-1.4 0-2.6-.6-3.2-1.6" />
        <path d="M12 6.5v11" />
      </>
    ),
  },
];

function NavIcon({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px] shrink-0"
    >
      {children}
    </svg>
  );
}

function iniciales(
  nombres: string,
  apellidos: string | null
) {
  const primera =
    nombres.trim().charAt(0);

  const segunda =
    apellidos?.trim().charAt(0) || "";

  return `${primera}${segunda}`.toUpperCase();
}

export default function MiCuentaShell({
  children,
  miembro,
}: Props) {
  const pathname =
    usePathname();

  const [open, setOpen] =
    useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const [cerrando, setCerrando] =
    useState(false);

  async function cerrarSesion() {
    if (cerrando) {
      return;
    }

    try {
      setCerrando(true);

      await fetch(
        "/api/multinivel/logout",
        {
          method: "POST",
        }
      );

      window.location.href =
        "/login-miembro";

    } catch {
      setCerrando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F9]">

      <header className="sticky top-0 z-20 flex items-center justify-between bg-brand-navy px-4 py-3 text-white md:hidden">

        <button
          type="button"
          onClick={() =>
            setOpen(true)
          }
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-xl"
        >
          ☰
        </button>


        <div className="text-center">

          <p className="text-sm font-semibold">
            DioxiLife
          </p>

          <p className="text-[11px] text-white/60">
            Panel del distribuidor
          </p>

        </div>


        <Link
          href="/"
          className="rounded-lg bg-brand-pink px-3 py-1.5 text-xs font-semibold"
        >
          Tienda
        </Link>

      </header>


      {open && (

        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() =>
            setOpen(false)
          }
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />

      )}


      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-brand-navy text-white transition-transform duration-200 md:w-64 ${
          open
            ? "translate-x-0"
            : "-translate-x-full"
        } md:translate-x-0`}
      >

        <div className="border-b border-white/10 p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">

              <Image
                src="/logo.png"
                alt="DioxiLife"
                width={42}
                height={42}
                className="object-contain"
              />

            </div>


            <div className="min-w-0">

              <p className="truncate font-semibold">
                DioxiLife Bolivia
              </p>

              <p className="text-xs text-white/55">
                Panel del distribuidor
              </p>

            </div>

          </div>

        </div>


        <div className="border-b border-white/10 px-4 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">

              {iniciales(
                miembro.nombres,
                miembro.apellidos
              )}

            </div>


            <div className="min-w-0">

              <p className="truncate text-sm font-semibold">
                {miembro.nombres}
                {miembro.apellidos
                  ? ` ${miembro.apellidos}`
                  : ""}
              </p>

              <p className="mt-0.5 truncate font-mono text-[11px] text-white/50">
                {miembro.codigoReferido}
              </p>

            </div>

          </div>

        </div>


        <nav className="flex-1 overflow-y-auto p-4">

          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
            Principal
          </p>


          <div className="space-y-1">

            {NAV_ITEMS.map(
              (item) => {

                const activo =
                  item.exact
                    ? pathname ===
                      item.href
                    : pathname.startsWith(
                        item.href
                      );

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() =>
                      setOpen(false)
                    }
                    className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm transition ${
                      activo
                        ? "border-brand-pink bg-white/10 font-semibold text-white"
                        : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >

                    <NavIcon>
                      {item.icon}
                    </NavIcon>

                    {item.label}

                  </Link>
                );
              }
            )}

          </div>


          <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
            Mi cuenta
          </p>


          <div className="space-y-1">

            <Link
              href="/mi-cuenta#perfil"
              onClick={() =>
                setOpen(false)
              }
              className="flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
            >

              <NavIcon>
                <>
                  <circle
                    cx="12"
                    cy="8"
                    r="4"
                  />
                  <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                </>
              </NavIcon>

              Mi perfil

            </Link>


            <Link
              href="/mi-cuenta#enlaces"
              onClick={() =>
                setOpen(false)
              }
              className="flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
            >

              <NavIcon>
                <>
                  <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
                  <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
                </>
              </NavIcon>

              Mis enlaces

            </Link>

          </div>

        </nav>


        <div className="border-t border-white/10 p-4">

          <Link
            href="/"
            className="mb-2 flex w-full items-center justify-center rounded-lg bg-brand-pink px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Ir a la tienda
          </Link>


          <button
            type="button"
            onClick={cerrarSesion}
            disabled={cerrando}
            className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            {cerrando
              ? "Cerrando..."
              : "Cerrar sesión"}
          </button>

        </div>

      </aside>


      <div className="min-w-0 md:pl-64">

        <div className="min-h-screen">
          {children}
        </div>

      </div>

    </div>
  );
}
