import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";
import {
  obtenerDiaSeguimiento,
  obtenerDiaSeguimientoFechaCalendario,
  obtenerDiaEntreFechasCalendario,
} from "@/lib/seguimiento-publico";

export const dynamic = "force-dynamic";

type Progreso = {
  diaPlan: number;
  completado: boolean;
};

type Actividad = {
  tipo: "TAREA" | "INFORMACION" | "CONTROL";
  seccion: "PRINCIPAL" | "ADICIONAL";
  diaInicio: number;
  diaFin: number | null;
  progresos: Progreso[];
  indicaciones: {
    progresos: Progreso[];
  }[];
};

function cumplimiento(
  actividades: Actividad[],
  desde: number,
  hasta: number,
  duracion: number
) {
  let total = 0;
  let realizadas = 0;

  if (hasta < desde) {
    return { total, realizadas };
  }

  for (const actividad of actividades) {
    if (actividad.tipo !== "TAREA") continue;

    const ultimo =
      actividad.diaFin ??
      (actividad.seccion === "ADICIONAL"
        ? duracion
        : actividad.diaInicio);

    const primerDia = Math.max(
      desde,
      actividad.diaInicio
    );

    const ultimoDia = Math.min(
      hasta,
      ultimo
    );

    const dias = Math.max(
      0,
      ultimoDia - primerDia + 1
    );

    if (dias === 0) continue;

    total += dias * (
      1 + actividad.indicaciones.length
    );

    const contarCompletadas = (
      progresos: Progreso[]
    ) => {
      const fechasCompletadas = new Set(
        progresos
          .filter((p) => p.completado)
          .map((p) => p.diaPlan)
      );

      for (const dia of fechasCompletadas) {
        if (
          dia >= primerDia &&
          dia <= ultimoDia
        ) {
          realizadas++;
        }
      }
    };

    contarCompletadas(actividad.progresos);

    for (const indicacion of actividad.indicaciones) {
      contarCompletadas(indicacion.progresos);
    }
  }

  return { total, realizadas };
}

function porcentaje(realizadas: number, total: number) {
  return total > 0
    ? Math.round((realizadas / total) * 100)
    : null;
}

function mostrarPorcentaje(valor: number | null) {
  return valor === null ? "—" : `${valor}%`;
}

type FiltrosPanel = {
  q?: string;
  grupo?: string;
  estado?: string;
  etapa?: string;
  pagina?: string;
};

