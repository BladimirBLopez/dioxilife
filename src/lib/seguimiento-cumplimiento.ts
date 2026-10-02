import { prisma } from "@/lib/prisma";
import { obtenerDiaSeguimiento } from "@/lib/seguimiento-publico";

export type PendienteHoy = {
  id: string;
  titulo: string;
  hora: string | null;
};

export type Cumplimiento = {
  diaActual: number;
  duracionDias: number;
  totalHoy: number;
  completadasHoy: number;
  pendientesHoy: PendienteHoy[];
  semanaTotal: number;
  semanaCompletadas: number;
  semanaPorcentaje: number | null;
};

function minutosAhoraBolivia(ahora: Date) {
  const partes =
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/La_Paz",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(ahora);

  const horas = Number(
    partes.find((p) => p.type === "hour")?.value ?? 0
  );

  const minutos = Number(
    partes.find((p) => p.type === "minute")?.value ?? 0
  );

  return horas * 60 + minutos;
}

function minutosDeHora(hora: string | null) {
  const partes =
    /^([01]\d|2[0-3]):([0-5]\d)$/.exec(
      (hora || "").trim()
    );

  if (!partes) {
    return null;
  }

  return Number(partes[1]) * 60 + Number(partes[2]);
}

export async function calcularCumplimiento(
  seguimientoId: string,
  ahora: Date = new Date()
): Promise<Cumplimiento | null> {
  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        id: seguimientoId,
      },

      select: {
        estado: true,
        fechaInicio: true,
        duracionDias: true,
      },
    });

  if (
    !seguimiento ||
    seguimiento.estado !== "ACTIVO" ||
    !seguimiento.fechaInicio
  ) {
    return null;
  }

  const dia = obtenerDiaSeguimiento(
    seguimiento.fechaInicio,
    ahora
  );

  if (dia < 1 || dia > seguimiento.duracionDias) {
    return null;
  }

  const desde = Math.max(1, dia - 6);

  const [actividades, progresos] =
    await Promise.all([
      prisma.actividadSeguimiento.findMany({
        where: {
          seguimientoId,
          activo: true,
          tipo: "TAREA",
        },

        orderBy: [
          {
            orden: "asc",
          },
        ],

        select: {
          id: true,
          titulo: true,
          hora: true,
          seccion: true,
          diaInicio: true,
          diaFin: true,
        },
      }),

      prisma.progresoActividad.findMany({
        where: {
          seguimientoId,
          completado: true,

          diaPlan: {
            gte: desde,
            lte: dia,
          },
        },

        select: {
          actividadSeguimientoId: true,
          diaPlan: true,
        },
      }),
    ]);

  const hechas = new Set(
    progresos.map(
      (progreso: {
        actividadSeguimientoId: string;
        diaPlan: number;
      }) =>
        `${progreso.actividadSeguimientoId}:${progreso.diaPlan}`
    )
  );

  const ahoraMin = minutosAhoraBolivia(ahora);

  const yaLlegoLaHora = (hora: string | null) => {
    const minutos = minutosDeHora(hora);

    return minutos === null || minutos <= ahoraMin;
  };

  const aplicaEn = (
    actividad: {
      diaInicio: number;
      diaFin: number | null;
      seccion:
        | "PRINCIPAL"
        | "ADICIONAL";
    },
    d: number
  ) => {
    const ultimoDia =
      actividad.diaFin ??
      (
        actividad.seccion ===
          "ADICIONAL"
          ? seguimiento.duracionDias
          : actividad.diaInicio
      );

    return (
      d >= actividad.diaInicio &&
      d <= ultimoDia
    );
  };

  let totalHoy = 0;
  let completadasHoy = 0;
  let semanaTotal = 0;
  let semanaCompletadas = 0;

  const pendientes: (PendienteHoy & {
    clave: string;
  })[] = [];

  for (let d = desde; d <= dia; d++) {
    for (const actividad of actividades) {
      if (!aplicaEn(actividad, d)) {
        continue;
      }

      const hecha = hechas.has(
        `${actividad.id}:${d}`
      );

      if (d === dia) {
        totalHoy++;

        if (hecha) {
          completadasHoy++;
        }

        if (!yaLlegoLaHora(actividad.hora)) {
          continue;
        }

        if (!hecha) {
          pendientes.push({
            id: actividad.id,
            titulo: actividad.titulo,
            hora: actividad.hora,
            clave: actividad.hora || "00:00",
          });
        }
      }

      semanaTotal++;

      if (hecha) {
        semanaCompletadas++;
      }
    }
  }

  pendientes.sort((a, b) =>
    a.clave.localeCompare(b.clave)
  );

  return {
    diaActual: dia,
    duracionDias: seguimiento.duracionDias,
    totalHoy,
    completadasHoy,

    pendientesHoy: pendientes.map(
      ({ id, titulo, hora }) => ({
        id,
        titulo,
        hora,
      })
    ),

    semanaTotal,
    semanaCompletadas,

    semanaPorcentaje:
      semanaTotal > 0
        ? Math.round(
            (semanaCompletadas / semanaTotal) * 100
          )
        : null,
  };
}
