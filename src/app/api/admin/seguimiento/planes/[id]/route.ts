import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const existente =
    await prisma.planSeguimiento.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        nombre: true,
        descripcion: true,
        duracionDias: true,
        estado: true,
        esCopiaGrupo: true,

        actividades: {
          select: {
            id: true,
            titulo: true,
            diaInicio: true,
            diaFin: true,
            activo: true,
          },
        },
      },
    });

  if (!existente) {
    return NextResponse.json(
      { error: "Plan no encontrado" },
      { status: 404 }
    );
  }

  /*
   * Las copias internas pertenecen al flujo
   * propio de cada grupo. No deben editarse
   * desde la biblioteca general de plantillas.
   */
  if (existente.esCopiaGrupo) {
    return NextResponse.json(
      {
        error:
          "Esta es una copia interna de un grupo y no puede modificarse desde la biblioteca de plantillas.",
      },
      { status: 409 }
    );
  }

  const body =
    await req
      .json()
      .catch(() => null);

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      {
        error:
          "Los datos enviados no son válidos.",
      },
      { status: 400 }
    );
  }

  const {
    nombre,
    descripcion,
    duracionDias,
    estado,
  } = body as {
    nombre?: unknown;
    descripcion?: unknown;
    duracionDias?: unknown;
    estado?: unknown;
  };

  const nombreLimpio =
    String(nombre || "")
      .trim()
      .slice(0, 200);

  const dias =
    Number(duracionDias);

  if (!nombreLimpio) {
    return NextResponse.json(
      {
        error:
          "El nombre del plan es obligatorio",
      },
      { status: 400 }
    );
  }

  if (
    !Number.isInteger(dias) ||
    dias < 1 ||
    dias > 365
  ) {
    return NextResponse.json(
      {
        error:
          "La duración debe estar entre 1 y 365 días",
      },
      { status: 400 }
    );
  }

  /*
   * Si se acorta una plantilla, no recortamos
   * ni eliminamos actividades automáticamente.
   *
   * El administrador debe ajustar primero las
   * actividades que quedarían fuera del rango.
   */
  if (
    dias <
    existente.duracionDias
  ) {
    const conflictos =
      existente.actividades.filter(
        (actividad) =>
          actividad.diaInicio >
            dias ||
          (
            actividad.diaFin !==
              null &&
            actividad.diaFin >
              dias
          )
      );

    if (
      conflictos.length >
      0
    ) {
      const conflicto =
        conflictos.reduce(
          (mayor, actividad) => {
            const finMayor =
              Math.max(
                mayor.diaInicio,
                mayor.diaFin ??
                  mayor.diaInicio
              );

            const finActividad =
              Math.max(
                actividad.diaInicio,
                actividad.diaFin ??
                  actividad.diaInicio
              );

            return finActividad >
              finMayor
              ? actividad
              : mayor;
          }
        );

      const ultimoDia =
        Math.max(
          conflicto.diaInicio,
          conflicto.diaFin ??
            conflicto.diaInicio
        );

      return NextResponse.json(
        {
          error:
            `No puedes reducir la duración a ${dias} días porque "${conflicto.titulo}" está programada hasta el día ${ultimoDia}. Ajusta primero esa actividad.`,
        },
        { status: 409 }
      );
    }
  }

  const estadoValido =
    estado === "ACTIVO" ||
    estado === "INACTIVO" ||
    estado === "BORRADOR"
      ? estado
      : "BORRADOR";

  /*
   * Una plantilla activa debe contener
   * al menos una actividad disponible.
   */
  if (
    estadoValido ===
      "ACTIVO" &&
    !existente.actividades.some(
      (actividad) =>
        actividad.activo
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Agrega al menos una actividad activa antes de activar la plantilla.",
      },
      { status: 409 }
    );
  }

  const descripcionLimpia =
    descripcion
      ? String(descripcion)
          .trim()
          .slice(0, 1500)
      : null;

  const plan =
    await prisma.planSeguimiento.update({
      where: {
        id,
      },

      data: {
        nombre:
          nombreLimpio,

        descripcion:
          descripcionLimpia,

        duracionDias:
          dias,

        estado:
          estadoValido,
      },

      include: {
        _count: {
          select: {
            actividades:
              true,
            seguimientos:
              true,
          },
        },
      },
    });

  return NextResponse.json(
    plan
  );
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const plan =
    await prisma.planSeguimiento.findUnique({
      where: {
        id,
      },

      select: {
        esCopiaGrupo: true,

        _count: {
          select: {
            seguimientos:
              true,
          },
        },
      },
    });

  if (!plan) {
    return NextResponse.json(
      { error: "Plan no encontrado" },
      { status: 404 }
    );
  }

  if (plan.esCopiaGrupo) {
    return NextResponse.json(
      {
        error:
          "Las copias internas de grupos no pueden eliminarse desde la biblioteca de plantillas.",
      },
      { status: 409 }
    );
  }

  if (
    plan._count
      .seguimientos >
    0
  ) {
    return NextResponse.json(
      {
        error:
          "Este plan ya fue asignado a clientes y no puede eliminarse. Puedes cambiarlo a INACTIVO.",
      },
      { status: 409 }
    );
  }

  await prisma.planSeguimiento.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}
