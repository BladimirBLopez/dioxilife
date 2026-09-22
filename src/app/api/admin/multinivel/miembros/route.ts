import {
  NextRequest,
  NextResponse,
} from "next/server";

import bcrypt from "bcryptjs";
import {
  createHash,
  randomBytes,
} from "crypto";

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
      !email
    ) {
      return NextResponse.json(
        {
          error:
            "Nombre y correo son obligatorios",
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
            activado: true,
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
          "ACTIVO" ||
        !patrocinador.activado
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


    const passwordTemporal =
      randomBytes(32).toString(
        "hex"
      );


    const passwordHash =
      await bcrypt.hash(
        passwordTemporal,
        12
      );


    const tokenActivacion =
      randomBytes(32).toString(
        "hex"
      );


    const tokenActivacionHash =
      createHash("sha256")
        .update(tokenActivacion)
        .digest("hex");


    const tokenActivacionExpira =
      new Date(
        Date.now() +
          48 *
            60 *
            60 *
            1000
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

          activado:
            false,

          tokenActivacionHash,

          tokenActivacionExpira,

          fechaActivacion:
            null,
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

        activacion: {
          token:
            tokenActivacion,

          ruta:
            `/activar/${tokenActivacion}`,

          expira:
            tokenActivacionExpira,
        },
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
