import type {
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type TipoActividadGrupo =
  | "TAREA"
  | "INFORMACION"
  | "CONTROL";

export type SeccionActividadGrupo =
  | "PRINCIPAL"
  | "ADICIONAL";

export type RecordatorioGrupo =
  | "NINGUNO"
  | "A_LA_HORA"
  | "MIN_15_ANTES"
  | "MIN_30_ANTES"
  | "MIN_60_ANTES";

export type IndicacionGrupoDatos = {
  hora: string;
  texto: string;
  orden: number;
  activo: boolean;
};

export type ActividadGrupoDatos = {
  tipo: TipoActividadGrupo;
  recordatorio: RecordatorioGrupo;
  seccion: SeccionActividadGrupo;
  titulo: string;
  descripcion: string | null;
  momento: string | null;
  hora: string | null;
  diaInicio: number;
  diaFin: number | null;
  orden: number;
  activo: boolean;
};

export function horaValidaGrupo(
  valor: string
) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
    valor
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

function fechaUtc(
  valor: string
) {
  return new Date(
    `${valor}T00:00:00.000Z`
  );
}

export function diaCambioGrupo({
  fechaInicio,
  duracionDias,
}: {
  fechaInicio: Date;
  duracionDias: number;
}) {
  const hoy =
    fechaUtc(
      fechaBoliviaActual()
    );

  const inicio =
    Date.UTC(
      fechaInicio.getUTCFullYear(),
      fechaInicio.getUTCMonth(),
      fechaInicio.getUTCDate()
    );

  const actual =
    Date.UTC(
      hoy.getUTCFullYear(),
      hoy.getUTCMonth(),
      hoy.getUTCDate()
    );

  const dia =
    Math.floor(
      (
        actual -
        inicio
      ) /
        86400000
    ) + 1;

  return Math.min(
    Math.max(
      dia,
      1
    ),
    duracionDias
  );
}

export async function obtenerContextoAgendaGrupo(
  grupoId: string
) {
  const grupo =
    await prisma.grupoSeguimiento.findUnique({
      where: {
        id:
          grupoId,
      },

      select: {
        id: true,
        estado: true,
        fechaInicio: true,
        duracionDias: true,
        planId: true,

        miembros: {
          select: {
            seguimientoId:
              true,
            estado:
              true,
          },
        },
      },
    });

  if (!grupo) {
    return null;
  }

  return {
    ...grupo,

    seguimientosActivos:
      grupo.miembros
        .filter(
          (
            miembro
          ) =>
            miembro.estado ===
            "ACTIVO"
        )
        .map(
          (
            miembro
          ) =>
            miembro.seguimientoId
        ),

    todosSeguimientos:
      grupo.miembros.map(
        (
          miembro
        ) =>
          miembro.seguimientoId
      ),
  };
}

export function normalizarActividadGrupo({
  body,
  duracionDias,
  seccionActual,
  activoActual = true,
}: {
  body: unknown;
  duracionDias: number;
  seccionActual?: SeccionActividadGrupo;
  activoActual?: boolean;
}) {
  if (
    typeof body !==
      "object" ||
    body === null ||
    Array.isArray(
      body
    )
  ) {
    return {
      ok: false as const,
      error:
        "Los datos enviados no son válidos.",
    };
  }

  const datos =
    body as Record<
      string,
      unknown
    >;

  const tipo:
    TipoActividadGrupo =
      datos.tipo ===
        "INFORMACION" ||
      datos.tipo ===
        "CONTROL"
        ? datos.tipo
        : "TAREA";

  const recordatorio:
    RecordatorioGrupo =
      datos.recordatorio ===
        "A_LA_HORA" ||
      datos.recordatorio ===
        "MIN_15_ANTES" ||
      datos.recordatorio ===
        "MIN_30_ANTES" ||
      datos.recordatorio ===
        "MIN_60_ANTES"
        ? datos.recordatorio
        : "NINGUNO";

  const seccion:
    SeccionActividadGrupo =
      datos.seccion ===
        "ADICIONAL"
        ? "ADICIONAL"
        : datos.seccion ===
            "PRINCIPAL"
        ? "PRINCIPAL"
        : seccionActual ??
          "PRINCIPAL";

  const titulo =
    String(
      datos.titulo ||
        ""
    ).trim();

  const descripcion =
    datos.descripcion
      ? String(
          datos.descripcion
        )
          .trim()
          .slice(
            0,
            5000
          )
      : null;

  const momento =
    datos.momento
      ? String(
          datos.momento
        )
          .trim()
          .slice(
            0,
            60
          )
      : null;

  const hora =
    datos.hora
      ? String(
          datos.hora
        )
          .trim()
          .slice(
            0,
            20
          )
      : null;

  const diaInicio =
    Number(
      datos.diaInicio
    );

  const diaFin =
    datos.diaFin ===
        null ||
    datos.diaFin ===
        undefined ||
    datos.diaFin ===
        ""
      ? null
      : Number(
          datos.diaFin
        );

  const ordenNumero =
    Number(
      datos.orden ??
        0
    );

  const orden =
    Number.isFinite(
      ordenNumero
    )
      ? Math.trunc(
          ordenNumero
        )
      : 0;

  const activo =
    typeof datos.activo ===
      "boolean"
      ? datos.activo
      : activoActual;

  if (!titulo) {
    return {
      ok: false as const,
      error:
        "El título es obligatorio.",
    };
  }

  if (
    !Number.isInteger(
      diaInicio
    ) ||
    diaInicio < 1 ||
    diaInicio >
      duracionDias
  ) {
    return {
      ok: false as const,
      error:
        `El día inicial debe estar entre 1 y ${duracionDias}.`,
    };
  }

  if (
    diaFin !== null &&
    (
      !Number.isInteger(
        diaFin
      ) ||
      diaFin <
        diaInicio ||
      diaFin >
        duracionDias
    )
  ) {
    return {
      ok: false as const,
      error:
        "El día final no es válido.",
    };
  }

  return {
    ok: true as const,

    datos: {
      tipo,
      recordatorio,
      seccion,
      titulo,
      descripcion,
      momento,
      hora,
      diaInicio,
      diaFin,
      orden,
      activo,
    } satisfies ActividadGrupoDatos,
  };
}

export async function crearActividadGrupoConCopias(
  tx: Prisma.TransactionClient,
  {
    planId,
    seguimientoIds,
    datos,
    indicaciones = [],
  }: {
    planId: string;
    seguimientoIds: string[];
    datos: ActividadGrupoDatos;
    indicaciones?: IndicacionGrupoDatos[];
  }
) {
  const actividad =
    await tx.actividadPlan.create({
      data: {
        planId,

        ...datos,

        indicaciones:
          indicaciones.length >
          0
            ? {
                create:
                  indicaciones.map(
                    (
                      indicacion
                    ) => ({
                      hora:
                        indicacion.hora,

                      texto:
                        indicacion.texto,

                      orden:
                        indicacion.orden,

                      activo:
                        indicacion.activo,
                    })
                  ),
              }
            : undefined,
      },

      include: {
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
        },
      },
    });

  for (
    const seguimientoId of
    seguimientoIds
  ) {
    await tx.actividadSeguimiento.create({
      data: {
        seguimientoId,

        actividadPlanOrigenId:
          actividad.id,

        tipo:
          actividad.tipo,

        recordatorio:
          actividad.recordatorio,

        seccion:
          actividad.seccion,

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
          actividad.indicaciones.length >
          0
            ? {
                create:
                  actividad.indicaciones.map(
                    (
                      indicacion
                    ) => ({
                      hora:
                        indicacion.hora,

                      texto:
                        indicacion.texto,

                      orden:
                        indicacion.orden,

                      activo:
                        indicacion.activo,
                    })
                  ),
              }
            : undefined,
      },
    });
  }

  return actividad;
}

