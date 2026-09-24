import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

const TIPOS_MANUALES = ["ENTRADA", "SALIDA", "AJUSTE"] as const;
type TipoManual = (typeof TIPOS_MANUALES)[number];

function esTipoManual(valor: unknown): valor is TipoManual {
  return (
    typeof valor === "string" &&
    TIPOS_MANUALES.includes(valor as TipoManual)
  );
}

export async function GET() {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const [productos, movimientos] = await Promise.all([
    prisma.producto.findMany({
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        imagenUrl: true,
        activo: true,
        precio: true,
        stockActual: true,
        stockMinimo: true,
        categoria: {
          select: {
            nombre: true,
          },
        },
      },
    }),

    prisma.movimientoInventario.findMany({
      take: 80,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        tipo: true,
        cantidad: true,
        stockAnterior: true,
        stockNuevo: true,
        motivo: true,
        createdAt: true,
        producto: {
          select: {
            id: true,
            nombre: true,
          },
        },
        admin: {
          select: {
            usuario: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    productos,
    movimientos,
  });
}

export async function POST(req: NextRequest) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const body = await req.json();

  const productoId =
    typeof body.productoId === "string"
      ? body.productoId.trim()
      : "";

  const tipo = body.tipo;
  const cantidad = Number(body.cantidad);

  const motivo =
    typeof body.motivo === "string"
      ? body.motivo.trim()
      : "";

  if (!productoId || !esTipoManual(tipo)) {
    return NextResponse.json(
      { error: "Producto y tipo de movimiento son requeridos" },
      { status: 400 }
    );
  }

  if (!Number.isInteger(cantidad)) {
    return NextResponse.json(
      { error: "La cantidad debe ser un número entero" },
      { status: 400 }
    );
  }

  if (!motivo) {
    return NextResponse.json(
      { error: "Debe indicar el motivo del movimiento" },
      { status: 400 }
    );
  }

  if (
    (tipo === "ENTRADA" || tipo === "SALIDA") &&
    cantidad <= 0
  ) {
    return NextResponse.json(
      { error: "La cantidad debe ser mayor a cero" },
      { status: 400 }
    );
  }

  if (tipo === "AJUSTE" && cantidad < 0) {
    return NextResponse.json(
      { error: "El stock ajustado no puede ser negativo" },
      { status: 400 }
    );
  }

  try {
    const resultado = await prisma.$transaction(
      async (tx) => {
        const producto = await tx.producto.findUnique({
          where: {
            id: productoId,
          },
          select: {
            id: true,
            nombre: true,
            stockActual: true,
          },
        });

        if (!producto) {
          throw new Error("PRODUCTO_NO_ENCONTRADO");
        }

        const stockAnterior = producto.stockActual;

        let stockNuevo = stockAnterior;
        let cantidadMovimiento = cantidad;

        if (tipo === "ENTRADA") {
          stockNuevo = stockAnterior + cantidad;
        }

        if (tipo === "SALIDA") {
          if (cantidad > stockAnterior) {
            throw new Error("STOCK_INSUFICIENTE");
          }

          stockNuevo = stockAnterior - cantidad;
        }

        if (tipo === "AJUSTE") {
          stockNuevo = cantidad;
          cantidadMovimiento =
            stockNuevo - stockAnterior;

          if (cantidadMovimiento === 0) {
            throw new Error("SIN_CAMBIOS");
          }
        }

        await tx.producto.update({
          where: {
            id: productoId,
          },
          data: {
            stockActual: stockNuevo,
          },
        });

        const movimiento =
          await tx.movimientoInventario.create({
            data: {
              productoId,
              tipo,
              cantidad: cantidadMovimiento,
              stockAnterior,
              stockNuevo,
              motivo,
              adminId: admin.id,
            },
            include: {
              producto: {
                select: {
                  nombre: true,
                },
              },
              admin: {
                select: {
                  usuario: true,
                },
              },
            },
          });

        return {
          movimiento,
          stockNuevo,
        };
      }
    );

    return NextResponse.json(resultado);
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "";

    if (mensaje === "PRODUCTO_NO_ENCONTRADO") {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    if (mensaje === "STOCK_INSUFICIENTE") {
      return NextResponse.json(
        { error: "No existe stock suficiente para realizar la salida" },
        { status: 400 }
      );
    }

    if (mensaje === "SIN_CAMBIOS") {
      return NextResponse.json(
        { error: "El stock indicado es igual al stock actual" },
        { status: 400 }
      );
    }

    console.error("Error inventario:", error);

    return NextResponse.json(
      { error: "No se pudo registrar el movimiento" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const body = await req.json();

  const productoId =
    typeof body.productoId === "string"
      ? body.productoId.trim()
      : "";

  const stockMinimo = Number(body.stockMinimo);

  if (
    !productoId ||
    !Number.isInteger(stockMinimo) ||
    stockMinimo < 0
  ) {
    return NextResponse.json(
      { error: "Stock mínimo inválido" },
      { status: 400 }
    );
  }

  const producto = await prisma.producto.update({
    where: {
      id: productoId,
    },
    data: {
      stockMinimo,
    },
    select: {
      id: true,
      stockActual: true,
      stockMinimo: true,
    },
  });

  return NextResponse.json(producto);
}
