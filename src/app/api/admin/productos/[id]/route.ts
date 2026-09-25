import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const {
    nombre,
    descripcion,
    precio,
    mostrarPrecio,
    enPromocion,
    precioPromocion,
    valorComisionable,
    puntosVolumen,
    generaComision,
    imagenUrl,
    categoriaId,
  } = await req.json();

  const precioNumero = Number(precio);

  if (
    !Number.isFinite(precioNumero) ||
    precioNumero <= 0
  ) {
    return NextResponse.json(
      {
        error:
          "El precio debe ser un número válido.",
      },
      { status: 400 }
    );
  }

  const precioPromocionNumero =
    precioPromocion !== undefined &&
    precioPromocion !== null &&
    precioPromocion !== ""
      ? Number(precioPromocion)
      : null;

  if (
    precioPromocionNumero !== null &&
    (
      !Number.isFinite(precioPromocionNumero) ||
      precioPromocionNumero < 0 ||
      precioPromocionNumero >= precioNumero
    )
  ) {
    return NextResponse.json(
      {
        error:
          "El precio de promoción no puede superar el precio normal.",
      },
      { status: 400 }
    );
  }

  const participaMultinivel =
    generaComision === true;

  const cv = participaMultinivel
    ? Number(valorComisionable)
    : 0;

  const pv = participaMultinivel
    ? Number(puntosVolumen)
    : 0;

  if (
    participaMultinivel &&
    (!Number.isFinite(cv) || cv <= 0)
  ) {
    return NextResponse.json(
      {
        error:
          "El valor comisionable (CV) debe ser mayor a 0",
      },
      { status: 400 }
    );
  }

  if (
    participaMultinivel &&
    (!Number.isFinite(pv) || pv <= 0)
  ) {
    return NextResponse.json(
      {
        error:
          "Los puntos de volumen (PV) deben ser mayores a 0",
      },
      { status: 400 }
    );
  }

  const producto =
    await prisma.producto.update({
      where: {
        id,
      },

      data: {
        nombre,

        descripcion:
          descripcion || null,

        precio,

        mostrarPrecio,

        enPromocion:
          enPromocion ?? false,

        precioPromocion:
          enPromocion === true &&
          precioPromocion !== undefined &&
          precioPromocion !== null &&
          precioPromocion !== ""
            ? precioPromocion
            : null,

        generaComision:
          participaMultinivel,

        valorComisionable:
          cv,

        puntosVolumen:
          pv,

        imagenUrl:
          imagenUrl || null,

        categoriaId,
      },
    });

  return NextResponse.json(producto);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await req.json();

  if (typeof body.activo !== "boolean") {
    return NextResponse.json(
      { error: "Estado inválido" },
      { status: 400 }
    );
  }

  const producto = await prisma.producto.update({
    where: { id },
    data: {
      activo: body.activo,
    },
    select: {
      id: true,
      activo: true,
    },
  });

  return NextResponse.json(producto);
}


export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const producto = await prisma.producto.findUnique({
    where: { id },
    select: {
      id: true,
      stockActual: true,
    },
  });

  if (!producto) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  }

  const [
    ventas,
    compras,
    movimientos,
    protocolos,
  ] = await Promise.all([
    prisma.detallePedido.count({
      where: { productoId: id },
    }),

    prisma.detalleCompra.count({
      where: { productoId: id },
    }),

    prisma.movimientoInventario.count({
      where: { productoId: id },
    }),

    prisma.protocolo.count({
      where: { productoId: id },
    }),
  ]);

  const tieneHistorial =
    ventas > 0 ||
    compras > 0 ||
    movimientos > 0 ||
    protocolos > 0 ||
    producto.stockActual > 0;

  if (tieneHistorial) {
    return NextResponse.json(
      {
        error:
          "Este producto ya tiene historial o stock. No puede eliminarse; desactívalo.",
      },
      { status: 409 }
    );
  }

  await prisma.producto.delete({
    where: { id },
  });

  return NextResponse.json({
    ok: true,
  });
}
