import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";
import { obtenerDiaSeguimiento } from "@/lib/seguimiento-publico";
import { verificarAprobacionEtapa } from "@/lib/seguimiento-aprobacion-etapa";

function horaValida(hora: string | null) {
  return Boolean(
    hora &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora)
  );
}

type Contexto = {
  params: Promise<{
    id: string;
    etapaId: string;
  }>;
};

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
        // Serializar las modificaciones administrativas
        // de este seguimiento.
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
          seguimiento.estado !== "ACTIVO" ||
          !seguimiento.fechaInicio
        ) {
          return NextResponse.json(
            {
              error:
                "La publicacion manual requiere un seguimiento activo e iniciado.",
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
          etapa.publicadaAt !== null
        ) {
          return NextResponse.json(
            {
              error:
                "Solo se pueden publicar borradores que no hayan sido publicados anteriormente.",
            },
            { status: 409 }
          );
        }

        if (etapa.modoPublicacion !== "MANUAL") {
          return NextResponse.json(
            {
              error:
                "Esta etapa no esta configurada para publicacion manual.",
            },
            { status: 409 }
          );
        }

        const diaActual =
          obtenerDiaSeguimiento(
            seguimiento.fechaInicio
          );

        if (
          diaActual < etapa.diaInicio ||
          diaActual > etapa.diaFin
        ) {
          return NextResponse.json(
            {
              error:
                `La etapa solo puede publicarse entre los dias ` +
                `${etapa.diaInicio} y ${etapa.diaFin}. ` +
                `El seguimiento esta en el dia ${diaActual}.`,
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
                "El periodo de la etapa es invalido.",
            },
            { status: 409 }
          );
        }

        const activas =
          etapa.actividades.filter(
            (actividad) => actividad.activo
          );

        if (activas.length === 0) {
          return NextResponse.json(
            {
              error:
                "Agrega al menos una actividad activa antes de publicar.",
            },
            { status: 409 }
          );
        }

        const actividadInvalida =
          etapa.actividades.some((actividad) => {
            const fin =
              actividad.diaFin ?? etapa.diaFin;

            return (
              actividad.diaInicio <
                etapa.diaInicio ||
              actividad.diaInicio >
                etapa.diaFin ||
              fin < actividad.diaInicio ||
              fin > etapa.diaFin ||
              fin > seguimiento.duracionDias
            );
          });

        if (actividadInvalida) {
          return NextResponse.json(
            {
              error:
                "Existen actividades con dias fuera del periodo de la etapa.",
            },
            { status: 409 }
          );
        }

        // PASO 215: validar contenido antes
        // de autorizar su publicacion.
        for (const actividad of activas) {
          if (!actividad.titulo.trim()) {
            return NextResponse.json(
              {
                error:
                  "Una actividad no tiene titulo. Corrige el borrador.",
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
            actividad.indicaciones.find(
              (indicacion) =>
                !horaValida(indicacion.hora) ||
                !indicacion.texto.trim()
            );

          if (indicacionInvalida) {
            return NextResponse.json(
              {
                error:
                  `La actividad "${actividad.titulo}" tiene una indicacion vacia o con horario incorrecto.`,
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

        const publicada =
          await tx.etapaSeguimiento.update({
            where: {
              id: etapa.id,
            },
            data: {
              estado: "PUBLICADA",
              modoPublicacion: "MANUAL",
              publicadaAt: new Date(),
            },
            select: {
              id: true,
              nombre: true,
              estado: true,
              diaInicio: true,
              diaFin: true,
              publicadaAt: true,
            },
          });

        return NextResponse.json({
          mensaje:
            "Etapa publicada correctamente.",
          etapa: publicada,
        });
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        {
          error:
            "Se detecto otra modificacion simultanea. Actualiza e intentalo nuevamente.",
        },
        { status: 409 }
      );
    }

    throw error;
  }
}
