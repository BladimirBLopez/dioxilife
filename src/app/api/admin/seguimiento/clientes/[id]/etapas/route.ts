import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  crearHuellaRevisionEtapa,
  seleccionRevisionEtapa,
} from "@/lib/seguimiento-aprobacion-etapa";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

type Contexto = {
  params: Promise<{
    id: string;
  }>;
};

type AprobacionParaLista = {
  id: string;
  aprobadaAt: Date | null;
  aprobadaPorAdminId: string | null;
  aprobadaPorUsuario: string | null;
  huellaAprobada: string | null;
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

  // Leer contenido y aprobaciones desde una
  // misma instantanea de lectura.
  const { etapas, aprobaciones } = await prisma.$transaction(
    async (tx) => {
      const etapas = await tx.etapaSeguimiento.findMany({
        where: { seguimientoId: id },
        orderBy: [
          { diaInicio: "asc" },
          { orden: "asc" },
        ],
        select: {
          ...seleccionRevisionEtapa,
          _count: {
            select: { actividades: true },
          },
        },
      });

      // Una sola lectura parametrizada para todas
      // las aprobaciones del seguimiento.
      const aprobaciones =
        await tx.$queryRaw<AprobacionParaLista[]>`
          SELECT
            "id",
            "aprobadaAt",
            "aprobadaPorAdminId",
            "aprobadaPorUsuario",
            "huellaAprobada"
          FROM "EtapaSeguimiento"
          WHERE "seguimientoId" = ${id}
        `;

      return { etapas, aprobaciones };
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.RepeatableRead,
    }
  );

  const aprobacionesPorId = new Map(
    aprobaciones.map((registro) => [registro.id, registro])
  );

  const etapasConAprobacion = etapas.map((etapa) => {
    const registro = aprobacionesPorId.get(etapa.id);

    let estadoAprobacion:
      | "PENDIENTE"
      | "APROBADA"
      | "REVISION_REQUERIDA" = "PENDIENTE";

    const existenDatos =
      registro &&
      (registro.aprobadaAt !== null ||
        registro.aprobadaPorAdminId !== null ||
        registro.aprobadaPorUsuario !== null ||
        registro.huellaAprobada !== null);

    if (existenDatos) {
      estadoAprobacion = "REVISION_REQUERIDA";

      if (
        registro.aprobadaAt &&
        registro.aprobadaPorAdminId &&
        registro.aprobadaPorUsuario &&
        typeof registro.huellaAprobada === "string" &&
        /^[a-f0-9]{64}$/.test(registro.huellaAprobada)
      ) {
        const huellaActual =
          crearHuellaRevisionEtapa(etapa);

        if (
          timingSafeEqual(
            Buffer.from(registro.huellaAprobada, "hex"),
            Buffer.from(huellaActual, "hex")
          )
        ) {
          estadoAprobacion = "APROBADA";
        }
      }
    }

    // No enviar actividades, huellas ni datos
    // personales del administrador al navegador.
    return {
      id: etapa.id,
      nombre: etapa.nombre,
      orden: etapa.orden,
      diaInicio: etapa.diaInicio,
      diaFin: etapa.diaFin,
      estado: etapa.estado,
      modoPublicacion: etapa.modoPublicacion,
      publicadaAt: etapa.publicadaAt,
      _count: etapa._count,
      estadoAprobacion,
    };
  });

  return NextResponse.json(
    {
      seguimiento,
      etapas: etapasConAprobacion,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
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
