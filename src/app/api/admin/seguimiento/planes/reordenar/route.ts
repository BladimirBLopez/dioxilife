import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function PUT(req: NextRequest) {
  const admin = await obtenerAdminActual();

  if (
    !admin ||
    (admin.rol !== "ADMIN" &&
      admin.rol !== "SUPER_ADMIN")
  ) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  let datos: unknown;

  try {
    datos = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud JSON inválida" },
      { status: 400 }
    );
  }

  const recibido =
    datos !== null &&
    typeof datos === "object" &&
    "ids" in datos
      ? (datos as { ids: unknown }).ids
      : null;

  if (
    !Array.isArray(recibido) ||
    recibido.length === 0 ||
    recibido.length > 5000 ||
    !recibido.every(
      (id: unknown) =>
        typeof id === "string" &&
        id.length > 0 &&
        id.length <= 128 &&
        id.trim() === id
    )
  ) {
    return NextResponse.json(
      { error: "Lista de plantillas inválida" },
      { status: 400 }
    );
  }

  const ids = recibido as string[];

  if (new Set(ids).size !== ids.length) {
    return NextResponse.json(
      { error: "Hay plantillas duplicadas" },
      { status: 400 }
    );
  }

  try {
    const existentes =
      await prisma.planSeguimiento.findMany({
        where: {
          esCopiaGrupo: false,
        },
        select: {
          id: true,
        },
      });

    const idsExistentes = new Set(
      existentes.map((plan) => plan.id)
    );

    if (
      existentes.length !== ids.length ||
      ids.some((id) => !idsExistentes.has(id))
    ) {
      return NextResponse.json(
        {
          error:
            "La lista cambió. Actualiza las plantillas antes de guardar el orden.",
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(
      ids.map((id, posicion) =>
        prisma.planSeguimiento.update({
          where: { id },
          data: {
            ordenVisual: posicion,
          },
          select: {
            id: true,
          },
        })
      )
    );

    return NextResponse.json({
      ok: true,
      total: ids.length,
      mensaje: "Orden guardado correctamente",
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "No se pudo guardar el orden de las plantillas.",
      },
      { status: 500 }
    );
  }
}
