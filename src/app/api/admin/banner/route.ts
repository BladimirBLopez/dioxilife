import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const banner = await prisma.banner.findFirst({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(banner);
}

export async function PUT(req: NextRequest) {
  const {
    id,
    titulo,
    subtitulo,
    textoBoton,
    tipoBoton,
    linkBoton,
    mensajeWhatsapp,
    imagenUrl,
    activo,
  } = await req.json();

  if (!titulo) {
    return NextResponse.json(
      { error: "El título es requerido" },
      { status: 400 }
    );
  }

  const data = {
    titulo,
    subtitulo: subtitulo || null,
    textoBoton: textoBoton || null,
    tipoBoton: tipoBoton || "LINK",
    linkBoton: linkBoton || null,
    mensajeWhatsapp: mensajeWhatsapp || null,
    imagenUrl: imagenUrl || null,
    activo: activo ?? true,
  };

  const banner = id
    ? await prisma.banner.update({ where: { id }, data })
    : await prisma.banner.create({ data });

  return NextResponse.json(banner);
}
