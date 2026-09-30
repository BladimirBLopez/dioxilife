import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function obtenerActividadIds(body: unknown): string[] {
  if (
    typeof body !== "object" ||
    body === null ||
    !("actividadIds" in body)
  ) {
    return [];
  }

  const valor =
    (body as Record<string, unknown>)
      .actividadIds;

  if (!Array.isArray(valor)) {
    return [];
  }

  const ids = valor
    .filter(
      (item): item is string =>
        typeof item === "string"
    )
    .map((item) =>
      item.trim()
    )
    .filter(
      (item) =>
        item.length > 0
    );

  return Array.from(
    new Set(ids)
  );
}

export async function POST(
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
      {
        error:
          "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  const { id } =
    await params;

  const plan =
    await prisma.planSeguimiento.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        duracionDias: true,
      },
    });

  if (!plan) {
    return NextResponse.json(
      {
        error:
          "Plantilla no encontrada.",
      },
      {
        status: 404,
      }
    );
  }

  const body: unknown =
    await req.json();

  const actividadIds =
    obtenerActividadIds(
      body
    );

  if (
    actividadIds.length === 0
  ) {
    return NextResponse.json(
      {
        error:
          "Selecciona al menos una actividad de la biblioteca.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    actividadIds.length > 100
  ) {
    return NextResponse.json(
      {
        error:
          "No puedes agregar más de 100 actividades a la vez.",
      },
      {
        status: 400,
      }
    );
  }

  const actividadesBase =
    await prisma.actividadBase.findMany({
      where: {
        id: {
          in: actividadIds,
        },

        activo: true,
      },

      select: {
        id: true,
        tipo: true,
        recordatorio: true,
        titulo: true,
        descripcion: true,
        momento: true,
        hora: true,
      },
    });

  if (
    actividadesBase.length !==
    actividadIds.length
  ) {
    return NextResponse.json(
      {
        error:
          "Una o más actividades seleccionadas no existen o están inactivas. Actualiza la biblioteca e inténtalo nuevamente.",
      },
      {
        status: 409,
      }
    );
  }

  const posicion =
    new Map<string, number>(
      actividadIds.map(
        (
          actividadId,
          indice
        ) => [
          actividadId,
          indice,
        ]
      )
    );

  actividadesBase.sort(
    (a, b) =>
      (posicion.get(
        a.id
      ) ?? 0) -
      (posicion.get(
        b.id
      ) ?? 0)
  );

  const ultimoOrden =
    await prisma.actividadPlan.aggregate({
      where: {
        planId: id,
      },

      _max: {
        orden: true,
      },
    });

  const ordenInicial =
    (ultimoOrden._max
      .orden ?? 0) + 1;

  const resultado =
    await prisma.actividadPlan.createMany({
      data:
        actividadesBase.map(
          (
            actividad,
            indice
          ) => ({
            planId:
              id,

            tipo:
              actividad.tipo,

            recordatorio:
              actividad.recordatorio,

            titulo:
              actividad.titulo,

            descripcion:
              actividad.descripcion,

            momento:
              actividad.momento,

            hora:
              actividad.hora,

            diaInicio:
              1,

            diaFin:
              plan.duracionDias,

            orden:
              ordenInicial +
              indice,

            activo:
              true,
          })
        ),
    });

  return NextResponse.json(
    {
      ok: true,
      agregadas:
        resultado.count,
    },
    {
      status: 201,
    }
  );
}
