export const dynamic =
  "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import AgregarParticipanteGrupo from "@/components/admin/seguimiento/AgregarParticipanteGrupo";
import GestionParticipanteGrupo from "@/components/admin/seguimiento/GestionParticipanteGrupo";
import GestionGrupoSeguimiento from "@/components/admin/seguimiento/GestionGrupoSeguimiento";
import ResumenGrupoSeguimiento from "@/components/admin/seguimiento/ResumenGrupoSeguimiento";
import BotonInformeGrupoSeguimiento from "@/components/admin/seguimiento/BotonInformeGrupoSeguimiento";
import AgendaCliente from "@/components/admin/seguimiento/AgendaCliente";

function fecha(
  valor: Date
) {
  return valor.toLocaleDateString(
    "es-BO",
    {
      timeZone: "UTC",
    }
  );
}

function fechaBoliviaActual() {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/La_Paz",
        year:
          "numeric",
        month:
          "2-digit",
        day:
          "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const valor = (
    tipo: string
  ) =>
    partes.find(
      (
        parte
      ) =>
        parte.type ===
        tipo
    )?.value || "";

  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

function fechaClave(
  valor: Date
) {
  return valor
    .toISOString()
    .slice(
      0,
      10
    );
}

function diaActualGrupo(
  fechaInicio: Date,
  duracionDias: number
) {
  const hoy =
    fechaBoliviaActual();

  const inicio =
    fechaClave(
      fechaInicio
    );

  const inicioMs =
    Date.parse(
      `${inicio}T00:00:00.000Z`
    );

  const hoyMs =
    Date.parse(
      `${hoy}T00:00:00.000Z`
    );

  if (
    !Number.isFinite(
      inicioMs
    ) ||
    !Number.isFinite(
      hoyMs
    )
  ) {
    return null;
  }

  const dia =
    Math.floor(
      (
        hoyMs -
        inicioMs
      ) /
        86400000
    ) + 1;

  if (
    dia < 1
  ) {
    return null;
  }

  return Math.min(
    dia,
    duracionDias
  );
}

