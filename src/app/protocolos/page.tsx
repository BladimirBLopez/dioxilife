import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import BotonWhatsapp from "@/components/BotonWhatsapp";
import Media from "@/components/Media";

export const dynamic = "force-dynamic";

export default async function ProtocolosPage() {
  const [protocolos, totalSucursales] = await Promise.all([
    prisma.protocolo.findMany({
      where: { activo: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sucursal.count({ where: { activo: true } }),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SiteHeader mostrarSucursales={totalSucursales > 0} />

      <section className="bg-gradient-to-r from-brand-pink to-brand-blue text-white text-center py-10 px-4">
        <h1 className="text-2xl font-bold">Protocolos</h1>
        <p className="text-white/90 mt-1">Modo de uso e información general</p>
      </section>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {protocolos.length === 0 ? (
          <div className="text-center py-20 text-brand-gray">
            <p className="text-lg font-medium">Aún no hay protocolos publicados</p>
            <p className="text-sm mt-1">Vuelve pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {protocolos.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                {p.imagenUrl && (
                  <div className="aspect-video bg-gray-100 relative">
                    <Media
                      src={p.imagenUrl}
                      alt={p.titulo}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-base font-semibold text-[#1F1B24]">
                    {p.titulo}
                  </h3>
                  <p className="text-sm text-brand-gray whitespace-pre-line mt-2">
                    {p.contenido}
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

      <BotonWhatsapp />
    </div>
  );
}
