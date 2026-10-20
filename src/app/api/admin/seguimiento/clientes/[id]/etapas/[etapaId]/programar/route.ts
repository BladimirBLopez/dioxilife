import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";
import { obtenerDiaSeguimiento } from "@/lib/seguimiento-publico";
import { verificarAprobacionEtapa } from "@/lib/seguimiento-aprobacion-etapa";

type Contexto = {
  params: Promise<{
    id: string;
    etapaId: string;
  }>;
};

function horaValida(hora: string | null) {
  return Boolean(
    hora &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora)
  );
}

export async function POST(
  _req: Request,
  { params }: Contexto
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  const { id, etapaId } = await params;

  if (!id || !etapaId) {
    return NextResponse.json(
      { error: "Identificadores invalidos." },
      { status: 400 }
    );
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const bloqueo =
          await tx.$queryRaw<Array<{ id: string }>>`
            SELECT "id"
            FROM "SeguimientoCliente"
            WHERE "id" = ${id}
            FOR UPDATE
          `;

        if (bloqueo.length === 0) {
          return NextResponse.json(
            { error: "Seguimiento no encontrado." },
            { status: 404 }
          );
        }

        const seguimiento =
          await tx.seguimientoCliente.findUnique({
            where: { id },
            select: {
              estado: true,
              fechaInicio: true,
              duracionDias: true,
            },
          });

        if (!seguimiento) {
          return NextResponse.json(
            { error: "Seguimiento no encontrado." },
            { status: 404 }
          );
        }

        if (
          seguimiento.estado !== "PENDIENTE" &&
          seguimiento.estado !== "ACTIVO"
        ) {
          return NextResponse.json(
            {
              error:
                "Este seguimiento no permite programar etapas.",
            },
            { status: 409 }
          );
        }

        const etapa =
          await tx.etapaSeguimiento.findFirst({
            where: {
              id: etapaId,
              seguimientoId: id,
            },
            select: {
              id: true,
              nombre: true,
              estado: true,
              modoPublicacion: true,
              publicadaAt: true,
              diaInicio: true,
              diaFin: true,
              actividades: {
                select: {
                  id: true,
                  activo: true,
                  titulo: true,
                  seccion: true,
                  hora: true,
                  diaInicio: true,
                  diaFin: true,
                  indicaciones: {
                    where: {
                      activo: true,
                    },
                    select: {
                      hora: true,
                      texto: true,
                    },
                  },
                },
              },
            },
          });

        if (!etapa) {
          return NextResponse.json(
            { error: "Etapa no encontrada." },
            { status: 404 }
          );
        }

        if (
          etapa.estado !== "BORRADOR" ||
          etapa.publicadaAt !== null ||
          etapa.modoPublicacion !== "MANUAL"
        ) {
          return NextResponse.json(
            {
              error:
                "Solo se pueden programar borradores que no hayan sido publicados.",
            },
            { status: 409 }
          );
        }

        if (
          etapa.diaInicio < 1 ||
          etapa.diaFin < etapa.diaInicio ||
          etapa.diaFin > seguimiento.duracionDias
        ) {
          return NextResponse.json(
            {
              error:
                "El periodo de la etapa no es valido.",
            },
            { status: 409 }
          );
        }

        if (seguimiento.estado === "ACTIVO") {
          if (!seguimiento.fechaInicio) {
            return NextResponse.json(
              {
                error:
                  "El seguimiento no tiene fecha de inicio.",
              },
              { status: 409 }
            );
          }

          const diaActual =
            obtenerDiaSeguimiento(
              seguimiento.fechaInicio
            );

          if (diaActual >= etapa.diaInicio) {
            return NextResponse.json(
              {
                error:
                  "El inicio de esta etapa ya llego. Revisa la opcion de publicacion manual.",
              },
              { status: 409 }
            );
          }
        }

        const activas =
          etapa.actividades.filter(
            (actividad) => actividad.activo
          );

        if (activas.length === 0) {
          return NextResponse.json(
            {
              error:
                "Agrega al menos una actividad activa antes de programar.",
            },
            { status: 409 }
          );
        }

        for (const actividad of etapa.actividades) {
          const fin =
            actividad.diaFin ?? etapa.diaFin;

          if (
            actividad.diaInicio < etapa.diaInicio ||
            actividad.diaInicio > etapa.diaFin ||
            fin < actividad.diaInicio ||
            fin > etapa.diaFin ||
            fin > seguimiento.duracionDias
          ) {
            return NextResponse.json(
              {
                error:
                  "Existen actividades fuera del periodo de la etapa.",
              },
              { status: 409 }
            );
          }
        }

        for (const actividad of activas) {
          if (!actividad.titulo.trim()) {
            return NextResponse.json(
              {
                error:
                  "Una actividad no tiene titulo.",
              },
              { status: 409 }
            );
          }

          if (
            actividad.seccion === "ADICIONAL" &&
            !horaValida(actividad.hora)
          ) {
            return NextResponse.json(
              {
                error:
                  `La actividad "${actividad.titulo}" necesita un horario valido.`,
              },
              { status: 409 }
            );
          }

          const indicacionInvalida =
            actividad.indicaciones.some(
              (indicacion) =>
                !horaValida(indicacion.hora) ||
                !indicacion.texto.trim()
            );

          if (indicacionInvalida) {
            return NextResponse.json(
              {
                error:
                  `La actividad "${actividad.titulo}" tiene indicaciones incompletas.`,
              },
              { status: 409 }
            );
          }
        }

        // PASO 522: exigir aprobacion vigente.
        const aprobacion =
          await verificarAprobacionEtapa(
            tx,
            id,
            etapaId
          );

        if (!aprobacion.valida) {
          return NextResponse.json(
            { error: aprobacion.motivo },
            { status: 409 }
          );
        }

        const programada =
          await tx.etapaSeguimiento.update({
            where: {
              id: etapa.id,
            },
            data: {
              estado: "PROGRAMADA",
              modoPublicacion: "AUTOMATICA",
            },
            select: {
              id: true,
              nombre: true,
              estado: true,
              modoPublicacion: true,
              diaInicio: true,
              diaFin: true,
              publicadaAt: true,
            },
          });

        return NextResponse.json({
          mensaje:
            "Etapa programada correctamente.",
          etapa: programada,
        });
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" || error.code === "P2002")
    ) {
      return NextResponse.json(
        {
          error:
            "Se detecto otra modificacion simultanea. Actualiza la pagina.",
        },
        { status: 409 }
      );
    }

    throw error;
  }
}
