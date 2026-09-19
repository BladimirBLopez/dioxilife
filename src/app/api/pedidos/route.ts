import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

type ItemEntrada = {
  id: string;
  cantidad: number;
};

async function generarCodigoPedido() {
  for (let intento = 0; intento < 10; intento++) {
    const codigo =
      "DXL-" +
      randomBytes(4)
        .toString("hex")
        .toUpperCase();

    const existe = await prisma.pedido.findUnique({
      where: {
        codigo,
      },
      select: {
        id: true,
      },
    });

    if (!existe) {
      return codigo;
    }
  }

  throw new Error(
    "No se pudo generar un código único para el pedido."
  );
}

async function obtenerMiembroSesion() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("miembro_token")?.value;

  if (!token) {
    return null;
  }

  const sesion =
    await verificarSesion(token);

  if (
    !sesion ||
    typeof sesion.usuario !== "string"
  ) {
    return null;
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
    return null;
  }

  return miembro;
}

export async function POST(
  req: NextRequest
) {
  try {
    const body = await req.json();

    const items =
      Array.isArray(body.items)
        ? (body.items as ItemEntrada[])
        : [];

    const nombreCliente =
      typeof body.nombreCliente === "string"
        ? body.nombreCliente.trim()
        : "";

    const telefonoCliente =
      typeof body.telefonoCliente === "string"
        ? body.telefonoCliente.trim()
        : "";

    const observaciones =
      typeof body.observaciones === "string"
        ? body.observaciones.trim()
        : "";

    if (items.length === 0) {
      return NextResponse.json(
        {
          error:
            "El pedido debe contener al menos un producto.",
        },
        {
          status: 400,
        }
      );
    }

    const cantidades = new Map<
      string,
      number
    >();

    for (const item of items) {
      if (
        !item ||
        typeof item.id !== "string" ||
        !item.id
      ) {
        return NextResponse.json(
          {
            error:
              "Uno de los productos no es válido.",
          },
          {
            status: 400,
          }
        );
      }

      const cantidad =
        Number(item.cantidad);

      if (
        !Number.isInteger(cantidad) ||
        cantidad < 1 ||
        cantidad > 100
      ) {
        return NextResponse.json(
          {
            error:
              "La cantidad de cada producto debe estar entre 1 y 100.",
          },
          {
            status: 400,
          }
        );
      }

      cantidades.set(
        item.id,
        (cantidades.get(item.id) ?? 0) +
          cantidad
      );
    }

    const ids =
      Array.from(cantidades.keys());

    const productos =
      await prisma.producto.findMany({
        where: {
          id: {
            in: ids,
          },
          activo: true,
        },

        select: {
          id: true,
          nombre: true,
          precio: true,
          mostrarPrecio: true,
          generaComision: true,
          valorComisionable: true,
          puntosVolumen: true,
        },
      });

    if (
      productos.length !== ids.length
    ) {
      return NextResponse.json(
        {
          error:
            "Uno o más productos ya no están disponibles.",
        },
        {
          status: 400,
        }
      );
    }

    let total =
      new Prisma.Decimal(0);

    let totalCV =
      new Prisma.Decimal(0);

    let totalPV =
      new Prisma.Decimal(0);

    let requiereCotizacion = false;

    const detalles =
      productos.map((producto) => {
        const cantidad =
          cantidades.get(producto.id) ?? 1;

        const cantidadDecimal =
          new Prisma.Decimal(cantidad);

        const subtotal =
          producto.mostrarPrecio
            ? producto.precio.mul(
                cantidadDecimal
              )
            : new Prisma.Decimal(0);

        if (!producto.mostrarPrecio) {
          requiereCotizacion = true;
        }

        const subtotalCV =
          producto.generaComision
            ? producto.valorComisionable.mul(
                cantidadDecimal
              )
            : new Prisma.Decimal(0);

        const subtotalPV =
          producto.generaComision
            ? producto.puntosVolumen.mul(
                cantidadDecimal
              )
            : new Prisma.Decimal(0);

        total = total.add(subtotal);
        totalCV =
          totalCV.add(subtotalCV);
        totalPV =
          totalPV.add(subtotalPV);

        return {
          productoId:
            producto.id,

          cantidad,

          nombreProducto:
            producto.nombre,

          precioUnitario:
            producto.precio,

          mostrarPrecio:
            producto.mostrarPrecio,

          generaComision:
            producto.generaComision,

          valorComisionable:
            producto.generaComision
              ? producto.valorComisionable
              : new Prisma.Decimal(0),

          puntosVolumen:
            producto.generaComision
              ? producto.puntosVolumen
              : new Prisma.Decimal(0),

          subtotal,

          subtotalCV,

          subtotalPV,
        };
      });

    const miembro =
      await obtenerMiembroSesion();

    const codigo =
      await generarCodigoPedido();

    const pedido =
      await prisma.pedido.create({
        data: {
          codigo,

          nombreCliente:
            nombreCliente || null,

          telefonoCliente:
            telefonoCliente || null,

          observaciones:
            observaciones || null,

          miembroId:
            miembro?.id ?? null,

          total,
          totalCV,
          totalPV,

          requiereCotizacion,

          detalles: {
            create: detalles,
          },
        },

        select: {
          id: true,
          codigo: true,
          estado: true,
          total: true,
          totalCV: true,
          totalPV: true,
          requiereCotizacion: true,
          miembroId: true,

          detalles: {
            select: {
              id: true,
              nombreProducto: true,
              cantidad: true,
              precioUnitario: true,
              mostrarPrecio: true,
              subtotal: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        pedido: {
          ...pedido,

          total:
            pedido.total.toString(),

          totalCV:
            pedido.totalCV.toString(),

          totalPV:
            pedido.totalPV.toString(),

          detalles:
            pedido.detalles.map(
              (detalle) => ({
                ...detalle,

                precioUnitario:
                  detalle.precioUnitario.toString(),

                subtotal:
                  detalle.subtotal.toString(),
              })
            ),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error creando pedido:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo registrar el pedido.",
      },
      {
        status: 500,
      }
    );
  }
}
