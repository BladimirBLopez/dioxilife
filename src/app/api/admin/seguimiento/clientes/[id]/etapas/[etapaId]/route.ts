import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

type Contexto = {
  params: Promise<{
    id: string;
    etapaId: string;
  }>;
};

export async function PUT(
  req: NextRequest,
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

  let body: Record<string, unknown>;

  try {
    const recibido: unknown = await req.json();

    if (
      !recibido ||
      typeof recibido !== "object" ||
      Array.isArray(recibido)
    ) {
      return NextResponse.json(
        { error: "Datos JSON inválidos." },
        { status: 400 }
      );
    }

    body = recibido as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer la solicitud." },
      { status: 400 }
    );
  }

  const nombre =
    typeof body.nombre === "string"
      ? body.nombre.trim()
      : "";

  const inicio = body.diaInicio;
  const fin = body.diaFin;

  if (!nombre || nombre.length > 100) {
    return NextResponse.json(
      { error: "El nombre debe tener entre 1 y 100 caracteres." },
      { status: 400 }
    );
  }

  if (
    typeof inicio !== "number" ||
    !Number.isInteger(inicio) ||
    typeof fin !== "number" ||
    !Number.isInteger(fin) ||
    inicio < 1 ||
    fin < inicio
  ) {
    return NextResponse.json(
      { error: "El período indicado no es válido." },
      { status: 400 }
    );
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        // Utilizar el mismo bloqueo de la API
        // que crea las etapas.
        await tx.$queryRaw`
          SELECT "id"
          FROM "SeguimientoCliente"
          WHERE "id" = ${id}
          FOR UPDATE
        `;

        const seguimiento =
          await tx.seguimientoCliente.findUnique({
            where: { id },
            select: {
              duracionDias: true,
              estado: true,
            },
          });

        if (!seguimiento) {
          return NextResponse.json(
            { error: "Seguimiento no encontrado." },
            { status: 404 }
          );
        }

        if (
          seguimiento.estado === "COMPLETADO" ||
          seguimiento.estado === "CANCELADO"
        ) {
          return NextResponse.json(
            {
              error:
                "No se pueden editar etapas de un seguimiento finalizado.",
            },
            { status: 409 }
          );
        }

        if (fin > seguimiento.duracionDias) {
          return NextResponse.json(
            {
              error:
                "La etapa supera la duración del seguimiento.",
            },
            { status: 400 }
          );
        }

        const etapa =
          await tx.etapaSeguimiento.findFirst({
            where: {
              id: etapaId,
              seguimientoId: id,
            },
            select: {
              estado: true,
              _count: {
                select: {
                  actividades: true,
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

        if (etapa.estado !== "BORRADOR") {
          return NextResponse.json(
            {
              error:
                "Por seguridad, solo se pueden editar borradores.",
            },
            { status: 409 }
          );
        }

        if (etapa._count.actividades > 0) {
          return NextResponse.json(
            {
              error:
                "Esta etapa ya tiene actividades. Su edición requiere revisar las instrucciones asociadas.",
            },
            { status: 409 }
          );
        }

        const superpuesta =
          await tx.etapaSeguimiento.findFirst({
            where: {
              seguimientoId: id,
              id: {
                not: etapaId,
              },
              diaInicio: {
                lte: fin,
              },
              diaFin: {
                gte: inicio,
              },
            },
            select: {
              nombre: true,
              diaInicio: true,
              diaFin: true,
            },
          });

        if (superpuesta) {
          return NextResponse.json(
            {
              error:
                `El período coincide con "${superpuesta.nombre}" ` +
                `(días ${superpuesta.diaInicio} al ${superpuesta.diaFin}).`,
            },
            { status: 409 }
          );
        }

        const actualizada =
          await tx.etapaSeguimiento.update({
            where: { id: etapaId },
            data: {
              nombre,
              diaInicio: inicio,
              diaFin: fin,
            },
            select: {
              id: true,
              nombre: true,
              diaInicio: true,
              diaFin: true,
              estado: true,
            },
          });

        return NextResponse.json({
          mensaje: "Borrador actualizado correctamente.",
          etapa: actualizada,
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
      (error.code === "P2002" || error.code === "P2034")
    ) {
      return NextResponse.json(
        {
          error:
            "Hubo otra modificación simultánea. Actualiza e inténtalo nuevamente.",
        },
        { status: 409 }
      );
    }

    throw error;
  }
}
