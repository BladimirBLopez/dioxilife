import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AgregarCarritoButton from "@/components/AgregarCarritoButton";
import ResenaForm from "@/components/ResenaForm";
import InformacionProductoPublica from "@/components/InformacionProductoPublica";
import SiteHeader from "@/components/SiteHeader";

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
    },
  });

  if (!producto || !producto.activo) {
    notFound();
  }

  const resenas = await prisma.resena.findMany({
    where: { productoId: producto.id, aprobado: true },
    orderBy: { createdAt: "desc" },
  });

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
          <div className="relative aspect-square bg-[#FAFAFB] md:w-1/2 md:border-r border-gray-100">
            {producto.enPromocion && (
              <span className="absolute left-4 top-4 z-10 rounded-full bg-brand-pink px-3 py-1.5 text-xs font-bold tracking-wide text-white shadow-sm">
                OFERTA
              </span>
            )}
            {producto.imagenUrl ? (
              <Image
                src={producto.imagenUrl}
                alt={producto.nombre}
                fill
                className="object-contain p-6 sm:p-8"
                priority
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-[#A3A0A7]">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm">
                  <span className="text-3xl">◻</span>
                </div>
                <span className="text-sm">Imagen próximamente</span>
              </div>
            )}
          </div>

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
                      Bs {Number(producto.precio).toFixed(2)}
                    </p>
                    <p className="text-brand-pink font-bold text-2xl">
                      Bs {Number(producto.precioPromocion).toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <p className="text-brand-blue font-bold text-2xl">
                    Bs {Number(producto.precio).toFixed(2)}
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

        {producto.protocolos.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-brand-blue mb-4">
              Modo de uso / Protocolos
            </h2>
            <div className="space-y-4">
              {producto.protocolos.map((prot) => (
                <div
                  key={prot.id}
                  className="bg-white rounded-xl shadow-sm p-4 flex gap-4"
                >
                  {prot.imagenUrl && (
                    <div className="w-20 h-20 shrink-0 relative rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={prot.imagenUrl}
                        alt={prot.titulo}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{prot.titulo}</h3>
                    <p className="text-sm text-brand-gray whitespace-pre-line mt-1">
                      {prot.contenido}
                    </p>
                  </div>
                </div>
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
