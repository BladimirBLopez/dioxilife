import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import BotonWhatsapp from "@/components/BotonWhatsapp";
import AplicacionesCdsGrid from "@/components/AplicacionesCdsGrid";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  aplicacion?: string;
}>;

export default async function AplicacionesCdsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { aplicacion } = await searchParams;

  const [aplicaciones, totalSucursales] = await Promise.all([
    prisma.aplicacionCds.findMany({
      where: { activo: true },
      orderBy: { createdAt: "desc" },
      include: {
        protocolos: {
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
                contenido: true,
                imagenUrl: true,
                videoUrl: true,
              },
            },
          },
        },
        resenas: {
          where: {
            aprobado: true,
          },
          orderBy: {
            createdAt: "desc",
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
        },
      },
    }),
    prisma.sucursal.count({ where: { activo: true } }),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SiteHeader mostrarSucursales={totalSucursales > 0} />

      <section className="bg-gradient-to-r from-brand-pink to-brand-blue px-4 py-6 text-center text-white sm:py-7">
        <h1 className="text-2xl font-bold">Aplicaciones del CDS</h1>
        <p className="mx-auto mt-1 max-w-xl text-sm text-white/85 sm:text-base">
          Consulta las aplicaciones registradas y su información relacionada.
        </p>
      </section>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {aplicaciones.length === 0 ? (
          <div className="text-center py-20 text-brand-gray">
            <p className="text-lg font-medium">Aún no hay aplicaciones publicadas</p>
            <p className="text-sm mt-1">Vuelve pronto.</p>
          </div>
        ) : (
          <AplicacionesCdsGrid
            aplicaciones={aplicaciones}
            aplicacionInicialId={aplicacion}
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
