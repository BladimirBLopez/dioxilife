import { NextRequest, NextResponse } from "next/server";
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
        telefono: true,
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


export async function PATCH(
  req: NextRequest
) {
  try {
    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        "miembro_token"
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          error: "No autorizado",
        },
        {
          status: 401,
        }
      );
    }

    const payload =
      await verificarSesion(token);

    if (
      !payload ||
      typeof payload.usuario !== "string"
    ) {
      return NextResponse.json(
        {
          error: "Sesión inválida",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await req.json();

    const telefonoIngresado =
      String(
        body.telefono || ""
      ).trim();

    let telefono:
      string | null = null;

    if (telefonoIngresado) {
      let numero =
        telefonoIngresado.replace(
          /\D/g,
          ""
        );

      // Si viene como +591 70000000
      // guardamos solamente 70000000.
      if (
        numero.startsWith("591") &&
        numero.length === 11
      ) {
        numero =
          numero.slice(3);
      }

      // Celulares bolivianos:
      // 8 dígitos comenzando en 6 o 7.
      if (
        !/^[67]\d{7}$/.test(numero)
      ) {
        return NextResponse.json(
          {
            error:
              "Ingresa un número de WhatsApp boliviano válido. Ejemplo: 70000000.",
          },
          {
            status: 400,
          }
        );
      }

      telefono = numero;
    }

    const resultado =
      await prisma.miembro.updateMany({
        where: {
          id: payload.usuario,
          estado: "ACTIVO",
        },

        data: {
          telefono,
        },
      });

    if (
      resultado.count === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No se pudo actualizar el WhatsApp. Verifica que tu cuenta esté activa.",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      telefono,
      mensaje: telefono
        ? "WhatsApp actualizado correctamente."
        : "WhatsApp eliminado. Tus pedidos usarán el número central de DioxiLife.",
    });

  } catch (error) {
    console.error(
      "Error actualizando WhatsApp:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar el WhatsApp.",
      },
      {
        status: 500,
      }
    );
  }
}
