import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NUMERO_WHATSAPP = "59170758200";

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
    },
  });

  if (!producto || !producto.activo) {
    notFound();
  }

  const mensajeWhatsapp = encodeURIComponent(
    `Hola, quiero consultar el precio de "${producto.nombre}".`
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-sm text-brand-blue font-medium">
            ← Volver a la tienda
          </Link>
          <Image src="/logo.png" alt="DioxiLife Bolivia" width={90} height={74} />
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden md:flex">
          <div className="md:w-1/2 aspect-square bg-gray-100 relative">
            {producto.imagenUrl ? (
              <Image
                src={producto.imagenUrl}
                alt={producto.nombre}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand-gray text-sm">
                Sin imagen
              </div>
            )}
          </div>

          <div className="p-6 md:w-1/2 flex flex-col">
            <span className="text-xs uppercase tracking-wide text-brand-pink font-semibold">
              {producto.categoria.nombre}
            </span>
            <h1 className="text-2xl font-bold mt-1">{producto.nombre}</h1>

            {producto.mostrarPrecio ? (
              <p className="text-brand-blue font-bold text-2xl mt-3">
                Bs {Number(producto.precio).toFixed(2)}
              </p>
            ) : (
              <a
                href={`https://wa.me/${NUMERO_WHATSAPP}?text=${mensajeWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#25D366] font-semibold mt-3"
              >
                Precio a consultar por WhatsApp
              </a>
            )}

            {producto.descripcion && (
              <p className="text-brand-gray mt-4 whitespace-pre-line">
                {producto.descripcion}
              </p>
            )}
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
      </main>

      <footer className="bg-white border-t py-4 text-center text-xs text-brand-gray">
        © {new Date().getFullYear()} DioxiLife Bolivia
      </footer>
    </div>
  );
}
