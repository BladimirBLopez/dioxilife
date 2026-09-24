"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import LogoutButton from "@/app/admin/LogoutButton";
import AdminHelpButton from "@/components/AdminHelpButton";

type AdminShellProps = {
  children: ReactNode;

  admin: {
    usuario: string;
    rol: "SUPER_ADMIN" | "ADMIN";
  };

  alertas: {
    pagosReportados: number;
    pedidosNuevos: number;
  };
};

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
  badge?: "pagos" | "nuevos";
};

type NavGroup = {
  titulo: string;
  items: NavItem[];
};

const grupos: NavGroup[] = [
  {
    titulo: "General",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        exact: true,
        icon: (
          <>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </>
        ),
      },

      {
        href: "/admin/pedidos",
        label: "Pedidos",
        badge: "pagos",
        icon: (
          <>
            <path d="M5 7h14l-1 13H6L5 7Z" />
            <path d="M9 7V5a3 3 0 0 1 6 0v2" />
          </>
        ),
      },
    ],
  },

  {
    titulo: "Catálogo",
    items: [
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
        href: "/admin/inventario",
        label: "Inventario",
        icon: (
          <>
            <path d="M4 6h16v14H4V6Z" />
            <path d="M4 10h16" />
            <path d="M9 14h6" />
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
    ],
  },

  {
    titulo: "Multinivel",
    items: [
      {
        href: "/admin/multinivel",
        label: "Resumen",
        exact: true,
        icon: (
          <>
            <circle cx="9" cy="7" r="3" />
            <circle cx="17" cy="10" r="2.5" />
            <path d="M3 20c0-3.2 2.5-5.5 6-5.5s6 2.3 6 5.5" />
            <path d="M15 15c3 0 5 1.8 5 5" />
          </>
        ),
      },

      {
        href: "/admin/multinivel/miembros",
        label: "Miembros",
        icon: (
          <>
            <circle cx="8" cy="8" r="3" />
            <circle cx="16.5" cy="9" r="2.5" />
            <path d="M2.5 21c0-3.5 2.5-6 5.5-6s5.5 2.5 5.5 6" />
            <path d="M14 16c3.5 0 6 2 6.5 5" />
          </>
        ),
      },

      {
        href: "/admin/multinivel/red",
        label: "Red",
        icon: (
          <>
            <circle cx="12" cy="5" r="2.5" />
            <circle cx="6" cy="18" r="2.5" />
            <circle cx="18" cy="18" r="2.5" />
            <path d="M12 7.5v4M12 11.5H6v4M12 11.5h6v4" />
          </>
        ),
      },

      {
        href: "/admin/multinivel/analitica",
        label: "Analítica",
        icon: (
          <>
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="M8 16v-4" />
            <path d="M12 16V8" />
            <path d="M16 16v-7" />
            <path d="M20 16v-3" />
          </>
        ),
      },

      {
        href: "/admin/multinivel/comisiones",
        label: "Comisiones",
        icon: (
          <>
            <circle cx="12" cy="12" r="8" />
            <path d="M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 1-3 2.2 0 1.3 1.1 1.8 3 2.2 1.9.4 3 1 3 2.3 0 1.3-1.3 2.3-3 2.3-1.4 0-2.6-.6-3.2-1.6" />
            <path d="M12 6.5v11" />
          </>
        ),
      },
    ],
  },

  {
    titulo: "Contenido",
    items: [
      {
        href: "/admin/banner",
        label: "Banner",
        icon: (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m4 16 5-4 3 3 3-2 5 4" />
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
            <rect x="3" y="7" width="18" height="14" rx="2" />
            <path d="M8 12h8M8 16h5M7 3h10" />
          </>
        ),
      },

      {
        href: "/admin/resenas",
        label: "Testimonios",
        icon: (
          <path d="M12 3.5 14.2 9l6 .6-4.5 4 1.3 5.9L12 16.7 6.9 19.5 8.2 13.6l-4.5-4 6-.6L12 3.5Z" />
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
    ],
  },
];

function Icon({
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

export default function AdminShell({
  children,
  admin,
  alertas,
}: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const [gruposAbiertos, setGruposAbiertos] = useState<string[]>(
    grupos.map((g) => g.titulo)
  );

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

  const inicial =
    admin.usuario
      .trim()
      .charAt(0)
      .toUpperCase() || "A";

  function obtenerBadge(
    tipo: "pagos" | "nuevos" | undefined
  ) {
    if (tipo === "pagos") {
      return alertas.pagosReportados;
    }

    if (tipo === "nuevos") {
      return alertas.pedidosNuevos;
    }

    return 0;
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] lg:flex">

      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[1px] lg:hidden"
        />
      )}


      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[285px] flex-col bg-[#10182D] text-white shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        <div className="border-b border-white/10 px-5 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow">
              <Image
                src="/logo.png"
                alt="DioxiLife Bolivia"
                width={44}
                height={44}
                className="object-contain"
              />
            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-bold">
                DioxiLife Bolivia
              </p>

              <p className="mt-0.5 text-xs text-white/45">
                Centro de administración
              </p>

            </div>

          </div>

        </div>


        <div className="border-b border-white/10 px-4 py-4">

          <div className="rounded-2xl bg-white/[0.06] p-3">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-pink font-bold text-white">
                {inicial}
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-sm font-semibold">
                  {admin.usuario}
                </p>

                <span
                  className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                    admin.rol === "SUPER_ADMIN"
                      ? "bg-amber-400/15 text-amber-300"
                      : "bg-blue-400/15 text-blue-300"
                  }`}
                >
                  {admin.rol === "SUPER_ADMIN"
                    ? "SUPER ADMIN"
                    : "ADMIN"}
                </span>

              </div>

            </div>

          </div>

        </div>


        <nav className="flex-1 overflow-y-auto px-3 py-4">

          <div className="space-y-5">

            {grupos.map((grupo) => (

              <div key={grupo.titulo}>

                <button
                  type="button"
                  onClick={() =>
                    setGruposAbiertos((actuales) =>
                      actuales.includes(grupo.titulo)
                        ? actuales.filter(
                            (g) => g !== grupo.titulo
                          )
                        : [
                            ...actuales,
                            grupo.titulo,
                          ]
                    )
                  }
                  className="mb-2 flex w-full items-center justify-between px-3"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
                    {grupo.titulo}
                  </span>

                  <span className="text-xs text-white/30">
                    {gruposAbiertos.includes(grupo.titulo)
                      ? "⌄"
                      : "›"}
                  </span>
                </button>


                {gruposAbiertos.includes(grupo.titulo) && (

                <div className="space-y-1">

                  {grupo.items.map((item) => {
                    const activo = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(
                          item.href
                        );

                    const badge =
                      obtenerBadge(
                        item.badge
                      );

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() =>
                          setOpen(false)
                        }
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                          activo
                            ? "bg-white text-[#10182D] shadow-sm"
                            : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >

                        <span
                          className={
                            activo
                              ? "text-brand-pink"
                              : "text-white/45 transition group-hover:text-white/80"
                          }
                        >
                          <Icon>
                            {item.icon}
                          </Icon>
                        </span>

                        <span className="min-w-0 flex-1 truncate font-medium">
                          {item.label}
                        </span>

                        {badge > 0 && (

                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-pink px-1.5 text-[10px] font-bold text-white">
                            {badge > 99
                              ? "99+"
                              : badge}
                          </span>

                        )}

                      </Link>
                    );
                  })}

                </div>

                )}

              </div>

            ))}

          </div>

        </nav>


        <div className="border-t border-white/10 p-4">

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Ver tienda
            <span>↗</span>
          </a>

          <LogoutButton />

        </div>

      </aside>


      <div className="min-w-0 flex-1">

        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">

          <div className="flex h-16 items-center gap-3 px-4 md:px-6">

            <button
              type="button"
              onClick={() =>
                setOpen(true)
              }
              aria-label="Abrir menú"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>


            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-bold text-slate-900">
                Centro de control
              </p>

              <p className="hidden text-xs text-slate-400 sm:block">
                Administración general de DioxiLife Bolivia
              </p>

            </div>


            {alertas.pagosReportados > 0 && (

              <Link
                href="/admin/pedidos"
                className="hidden items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 sm:flex"
              >
                <span className="h-2 w-2 rounded-full bg-orange-500" />

                {alertas.pagosReportados} pago
                {alertas.pagosReportados === 1
                  ? ""
                  : "s"}{" "}
                por revisar
              </Link>

            )}


            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-[#10182D] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#18233e] sm:px-4 sm:text-sm"
            >
              Tienda ↗
            </a>

          </div>

        </header>


        <main className="p-4 md:p-6 xl:p-8">
          {children}
        </main>

        <AdminHelpButton />

      </div>

    </div>
  );
}
