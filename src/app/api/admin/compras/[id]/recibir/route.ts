import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function POST(
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
      {
        error: "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  const { id } = await params;

  try {
    const resultado =
      await prisma.$transaction(
        async (tx) => {
          const cambioEstado =
            await tx.compra.updateMany({
              where: {
                id,
                estado: "REGISTRADA",
              },

              data: {
                estado: "RECIBIDA",
                recibidaAt: new Date(),
              },
            });

          if (
            cambioEstado.count !== 1
          ) {
            const existente =
              await tx.compra.findUnique({
                where: {
                  id,
                },

                select: {
                  id: true,
                  estado: true,
                },
              });

            if (!existente) {
              throw new Error(
                "COMPRA_NO_EXISTE"
              );
            }

            if (
              existente.estado ===
              "RECIBIDA"
            ) {
              throw new Error(
                "COMPRA_YA_RECIBIDA"
              );
            }

            if (
              existente.estado ===
              "ANULADA"
            ) {
              throw new Error(
                "COMPRA_ANULADA"
              );
            }

            throw new Error(
              "ESTADO_INVALIDO"
            );
          }

          const compra =
            await tx.compra.findUnique({
              where: {
                id,
              },

              include: {
                detalles: true,
              },
            });

          if (!compra) {
            throw new Error(
              "COMPRA_NO_EXISTE"
            );
          }

          for (
            const detalle
            of compra.detalles
          ) {
            const producto =
              await tx.producto.update({
                where: {
                  id:
                    detalle.productoId,
                },

                data: {
                  stockActual: {
                    increment:
                      detalle.cantidad,
                  },
                },

                select: {
                  stockActual: true,
                },
              });

            const stockNuevo =
              producto.stockActual;

            const stockAnterior =
              stockNuevo -
              detalle.cantidad;

            await tx.movimientoInventario.create({
              data: {
                productoId:
                  detalle.productoId,

                tipo: "ENTRADA",

                cantidad:
                  detalle.cantidad,

                stockAnterior,

                stockNuevo,

                motivo:
                  `Recepción compra ${compra.codigo}`,

                compraId:
                  compra.id,

                adminId:
                  admin.id,
              },
            });
          }

          return tx.compra.findUnique({
            where: {
              id,
            },

            include: {
              proveedor: true,

              detalles: {
                include: {
                  producto: true,
                },
              },
            },
          });
        }
      );

    return NextResponse.json(
      resultado
    );
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "";

    if (
      mensaje ===
      "COMPRA_NO_EXISTE"
    ) {
      return NextResponse.json(
        {
          error:
            "Compra no encontrada",
        },
        {
          status: 404,
        }
      );
    }

    if (
      mensaje ===
      "COMPRA_YA_RECIBIDA"
    ) {
      return NextResponse.json(
        {
          error:
            "Esta compra ya fue recibida",
        },
        {
          status: 409,
        }
      );
    }

    if (
      mensaje ===
      "COMPRA_ANULADA"
    ) {
      return NextResponse.json(
        {
          error:
            "Una compra anulada no puede recibirse",
        },
        {
          status: 409,
        }
      );
    }

    if (
      mensaje ===
      "ESTADO_INVALIDO"
    ) {
      return NextResponse.json(
        {
          error:
            "La compra no está disponible para recepción",
        },
        {
          status: 409,
        }
      );
    }

    console.error(
      "Error al recibir compra:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo recibir la compra",
      },
      {
        status: 500,
      }
    );
  }
}
