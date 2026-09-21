import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        "miembro_token"
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          error: "No autorizado",
        },
        {
          status: 401,
        }
      );
    }

    const sesion =
      await verificarSesion(token);

    if (
      !sesion ||
      typeof sesion.usuario !== "string"
    ) {
      return NextResponse.json(
        {
          error: "Sesión inválida",
        },
        {
          status: 401,
        }
      );
    }

    const miembro =
      await prisma.miembro.findUnique({
        where: {
          id: sesion.usuario,
        },

        select: {
          id: true,
          estado: true,
        },
      });

    if (
      !miembro ||
      miembro.estado !== "ACTIVO"
    ) {
      return NextResponse.json(
        {
          error:
            "El miembro no se encuentra activo.",
        },
        {
          status: 403,
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
