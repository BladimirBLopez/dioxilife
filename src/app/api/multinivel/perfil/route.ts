import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("miembro_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const payload = await verificarSesion(token);

    if (!payload?.usuario) {
      return NextResponse.json(
        { error: "Sesión inválida" },
        { status: 401 }
      );
    }

    const miembro = await prisma.miembro.findUnique({
      where: {
        id: String(payload.usuario),
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
        codigoReferido: true,
        estado: true,
        createdAt: true,
        referidos: {
          select: {
            id: true,
            nombres: true,
            codigoReferido: true,
          },
        },
      },
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      miembro,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
