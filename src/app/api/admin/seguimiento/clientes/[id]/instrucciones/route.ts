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
        seguimiento.actividades,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
