import {
  NextRequest,
  NextResponse,
} from "next/server";

import bcrypt from "bcryptjs";

import {
  createHash,
} from "crypto";

import {
  prisma,
} from "@/lib/prisma";


function obtenerHashToken(
  token: string
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}


function tokenValido(
  token: string
) {
  return /^[a-f0-9]{64}$/.test(
    token
  );
}


export async function GET(
  req: NextRequest
) {
  try {

    const token =
      String(
        req.nextUrl.searchParams.get(
          "token"
        ) || ""
      ).trim();


    if (!tokenValido(token)) {
      return NextResponse.json(
        {
          error:
            "Enlace de activación no válido",
        },
        {
          status: 400,
        }
      );
    }


    const tokenHash =
      obtenerHashToken(token);


    const miembro =
      await prisma.miembro.findUnique({
        where: {
          tokenActivacionHash:
            tokenHash,
        },

        select: {
          id: true,
          nombres: true,
          apellidos: true,
          email: true,
          activado: true,
          tokenActivacionExpira:
            true,
        },
      });


    if (!miembro) {
      return NextResponse.json(
        {
          error:
            "El enlace de activación no existe o ya fue utilizado",
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
            "Esta cuenta ya fue activada",
        },
        {
          status: 409,
        }
      );
    }


    if (
      !miembro.tokenActivacionExpira ||
      miembro.tokenActivacionExpira <
        new Date()
    ) {
      return NextResponse.json(
        {
          error:
            "El enlace de activación ha vencido",
        },
        {
          status: 410,
        }
      );
    }


    return NextResponse.json({
      ok: true,

      miembro: {
        nombres:
          miembro.nombres,

        apellidos:
          miembro.apellidos,

        email:
          miembro.email,
      },
    });

  } catch (error) {

    console.error(
      "Error al validar activación:",
      error
    );


    return NextResponse.json(
      {
        error:
          "No se pudo validar el enlace de activación",
      },
      {
        status: 500,
      }
    );
  }
}


export async function POST(
  req: NextRequest
) {
  try {

    const body =
      await req.json();


    const token =
      String(
        body.token || ""
      ).trim();


    const password =
      String(
        body.password || ""
      );


    if (!tokenValido(token)) {
      return NextResponse.json(
        {
          error:
            "Enlace de activación no válido",
        },
        {
          status: 400,
        }
      );
    }


    if (
      password.length < 8 ||
      password.length > 128
    ) {
      return NextResponse.json(
        {
          error:
            "La contraseña debe tener entre 8 y 128 caracteres",
        },
        {
          status: 400,
        }
      );
    }


    const tokenHash =
      obtenerHashToken(token);


    const miembro =
      await prisma.miembro.findUnique({
        where: {
          tokenActivacionHash:
            tokenHash,
        },

        select: {
          id: true,
          activado: true,
          tokenActivacionExpira:
            true,
        },
      });


    if (!miembro) {
      return NextResponse.json(
        {
          error:
            "El enlace de activación no existe o ya fue utilizado",
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
            "Esta cuenta ya fue activada",
        },
        {
          status: 409,
        }
      );
    }


    if (
      !miembro.tokenActivacionExpira ||
      miembro.tokenActivacionExpira <
        new Date()
    ) {
      return NextResponse.json(
        {
          error:
            "El enlace de activación ha vencido",
        },
        {
          status: 410,
        }
      );
    }


    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );


    await prisma.miembro.update({
      where: {
        id:
          miembro.id,
      },

      data: {
        passwordHash,

        activado:
          true,

        fechaActivacion:
          new Date(),

        tokenActivacionHash:
          null,

        tokenActivacionExpira:
          null,
      },
    });


    return NextResponse.json({
      ok: true,

      mensaje:
        "Cuenta activada correctamente",
    });

  } catch (error) {

    console.error(
      "Error al activar miembro:",
      error
    );


    return NextResponse.json(
      {
        error:
          "No se pudo activar la cuenta",
      },
      {
        status: 500,
      }
    );
  }
}
