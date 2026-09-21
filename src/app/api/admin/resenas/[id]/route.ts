import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const admin =
    await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await req.json();

  if (
    Object.keys(body).length === 1 &&
    "aprobado" in body
  ) {
    const resena =
      await prisma.resena.update({
        where: {
          id,
        },
        data: {
          aprobado:
            Boolean(body.aprobado),
        },
      });

    return NextResponse.json(
      resena
    );
  }

  const {
    nombreCliente,
    calificacion,
    comentario,
    imagenUrl,
    productoId,
    aprobado,
  } = body;

  const resena =
    await prisma.resena.update({
      where: {
        id,
      },
      data: {
        nombreCliente,
        calificacion:
          Number(calificacion) || 5,
        comentario,
        imagenUrl:
          imagenUrl || null,
        productoId:
          productoId || null,
        aprobado:
          Boolean(aprobado),
      },
    });

  return NextResponse.json(resena);
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const admin =
    await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;

  await prisma.resena.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}
