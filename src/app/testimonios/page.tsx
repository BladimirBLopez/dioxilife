import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import BotonWhatsapp from "@/components/BotonWhatsapp";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  aplicacion?: string;
}>;

export default async function TestimoniosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { aplicacion } = await searchParams;

  const [aplicaciones, resenas, totalSucursales] = await Promise.all([
    prisma.aplicacionCds.findMany({
      where: {
        activo: true,
        resenas: {
          some: {
            aprobado: true,
            tipo: "EXPERIENCIA",
          },
        },
      },
      orderBy: {
        nombre: "asc",
      },
      select: {
        id: true,
        nombre: true,
        imagenUrl: true,
        _count: {
          select: {
            resenas: {
              where: {
                aprobado: true,
                tipo: "EXPERIENCIA",
              },
            },
          },
        },
      },
    }),

    prisma.resena.findMany({
      where: {
        aprobado: true,
        tipo: "EXPERIENCIA",
        ...(aplicacion
          ? {
              aplicacionId: aplicacion,
            }
          : {
              aplicacionId: {
                not: null,
              },
            }),
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
        createdAt: true,
        aplicacion: {
          select: {
            id: true,
            nombre: true,
          },
        },
        producto: {
          select: {
            nombre: true,
            slug: true,
          },
        },
      },
    }),

    prisma.sucursal.count({
      where: {
        activo: true,
      },
    }),
  ]);

  const aplicacionActiva = aplicaciones.find((a) => a.id === aplicacion);

  return (
    <div className="min-h-screen bg-[#F5F3FA]">
      <SiteHeader mostrarSucursales={totalSucursales > 0} />

      <section className="bg-gradient-to-r from-brand-pink to-brand-blue px-4 py-7 text-center text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">Testimonios</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
          Experiencias compartidas por clientes de DioxiLife Bolivia.
        </p>
      </section>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        {aplicaciones.length > 0 && (
          <section>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
                Explora por aplicación
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#1F1B24]">
                Experiencias relacionadas
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <Link
                href="/testimonios"
                className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${
                  !aplicacion
                    ? "border-brand-pink bg-[#FFF3FA]"
                    : "border-[#E9E4F2] bg-white"
                }`}
              >
                <p className="text-sm font-bold text-[#1F1B24]">Todos</p>
                <p className="mt-1 text-xs text-brand-gray">
                  Ver todas las experiencias
                </p>
              </Link>

              {aplicaciones.map((a) => (
                <Link
                  key={a.id}
                  href={`/testimonios?aplicacion=${a.id}`}
                  className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${
                    aplicacion === a.id
                      ? "border-brand-pink bg-[#FFF3FA]"
                      : "border-[#E9E4F2] bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {a.imagenUrl ? (
                      <Image
                        src={a.imagenUrl}
                        alt={a.nombre}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8F6FF] text-sm font-bold text-brand-pink">
                        {a.nombre.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#1F1B24]">
                        {a.nombre}
                      </p>
                      <p className="text-xs text-brand-gray">
                        {a._count.resenas} testimonio
                        {a._count.resenas === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
              Testimonios publicados
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#1F1B24]">
              {aplicacionActiva
                ? `Experiencias relacionadas con ${aplicacionActiva.nombre}`
                : "Experiencias de nuestra comunidad"}
            </h2>
          </div>

          {resenas.length === 0 ? (
            <div className="rounded-3xl border border-[#E9E4F2] bg-white px-5 py-12 text-center">
              <p className="text-sm text-brand-gray">
                Aún no hay testimonios publicados en esta categoría.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resenas.map((r) => (
                <article
                  key={r.id}
                  className="flex h-full flex-col rounded-3xl border border-[#E9E4F2] bg-white p-5 shadow-[0_6px_20px_rgba(70,42,120,0.05)]"
                >
                  <div className="mb-4 flex items-center gap-3">
                    {r.imagenUrl ? (
                      <Image
                        src={r.imagenUrl}
                        alt={r.nombreCliente}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-pink/10 font-bold text-brand-pink">
                        {r.nombreCliente.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#1F1B24]">
                        {r.nombreCliente}
                      </p>
                      <p className="mt-0.5 text-xs text-yellow-500">
                        {r.calificacion !== null
                          ? "★".repeat(r.calificacion)
                          : null}
                      </p>
                    </div>
                  </div>

                  {r.aplicacion && (
                    <span className="mb-3 w-fit rounded-full bg-[#F8F6FF] px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                      {r.aplicacion.nombre}
                    </span>
                  )}

                  <p className="flex-1 text-sm leading-6 text-brand-gray">
                    “{r.comentario}”
                  </p>

                  {r.producto && (
                    <Link
                      href={`/producto/${r.producto.slug}`}
                      className="mt-4 border-t border-[#EEEAF5] pt-3 text-xs font-semibold text-brand-pink"
                    >
                      Producto relacionado: {r.producto.nombre} →
                    </Link>
                  )}

                  <p className="mt-3 text-[11px] text-[#8A8790]">
                    Experiencia personal compartida por un cliente.
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-[#E9E4F2] bg-white py-4 text-center text-xs text-brand-gray">
        © {new Date().getFullYear()} DioxiLife Bolivia
      </footer>

      <BotonWhatsapp />
    </div>
  );
}
