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
    activo,
  } = await req.json();

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

        activo,
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

  const protocolosAsociados =
    await prisma.protocolo.count({
      where: {
        productoId: id,
      },
    });

  if (protocolosAsociados > 0) {
    return NextResponse.json(
      {
        error: `No se puede borrar este producto porque tiene ${protocolosAsociados} protocolo(s) asociado(s). Borra primero ese(s) protocolo(s) desde la sección Protocolos.`,
      },
      { status: 409 }
    );
  }

  await prisma.producto.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}
