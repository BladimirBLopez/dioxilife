import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NUMERO_WHATSAPP } from "@/lib/constants";
import SiteHeader from "@/components/SiteHeader";
import BotonWhatsapp from "@/components/BotonWhatsapp";
import SeccionSucursales from "@/components/SeccionSucursales";
import AgregarCarritoButton from "@/components/AgregarCarritoButton";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ categoria?: string }>;

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
  const { categoria } = await searchParams;

  const [categorias, productos, aplicaciones, testimonios, sucursales, banner] =
    await Promise.all([
      prisma.categoria.findMany({
        orderBy: { nombre: "asc" },
        include: { _count: { select: { productos: true } } },
      }),
      prisma.producto.findMany({
        where: {
          activo: true,
          ...(categoria ? { categoria: { slug: categoria } } : {}),
        },
        include: { categoria: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.aplicacionCds.findMany({
        where: { activo: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.testimonio.findMany({
        where: { activo: true, destacado: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sucursal.findMany({
        where: { activo: true },
        orderBy: { departamento: "asc" },
      }),
      prisma.banner.findFirst({
        where: { activo: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const categoriasConProductos = categorias.filter(
    (c) => c._count.productos > 0
  );

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

      {/* Categorías */}
      {categoriasConProductos.length > 0 && (
        <nav className="max-w-6xl mx-auto w-full px-4 py-4 flex gap-2 overflow-x-auto">
          <a
            href="/"
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border ${
              !categoria
                ? "bg-brand-pink text-white border-brand-pink"
                : "bg-white text-brand-gray border-gray-300"
            }`}
          >
            Todos
          </a>
          {categoriasConProductos.map((c) => (
            <a
              key={c.id}
              href={`/?categoria=${c.slug}`}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border ${
                categoria === c.slug
                  ? "bg-brand-pink text-white border-brand-pink"
                  : "bg-white text-brand-gray border-gray-300"
              }`}
            >
              {c.nombre} ({c._count.productos})
            </a>
          ))}
        </nav>
      )}

      {/* Grid de productos */}
      <main id="productos" className="flex-1 max-w-6xl mx-auto w-full px-4 pb-4">
        {productos.length === 0 ? (
          <div className="text-center py-20 text-brand-gray">
            <p className="text-lg font-medium">Aún no hay productos disponibles</p>
            <p className="text-sm mt-1">Vuelve pronto, estamos preparando todo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
            {productos.map((p) => (
              <div
                key={p.id}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md overflow-hidden flex flex-col transition-shadow duration-200"
              >
                <Link href={`/producto/${p.slug}`} className="flex flex-col flex-1">
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    {p.imagenUrl ? (
                      <Image
                        src={p.imagenUrl}
                        alt={p.nombre}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-gray-300">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
                          <path d="m21 15-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-[11px]">Sin imagen</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 pb-2 flex flex-col flex-1">
                    <span className="text-[11px] uppercase tracking-wide text-brand-pink font-semibold">
                      {p.categoria.nombre}
                    </span>
                    <h3 className="text-sm font-medium mt-0.5 line-clamp-2">
                      {p.nombre}
                    </h3>
                    {p.mostrarPrecio && (
                      <p className="text-brand-blue font-bold mt-auto pt-2">
                        Bs {Number(p.precio).toFixed(2)}
                      </p>
                    )}
                  </div>
                </Link>
                <div className="px-3 pb-3">
                  <AgregarCarritoButton
                    id={p.id}
                    nombre={p.nombre}
                    precio={Number(p.precio)}
                    mostrarPrecio={p.mostrarPrecio}
                    imagenUrl={p.imagenUrl}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Aplicaciones del CDS */}
      {aplicaciones.length > 0 && (
        <section id="aplicaciones-cds" className="bg-white border-t py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold text-brand-blue text-center mb-1">
              Aplicaciones del CDS
            </h2>
            <p className="text-sm text-brand-gray text-center mb-6">
              Conoce para qué se puede usar el dióxido de cloro
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {aplicaciones.map((a) => (
                <div
                  key={a.id}
                  className="bg-gray-50 rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {a.imagenUrl ? (
                      <Image
                        src={a.imagenUrl}
                        alt={a.nombre}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-gray text-xs">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-[#1F1B24]">
                      {a.nombre}
                    </h3>
                    {a.descripcion && (
                      <p className="text-xs text-brand-gray line-clamp-3 mt-1">
                        {a.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonios destacados */}
      {testimonios.length > 0 && (
        <section id="testimonios" className="bg-gray-50 border-t py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold text-brand-blue text-center mb-6">
              Lo que dicen nuestros clientes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {testimonios.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-xl p-4 flex flex-col shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {t.imagenUrl ? (
                      <Image
                        src={t.imagenUrl}
                        alt={t.nombreCliente}
                        width={40}
                        height={40}
                        className="rounded-full object-cover w-10 h-10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-pink/20 flex items-center justify-center text-brand-pink font-semibold">
                        {t.nombreCliente.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{t.nombreCliente}</p>
                      <p className="text-xs text-yellow-500">
                        {"⭐".repeat(t.calificacion)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-brand-gray">{t.contenido}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sucursales por departamento */}
      {sucursales.length > 0 && (
        <section id="sucursales" className="bg-white border-t py-10 px-4">
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
