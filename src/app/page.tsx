import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import BotonWhatsapp from "@/components/BotonWhatsapp";

export const dynamic = "force-dynamic";

const NUMERO_WHATSAPP = "59170758200";

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

function IconoFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.9.25-1.5 1.55-1.5H16.5V4.3C16.2 4.26 15.2 4.17 14 4.17c-2.4 0-4 1.46-4 4.15V10.5H7.5v3H10V21h3.5Z" />
    </svg>
  );
}

function IconoInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 8.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Zm0 6.1a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8Zm4.7-6.25a.86.86 0 1 1-1.72 0 .86.86 0 0 1 1.72 0ZM20 7.2c-.06-1.2-.33-2.27-1.2-3.14C17.93 3.2 16.85 2.93 15.66 2.87 14.44 2.8 9.56 2.8 8.34 2.87c-1.2.06-2.27.33-3.14 1.19C4.33 4.93 4.06 6 4 7.2c-.07 1.22-.07 6.1 0 7.32.06 1.2.33 2.27 1.2 3.13.87.87 1.94 1.14 3.14 1.2 1.22.07 6.1.07 7.32 0 1.2-.06 2.27-.33 3.14-1.2.87-.86 1.14-1.93 1.2-3.13.07-1.22.07-6.09 0-7.32ZM18.4 15.9a4.1 4.1 0 0 1-2.3 2.3c-1.6.63-5.4.49-7 .49s-5.4.14-7-.49a4.1 4.1 0 0 1-2.3-2.3c-.63-1.6-.49-5.4-.49-7s-.14-5.4.49-7a4.1 4.1 0 0 1 2.3-2.3c1.6-.63 5.4-.49 7-.49s5.4-.14 7 .49a4.1 4.1 0 0 1 2.3 2.3c.63 1.6.49 5.4.49 7s.14 5.4-.49 7Z" />
    </svg>
  );
}

function IconoTikTok() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M16.6 5.82c-.9-.98-1.4-2.26-1.4-3.57h-3.03v13.4c0 1.53-1.24 2.77-2.77 2.77a2.77 2.77 0 0 1 0-5.54c.28 0 .55.04.8.12V9.9a5.9 5.9 0 0 0-.8-.06 5.83 5.83 0 1 0 5.83 5.83V9.02a8.6 8.6 0 0 0 5.03 1.62V7.6a5.6 5.6 0 0 1-3.66-1.78Z" />
    </svg>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { categoria } = await searchParams;

  const [categorias, productos, testimonios, sucursales, banner] = await Promise.all([
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

  const sucursalesPorDepartamento = sucursales.reduce<
    Record<string, typeof sucursales>
  >((acc, s) => {
    (acc[s.departamento] ||= []).push(s);
    return acc;
  }, {});

  const hrefBotonBanner =
    banner?.tipoBoton === "WHATSAPP"
      ? `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(
          banner.mensajeWhatsapp || `Hola, quiero más información sobre ${banner.titulo}`
        )}`
      : banner?.linkBoton || "#";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SiteHeader />

      {/* Hero */}
      {banner && banner.imagenUrl ? (
        <section
          className="relative py-16 px-4 text-center text-white overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: `url(${banner.imagenUrl})` }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative">
            <h1 className="text-2xl md:text-3xl font-bold">{banner.titulo}</h1>
            {banner.subtitulo && (
              <p className="text-white/90 mt-2">{banner.subtitulo}</p>
            )}
            {banner.textoBoton && (
              <a
                href={hrefBotonBanner}
                target={banner.tipoBoton === "WHATSAPP" ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="inline-block mt-4 bg-brand-pink px-6 py-2 rounded-full font-semibold hover:opacity-90"
              >
                {banner.textoBoton}
              </a>
            )}
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-r from-brand-pink to-brand-blue text-white text-center py-8 px-4">
          <h1 className="text-2xl font-bold">DioxiLife Bolivia</h1>
          <p className="text-white/90 mt-1">Tu tienda de confianza en Bolivia</p>
        </section>
      )}

      {/* Categorías */}
      {categorias.length > 0 && (
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
          {categorias.map((c) => (
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
            {productos.map((p) => {
              const mensaje = p.mostrarPrecio
                ? `Hola, quiero comprar "${p.nombre}", vi que cuesta Bs ${Number(p.precio).toFixed(2)}.`
                : `Hola, quiero consultar el precio de "${p.nombre}".`;
              const linkWhatsapp = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col"
                >
                  <Link href={`/producto/${p.slug}`} className="flex flex-col flex-1">
                    <div className="aspect-square bg-gray-100 relative">
                      {p.imagenUrl ? (
                        <Image
                          src={p.imagenUrl}
                          alt={p.nombre}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-gray text-xs">
                          Sin imagen
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
                    <a
                      href={linkWhatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-xs font-semibold text-white bg-[#25D366] rounded py-1.5 hover:opacity-90"
                    >
                      {p.mostrarPrecio ? "Comprar por WhatsApp" : "Consultar por WhatsApp"}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Testimonios destacados */}
      {testimonios.length > 0 && (
        <section id="testimonios" className="bg-white border-t py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold text-brand-blue text-center mb-6">
              Lo que dicen nuestros clientes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {testimonios.map((t) => (
                <div
                  key={t.id}
                  className="bg-gray-50 rounded-xl p-4 flex flex-col"
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
        <section id="sucursales" className="bg-gray-50 border-t py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold text-brand-blue text-center mb-6">
              Puntos de venta por departamento
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(sucursalesPorDepartamento).map(
                ([departamento, lista]) => (
                  <div
                    key={departamento}
                    className="bg-white rounded-xl shadow-sm p-4"
                  >
                    <h3 className="font-semibold text-brand-pink mb-2">
                      {NOMBRE_DEPARTAMENTO[departamento] || departamento}
                    </h3>
                    <div className="space-y-3">
                      {lista.map((s) => (
                        <div key={s.id} className="text-sm">
                          {s.nombre && (
                            <p className="font-medium">{s.nombre}</p>
                          )}
                          {s.direccion && (
                            <p className="text-brand-gray">{s.direccion}</p>
                          )}
                          {s.telefono && (
                            <p className="text-brand-gray">{s.telefono}</p>
                          )}
                          {(s.facebookUrl || s.tiktokUrl || s.instagramUrl) && (
                            <div className="flex gap-3 mt-1 text-brand-blue">
                              {s.facebookUrl && (
                                <a
                                  href={s.facebookUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label="Facebook"
                                >
                                  <IconoFacebook />
                                </a>
                              )}
                              {s.instagramUrl && (
                                <a
                                  href={s.instagramUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label="Instagram"
                                >
                                  <IconoInstagram />
                                </a>
                              )}
                              {s.tiktokUrl && (
                                <a
                                  href={s.tiktokUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label="TikTok"
                                >
                                  <IconoTikTok />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
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
