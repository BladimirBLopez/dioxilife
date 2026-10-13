import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";
import { obtenerDiaSeguimiento } from "@/lib/seguimiento-publico";

export async function GET() {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  const planes = await prisma.planSeguimiento.findMany({
    where: {
      esCopiaGrupo: false,
      actividades: {
        some: {
          activo: true,
          seccion: "ADICIONAL",
        },
      },
    },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      duracionDias: true,
      _count: {
        select: {
          actividades: {
            where: {
              activo: true,
              seccion: "ADICIONAL",
            },
          },
        },
      },
    },
    orderBy: { nombre: "asc" },
    take: 150,
  });

  return NextResponse.json(
    {
      plantillas: planes.map((plan) => ({
        id: plan.id,
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        duracionDias: plan.duracionDias,
        actividades: plan._count.actividades,
      })),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const body: unknown = await req.json().catch(() => null);

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      { error: "Datos no válidos." },
      { status: 400 }
    );
  }

  const datos = body as Record<string, unknown>;

  const planId =
    typeof datos.planId === "string"
      ? datos.planId.trim()
      : "";

  const inicio = Number(datos.diaInicio);
  const fin = Number(datos.diaFin);

  if (
    !planId ||
    !Number.isInteger(inicio) ||
    !Number.isInteger(fin) ||
    inicio < 1 ||
    fin < inicio
  ) {
    return NextResponse.json(
      {
        error:
          "Selecciona una plantilla y un período válido.",
      },
      { status: 400 }
    );
  }

  const resultado = await prisma.$transaction(
    async (tx) => {
      const seguimiento =
        await tx.seguimientoCliente.findUnique({
          where: { id },
          select: {
            id: true,
            estado: true,
            fechaInicio: true,
            duracionDias: true,
          },
        });

      if (!seguimiento) {
        return {
          error: "Seguimiento no encontrado.",
          status: 404,
        };
      }

      if (
        seguimiento.estado === "COMPLETADO" ||
        seguimiento.estado === "CANCELADO"
      ) {
        return {
          error: "El seguimiento está finalizado.",
          status: 409,
        };
      }

      if (fin > seguimiento.duracionDias) {
        return {
          error:
            "El período supera la duración del seguimiento.",
          status: 400,
        };
      }

      if (
        seguimiento.estado === "ACTIVO" &&
        seguimiento.fechaInicio &&
        inicio < obtenerDiaSeguimiento(
          seguimiento.fechaInicio
        )
      ) {
        return {
          error:
            "No puedes comenzar el protocolo en días anteriores.",
          status: 409,
        };
      }

      const plantilla =
        await tx.planSeguimiento.findFirst({
          where: {
            id: planId,
            esCopiaGrupo: false,
          },
          select: {
            nombre: true,
            duracionDias: true,
            actividades: {
              where: {
                activo: true,
                seccion: "ADICIONAL",
              },
              orderBy: [
                { diaInicio: "asc" },
                { orden: "asc" },
              ],
              select: {
                id: true,
                tipo: true,
                recordatorio: true,
                seccion: true,
                titulo: true,
                descripcion: true,
                momento: true,
                hora: true,
                diaInicio: true,
                diaFin: true,
                indicaciones: {
                  where: { activo: true },
                  orderBy: [
                    { hora: "asc" },
                    { orden: "asc" },
                  ],
                  select: {
                    hora: true,
                    texto: true,
                    orden: true,
                  },
                },
              },
            },
          },
        });

      if (!plantilla) {
        return {
          error: "Plantilla no encontrada.",
          status: 404,
        };
      }

      if (plantilla.actividades.length === 0) {
        return {
          error:
            "Esta plantilla no tiene protocolos adicionales activos.",
          status: 400,
        };
      }

      if (plantilla.actividades.length > 80) {
        return {
          error:
            "La plantilla tiene demasiadas actividades para una sola importación.",
          status: 400,
        };
      }

      const actividades = plantilla.actividades.map(
        (actividad) => {
          const inicioNuevo =
            inicio + actividad.diaInicio - 1;

          const finNuevo =
            actividad.diaFin === null
              ? fin
              : inicio + actividad.diaFin - 1;

          return {
            origen: actividad,
            diaInicio: inicioNuevo,
            diaFin: finNuevo,
          };
        }
      );

      const actividadIncompatible =
        actividades.find(
          (actividad) =>
            actividad.diaInicio > fin ||
            actividad.diaFin > fin ||
            actividad.diaFin < actividad.diaInicio
        );

      if (actividadIncompatible) {
        const diaNecesario =
          actividadIncompatible.origen.diaFin ??
          actividadIncompatible.origen.diaInicio;

        return {
          error:
            'La actividad "' +
            actividadIncompatible.origen.titulo +
            '" necesita al menos ' +
            diaNecesario +
            ' días según la plantilla. Elegiste ' +
            (fin - inicio + 1) +
            ' días. Amplía el período o ajusta la plantilla.',
          status: 400,
        };
      }

      const duplicada =
        await tx.actividadSeguimiento.findFirst({
          where: {
            seguimientoId: id,
            OR: actividades.map((actividad) => ({
              actividadPlanOrigenId:
                actividad.origen.id,
              diaInicio: actividad.diaInicio,
              diaFin: actividad.diaFin,
            })),
          },
          select: { id: true },
        });

      if (duplicada) {
        return {
          error:
            "Una o más actividades de esta plantilla ya están agregadas en el mismo período.",
          status: 409,
        };
      }

      const ordenActual =
        await tx.actividadSeguimiento.aggregate({
          where: { seguimientoId: id },
          _max: { orden: true },
        });

      const ordenBase = ordenActual._max.orden ?? 0;

      let indicacionesCopiadas = 0;

      for (const [indice, actividad] of actividades.entries()) {
        const origen = actividad.origen;

        await tx.actividadSeguimiento.create({
          data: {
            seguimientoId: id,
            actividadPlanOrigenId: origen.id,
            tipo: origen.tipo,
            recordatorio: origen.recordatorio,
            seccion: "ADICIONAL",
            titulo: origen.titulo,
            descripcion: origen.descripcion,
            momento: origen.momento,
            hora: origen.hora,
            diaInicio: actividad.diaInicio,
            diaFin: actividad.diaFin,
            orden: ordenBase + indice + 1,
            activo: true,
            indicaciones: {
              create: origen.indicaciones.map(
                (indicacion) => ({
                  hora: indicacion.hora,
                  texto: indicacion.texto,
                  orden: indicacion.orden,
                  activo: true,
                })
              ),
            },
          },
        });

        indicacionesCopiadas +=
          origen.indicaciones.length;
      }

      return {
        ok: true,
        nombre: plantilla.nombre,
        actividadesCopiadas: actividades.length,
        indicacionesCopiadas,
        status: 201,
      };
    }
  );

  if ("error" in resultado) {
    return NextResponse.json(
      { error: resultado.error },
      { status: resultado.status }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      nombre: resultado.nombre,
      actividadesCopiadas:
        resultado.actividadesCopiadas,
      indicacionesCopiadas:
        resultado.indicacionesCopiadas,
    },
    { status: 201 }
  );
}
