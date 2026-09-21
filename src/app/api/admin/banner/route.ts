import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function GET() {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const banner = await prisma.banner.findFirst({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(banner);
}

export async function PUT(req: NextRequest) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const {
    id,
    titulo,
    subtitulo,
    textoBoton,
    tipoBoton,
    linkBoton,
    mensajeWhatsapp,
    imagenUrl,
    mostrarTexto,
    activo,
  } = await req.json();

  if (mostrarTexto && !titulo) {
    return NextResponse.json(
      { error: "El título es requerido" },
      { status: 400 }
    );
  }

  const data = {
    titulo: mostrarTexto ? titulo : null,
    subtitulo: mostrarTexto ? subtitulo || null : null,
    textoBoton: mostrarTexto ? textoBoton || null : null,
    tipoBoton: tipoBoton || "LINK",
    linkBoton: mostrarTexto ? linkBoton || null : null,
    mensajeWhatsapp: mostrarTexto ? mensajeWhatsapp || null : null,
    imagenUrl: imagenUrl || null,
    mostrarTexto: mostrarTexto ?? true,
    activo: activo ?? true,
  };

  const banner = id
    ? await prisma.banner.update({ where: { id }, data })
    : await prisma.banner.create({ data });

  return NextResponse.json(banner);
}
