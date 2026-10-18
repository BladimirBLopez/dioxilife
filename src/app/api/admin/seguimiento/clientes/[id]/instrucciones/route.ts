import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function GET(
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
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: { id },

      select: {
        nombreCliente: true,
        nombrePlan: true,
        duracionDias: true,

        actividades: {
          where: {
            seccion: "ADICIONAL",
            activo: true,
          },

          orderBy: [
            { diaInicio: "asc" },
            { orden: "asc" },
          ],

          select: {
            id: true,
            titulo: true,
            descripcion: true,
            momento: true,
            hora: true,
            diaInicio: true,
            diaFin: true,
            orden: true,

            etapa: {
              select: {
                diaInicio: true,
                diaFin: true,
              },
            },

            indicaciones: {
              where: {
                activo: true,
              },

              orderBy: [
                { orden: "asc" },
              ],

              select: {
                id: true,
                hora: true,
                texto: true,
                orden: true,
              },
            },
          },
        },
      },
    });

  if (!seguimiento) {
    return NextResponse.json(
      { error: "Seguimiento no encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      cliente: {
        nombreCliente:
          seguimiento.nombreCliente,
        nombrePlan:
          seguimiento.nombrePlan,
        duracionDias:
          seguimiento.duracionDias,
      },
      protocolos:
        seguimiento.actividades.flatMap((actividad) => {
          const { etapa, ...protocolo } = actividad;

          // El protocolo tradicional
          // conserva sus fechas.
          if (!etapa) {
            return [protocolo];
          }

          const inicio = Math.max(
            protocolo.diaInicio,
            etapa.diaInicio
          );

          const fin = Math.min(
            protocolo.diaFin ?? etapa.diaFin,
            etapa.diaFin
          );

          // No imprimir períodos inválidos.
          if (inicio > fin) {
            return [];
          }

          return [{
            ...protocolo,
            diaInicio: inicio,
            diaFin: fin,
          }];
        }),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
