import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_REFERIDO = "dioxilife_ref";
const DURACION_COOKIE = 60 * 60 * 24 * 30;

export async function POST(
  req: NextRequest
) {
  try {
    const body = await req.json();

    const codigo =
      typeof body.codigo === "string"
        ? body.codigo.trim().toUpperCase()
        : "";

    if (
      !codigo ||
      codigo.length > 100
    ) {
      return NextResponse.json(
        {
          error:
            "Código de referido no válido.",
        },
        {
          status: 400,
        }
      );
    }

    const miembro =
      await prisma.miembro.findUnique({
        where: {
          codigoReferido: codigo,
        },

        select: {
          id: true,
          nombres: true,
          apellidos: true,
          codigoReferido: true,
          estado: true,
          activado: true,
        },
      });

    const cookieStore =
      await cookies();

    if (
      !miembro ||
      miembro.estado !== "ACTIVO" ||
      !miembro.activado
    ) {
      cookieStore.delete(
        COOKIE_REFERIDO
      );

      return NextResponse.json(
        {
          error:
            "El vendedor no existe o no está activo.",
        },
        {
          status: 404,
        }
      );
    }

    cookieStore.set(
      COOKIE_REFERIDO,
      miembro.id,
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        path: "/",
        maxAge: DURACION_COOKIE,
      }
    );

    return NextResponse.json({
      ok: true,

      vendedor: {
        nombres: miembro.nombres,
        apellidos:
          miembro.apellidos,
        codigoReferido:
          miembro.codigoReferido,
      },
    });
  } catch (error) {
    console.error(
      "Error guardando referido:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo registrar el vendedor referido.",
      },
      {
        status: 500,
      }
    );
  }
}
