import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NUMERO_WHATSAPP } from "@/lib/constants";
import SiteHeader from "@/components/SiteHeader";
import BotonWhatsapp from "@/components/BotonWhatsapp";
import SeccionSucursales from "@/components/SeccionSucursales";
import AgregarCarritoButton from "@/components/AgregarCarritoButton";
import ResenaForm from "@/components/ResenaForm";
import { formatearPrecio } from "@/lib/precio";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  categoria?: string;
  promo?: string;
  ver?: string;
}>;

const NOMBRE_DEPARTAMENTO: Record<string, string> = {
  LA_PAZ: "La Paz",
  SANTA_CRUZ: "Santa Cruz",
  COCHABAMBA: "Cochabamba",
  ORURO: "Oruro",
  POTOSI: "Potosí",
  CHUQUISACA: "Chuquisaca",
  TARIJA: "Tarija",
  BENI: "Beni",
  PANDO: "Pando",
};

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { categoria, promo, ver } = await searchParams;
  const soloPromociones = promo === "1";
  const verTodos = ver === "todos";

  const [
    categorias,
    productos,
    aplicacionesDestacadas,
    protocolosDestacados,
    resenas,
    sucursales,
    banner,
    promoCount,
  ] = await Promise.all([
      prisma.categoria.findMany({
        orderBy: { nombre: "asc" },
        include: { _count: { select: { productos: true } } },
      }),
      prisma.producto.findMany({
        where: {
          activo: true,
          ...(soloPromociones
            ? { enPromocion: true }
            : categoria
            ? { categoria: { slug: categoria } }
            : {}),
        },
        include: { categoria: true },
        orderBy: { orden: "asc" },
      }),
      prisma.aplicacionCds.findMany({
        where: { activo: true },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          nombre: true,
          imagenUrl: true,
        },
      }),
      prisma.protocolo.findMany({
        where: { activo: true },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          titulo: true,
          imagenUrl: true,
        },
      }),
      prisma.resena.findMany({
        where: {
          aprobado: true,
          destacado: true,
        },

        select: {
          id: true,
          nombreCliente: true,
          calificacion: true,
          comentario: true,
          imagenUrl: true,
          tiempoUso: true,
          producto: {
            select: {
              nombre: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.sucursal.findMany({
        where: { activo: true },
        orderBy: { departamento: "asc" },
      }),
      prisma.banner.findFirst({
        where: { activo: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.producto.count({
        where: { activo: true, enPromocion: true },
      }),
    ]);

  const categoriasConProductos = categorias.filter(
    (c) => c._count.productos > 0
  );

  const productosVisibles =
    categoria || soloPromociones || verTodos
      ? productos
      : productos.slice(0, 8);

  const tituloProductos = soloPromociones
    ? "Promociones"
    : categoria
    ? categoriasConProductos.find((c) => c.slug === categoria)?.nombre ||
      "Productos"
    : verTodos
    ? "Todos los productos"
    : "Productos destacados";

  const sucursalesPorDepartamento = sucursales.reduce<
    Record<string, typeof sucursales>
  >((acc, s) => {
    (acc[s.departamento] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SiteHeader mostrarSucursales={sucursales.length > 0} />

      {/* Hero / Banner principal */}
      {banner ? (
        <section
          className="relative text-white text-center overflow-hidden bg-gradient-to-r from-brand-pink to-brand-blue h-56 sm:h-72 md:h-80 flex items-center justify-center px-4"
          style={
            banner.imagenUrl
              ? {
                  backgroundImage: `url(${banner.imagenUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {banner.imagenUrl && banner.mostrarTexto && (
            <div className="absolute inset-0 bg-black/45" />
          )}
          {banner.mostrarTexto && (
            <div className="relative z-10">
              <h1 className="text-2xl font-bold">{banner.titulo}</h1>
              {banner.subtitulo && (
                <p className="text-white/90 mt-1">{banner.subtitulo}</p>
              )}
              {banner.textoBoton && (
                <a
                  href={
                    banner.tipoBoton === "WHATSAPP"
                      ? `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(
                          banner.mensajeWhatsapp || ""
                        )}`
                      : banner.linkBoton || "#"
                  }
                  target={banner.tipoBoton === "WHATSAPP" ? "_blank" : undefined}
                  rel={
                    banner.tipoBoton === "WHATSAPP"
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="inline-block mt-4 bg-white text-brand-pink font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90"
                >
                  {banner.textoBoton}
                </a>
              )}
            </div>
          )}
        </section>
      ) : (
        <section className="bg-gradient-to-r from-brand-pink to-brand-blue text-white text-center py-8 px-4">
          <h1 className="text-2xl font-bold">DioxiLife Bolivia</h1>
          <p className="text-white/90 mt-1">Tu tienda de confianza en Bolivia</p>
        </section>
      )}

      {/* Accesos rápidos */}
      <section className="px-4 pt-6 pb-2">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#1F1B24] sm:text-2xl">
                Explora <span className="text-brand-pink">DioxiLife</span>
              </h2>
              <p className="mt-1 text-sm text-brand-gray">
                Todo lo que necesitas en un solo lugar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <a
              href="#productos"
              className="group flex min-h-[88px] items-center gap-3 rounded-2xl border border-pink-100 bg-pink-50/80 p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-pink text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <circle cx="9" cy="20" r="1" />
                  <circle cx="19" cy="20" r="1" />
                  <path d="M3 4h2l2.4 10.5a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 2-1.6L21 7H6" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1F1B24]">Productos</p>
                <p className="mt-0.5 text-xs text-brand-gray">
                  CDS, kits y más
                </p>
              </div>
              <span className="ml-auto shrink-0 text-lg text-brand-gray/60 transition group-hover:translate-x-0.5 group-hover:text-brand-pink">
                ›
              </span>
            </a>

            <Link
              href="/aplicaciones-cds"
              className="group flex min-h-[88px] items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/80 p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-400 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M9 3h6" />
                  <path d="M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3" />
                  <path d="M8 15h8" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1F1B24]">
                  Aplicaciones CDS
                </p>
                <p className="mt-0.5 text-xs text-brand-gray">
                  Dolencias y casos
                </p>
              </div>
              <span className="ml-auto shrink-0 text-lg text-brand-gray/60 transition group-hover:translate-x-0.5 group-hover:text-brand-pink">
                ›
              </span>
            </Link>

            <Link
              href="/protocolos"
              className="group flex min-h-[88px] items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/80 p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <rect x="5" y="4" width="14" height="17" rx="2" />
                  <path d="M9 4.5V3h6v1.5" />
                  <path d="M9 10h6M9 14h6M9 18h4" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1F1B24]">Protocolos</p>
                <p className="mt-0.5 text-xs text-brand-gray">
                  Guías y procedimientos
                </p>
              </div>
              <span className="ml-auto shrink-0 text-lg text-brand-gray/60 transition group-hover:translate-x-0.5 group-hover:text-brand-pink">
                ›
              </span>
            </Link>

            <a
              href="#resenas"
              className="group flex min-h-[88px] items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1F1B24]">Testimonios</p>
                <p className="mt-0.5 text-xs text-brand-gray">
                  Historias de clientes
                </p>
              </div>
              <span className="ml-auto shrink-0 text-lg text-brand-gray/60 transition group-hover:translate-x-0.5 group-hover:text-brand-pink">
                ›
              </span>
            </a>

            {sucursales.length > 0 && (
              <a
                href="#sucursales"
                className="group flex min-h-[88px] items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/80 p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1F1B24]">Sucursales</p>
                  <p className="mt-0.5 text-xs text-brand-gray">
                    Encuentra la más cercana
                  </p>
                </div>
              <span className="ml-auto shrink-0 text-lg text-brand-gray/60 transition group-hover:translate-x-0.5 group-hover:text-brand-pink">
                ›
              </span>
              </a>
            )}

            <a
              href={`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(
                "Hola, quiero información para ser distribuidor de DioxiLife Bolivia.\n\nNombre:\nCiudad:\n¿Quién me recomendó DioxiLife?:"
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-[88px] items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50/80 p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="m8 11 2 2a2 2 0 0 0 3 0l2-2" />
                  <path d="m4 9 4-4 4 2 4-2 4 4" />
                  <path d="m5 10 5 7a3 3 0 0 0 4 0l5-7" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1F1B24]">
                  Ser distribuidor
                </p>
                <p className="mt-0.5 text-xs text-brand-gray">
                  Únete a la red
                </p>
              </div>
              <span className="ml-auto shrink-0 text-lg text-brand-gray/60 transition group-hover:translate-x-0.5 group-hover:text-brand-pink">
                ›
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Grid de productos */}
      <main
        id="productos"
        className="flex-1 max-w-6xl mx-auto w-full px-4 pb-8"
      >
        {productos.length > 0 && (
          <>
            <div className="mb-4 mt-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1F1B24] sm:text-2xl">
                  {tituloProductos}
                </h2>

                {!categoria && !soloPromociones && !verTodos && (
                  <p className="mt-1 text-sm text-brand-gray">
                    Una selección de nuestros productos.
                  </p>
                )}
              </div>

              {!categoria && !soloPromociones && !verTodos && (
                <Link
                  href="/?ver=todos#productos"
                  className="shrink-0 text-sm font-semibold text-brand-pink"
                >
                  Ver todos →
                </Link>
              )}
            </div>

            {(categoriasConProductos.length > 0 || promoCount > 0) && (
              <nav className="mb-5 flex gap-2 overflow-x-auto pb-1">
                <a
                  href="/#productos"
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium ${
                    !categoria && !soloPromociones
                      ? "border-brand-pink bg-brand-pink text-white"
                      : "border-gray-300 bg-white text-brand-gray"
                  }`}
                >
                  Todos
                </a>

                {promoCount > 0 && (
                  <a
                    href="/?promo=1#productos"
                    className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium ${
                      soloPromociones
                        ? "border-brand-pink bg-brand-pink text-white"
                        : "border-gray-300 bg-white text-brand-gray"
                    }`}
                  >
                    Promociones
                  </a>
                )}

                {categoriasConProductos.map((c) => (
                  <a
                    key={c.id}
                    href={`/?categoria=${c.slug}#productos`}
                    className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium ${
                      categoria === c.slug && !soloPromociones
                        ? "border-brand-pink bg-brand-pink text-white"
                        : "border-gray-300 bg-white text-brand-gray"
                    }`}
                  >
                    {c.nombre}
                  </a>
                ))}
              </nav>
            )}
          </>
        )}

        {productos.length === 0 ? (
          <div className="text-center py-20 text-brand-gray">
            <p className="text-lg font-medium">
              {soloPromociones
                ? "No hay productos en promoción por ahora"
                : "Aún no hay productos disponibles"}
            </p>
            <p className="text-sm mt-1">Vuelve pronto, estamos preparando todo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
            {productosVisibles.map((p) => (
              <div
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(0,0,0,0.07)]"
              >
                <Link href={`/producto/${p.slug}`} className="flex flex-col flex-1">
                  <div className="relative aspect-square border-b border-gray-100 bg-[#FBFBFC]">
                    {p.enPromocion && (
                      <span className="absolute left-2 top-2 z-10 rounded-full bg-brand-pink px-2.5 py-1 text-[10px] font-bold tracking-wide text-white shadow-sm">
                        OFERTA
                      </span>
                    )}
                    {p.imagenUrl ? (
                      <Image
                        src={p.imagenUrl}
                        alt={p.nombre}
                        fill
                        className="object-contain p-5 transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-[#A3A0A7]">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                          <span className="text-2xl">◻</span>
                        </div>
                        <span className="text-xs">Imagen próximamente</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3.5 pb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-pink">
                      {p.categoria.nombre}
                    </span>
                    <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-[#1F1B24]">
                      {p.nombre}
                    </h3>
                    {p.mostrarPrecio && (
                      <div className="mt-auto pt-3">
                        {p.enPromocion && p.precioPromocion ? (
                          <>
                            <p className="text-xs text-gray-400 line-through">
                              Bs {formatearPrecio(p.precio)}
                            </p>
                            <p className="text-base font-bold text-brand-pink">
                              Bs {formatearPrecio(p.precioPromocion)}
                            </p>
                          </>
                        ) : (
                          <p className="text-base font-bold text-brand-blue">
                            Bs {formatearPrecio(p.precio)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="px-3.5 pb-3.5">
                  <AgregarCarritoButton
                    id={p.id}
                    nombre={p.nombre}
                    precio={
                      p.enPromocion && p.precioPromocion
                        ? Number(p.precioPromocion)
                        : Number(p.precio)
                    }
                    mostrarPrecio={p.mostrarPrecio}
                    imagenUrl={p.imagenUrl}
                  />
                </div>
              </div>
            ))}
          </div>
        )}


      </main>

      {/* Aplicaciones CDS destacadas */}
      {aplicacionesDestacadas.length > 0 && (
        <section className="bg-white px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1F1B24] sm:text-2xl">
                  Aplicaciones CDS
                </h2>
                <p className="mt-1 text-sm text-brand-gray">
                  Consulta las aplicaciones disponibles.
                </p>
              </div>

              <Link
                href="/aplicaciones-cds"
                className="shrink-0 text-sm font-semibold text-brand-pink"
              >
                Ver todas →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {aplicacionesDestacadas.map((a) => (
                <Link
                  key={a.id}
                  href={`/aplicaciones-cds?aplicacion=${a.id}`}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_3px_14px_rgba(0,0,0,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.06)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#F7F7F9]">
                    {a.imagenUrl ? (
                      <Image
                        src={a.imagenUrl}
                        alt={a.nombre}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-pink/10 text-brand-pink">
                          +
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#1F1B24]">
                        {a.nombre}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-brand-pink">
                        Ver aplicación
                      </p>
                    </div>

                    <span className="shrink-0 text-lg text-brand-gray/50 transition group-hover:translate-x-0.5 group-hover:text-brand-pink">
                      ›
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Protocolos destacados */}
      {protocolosDestacados.length > 0 && (
        <section className="px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1F1B24] sm:text-2xl">
                  Protocolos
                </h2>
                <p className="mt-1 text-sm text-brand-gray">
                  Consulta las guías y procedimientos disponibles.
                </p>
              </div>

              <Link
                href="/protocolos"
                className="shrink-0 text-sm font-semibold text-brand-pink"
              >
                Ver todos →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {protocolosDestacados.map((p) => (
                <Link
                  key={p.id}
                  href={`/protocolos?protocolo=${p.id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-[0_3px_14px_rgba(0,0,0,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.06)]"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-violet-50">
                    {p.imagenUrl ? (
                      <Image
                        src={p.imagenUrl}
                        alt={p.titulo}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-6 w-6 text-violet-500"
                        >
                          <rect x="5" y="4" width="14" height="17" rx="2" />
                          <path d="M9 4.5V3h6v1.5" />
                          <path d="M9 10h6M9 14h6M9 18h4" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#1F1B24]">
                      {p.titulo}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-brand-pink">
                      Ver protocolo
                    </p>
                  </div>

                  <span className="shrink-0 text-lg text-brand-gray/50 transition group-hover:translate-x-0.5 group-hover:text-brand-pink">
                    ›
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Distribuidores */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-r from-[#171E38] via-[#22295A] to-[#4B2A78] px-6 py-7 text-white shadow-[0_8px_28px_rgba(28,31,70,0.16)] sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-6 w-6"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M19 8v6M16 11h6" />
                </svg>
              </div>

              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">
                  Red DioxiLife
                </p>

                <h2 className="mt-1.5 text-xl font-bold sm:text-2xl">
                  ¿Quieres ser distribuidor?
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/75">
                  Conoce los requisitos y beneficios para formar parte de la red DioxiLife Bolivia.
                </p>
              </div>
            </div>

            <a
              href={`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(
                "Hola, quiero información para ser distribuidor de DioxiLife Bolivia.\n\nNombre:\nCiudad:\n¿Quién me recomendó DioxiLife?:"
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#171E38] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Quiero ser distribuidor
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Testimonios de clientes */}
      <section id="resenas" className="bg-white px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
              Testimonios
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#1F1B24] sm:text-2xl">
              Historias DioxiLife
            </h2>
            <p className="mt-1 text-sm text-brand-gray">
              Experiencias compartidas por nuestra comunidad.
            </p>
          </div>

          {resenas.length > 0 ? (
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {resenas.map((r) => (
                <div
                  key={r.id}
                  className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_3px_14px_rgba(0,0,0,0.035)]"
                >
                  <div className="mb-4 flex items-center gap-3">
                    {r.imagenUrl ? (
                      <Image
                        src={r.imagenUrl}
                        alt={r.nombreCliente}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-pink/10 font-bold text-brand-pink">
                        {r.nombreCliente.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1F1B24]">
                        {r.nombreCliente}
                      </p>
                      <p className="mt-0.5 text-xs text-yellow-500">
                        {"★".repeat(r.calificacion)}
                      </p>
                    </div>
                  </div>

                  <p className="flex-1 text-sm leading-6 text-brand-gray">
                    “{r.comentario}”
                  </p>

                  {r.producto && (
                    <Link
                      href={`/producto/${r.producto.slug}`}
                      className="mt-4 border-t border-gray-100 pt-3 text-xs font-semibold text-brand-pink"
                    >
                      {r.producto.nombre} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-8 text-center">
              <p className="text-sm text-brand-gray">
                Muy pronto compartiremos experiencias de nuestra comunidad DioxiLife.
              </p>
            </div>
          )}

          <div className="mx-auto max-w-md">
            <ResenaForm />
          </div>
        </div>
      </section>

      {/* Sucursales por departamento */}
      {sucursales.length > 0 && (
        <section id="sucursales" className="bg-gray-50 border-t py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold text-brand-blue text-center mb-6">
              Puntos de venta por departamento
            </h2>
            <SeccionSucursales
              grupos={sucursalesPorDepartamento}
              nombreDepartamento={NOMBRE_DEPARTAMENTO}
            />
          </div>
        </section>
      )}

      <footer className="bg-white border-t py-4 text-center text-xs text-brand-gray">
        © {new Date().getFullYear()} DioxiLife Bolivia
      </footer>

      <BotonWhatsapp />
    </div>
  );
}
