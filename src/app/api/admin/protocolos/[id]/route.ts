import { leerContenidoProtocolo, validarContenidoPublicable } from "@/lib/protocolos-contenido";
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
    titulo,
    contenido,
    contenidoInicial,
    imagenUrl,
    videoUrl,
    productoIds,
    activo,
  } = await req.json();

  if (typeof activo !== "boolean") {
    return NextResponse.json(
      { error: "Estado de publicación inválido" },
      { status: 400 }
    );
  }

  if (!titulo || !contenido) {
    return NextResponse.json(
      { error: "Título y contenido son requeridos" },
      { status: 400 }
    );
  }

  if (typeof contenidoInicial !== "string") {
    return NextResponse.json(
      {
        error:
          "Falta la versión inicial del contenido. " +
          "Recarga el formulario."
      },
      { status: 400 }
    );
  }

  const existente = await prisma.protocolo.findUnique({
    where: { id },
    select: {
      activo: true,
      contenido: true,
    },
  });

  if (!existente) {
    return NextResponse.json(
      { error: "Protocolo no encontrado" },
      { status: 404 }
    );
  }

  if (existente.contenido !== contenidoInicial) {
    return NextResponse.json(
      {
        error:
          "El contenido fue modificado después de abrir " +
          "el formulario. Recarga antes de guardar."
      },
      { status: 409 }
    );
  }

  const lecturaAnterior =
    leerContenidoProtocolo(existente.contenido);

  const lecturaNueva =
    leerContenidoProtocolo(contenido);

  if (lecturaAnterior.tipo === "anterior") {
    if (lecturaNueva.tipo === "organizado") {
      if (
        lecturaNueva.documento.textoOriginal !==
        existente.contenido
      ) {
        return NextResponse.json(
          {
            error:
              "El texto original no coincide con el registro " +
              "almacenado. No se guardaron cambios.",
          },
          { status: 409 }
        );
      }
    } else if (contenido !== existente.contenido) {
      return NextResponse.json(
        {
          error:
            "Para conservar el texto original, organiza el " +
            "protocolo antes de modificar su contenido.",
        },
        { status: 409 }
      );
    }
  } else {
    if (
      lecturaNueva.tipo !== "organizado" ||
      lecturaNueva.documento.textoOriginal !==
        lecturaAnterior.documento.textoOriginal
    ) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar ni modificar la copia " +
            "del texto original del protocolo.",
        },
        { status: 409 }
      );
    }
  }

  if (activo === true) {
    const conservarContenidoAnterior =
      existente.activo &&
      existente.contenido === contenido;

    if (!conservarContenidoAnterior) {
      const problema =
        validarContenidoPublicable(contenido);

      if (problema) {
        return NextResponse.json(
          { error: problema },
          { status: 400 }
        );
      }
    }
  }

  const actualizarRelaciones =
    productoIds !== undefined;

  if (
    actualizarRelaciones &&
    (
      !Array.isArray(productoIds) ||
      !productoIds.every(
        (valor: unknown) =>
          typeof valor === "string" &&
          valor.trim().length > 0
      )
    )
  ) {
    return NextResponse.json(
      { error: "Lista de productos inválida" },
      { status: 400 }
    );
  }

  const idsRelacionados = Array.isArray(productoIds)
    ? [...new Set(
        productoIds.filter(
          (productoId): productoId is string =>
            typeof productoId === "string" &&
            productoId.trim().length > 0
        )
      )]
    : [];

  const protocolo = await prisma.protocolo.update({
    where: {
      id,
      contenido: contenidoInicial,
    },
    data: {
      titulo,
      contenido,
      imagenUrl: imagenUrl || null,
      videoUrl: videoUrl || null,

      activo,

      ...(actualizarRelaciones
        ? {
            productosRelacionados: {
              deleteMany: {},
              create: idsRelacionados.map(
                (productoId, index) => ({
                  productoId,
                  orden: index,
                })
              ),
            },
          }
        : {}),
    },
    include: {
      producto: true,
      productosRelacionados: {
        orderBy: { orden: "asc" },
        include: {
          producto: true,
        },
      },
    },
  }).catch((error: unknown) => {
    if (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return null;
    }

    throw error;
  });

  if (!protocolo) {
    return NextResponse.json(
      {
        error:
          "El protocolo cambió durante el guardado. " +
          "Recarga la página antes de editar."
      },
      { status: 409 }
    );
  }

  return NextResponse.json(protocolo);
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
  const body = await req.json().catch(() => null);

  if (
    !body ||
    typeof body !== "object" ||
    !Object.prototype.hasOwnProperty.call(
      body,
      "fotoPerfilUrl"
    )
  ) {
    return NextResponse.json(
      { error: "Falta la foto de perfil" },
      { status: 400 }
    );
  }

  const valor = body.fotoPerfilUrl;

  if (
    valor !== null &&
    typeof valor !== "string"
  ) {
    return NextResponse.json(
      { error: "Formato de imagen inválido" },
      { status: 400 }
    );
  }

  const fotoPerfilUrl = valor?.trim() || null;

  if (fotoPerfilUrl) {
    try {
      const url = new URL(fotoPerfilUrl);

      if (
        url.protocol !== "https:" ||
        fotoPerfilUrl.length > 2048
      ) {
        throw new Error("URL inválida");
      }
    } catch {
      return NextResponse.json(
        { error: "La foto requiere una URL HTTPS válida" },
        { status: 400 }
      );
    }
  }

  const existente = await prisma.protocolo.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existente) {
    return NextResponse.json(
      { error: "Protocolo no encontrado" },
      { status: 404 }
    );
  }

  const actualizado = await prisma.protocolo.update({
    where: { id },
    data: { fotoPerfilUrl },
    select: {
      id: true,
      fotoPerfilUrl: true,
    },
  });

  return NextResponse.json(actualizado);
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

  await prisma.protocolo.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
