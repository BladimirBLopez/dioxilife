import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createHash,
  randomBytes,
} from "crypto";

import {
  prisma,
} from "@/lib/prisma";

import {
  obtenerAdminActual,
} from "@/lib/admin-auth";


export async function POST(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {

    const admin =
      await obtenerAdminActual();


    if (!admin) {
      return NextResponse.json(
        {
          error:
            "Sesión administrativa no válida",
        },
        {
          status: 401,
        }
      );
    }


    if (
      admin.rol !==
      "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Solo el Super Admin puede generar enlaces de activación",
        },
        {
          status: 403,
        }
      );
    }


    const {
      id,
    } =
      await params;


    const miembro =
      await prisma.miembro.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          activado: true,
          estado: true,
        },
      });


    if (!miembro) {
      return NextResponse.json(
        {
          error:
            "Miembro no encontrado",
        },
        {
          status: 404,
        }
      );
    }


    if (miembro.activado) {
      return NextResponse.json(
        {
          error:
            "La cuenta ya fue activada",
        },
        {
          status: 409,
        }
      );
    }


    const token =
      randomBytes(32).toString(
        "hex"
      );


    const tokenHash =
      createHash("sha256")
        .update(token)
        .digest("hex");


    const expira =
      new Date(
        Date.now() +
          48 *
            60 *
            60 *
            1000
      );


    await prisma.miembro.update({
      where: {
        id:
          miembro.id,
      },

      data: {
        tokenActivacionHash:
          tokenHash,

        tokenActivacionExpira:
          expira,
      },
    });


    return NextResponse.json({
      ok: true,

      activacion: {
        ruta:
          `/activar/${token}`,

        expira,
      },
    });

  } catch (error) {

    console.error(
      "Error al generar enlace de activación:",
      error
    );


    return NextResponse.json(
      {
        error:
          "No se pudo generar el enlace de activación",
      },
      {
        status: 500,
      }
    );
  }
}
