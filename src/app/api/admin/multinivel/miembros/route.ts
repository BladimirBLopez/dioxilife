import {
  NextRequest,
  NextResponse,
} from "next/server";

import bcrypt from "bcryptjs";

import {
  revalidatePath,
} from "next/cache";

import {
  prisma,
} from "@/lib/prisma";

import {
  obtenerAdminActual,
} from "@/lib/admin-auth";

import {
  generarCodigoReferido,
} from "@/lib/codigo-referido";


export async function POST(
  req: NextRequest
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
            "Solo el Super Admin puede registrar miembros manualmente",
        },
        {
          status: 403,
        }
      );
    }


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

    const patrocinadorId =
      String(
        body.patrocinadorId ||
          ""
      ).trim() ||
      null;


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


    const existente =
      await prisma.miembro.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
        },
      });


    if (existente) {
      return NextResponse.json(
        {
          error:
            "Ya existe un miembro con ese correo electrónico",
        },
        {
          status: 409,
        }
      );
    }


    if (patrocinadorId) {

      const patrocinador =
        await prisma.miembro.findUnique({
          where: {
            id:
              patrocinadorId,
          },

          select: {
            id: true,
            estado: true,
          },
        });


      if (!patrocinador) {
        return NextResponse.json(
          {
            error:
              "El patrocinador seleccionado no existe",
          },
          {
            status: 400,
          }
        );
      }


      if (
        patrocinador.estado !==
        "ACTIVO"
      ) {
        return NextResponse.json(
          {
            error:
              "El patrocinador seleccionado no está activo",
          },
          {
            status: 400,
          }
        );
      }
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

          patrocinadorId,

          estado:
            "ACTIVO",
        },

        select: {
          id: true,
          nombres: true,
          apellidos: true,
          email: true,
          codigoReferido: true,
          patrocinadorId: true,
          estado: true,
        },
      });


    revalidatePath(
      "/admin/multinivel"
    );

    revalidatePath(
      "/admin/multinivel/miembros"
    );

    revalidatePath(
      "/admin/multinivel/red"
    );


    return NextResponse.json(
      {
        ok: true,
        miembro,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.error(
      "Error al crear miembro desde Super Admin:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo crear el miembro",
      },
      {
        status: 500,
      }
    );
  }
}
