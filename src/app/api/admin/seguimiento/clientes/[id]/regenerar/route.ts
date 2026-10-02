import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function hashToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function POST(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        estado: true,
        preparadoAt: true,
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
          "No se puede regenerar el acceso de un seguimiento finalizado.",
      },
      { status: 409 }
    );
  }

  if (
    seguimiento.estado === "PENDIENTE" &&
    !seguimiento.preparadoAt
  ) {
    return NextResponse.json(
      {
        error:
          "Primero debes finalizar la preparación antes de generar un enlace de acceso.",
      },
      { status: 409 }
    );
  }

  const token =
    randomBytes(32).toString("hex");

  await prisma.seguimientoCliente.update({
    where: {
      id,
    },
    data: {
      tokenAccesoHash:
        hashToken(token),
      tokenCreadoAt:
        new Date(),
    },
  });

  return NextResponse.json({
    token,
  });
}
