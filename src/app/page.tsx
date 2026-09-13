import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ categoria?: string }>;

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { categoria } = await searchParams;

  const [categorias, productos] = await Promise.all([
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
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="DioxiLife Bolivia"
            width={160}
            height={132}
            priority
          />
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-brand-pink to-brand-blue text-white text-center py-8 px-4">
        <h1 className="text-2xl font-bold">DioxiLife Bolivia</h1>
        <p className="text-white/90 mt-1">Tu tienda de confianza en Bolivia</p>
      </section>

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
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pb-12">
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
                className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col"
              >
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
                <div className="p-3 flex flex-col flex-1">
                  <span className="text-[11px] uppercase tracking-wide text-brand-pink font-semibold">
                    {p.categoria.nombre}
                  </span>
                  <h3 className="text-sm font-medium mt-0.5 line-clamp-2">
                    {p.nombre}
                  </h3>
                  <p className="text-brand-blue font-bold mt-auto pt-2">
                    Bs {Number(p.precio).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white border-t py-4 text-center text-xs text-brand-gray">
        © {new Date().getFullYear()} DioxiLife Bolivia
      </footer>
    </div>
  );
}
