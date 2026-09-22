import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerMiembroActual } from "@/lib/miembro-auth";

export async function GET() {
  try {
    const miembro =
      await obtenerMiembroActual();

    if (!miembro) {
      return NextResponse.json(
        {
          error:
            "No autorizado o cuenta inactiva",
        },
        {
          status: 401,
        }
      );
    }

    const [
      ventasAtribuidas,
      montoPagado,
      redDirecta,
      comisionesPendientes,
      pagosReportados,
      ultimosPedidos,
    ] = await Promise.all([
      prisma.pedido.count({
        where: {
          referidoPorId:
            miembro.id,

          estado: {
            not: "CANCELADO",
          },
        },
      }),

      prisma.pedido.aggregate({
        where: {
          referidoPorId:
            miembro.id,

          estado: {
            in: [
              "PAGADO",
              "COMPLETADO",
            ],
          },
        },

        _sum: {
          total: true,
        },
      }),

      prisma.miembro.count({
        where: {
          patrocinadorId:
            miembro.id,

          estado: "ACTIVO",
          activado: true,
        },
      }),

      prisma.comisionMultinivel.aggregate({
        where: {
          beneficiarioId:
            miembro.id,

          estado: "PENDIENTE",
        },

        _sum: {
          monto: true,
        },
      }),

      prisma.pedido.count({
        where: {
          referidoPorId:
            miembro.id,

          estado:
            "PAGO_REPORTADO",
        },
      }),

      prisma.pedido.findMany({
        where: {
          referidoPorId:
            miembro.id,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 5,

        select: {
          id: true,
          codigo: true,
          estado: true,
          nombreCliente: true,
          total: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      ventasAtribuidas,

      montoPagado:
        montoPagado._sum.total
          ?.toString() || "0",

      redDirecta,

      comisionesPendientes:
        comisionesPendientes._sum.monto
          ?.toString() || "0",

      pagosReportados,

      ultimosPedidos:
        ultimosPedidos.map(
          (pedido) => ({
            ...pedido,

            total:
              pedido.total.toString(),
          })
        ),
    });

  } catch (error) {
    console.error(
      "Error cargando resumen del vendedor:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo cargar el resumen.",
      },
      {
        status: 500,
      }
    );
  }
}