export async function versionarAdicionalGrupo(
  tx: Prisma.TransactionClient,
  {
    planId,
    actividadAnteriorId,
    seguimientoIds,
    diaCambio,
    datos,
    indicaciones,
  }: {
    planId: string;
    actividadAnteriorId: string;
    seguimientoIds: string[];
    diaCambio: number;
    datos: ActividadGrupoDatos;
    indicaciones: IndicacionGrupoDatos[];
  }
) {
  await tx.actividadPlan.update({
    where: {
      id:
        actividadAnteriorId,
    },

    data: {
      diaFin:
        diaCambio -
        1,

      activo:
        true,
    },
  });

  if (
    seguimientoIds.length >
    0
  ) {
    await tx.actividadSeguimiento.updateMany({
      where: {
        actividadPlanOrigenId:
          actividadAnteriorId,

        seguimientoId: {
          in:
            seguimientoIds,
        },
      },

      data: {
        diaFin:
          diaCambio -
          1,

        activo:
          true,
      },
    });
  }

  return crearActividadGrupoConCopias(
    tx,
    {
      planId,

      seguimientoIds,

      datos: {
        ...datos,

        seccion:
          "ADICIONAL",

        diaInicio:
          diaCambio,

        activo:
          true,
      },

      indicaciones,
    }
  );
}

export async function copiasActividadGrupo(
  tx: Prisma.TransactionClient,
  {
    actividadPlanId,
    seguimientoIds,
  }: {
    actividadPlanId: string;
    seguimientoIds: string[];
  }
) {
  if (
    seguimientoIds.length ===
    0
  ) {
    return [];
  }

  return tx.actividadSeguimiento.findMany({
    where: {
      actividadPlanOrigenId:
        actividadPlanId,

      seguimientoId: {
        in:
          seguimientoIds,
      },
    },

    select: {
      id: true,
      seguimientoId: true,

      indicaciones: {
        where: {
          activo:
            true,
        },

        orderBy: [
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
          activo: true,
        },
      },
    },
  });
}
