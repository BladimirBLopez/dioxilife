import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function slugify(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const productos = await prisma.producto.findMany({
    orderBy: { orden: "asc" },
    include: { categoria: true },
  });

  return NextResponse.json(productos);
}

export async function POST(req: NextRequest) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

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
    !nombre ||
    !categoriaId ||
    !Number.isFinite(precioNumero) ||
    precioNumero <= 0
  ) {
    return NextResponse.json(
      {
        error:
          "Nombre, precio y categoría son requeridos",
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

  const ultimo =
    await prisma.producto.findFirst({
      orderBy: {
        orden: "desc",
      },
    });

  const nuevoOrden =
    ultimo ? ultimo.orden + 1 : 0;

  const producto =
    await prisma.producto.create({
      data: {
        nombre,
        slug:
          slugify(nombre) +
          "-" +
          Date.now().toString(36),

        descripcion:
          descripcion || null,

        precio,

        mostrarPrecio:
          mostrarPrecio ?? false,

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

        orden:
          nuevoOrden,
      },
    });

  return NextResponse.json(producto);
}
