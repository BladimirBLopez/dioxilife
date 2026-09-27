import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AgregarCarritoButton from "@/components/AgregarCarritoButton";
import ResenaForm from "@/components/ResenaForm";
import InformacionProductoPublica from "@/components/InformacionProductoPublica";
import SiteHeader from "@/components/SiteHeader";
import ProductoGaleria from "@/components/ProductoGaleria";
import { formatearPrecio } from "@/lib/precio";
import { NUMERO_WHATSAPP } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ProductoDetalle({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const producto = await prisma.producto.findUnique({
    where: { slug },
    include: {
      categoria: true,
      protocolos: {
        where: { activo: true },
        orderBy: { createdAt: "asc" },
      },
      protocolosRelacionados: {
        where: {
          protocolo: {
            activo: true,
          },
        },
        orderBy: { orden: "asc" },
        include: {
          protocolo: {
            select: {
              id: true,
              titulo: true,
              imagenUrl: true,
            },
          },
        },
      },
      informacionProducto: {
        where: { activo: true },
        orderBy: { orden: "asc" },
        select: {
          id: true,
          tipo: true,
          titulo: true,
          contenido: true,
          imagenUrl: true,
          videoUrl: true,
        },
      },
      imagenes: {
        orderBy: [
          { orden: "asc" },
          { createdAt: "asc" },
        ],
        select: {
          id: true,
          url: true,
        },
      },
    },
  });

  if (!producto || !producto.activo) {
    notFound();
  }

  const resenas = await prisma.resena.findMany({
    where: { productoId: producto.id, aprobado: true },
    orderBy: { createdAt: "desc" },
  });

  const productosRelacionados = await prisma.producto.findMany({
    where: {
      activo: true,
      categoriaId: producto.categoriaId,
      id: {
        not: producto.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 4,
    select: {
      id: true,
      nombre: true,
      slug: true,
      imagenUrl: true,
      precio: true,
      precioPromocion: true,
      enPromocion: true,
      mostrarPrecio: true,
    },
  });

  const protocolosRelacionados = Array.from(
    new Map(
      [
        ...producto.protocolosRelacionados.map(({ protocolo }) => protocolo),
        ...producto.protocolos.map((protocolo) => ({
          id: protocolo.id,
          titulo: protocolo.titulo,
          imagenUrl: protocolo.imagenUrl,
        })),
      ].map((protocolo) => [protocolo.id, protocolo])
    ).values()
  );

  const presentacion =
    producto.nombre.match(/\b\d+(?:[.,]\d+)?\s*(?:ml|mg|g|kg|l)\b/i)?.[0] ||
    null;

  const concentracion =
    producto.nombre.match(/\b\d+(?:[.,]\d+)?\s*(?:ppm|%)\b/i)?.[0] ||
    null;

  const mensajeWhatsapp = encodeURIComponent(
    `Hola, quiero información sobre ${producto.nombre}.`
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SiteHeader />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-4">
          <Link
            href="/#productos"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-gray transition hover:text-brand-pink"
          >
            <span aria-hidden="true">←</span>
            Volver a productos
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.05)] md:flex">
          <ProductoGaleria
            nombre={producto.nombre}
            imagenPrincipal={producto.imagenUrl}
            imagenes={producto.imagenes}
            enPromocion={producto.enPromocion}
          />

          <div className="flex flex-col p-6 sm:p-8 md:w-1/2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-pink">
              {producto.categoria.nombre}
            </span>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-[#1F1B24] sm:text-3xl">{producto.nombre}</h1>

            {resenas.length > 0 && (
              <p className="text-xs text-yellow-500 mt-1">
                {"⭐".repeat(
                  Math.round(
                    resenas.reduce((acc, r) => acc + r.calificacion, 0) /
                      resenas.length
                  )
                )}{" "}
                <span className="text-[#6B6870]">
                  ({resenas.length} testimonio{resenas.length === 1 ? "" : "s"})
                </span>
              </p>
            )}

            {producto.mostrarPrecio && (
              <div className="mt-3">
                {producto.enPromocion && producto.precioPromocion ? (
                  <div className="flex items-baseline gap-2">
                    <p className="text-gray-400 line-through text-lg">
                      Bs {formatearPrecio(producto.precio)}
                    </p>
                    <p className="text-brand-pink font-bold text-2xl">
                      Bs {formatearPrecio(producto.precioPromocion)}
                    </p>
                  </div>
                ) : (
                  <p className="text-brand-blue font-bold text-2xl">
                    Bs {formatearPrecio(producto.precio)}
                  </p>
                )}
              </div>
            )}

            {producto.descripcion && (
              <p className="mt-5 whitespace-pre-line text-sm leading-6 text-brand-gray sm:text-base">
                {producto.descripcion}
              </p>
            )}

            <div className="mt-7">
              <AgregarCarritoButton
                id={producto.id}
                nombre={producto.nombre}
                precio={
                  producto.enPromocion && producto.precioPromocion
                    ? Number(producto.precioPromocion)
                    : Number(producto.precio)
                }
                mostrarPrecio={producto.mostrarPrecio}
                imagenUrl={producto.imagenUrl}
              />

              <InformacionProductoPublica
                nombreProducto={producto.nombre}
                informaciones={producto.informacionProducto}
              />
            </div>
          </div>
        </div>

        <section className="mt-8">
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.035)] sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
                Detalles
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#1F1B24]">
                Información del producto
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
                  Categoría
                </p>
                <p className="mt-1 text-sm font-bold text-[#1F1B24]">
                  {producto.categoria.nombre}
                </p>
              </div>

              {presentacion && (
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
                    Presentación
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#1F1B24]">
                    {presentacion}
                  </p>
                </div>
              )}

              {concentracion && (
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
                    Concentración
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#1F1B24]">
                    {concentracion}
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
                  Protocolos
                </p>
                <p className="mt-1 text-sm font-bold text-[#1F1B24]">
                  {protocolosRelacionados.length > 0
                    ? `${protocolosRelacionados.length} relacionado${
                        protocolosRelacionados.length === 1 ? "" : "s"
                      }`
                    : "Sin relación"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href={`https://wa.me/${NUMERO_WHATSAPP}?text=${mensajeWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-3 text-sm font-semibold text-[#128C4A] transition hover:bg-[#25D366]/15"
              >
                Consultar por WhatsApp
              </a>

              <Link
                href="/#productos"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#1F1B24] transition hover:bg-gray-50"
              >
                Ver más productos
              </Link>
            </div>
          </div>
        </section>

        {protocolosRelacionados.length > 0 && (
          <section className="mt-10">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
                Contenido relacionado
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#1F1B24]">
                Protocolos relacionados
              </h2>
              <p className="mt-1 text-sm text-brand-gray">
                Consulta los protocolos asociados a este producto.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {protocolosRelacionados.map((prot) => (
                <Link
                  key={prot.id}
                  href={`/protocolos?protocolo=${prot.id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-[0_3px_14px_rgba(0,0,0,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.06)]"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-violet-50">
                    {prot.imagenUrl ? (
                      <Image
                        src={prot.imagenUrl}
                        alt={prot.titulo}
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
                      {prot.titulo}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-brand-pink">
                      Ver protocolo
                    </p>
                  </div>

                  <span className="shrink-0 text-lg text-brand-gray/50 transition group-hover:translate-x-0.5 group-hover:text-brand-pink">
                    ›
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {productosRelacionados.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
                  También puedes ver
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#1F1B24]">
                  Productos relacionados
                </h2>
              </div>

              <Link
                href="/#productos"
                className="shrink-0 text-sm font-semibold text-brand-pink"
              >
                Ver todos →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {productosRelacionados.map((relacionado) => (
                <Link
                  key={relacionado.id}
                  href={`/producto/${relacionado.slug}`}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_3px_14px_rgba(0,0,0,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
                >
                  <div className="relative aspect-square bg-gray-50">
                    {relacionado.imagenUrl ? (
                      <Image
                        src={relacionado.imagenUrl}
                        alt={relacionado.nombre}
                        fill
                        className="object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-4 text-center text-xs text-brand-gray">
                        Sin imagen
                      </div>
                    )}

                    {relacionado.enPromocion && (
                      <span className="absolute left-2 top-2 rounded-full bg-brand-pink px-2 py-1 text-[10px] font-bold text-white">
                        PROMO
                      </span>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-[#1F1B24]">
                      {relacionado.nombre}
                    </h3>

                    {relacionado.mostrarPrecio && (
                      <div className="mt-2">
                        {relacionado.enPromocion &&
                        relacionado.precioPromocion ? (
                          <div>
                            <p className="text-xs text-gray-400 line-through">
                              Bs {formatearPrecio(relacionado.precio)}
                            </p>
                            <p className="text-base font-bold text-brand-pink">
                              Bs {formatearPrecio(relacionado.precioPromocion)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-base font-bold text-brand-blue">
                            Bs {formatearPrecio(relacionado.precio)}
                          </p>
                        )}
                      </div>
                    )}

                    <p className="mt-2 text-xs font-semibold text-brand-pink">
                      Ver producto →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Testimonios de este producto */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-brand-blue mb-4">Testimonios</h2>

          {resenas.length > 0 ? (
            <div className="space-y-3 mb-6">
              {resenas.map((r) => (
                <div key={r.id} className="bg-white rounded-xl shadow-sm p-4 flex gap-3">
                  {r.imagenUrl ? (
                    <Image
                      src={r.imagenUrl}
                      alt={r.nombreCliente}
                      width={36}
                      height={36}
                      className="rounded-full object-cover w-9 h-9 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 shrink-0 rounded-full bg-brand-pink/20 flex items-center justify-center text-brand-pink font-semibold text-sm">
                      {r.nombreCliente.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{r.nombreCliente}</p>
                      <span className="text-xs text-yellow-500">
                        {"⭐".repeat(r.calificacion)}
                      </span>
                    </div>
                    <p className="text-sm text-brand-gray mt-1 whitespace-pre-line">
                      {r.comentario}
                    </p>

                    {r.tiempoUso && (
                      <p className="text-xs text-[#8A8790] mt-2">
                        🕒 Tiempo usando: {r.tiempoUso}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-gray mb-6">
              Todavía no hay testimonios de este producto. ¡Sé el primero en dejar una!
            </p>
          )}

          <ResenaForm productoId={producto.id} />
        </section>
      </main>

      <footer className="bg-white border-t py-4 text-center text-xs text-brand-gray">
        © {new Date().getFullYear()} DioxiLife Bolivia
      </footer>
    </div>
  );
}