function claseEstado(
  estado: string
) {
  switch (estado) {
    case "ACTIVO":
      return "bg-emerald-100 text-emerald-700";

    case "PROGRAMADO":
      return "bg-violet-100 text-violet-700";

    case "FINALIZADO":
      return "bg-blue-100 text-blue-700";

    case "CANCELADO":
      return "bg-red-100 text-red-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default async function GrupoSeguimientoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    paso?: string;
  }>;
}) {
  const {
    id,
  } = await params;

  const consulta =
    await searchParams;

  const paso =
    consulta.paso ?? "";

  const grupo =
    await prisma.grupoSeguimiento.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        nombre: true,
        objetivo: true,
        descripcion: true,
        fechaInicio: true,
        duracionDias: true,
        estado: true,

        plan: {
          select: {
            id: true,
            nombre: true,
            duracionDias: true,

            _count: {
              select: {
                actividades: {
                  where: {
                    activo: true,
                  },
                },
              },
            },

            actividades: {
              orderBy: [
                {
                  diaInicio:
                    "asc",
                },
                {
                  orden:
                    "asc",
                },
                {
                  hora: {
                    sort:
                      "asc",
                    nulls:
                      "last",
                  },
                },
                {
                  createdAt:
                    "asc",
                },
              ],

              select: {
                id: true,
                tipo: true,
                recordatorio: true,
                seccion: true,
                titulo: true,
                descripcion: true,
                momento: true,
                hora: true,
                diaInicio: true,
                diaFin: true,
                orden: true,
                activo: true,

                indicaciones: {
                  where: {
                    activo:
                      true,
                  },

                  orderBy: [
                    {
                      hora:
                        "asc",
                    },
                    {
                      orden:
                        "asc",
                    },
                    {
                      createdAt:
                        "asc",
                    },
                  ],

                  select: {
                    id: true,
                    hora: true,
                    texto: true,
                    orden: true,
                  },
                },

                copiasSeguimiento: {
                  select: {
                    _count: {
                      select: {
                        progresos:
                          true,
                      },
                    },
                  },
                },
              },
            },
          },
        },

        miembros: {
          orderBy: {
            createdAt: "asc",
          },

          select: {
            id: true,
            diaIngreso: true,
            fechaIngreso: true,
            fechaRetiro: true,
            estado: true,

            seguimiento: {
              select: {
                id: true,
                nombreCliente: true,
                telefonoCliente: true,
                estado: true,
              },
            },
          },
        },
      },
    });

  if (!grupo) {
    notFound();
  }

  const grupoProgramado =
    grupo.estado ===
      "ACTIVO" &&
    fechaClave(
      grupo.fechaInicio
    ) >
      fechaBoliviaActual();

  const estadoVisual =
    grupoProgramado
      ? "PROGRAMADO"
      : grupo.estado;

  const diaActual =
    grupo.estado ===
      "ACTIVO" &&
    !grupoProgramado
      ? diaActualGrupo(
          grupo.fechaInicio,
          grupo.duracionDias
        )
      : null;

  const participantesActivos =
    grupo.miembros.filter(
      (miembro) =>
        miembro.estado ===
        "ACTIVO"
    ).length;

  const participantesRetirados =
    grupo.miembros.filter(
      (miembro) =>
        miembro.estado ===
        "RETIRADO"
    ).length;


  const actividadesAgenda =
    grupo.plan.actividades.map(
      (
        actividad
      ) => ({
        id:
          actividad.id,

        tipo:
          actividad.tipo,

        seccion:
          actividad.seccion,

        recordatorio:
          actividad.recordatorio,

        titulo:
          actividad.titulo,

        descripcion:
          actividad.descripcion,

        momento:
          actividad.momento,

        hora:
          actividad.hora,

        diaInicio:
          actividad.diaInicio,

        diaFin:
          actividad.diaFin,

        orden:
          actividad.orden,

        activo:
          actividad.activo,

        indicaciones:
          actividad.indicaciones,

        cantidadProgresos:
          actividad.copiasSeguimiento.reduce(
            (
              total,
              copia
            ) =>
              total +
              copia._count
                .progresos,
            0
          ),
      })
    );

  return (
    <div className="space-y-6">

      {(paso ===
        "participantes" ||
        paso ===
        "revisar") && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">

          <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
            {paso ===
            "participantes"
              ? "Paso 3 de 4 · Participantes"
              : "Paso 4 de 4 · Revisar"}
          </p>

          <p className="mt-1 font-semibold text-violet-950">
            {paso ===
            "participantes"
              ? "Agrega las personas que formarán parte del grupo"
              : "Revisa el grupo antes de iniciarlo"}
          </p>

          <p className="mt-1 text-sm leading-6 text-violet-700">
            {paso ===
            "participantes"
              ? "Puedes agregar varios participantes seguidos y continuar cuando termines."
              : "Comprueba el protocolo, duración y participantes. Si todo está correcto, usa Iniciar grupo."}
          </p>

        </div>
      )}

      <div>

        <Link
          href="/admin/seguimiento/grupos"
          className="text-sm font-semibold text-violet-700 hover:text-violet-800"
        >
          ← Grupos
        </Link>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <div className="flex flex-wrap items-center gap-2">

              <h1 className="text-2xl font-semibold text-gray-900">
                {grupo.nombre}
              </h1>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${claseEstado(
                  estadoVisual
                )}`}
              >
                {estadoVisual}
              </span>

            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              {grupo.objetivo}
            </p>

          </div>

          <div className="flex flex-wrap items-center gap-2">

            {(
              (
                grupo.estado ===
                  "ACTIVO" &&
                !grupoProgramado
              ) ||
              grupo.estado ===
                "FINALIZADO"
            ) && (
              <BotonInformeGrupoSeguimiento
                grupoId={grupo.id}
              />
            )}

            <GestionGrupoSeguimiento
              grupoId={grupo.id}
              estado={grupo.estado}
              duracionDias={grupo.duracionDias}
              participantes={participantesActivos}
              fechaInicio={
                fechaClave(
                  grupo.fechaInicio
                )
              }
              programado={
                grupoProgramado
              }
            />

          </div>

        </div>

      </div>


      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        <div className="admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Protocolo común
          </p>

          <p className="mt-1 font-semibold text-gray-900">
            {grupo.plan.nombre}
          </p>

          {grupo.estado === "BORRADOR" && (
            <Link
              href={`/admin/seguimiento/grupos/${grupo.id}/preparar`}
              className="mt-2 inline-block text-sm font-semibold text-violet-700 hover:text-violet-800"
            >
              {grupo.plan._count.actividades === 0
                ? "Configurar protocolo →"
                : "Editar protocolo →"}
            </Link>
          )}
        </div>

        <div className="admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Inicio
          </p>

          <p className="mt-1 font-semibold text-gray-900">
            {fecha(
              grupo.fechaInicio
            )}
          </p>
        </div>

        <div className="admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Duración
          </p>

          <p className="mt-1 font-semibold text-gray-900">
            {grupo.duracionDias} días
          </p>
        </div>

      </div>


      {grupo.descripcion && (
        <div className="admin-card p-5">

          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Descripción
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
            {grupo.descripcion}
          </p>

        </div>
      )}


      {grupo.estado !==
        "BORRADOR" && (

        <AgendaCliente
          apiBase={
            `/api/admin/seguimiento/grupos/${grupo.id}`
          }
          tituloAgenda="Agenda grupal"
          descripcionAgenda="Los cambios realizados aquí se aplican al protocolo común y a los participantes activos del grupo."
          duracionDias={
            grupo.duracionDias
          }
          estado={
            grupo.estado ===
              "FINALIZADO"
              ? "COMPLETADO"
              : grupo.estado
          }
          diaActual={
            diaActual
          }
          actividades={
            actividadesAgenda
          }
        />

      )}


      {grupo.estado !==
        "BORRADOR" &&
        !grupoProgramado && (
        <ResumenGrupoSeguimiento
          grupoId={grupo.id}
        />
      )}


      <section className="admin-card p-5">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

          <div>
            <h2 className="font-semibold text-gray-900">
              Participantes
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {grupo.miembros.length ===
              0
                ? "Todavía no hay participantes en este grupo."
                : `${participantesActivos} activo${
                    participantesActivos ===
                    1
                      ? ""
                      : "s"
                  }${
                    participantesRetirados >
                    0
                      ? ` · ${participantesRetirados} retirado${
                          participantesRetirados ===
                          1
                            ? ""
                            : "s"
                        }`
                      : ""
                  }`}
            </p>
          </div>

          {(grupo.estado === "BORRADOR" ||
            grupo.estado === "ACTIVO") &&
            grupo.plan._count.actividades === 0 && (
              <div className="flex flex-col gap-2 sm:items-end">
                <Link
                  href={`/admin/seguimiento/grupos/${grupo.id}/preparar`}
                  className="admin-btn-primary"
                >
                  Configurar protocolo
                </Link>

                <p className="text-xs text-amber-600">
                  Primero configura el protocolo del grupo.
                </p>
              </div>
            )}

          {(grupo.estado ===
            "BORRADOR" ||
            grupo.estado ===
            "ACTIVO") &&
            grupo.plan._count.actividades > 0 && (
            <AgregarParticipanteGrupo
              grupoId={grupo.id}
              abrirAutomatico={
                paso ===
                "participantes"
              }
              modoFlujo={
                paso ===
                  "participantes" ||
                paso ===
                  "revisar"
              }
            />
          )}

        </div>


        {grupo.miembros.length >
        0 ? (
          <div className="mt-4 divide-y divide-gray-100">

            {grupo.miembros.map(
              (miembro) => (
                <div
                  key={
                    miembro.id
                  }
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div>

                    <div className="flex flex-wrap items-center gap-2">

                      <p className="font-semibold text-gray-900">
                        {miembro
                          .seguimiento
                          .nombreCliente ||
                          "Cliente sin nombre"}
                      </p>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          miembro.estado ===
                          "ACTIVO"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {miembro.estado}
                      </span>

                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                      Ingreso día{" "}
                      {
                        miembro.diaIngreso
                      }{" "}
                      ·{" "}
                      {fecha(
                        miembro.fechaIngreso
                      )}

                      {miembro.estado ===
                        "RETIRADO" &&
                        miembro.fechaRetiro && (
                          <>
                            {" "}
                            · Retiro{" "}
                            {fecha(
                              miembro.fechaRetiro
                            )}
                          </>
                        )}
                    </p>

                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3">

                    <Link
                      href={`/admin/seguimiento/clientes/${miembro.seguimiento.id}`}
                      className="text-sm font-semibold text-violet-700 hover:text-violet-800"
                    >
                      Ver seguimiento →
                    </Link>

                    <GestionParticipanteGrupo
                      grupoId={
                        grupo.id
                      }
                      miembroId={
                        miembro.id
                      }
                      nombre={
                        miembro
                          .seguimiento
                          .nombreCliente ||
                        "este participante"
                      }
                      estadoGrupo={
                        grupo.estado
                      }
                      estadoMiembro={
                        miembro.estado
                      }
                      programado={
                        grupoProgramado
                      }
                    />

                  </div>

                </div>
              )
            )}

          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-violet-200 bg-violet-50/50 p-6 text-center">

            <p className="font-semibold text-gray-800">
              Grupo listo para recibir participantes
            </p>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-500">
              En el siguiente paso agregaremos participantes y el sistema
              les asignará automáticamente este mismo protocolo.
            </p>

          </div>
        )}

      </section>

    </div>
  );
}
