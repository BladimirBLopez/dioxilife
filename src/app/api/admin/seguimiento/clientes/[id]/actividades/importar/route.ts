import {
  NextRequest,
  NextResponse,
} from "next/server";

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

  const protocolos = await prisma.actividadPlan.findMany({
    where: {
      seccion: "ADICIONAL",
      activo: true,
      plan: {
        is: {
          esCopiaGrupo: false,
        },
      },
    },
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      hora: true,
      diaInicio: true,
      diaFin: true,
      plan: {
        select: {
          nombre: true,
        },
      },
    },
    orderBy: [
      { titulo: "asc" },
      { createdAt: "desc" },
    ],
    take: 300,
  });

  return NextResponse.json(
    { protocolos },
    { headers: { "Cache-Control": "no-store" } }
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
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const body: unknown =
    await req.json().catch(() => null);

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

  const actividadPlanId =
    typeof datos.actividadPlanId === "string"
      ? datos.actividadPlanId.trim()
      : "";

  const inicio = Number(datos.diaInicio);

  const fin =
    datos.diaFin === null ||
    datos.diaFin === undefined ||
    datos.diaFin === ""
      ? null
      : Number(datos.diaFin);

  if (!actividadPlanId) {
    return NextResponse.json(
      { error: "Selecciona un protocolo guardado." },
      { status: 400 }
    );
  }

  if (
    !Number.isInteger(inicio) ||
    inicio < 1 ||
    (
      fin !== null &&
      (!Number.isInteger(fin) || fin < inicio)
    )
  ) {
    return NextResponse.json(
      { error: "Los días indicados no son válidos." },
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
          error:
            "No se pueden agregar protocolos a un seguimiento finalizado.",
          status: 409,
        };
      }

      if (
        inicio > seguimiento.duracionDias ||
        (fin !== null && fin > seguimiento.duracionDias)
      ) {
        return {
          error:
            `Los días deben estar dentro del seguimiento de ${seguimiento.duracionDias} días.`,
          status: 400,
        };
      }

      if (
        seguimiento.estado === "ACTIVO" &&
        seguimiento.fechaInicio
      ) {
        const diaActual =
          obtenerDiaSeguimiento(
            seguimiento.fechaInicio
          );

        if (inicio < diaActual) {
          return {
            error:
              "No puedes comenzar un protocolo nuevo en días anteriores al día actual.",
            status: 409,
          };
        }
      }

      const origen =
        await tx.actividadPlan.findFirst({
          where: {
            id: actividadPlanId,
            seccion: "ADICIONAL",
            activo: true,
            plan: {
              is: {
                esCopiaGrupo: false,
              },
            },
          },

          select: {
            tipo: true,
            recordatorio: true,
            titulo: true,
            descripcion: true,
            momento: true,
            hora: true,

            indicaciones: {
              where: {
                activo: true,
              },
              orderBy: [
                { orden: "asc" },
                { hora: "asc" },
              ],
              select: {
                hora: true,
                texto: true,
                orden: true,
              },
            },
          },
        });

      if (!origen) {
        return {
          error:
            "El protocolo seleccionado no existe o no está disponible.",
          status: 404,
        };
      }

      const ultimoOrden =
        await tx.actividadSeguimiento.aggregate({
          where: {
            seguimientoId: id,
          },
          _max: {
            orden: true,
          },
        });

      const copia =
        await tx.actividadSeguimiento.create({
          data: {
            seguimientoId: id,
            actividadPlanOrigenId: actividadPlanId,

            tipo: origen.tipo,
            recordatorio: origen.recordatorio,
            seccion: "ADICIONAL",

            titulo: origen.titulo,
            descripcion: origen.descripcion,
            momento: origen.momento,
            hora: origen.hora,

            diaInicio: inicio,
            diaFin: fin,

            orden:
              (ultimoOrden._max.orden ?? 0) + 1,

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

          select: {
            id: true,
            titulo: true,
          },
        });

      return {
        ok: true,
        actividad: copia,
        indicacionesCopiadas:
          origen.indicaciones.length,
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
      actividad: resultado.actividad,
      indicacionesCopiadas:
        resultado.indicacionesCopiadas,
    },
    { status: 201 }
  );
}
