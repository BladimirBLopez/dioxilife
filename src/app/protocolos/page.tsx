import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import BotonWhatsapp from "@/components/BotonWhatsapp";
import ProtocolosAcordeon from "@/components/ProtocolosAcordeon";

export const dynamic = "force-dynamic";

export default async function ProtocolosPage({
  searchParams,
}: {
  searchParams: Promise<{ protocolo?: string }>;
}) {
  const { protocolo } = await searchParams;
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

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {protocolos.length === 0 ? (
          <div className="text-center py-20 text-brand-gray">
            <p className="text-lg font-medium">Aún no hay protocolos publicados</p>
            <p className="text-sm mt-1">Vuelve pronto.</p>
          </div>
        ) : (
          <ProtocolosAcordeon
            protocolos={protocolos}
            protocoloInicialId={protocolo}
          />
        )}
      </main>

      <footer className="bg-white border-t py-4 text-center text-xs text-brand-gray">
        © {new Date().getFullYear()} DioxiLife Bolivia
      </footer>

      <BotonWhatsapp />
    </div>
  );
}