export default async function SeguimientoGeneralPage({
  searchParams,
}: {
  searchParams?: Promise<FiltrosPanel>;
}) {
  const parametros = (await searchParams) ?? {};

  const q =
    typeof parametros.q === "string"
      ? parametros.q.trim().slice(0, 120)
      : "";

  const grupoFiltro =
    typeof parametros.grupo === "string"
      ? parametros.grupo
      : "";

  const estadoFiltro =
    parametros.estado === "ACTIVO" ||
    parametros.estado === "PAUSADO"
      ? parametros.estado
      : "";

  const etapaFiltro =
    typeof parametros.etapa === "string"
      ? parametros.etapa
      : "";
  const paginaSolicitada =
    typeof parametros.pagina === "string" &&
    /^[1-9][0-9]{0,5}$/.test(parametros.pagina)
      ? Number(parametros.pagina)
      : 1;

  const admin = await obtenerAdminActual();

  if (
    !admin ||
    (admin.rol !== "ADMIN" && admin.rol !== "SUPER_ADMIN")
  ) {
    redirect("/admin/login");
  }

  const ahora = new Date();

  const [seguimientos, grupos] = await Promise.all([
    prisma.seguimientoCliente.findMany({
      where: {
        estado: { in: ["ACTIVO", "PAUSADO"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nombreCliente: true,
        nombrePlan: true,
        estado: true,
        fechaInicio: true,
        duracionDias: true,

        miembroGrupo: {
          select: {
            estado: true,
            diaIngreso: true,
            fechaRetiro: true,
            grupo: {
              select: {
                id: true,
                nombre: true,
                fechaInicio: true,
                duracionDias: true,
                estado: true,
              },
            },
          },
        },

        etapas: {
          select: {
            nombre: true,
            diaInicio: true,
            diaFin: true,
            estado: true,
          },
        },

        actividades: {
          where: {
            activo: true,
            tipo: "TAREA",
          },
          select: {
            tipo: true,
            seccion: true,
            diaInicio: true,
            diaFin: true,

            progresos: {
              where: { completado: true },
              select: {
                diaPlan: true,
                completado: true,
              },
            },

            indicaciones: {
              where: { activo: true },
              select: {
                progresos: {
                  where: { completado: true },
                  select: {
                    diaPlan: true,
                    completado: true,
                  },
                },
              },
            },
          },
        },
      },
    }),

    prisma.grupoSeguimiento.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nombre: true,
        fechaInicio: true,
        duracionDias: true,
        miembros: {
          select: {
            seguimientoId: true,
            estado: true,
          },
        },
      },
    }),
  ]);

  const perfiles = seguimientos.map((s) => {
    const miembro = s.miembroGrupo;
    const grupo = miembro?.grupo;
    const duracion = grupo?.duracionDias ?? s.duracionDias;

    const diaSinLimitar = grupo
      ? obtenerDiaSeguimientoFechaCalendario(
          grupo.fechaInicio,
          ahora
        )
      : s.fechaInicio
        ? obtenerDiaSeguimiento(s.fechaInicio, ahora)
        : 0;

    const dia = Math.max(
      0,
      Math.min(duracion, diaSinLimitar)
    );

    const desde = miembro
      ? Math.max(1, miembro.diaIngreso)
      : 1;

    const hastaRetiro =
      miembro?.estado === "RETIRADO" &&
      miembro.fechaRetiro &&
      grupo
        ? obtenerDiaEntreFechasCalendario(
            grupo.fechaInicio,
            miembro.fechaRetiro
          )
        : dia;

    const hasta = Math.min(dia, hastaRetiro);

    const acumulado = cumplimiento(
      s.actividades,
      desde,
      hasta,
      duracion
    );

    const anterior = cumplimiento(
      s.actividades,
      desde,
      Math.min(hasta, dia - 1),
      duracion
    );

    const pendientesPrevios = Math.max(
      0,
      anterior.total - anterior.realizadas
    );

    const etapa = s.etapas.find(
      (e) => dia >= e.diaInicio && dia <= e.diaFin
    );

    return {
      seguimiento: s,
      dia,
      duracion,
      etapa,
      acumulado,
      pendientesPrevios,
      pct: porcentaje(
        acumulado.realizadas,
        acumulado.total
      ),
    };
  });

  const porId = new Map(
    perfiles.map((p) => [p.seguimiento.id, p])
  );

  const gruposResumen = grupos.map((grupo) => {
    const miembrosActivos = grupo.miembros.filter(
      (miembro) => miembro.estado === "ACTIVO"
    );

    const retirados = grupo.miembros.filter(
      (miembro) => miembro.estado === "RETIRADO"
    ).length;

    const participantes = miembrosActivos
      .map((m) => porId.get(m.seguimientoId))
      .filter((p) => p !== undefined);

    const total = participantes.reduce(
      (suma, p) => suma + p.acumulado.total,
      0
    );

    const realizadas = participantes.reduce(
      (suma, p) => suma + p.acumulado.realizadas,
      0
    );

    return {
      grupo,
      participantes: participantes.length,
      activos: miembrosActivos.length,
      retirados,
      pct: porcentaje(realizadas, total),
    };
  });

  const opcionesGrupos = Array.from(
    new Map(
      perfiles.flatMap((p) => {
        const g = p.seguimiento.miembroGrupo?.grupo;
        return g
          ? [[g.id, { id: g.id, nombre: g.nombre }] as const]
          : [];
      })
    ).values()
  ).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const opcionesEtapas = Array.from(
    new Set(
      perfiles
        .map((p) => p.etapa?.nombre)
        .filter((nombre): nombre is string =>
          typeof nombre === "string" && nombre.length > 0
        )
    )
  ).sort((a, b) => a.localeCompare(b, "es"));

  const buscar = q.toLocaleLowerCase("es");

  const perfilesFiltrados = perfiles.filter((p) => {
    const s = p.seguimiento;
    const grupo = s.miembroGrupo?.grupo;

    const texto = [
      s.nombreCliente ?? "",
      s.nombrePlan,
      grupo?.nombre ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase("es");

    const coincideTexto =
      !buscar || texto.includes(buscar);

    const coincideGrupo =
      !grupoFiltro ||
      (grupoFiltro === "__individuales__"
        ? !grupo
        : grupo?.id === grupoFiltro);

    const coincideEstado =
      !estadoFiltro || s.estado === estadoFiltro;

    const coincideEtapa =
      !etapaFiltro || p.etapa?.nombre === etapaFiltro;

    return (
      coincideTexto &&
      coincideGrupo &&
      coincideEstado &&
      coincideEtapa
    );
  });

  const porPagina = 20;

  const totalPaginas = Math.max(
    1,
    Math.ceil(perfilesFiltrados.length / porPagina)
  );

  const paginaActual = Math.min(
    paginaSolicitada,
    totalPaginas
  );

  const inicioPagina = (paginaActual - 1) * porPagina;

  const perfilesPagina = perfilesFiltrados.slice(
    inicioPagina,
    inicioPagina + porPagina
  );

  function enlacePagina(numero: number) {
    const parametrosUrl = new URLSearchParams();

    if (q) parametrosUrl.set("q", q);

    if (grupoFiltro)
      parametrosUrl.set("grupo", grupoFiltro);

    if (estadoFiltro)
      parametrosUrl.set("estado", estadoFiltro);

    if (etapaFiltro)
      parametrosUrl.set("etapa", etapaFiltro);

    parametrosUrl.set("pagina", String(numero));

    return "/admin/seguimiento?" +
      parametrosUrl.toString();
  }

  const totalChecks = perfiles.reduce(
    (suma, p) => suma + p.acumulado.total,
    0
  );

  const checksRealizados = perfiles.reduce(
    (suma, p) => suma + p.acumulado.realizadas,
    0
  );

  const pendientesPrevios = perfiles.reduce(
    (suma, p) => suma + p.pendientesPrevios,
    0
  );

  const indicadores = [
    {
      titulo: "Seguimientos en curso",
      valor: String(perfiles.length),
      detalle: "Activos y pausados",
    },
    {
      titulo: "Grupos activos",
      valor: String(grupos.length),
      detalle: "Sin duplicar clientes",
    },
    {
      titulo: "Cumplimiento acumulado",
      valor: mostrarPorcentaje(
        porcentaje(checksRealizados, totalChecks)
      ),
      detalle: "Checks programados hasta hoy",
    },
    {
      titulo: "Pendientes anteriores",
      valor: String(pendientesPrevios),
      detalle: "Checks de días previos sin completar",
    },
  ];

  return (
    <main className="space-y-6 pb-8">
      <header className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-700">
            Administración / Seguimiento
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Control general
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Resumen de los seguimientos en curso. Los
            indicadores se calculan al abrir esta página.
          </p>
        </div>

        <nav className="flex flex-wrap gap-2">
          <Link
            href="/admin/seguimiento/clientes"
            className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-800"
          >
            Todos los clientes
          </Link>
          <Link
            href="/admin/seguimiento/grupos"
            className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-800"
          >
            Administrar grupos
          </Link>
          <Link
            href="/admin/seguimiento"
            className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Actualizar datos
          </Link>
        </nav>
      </header>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {indicadores.map((item) => (
          <article
            key={item.titulo}
            className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold text-gray-600">
              {item.titulo}
            </p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums text-violet-800">
              {item.valor}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {item.detalle}
            </p>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-xl font-bold text-gray-900">
            Clientes en seguimiento
          </h2>
          <span className="text-xs text-gray-500">
            {perfilesFiltrados.length} de {perfiles.length} seguimientos
          </span>
        </div>

        <form
          action="/admin/seguimiento"
          method="get"
          role="search"
          className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-gray-700">
              Buscar cliente o programa
              <input
                type="search"
                name="q"
                defaultValue={q}
                maxLength={120}
                placeholder="Nombre, programa o grupo"
                className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-normal text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-gray-700">
              Grupo
              <select
                name="grupo"
                defaultValue={grupoFiltro}
                className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-normal text-gray-900 focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <option value="">Todos los grupos</option>
                <option value="__individuales__">Sin grupo</option>
                {opcionesGrupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-gray-700">
              Estado
              <select
                name="estado"
                defaultValue={estadoFiltro}
                className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-normal text-gray-900 focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="PAUSADO">Pausado</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-gray-700">
              Etapa actual
              <select
                name="etapa"
                defaultValue={etapaFiltro}
                className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-normal text-gray-900 focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <option value="">Todas las etapas</option>
                {opcionesEtapas.map((etapa) => (
                  <option key={etapa} value={etapa}>
                    {etapa}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="min-h-11 rounded-xl bg-violet-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              Aplicar filtros
            </button>

            <Link
              href="/admin/seguimiento"
              className="inline-flex min-h-11 items-center rounded-xl border border-violet-200 px-4 py-2 text-sm font-semibold text-violet-800"
            >
              Limpiar filtros
            </Link>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Los indicadores superiores muestran el total general.
            Los filtros se aplican solamente a la lista de clientes.
          </p>
        </form>

        {perfilesFiltrados.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600">
            {perfiles.length === 0
              ? "No hay seguimientos activos o pausados."
              : "Ningún seguimiento coincide con los filtros seleccionados."}
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {perfilesPagina.map((p) => {
              const s = p.seguimiento;
              return (
                <article
                  key={s.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-bold text-gray-900">
                        {s.nombreCliente || "Cliente sin nombre"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {s.nombrePlan}
                      </p>
                      {s.miembroGrupo && (
                        <p className="mt-1 text-xs font-medium text-violet-700">
                          Grupo: {s.miembroGrupo.grupo.nombre}
                        </p>
                      )}
                    </div>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-800">
                      {s.estado}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-gray-600">
                    {p.dia > 0
                      ? `Día ${p.dia} de ${p.duracion}`
                      : "Sin inicio efectivo"}
                    {" · "}
                    {p.etapa?.nombre || "Sin etapa para este día"}
                  </p>
                  {p.etapa && (
                    <span className="mt-1 inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-800">
                      {p.etapa.estado === "BORRADOR"
                        ? "Etapa en borrador · no publicada"
                        : p.etapa.estado === "PROGRAMADA"
                          ? "Etapa programada · no publicada"
                          : p.etapa.estado === "PUBLICADA"
                            ? "Etapa publicada"
                            : "Etapa finalizada"}
                    </span>
                  )}

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-600">
                      Cumplimiento hasta hoy
                    </span>
                    <strong className="text-violet-800">
                      {mostrarPorcentaje(p.pct)}
                    </strong>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100">
                    <div
                      className="h-full rounded-full bg-violet-700"
                      style={{ width: `${p.pct ?? 0}%` }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    {p.acumulado.realizadas} de {p.acumulado.total} checks
                    {" · "}
                    {p.pendientesPrevios} pendientes anteriores
                  </p>

                  <Link
                    href={`/admin/seguimiento/clientes/${s.id}`}
                    className="mt-4 inline-flex rounded-lg bg-violet-50 px-3 py-2 text-sm font-bold text-violet-800"
                  >
                    Ver seguimiento →
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {perfilesFiltrados.length > porPagina && (
        <nav
          aria-label="Paginación de seguimientos"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-white p-4"
        >
          <p className="text-sm text-gray-600">
            Página {paginaActual} de {totalPaginas}
            {" · "}
            {perfilesFiltrados.length} resultados
          </p>

          <div className="flex flex-wrap gap-2">
            {paginaActual > 1 && (
              <Link
                href={enlacePagina(paginaActual - 1)}
                className="inline-flex min-h-10 items-center rounded-xl border border-violet-200 px-4 py-2 text-sm font-bold text-violet-800"
              >
                ← Anterior
              </Link>
            )}

            {paginaActual < totalPaginas && (
              <Link
                href={enlacePagina(paginaActual + 1)}
                className="inline-flex min-h-10 items-center rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white"
              >
                Siguiente →
              </Link>
            )}
          </div>
        </nav>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">
          Grupos activos
        </h2>

        {gruposResumen.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600">
            No hay grupos activos.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {gruposResumen.map(({ grupo, participantes, activos, retirados, pct }) => (
              <article
                key={grupo.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <h3 className="font-bold text-gray-900">
                  {grupo.nombre}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {activos} integrantes activos · {retirados} retirados
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {participantes} seguimientos en curso
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">
                    Cumplimiento ponderado · en curso
                  </span>
                  <strong className="text-violet-800">
                    {mostrarPorcentaje(pct)}
                  </strong>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100">
                  <div
                    className="h-full rounded-full bg-violet-700"
                    style={{ width: `${pct ?? 0}%` }}
                  />
                </div>
                <Link
                  href={`/admin/seguimiento/grupos/${grupo.id}`}
                  className="mt-4 inline-flex rounded-lg bg-violet-50 px-3 py-2 text-sm font-bold text-violet-800"
                >
                  Ver grupo →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-gray-500">
        El cumplimiento contabiliza actividades e indicaciones
        registrables hasta el día correspondiente. No representa
        una valoración médica. Los pendientes anteriores no son
        equivalentes a alertas médicas.
      </p>
    </main>
  );
}
