import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

type Contexto = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _req: NextRequest,
  { params }: Contexto
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: { id },
      select: {
        id: true,
        duracionDias: true,
        estado: true,
        mostrarEtapasAnteriores: true,
      },
    });

  if (!seguimiento) {
    return NextResponse.json(
      { error: "Seguimiento no encontrado." },
      { status: 404 }
    );
  }

  const etapas =
    await prisma.etapaSeguimiento.findMany({
      where: {
        seguimientoId: id,
      },
      orderBy: [
        { diaInicio: "asc" },
        { orden: "asc" },
      ],
      select: {
        id: true,
        nombre: true,
        orden: true,
        diaInicio: true,
        diaFin: true,
        estado: true,
        modoPublicacion: true,
        publicadaAt: true,
        _count: {
          select: {
            actividades: true,
          },
        },
      },
    });

  return NextResponse.json({
    seguimiento,
    etapas,
  });
}

export async function POST(
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

  const { id } = await params;

  let body: Record<string, unknown>;

  try {
    const recibido: unknown = await req.json();

    if (
      !recibido ||
      typeof recibido !== "object" ||
      Array.isArray(recibido)
    ) {
      throw new Error("Cuerpo inválido");
    }

    body = recibido as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Envía datos JSON válidos." },
      { status: 400 }
    );
  }

  const nombre =
    typeof body.nombre === "string"
      ? body.nombre.trim()
      : "";

  const inicio = body.diaInicio;
  const fin = body.diaFin;

  if (
    !nombre ||
    nombre.length > 100
  ) {
    return NextResponse.json(
      {
        error:
          "El nombre debe tener entre 1 y 100 caracteres.",
      },
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
      {
        error:
          "Selecciona días de inicio y finalización válidos.",
      },
      { status: 400 }
    );
  }

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "SeguimientoCliente" WHERE "id" = ${id} FOR UPDATE`;

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
          "No se pueden crear etapas en un seguimiento finalizado.",
      },
      { status: 409 }
    );
  }

  if (fin > seguimiento.duracionDias) {
    return NextResponse.json(
      {
        error:
          `La etapa no puede superar los ${seguimiento.duracionDias} días del seguimiento.`,
      },
      { status: 400 }
    );
  }

  const superpuesta =
    await tx.etapaSeguimiento.findFirst({
      where: {
        seguimientoId: id,
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

  const ultima =
    await tx.etapaSeguimiento.findFirst({
      where: {
        seguimientoId: id,
      },
      orderBy: {
        orden: "desc",
      },
      select: {
        orden: true,
      },
    });

      const etapa =
        await tx.etapaSeguimiento.create({
        data: {
          seguimientoId: id,
          nombre,
          diaInicio: inicio,
          diaFin: fin,
          orden: (ultima?.orden ?? 0) + 1,
          estado: "BORRADOR",
          modoPublicacion: "MANUAL",
        },
      });

    return NextResponse.json(
      {
        mensaje: "Etapa creada como borrador.",
        etapa,
      },
      { status: 201 }
    );
    }, {
      isolationLevel:
        Prisma.TransactionIsolationLevel.ReadCommitted,
    });
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "Otra etapa fue registrada al mismo tiempo. Actualiza e inténtalo nuevamente.",
        },
        { status: 409 }
      );
    }

    throw error;
  }
}


// Configuracion de visibilidad del historial.
// Solo el administrador autenticado puede modificarla.
export async function PATCH(
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

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Identificador invalido." },
      { status: 400 }
    );
  }

  let recibido: unknown;

  try {
    recibido = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Envia datos JSON validos." },
      { status: 400 }
    );
  }

  if (
    !recibido ||
    typeof recibido !== "object" ||
    Array.isArray(recibido)
  ) {
    return NextResponse.json(
      { error: "Configuracion invalida." },
      { status: 400 }
    );
  }

  const body = recibido as Record<string, unknown>;

  const mostrarEtapasAnteriores =
    body.mostrarEtapasAnteriores;

  if (typeof mostrarEtapasAnteriores !== "boolean") {
    return NextResponse.json(
      {
        error:
          "La opcion mostrarEtapasAnteriores debe ser verdadera o falsa.",
      },
      { status: 400 }
    );
  }

  const actualizacion =
    await prisma.seguimientoCliente.updateMany({
      where: {
        id,
      },
      data: {
        mostrarEtapasAnteriores,
      },
    });

  if (actualizacion.count !== 1) {
    return NextResponse.json(
      { error: "Seguimiento no encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    mensaje: mostrarEtapasAnteriores
      ? "Historial anterior habilitado."
      : "Historial anterior ocultado.",
    seguimiento: {
      id,
      mostrarEtapasAnteriores,
    },
  });
}
