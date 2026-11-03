import { esCambioSoloPresentacion } from "@/lib/protocolos-presentacion";
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
    estadoInicial,
    confirmarCambiosApartados,
    imagenUrl,
    videoUrl,
    productoIds,
    protocoloIds,
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

  if (
    typeof contenidoInicial !== "string" ||
    !estadoInicial ||
    typeof estadoInicial !== "object" ||
    typeof estadoInicial.titulo !== "string" ||
    typeof estadoInicial.contenido !== "string" ||
    typeof estadoInicial.imagenUrl !== "string" ||
    typeof estadoInicial.videoUrl !== "string" ||
    typeof estadoInicial.activo !== "boolean" ||
    !Array.isArray(estadoInicial.productoIds) ||
    !estadoInicial.productoIds.every(
      (valor: unknown) => typeof valor === "string"
    ) ||
    !Array.isArray(estadoInicial.protocoloIds) ||
    !estadoInicial.protocoloIds.every(
      (valor: unknown) => typeof valor === "string"
    ) ||
    estadoInicial.contenido !== contenidoInicial
  ) {
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

  if (
    existente.activo &&
    contenido !== existente.contenido &&
    !esCambioSoloPresentacion(
      existente.contenido,
      contenido
    ) &&
    activo === true
  ) {
    return NextResponse.json(
      {
        error:
          "Los cambios de contenido publicado deben " +
          "guardarse primero como borrador."
      },
      { status: 409 }
    );
  }

  const lecturaAnterior =
    leerContenidoProtocolo(existente.contenido);

  const lecturaNueva =
    leerContenidoProtocolo(contenido);

  if (
    lecturaAnterior.tipo === "anterior" &&
    lecturaNueva.tipo === "organizado"
  ) {
    if (
      activo === true &&
      !esCambioSoloPresentacion(
        existente.contenido,
        contenido
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Guarda primero la organizacion como borrador."
        },
        { status: 409 }
      );
    }

    const sinEspacios = (texto: string) =>
      texto.replace(/\s/g, "");

    const textoReconstruido =
      lecturaNueva.documento.secciones
        .map((s) => s.contenido)
        .join("");

    if (
      sinEspacios(textoReconstruido) !==
        sinEspacios(existente.contenido) &&
      confirmarCambiosApartados !== true
    ) {
      return NextResponse.json(
        {
          error:
            "Los apartados no representan íntegramente " +
            "el texto original. No se guardaron cambios."
        },
        { status: 409 }
      );
    }
  }

  if (
    lecturaAnterior.tipo === "organizado" &&
    lecturaNueva.tipo === "organizado"
  ) {
    const textosAnteriores = JSON.stringify(
      lecturaAnterior.documento.secciones
        .map((s) => s.contenido).sort()
    );

    const textosNuevos = JSON.stringify(
      lecturaNueva.documento.secciones
        .map((s) => s.contenido).sort()
    );

    if (
      textosAnteriores !== textosNuevos &&
      confirmarCambiosApartados !== true
    ) {
      return NextResponse.json(
        {
          error:
            "Los textos de los apartados cambiaron. " +
            "Confirma la modificación desde el editor."
        },
        { status: 409 }
      );
    }
  }

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
      esCambioSoloPresentacion(
        existente.contenido,
        contenido
      );

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

  const actualizarProtocolos =
    protocoloIds !== undefined;

  if (
    actualizarProtocolos &&
    (
      !Array.isArray(protocoloIds) ||
      !protocoloIds.every(
        (valor: unknown) =>
          typeof valor === "string" &&
          valor.trim().length > 0
      )
    )
  ) {
    return NextResponse.json(
      { error: "Lista de protocolos inválida" },
      { status: 400 }
    );
  }

  const idsProtocolos: string[] = Array.isArray(protocoloIds)
    ? [...new Set(protocoloIds as string[])]
    : [];

  if (idsProtocolos.includes(id)) {
    return NextResponse.json(
      { error: "Un protocolo no puede relacionarse consigo mismo" },
      { status: 400 }
    );
  }

  const protocolo = await prisma.$transaction(
    async (tx) => {
      const actual = await tx.protocolo.findUnique({
        where: { id },
        select: {
          titulo: true,
          contenido: true,
          imagenUrl: true,
          videoUrl: true,
          activo: true,
          productosRelacionados: {
            orderBy: { orden: "asc" },
            select: { productoId: true },
          },
          relacionesOrigen: {
            orderBy: { orden: "asc" },
            select: { relacionadoId: true },
          },
        },
      });

      if (
        !actual ||
        actual.titulo !== estadoInicial.titulo ||
        actual.contenido !== estadoInicial.contenido ||
        (actual.imagenUrl || "") !==
          estadoInicial.imagenUrl ||
        (actual.videoUrl || "") !==
          estadoInicial.videoUrl ||
        actual.activo !== estadoInicial.activo ||
        JSON.stringify(
          actual.productosRelacionados.map(
            (r) => r.productoId
          )
        ) !== JSON.stringify(estadoInicial.productoIds) ||
        JSON.stringify(
          actual.relacionesOrigen.map((r) => r.relacionadoId)
        ) !== JSON.stringify(estadoInicial.protocoloIds)
      ) {
        return null;
      }

      if (actualizarProtocolos && idsProtocolos.length > 0) {
        const encontrados = await tx.protocolo.count({
          where: { id: { in: idsProtocolos } },
        });

        if (encontrados !== idsProtocolos.length) {
          return null;
        }
      }

      return tx.protocolo.update({
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
      ...(actualizarProtocolos
        ? {
            relacionesOrigen: {
              deleteMany: {},
              create: idsProtocolos.map(
                (relacionadoId, orden) => ({
                  relacionadoId,
                  orden,
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
      });
    },
    {
      isolationLevel: "Serializable",
      maxWait: 5000,
      timeout: 10000,
    }
  ).catch((error: unknown) => {
    if (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      (
        error.code === "P2025" ||
        error.code === "P2034"
      )
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
