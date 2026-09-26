import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function codigoCompra() {
  return "CMP-" + Date.now().toString().slice(-8);
}

function hoyBolivia() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = partes.find((p) => p.type === "year")?.value;
  const month = partes.find((p) => p.type === "month")?.value;
  const day = partes.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function convertirFechaCompra(valor: unknown) {
  if (
    typeof valor !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(valor)
  ) {
    return null;
  }

  const [year, month, day] =
    valor.split("-").map(Number);

  const fecha = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    fecha.getUTCFullYear() !== year ||
    fecha.getUTCMonth() !== month - 1 ||
    fecha.getUTCDate() !== day
  ) {
    return null;
  }

  if (valor > hoyBolivia()) {
    return null;
  }

  return fecha;
}

export async function GET() {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const compras = await prisma.compra.findMany({
    orderBy: {
      createdAt: "desc",
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

  return NextResponse.json(compras);
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

  if (
    !body.proveedorId ||
    !body.fechaCompra ||
    !Array.isArray(body.detalles) ||
    body.detalles.length === 0
  ) {
    return NextResponse.json(
      {
        error:
          "Proveedor, fecha de compra y productos requeridos",
      },
      { status: 400 }
    );
  }

  const fechaCompra =
    convertirFechaCompra(
      body.fechaCompra
    );

  if (!fechaCompra) {
    return NextResponse.json(
      {
        error:
          "La fecha de compra no es válida o está en el futuro",
      },
      { status: 400 }
    );
  }

  try {
    const resultado = await prisma.$transaction(
      async (tx) => {
        let total = 0;
        const detallesPreparados = [];

        for (const item of body.detalles) {
          const cantidad = Number(item.cantidad);
          const costo = Number(item.costoUnitario);

          if (
            !item.productoId ||
            !Number.isInteger(cantidad) ||
            cantidad <= 0 ||
            !Number.isFinite(costo) ||
            costo < 0
          ) {
            throw new Error("DETALLE_INVALIDO");
          }

          const producto = await tx.producto.findUnique({
            where: {
              id: item.productoId,
            },
            select: {
              id: true,
            },
          });

          if (!producto) {
            throw new Error("PRODUCTO_NO_EXISTE");
          }

          const subtotal = cantidad * costo;
          total += subtotal;

          detallesPreparados.push({
            productoId: producto.id,
            cantidad,
            costoUnitario: costo,
            subtotal,
          });
        }

        const compra = await tx.compra.create({
          data: {
            codigo: codigoCompra(),
            proveedorId: body.proveedorId,
            fechaCompra,
            estado: "REGISTRADA",
            total,

            detalles: {
              create: detallesPreparados,
            },
          },

          include: {
            proveedor: true,
            detalles: true,
          },
        });

        return compra;
      }
    );

    return NextResponse.json(resultado);
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "";

    if (mensaje === "DETALLE_INVALIDO") {
      return NextResponse.json(
        {
          error:
            "Existe un producto con cantidad o costo inválido",
        },
        { status: 400 }
      );
    }

    if (mensaje === "PRODUCTO_NO_EXISTE") {
      return NextResponse.json(
        {
          error:
            "Uno de los productos ya no existe",
        },
        { status: 400 }
      );
    }

    console.error(
      "Error al registrar compra:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo registrar la compra",
      },
      { status: 500 }
    );
  }
}
