import {
  NextRequest,
  NextResponse,
} from "next/server";

import bcrypt from "bcryptjs";

import {
  prisma,
} from "@/lib/prisma";

import {
  generarCodigoReferido,
} from "@/lib/codigo-referido";


export async function POST(
  req: NextRequest
) {
  try {

    const body =
      await req.json();


    const nombres =
      String(
        body.nombres || ""
      ).trim();

    const apellidos =
      String(
        body.apellidos || ""
      ).trim();

    const email =
      String(
        body.email || ""
      )
        .trim()
        .toLowerCase();

    const telefono =
      String(
        body.telefono || ""
      ).trim();

    const password =
      String(
        body.password || ""
      );

    const ref =
      String(
        body.ref || ""
      )
        .trim()
        .toUpperCase();


    if (
      !nombres ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        {
          error:
            "Nombre, correo y contraseña son obligatorios",
        },
        {
          status: 400,
        }
      );
    }


    if (
      nombres.length > 120 ||
      apellidos.length > 120 ||
      email.length > 180 ||
      telefono.length > 30
    ) {
      return NextResponse.json(
        {
          error:
            "Uno o más datos superan el tamaño permitido",
        },
        {
          status: 400,
        }
      );
    }


    if (
      password.length < 8
    ) {
      return NextResponse.json(
        {
          error:
            "La contraseña debe tener al menos 8 caracteres",
        },
        {
          status: 400,
        }
      );
    }


    /*
     * El registro público pertenece al flujo
     * de invitaciones.
     *
     * Los miembros sin patrocinador se crean
     * únicamente desde Super Admin.
     */
    if (!ref) {
      return NextResponse.json(
        {
          error:
            "Necesitas un código o enlace de invitación para registrarte",
        },
        {
          status: 400,
        }
      );
    }


    const miembroExistente =
      await prisma.miembro.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
        },
      });


    if (miembroExistente) {
      return NextResponse.json(
        {
          error:
            "Ya existe una cuenta con este correo electrónico",
        },
        {
          status: 409,
        }
      );
    }


    const patrocinador =
      await prisma.miembro.findUnique({
        where: {
          codigoReferido:
            ref,
        },

        select: {
          id: true,
          nombres: true,
          apellidos: true,
          estado: true,
          activado: true,
        },
      });


    if (!patrocinador) {
      return NextResponse.json(
        {
          error:
            "El código de patrocinador no existe",
        },
        {
          status: 400,
        }
      );
    }


    if (
      patrocinador.estado !==
        "ACTIVO" ||
      !patrocinador.activado
    ) {
      return NextResponse.json(
        {
          error:
            "El patrocinador no se encuentra activo",
        },
        {
          status: 400,
        }
      );
    }


    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    const codigoReferido =
      await generarCodigoReferido();


    const miembro =
      await prisma.miembro.create({
        data: {
          nombres,

          apellidos:
            apellidos ||
            null,

          email,

          telefono:
            telefono ||
            null,

          passwordHash,

          codigoReferido,

          patrocinadorId:
            patrocinador.id,

          estado:
            "ACTIVO",

          activado:
            true,

          fechaActivacion:
            new Date(),
        },

        select: {
          id: true,
          nombres: true,
          apellidos: true,
          email: true,
          codigoReferido: true,
          patrocinadorId: true,
          estado: true,
          createdAt: true,

          patrocinador: {
            select: {
              nombres: true,
              apellidos: true,
              codigoReferido: true,
            },
          },
        },
      });


    return NextResponse.json(
      {
        ok: true,

        mensaje:
          "Cuenta creada correctamente",

        miembro,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.error(
      "Error al registrar miembro:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo crear la cuenta",
      },
      {
        status: 500,
      }
    );
  }
}
