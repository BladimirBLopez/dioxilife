import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NUMERO_WHATSAPP } from "@/lib/constants";
import SiteHeader from "@/components/SiteHeader";
import BotonWhatsapp from "@/components/BotonWhatsapp";
import SeccionSucursales from "@/components/SeccionSucursales";
import AgregarCarritoButton from "@/components/AgregarCarritoButton";
import ResenaForm from "@/components/ResenaForm";

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

  const [categorias, productos, resenas, sucursales, banner, promoCount] =
    await Promise.all([
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

      {/* Categorías */}
      {(categoriasConProductos.length > 0 || promoCount > 0) && (
        <nav className="max-w-6xl mx-auto w-full px-4 py-4 flex gap-2 overflow-x-auto">
          <a
            href="/"
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border ${
              !categoria && !soloPromociones
                ? "bg-brand-pink text-white border-brand-pink"
                : "bg-white text-brand-gray border-gray-300"
            }`}
          >
            Todos
          </a>
          {promoCount > 0 && (
            <a
              href="/?promo=1"
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border ${
                soloPromociones
                  ? "bg-brand-pink text-white border-brand-pink"
                  : "bg-white text-brand-gray border-gray-300"
              }`}
            >
              🔥 Promociones
            </a>
          )}
          {categoriasConProductos.map((c) => (
            <a
              key={c.id}
              href={`/?categoria=${c.slug}`}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border ${
                categoria === c.slug && !soloPromociones
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
      <main
        id="productos"
        className="flex-1 max-w-6xl mx-auto w-full px-4 pb-8"
      >
        {productos.length > 0 && (
          <div className="mb-5 mt-2 flex items-end justify-between gap-4">
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
          </div>
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
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_18px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] flex flex-col"
              >
                <Link href={`/producto/${p.slug}`} className="flex flex-col flex-1">
                  <div className="relative aspect-square border-b border-gray-100 bg-[#FAFAFB]">
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
                        className="object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
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
                  <div className="flex flex-1 flex-col p-4 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-pink">
                      {p.categoria.nombre}
                    </span>
                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-[#1F1B24]">
                      {p.nombre}
                    </h3>
                    {p.mostrarPrecio && (
                      <div className="mt-auto pt-2">
                        {p.enPromocion && p.precioPromocion ? (
                          <>
                            <p className="text-xs text-gray-400 line-through">
                              Bs {Number(p.precio).toFixed(2)}
                            </p>
                            <p className="text-brand-pink font-bold">
                              Bs {Number(p.precioPromocion).toFixed(2)}
                            </p>
                          </>
                        ) : (
                          <p className="text-brand-blue font-bold">
                            Bs {Number(p.precio).toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="px-4 pb-4">
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

        {!categoria &&
          !soloPromociones &&
          !verTodos &&
          productos.length > productosVisibles.length && (
            <div className="mt-7 flex justify-center">
              <Link
                href="/?ver=todos#productos"
                className="inline-flex items-center justify-center rounded-xl border border-brand-pink px-5 py-2.5 text-sm font-semibold text-brand-pink transition hover:bg-brand-pink hover:text-white"
              >
                Ver todos los productos
              </Link>
            </div>
          )}
      </main>

      {/* Distribuidores */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-[#10182D] px-6 py-8 text-white sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">
                Red DioxiLife
              </p>

              <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                ¿Quieres ser distribuidor?
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/70">
                Conoce los requisitos y beneficios para formar parte
                de la red DioxiLife Bolivia.
              </p>
            </div>

            <a
              href={`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(
                "Hola, quiero información para ser distribuidor de DioxiLife Bolivia.\n\nNombre:\nCiudad:\n¿Quién me recomendó DioxiLife?:"
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#10182D] transition hover:opacity-90"
            >
              Quiero ser distribuidor
            </a>
          </div>
        </div>
      </section>

      {/* Testimonios de clientes (moderadas) */}
      <section id="resenas" className="bg-white border-t py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold text-brand-blue text-center mb-1">
            Historias DioxiLife
          </h2>
          <p className="text-sm text-brand-gray text-center mb-6">
            Experiencias reales de personas que eligieron DioxiLife
          </p>

          {resenas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {resenas.map((r) => (
                <div key={r.id} className="bg-gray-50 rounded-xl p-4 flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    {r.imagenUrl ? (
                      <Image
                        src={r.imagenUrl}
                        alt={r.nombreCliente}
                        width={40}
                        height={40}
                        className="rounded-full object-cover w-10 h-10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-pink/20 flex items-center justify-center text-brand-pink font-semibold">
                        {r.nombreCliente.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{r.nombreCliente}</p>
                      <p className="text-xs text-yellow-500">
                        {"⭐".repeat(r.calificacion)}
                      </p>
                    </div>
                  </div>
                  {r.producto && (
                    <Link
                      href={`/producto/${r.producto.slug}`}
                      className="text-xs text-brand-pink font-medium mb-1"
                    >
                      {r.producto.nombre}
                    </Link>
                  )}
                  <p className="text-sm text-brand-gray">{r.comentario}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-gray text-center mb-8">
              Muy pronto compartiremos experiencias reales de nuestra comunidad DioxiLife.
            </p>
          )}

          <div className="max-w-md mx-auto">
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
