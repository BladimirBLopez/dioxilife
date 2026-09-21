import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  revalidatePath,
} from "next/cache";

import {
  prisma,
} from "@/lib/prisma";

import {
  obtenerAdminActual,
} from "@/lib/admin-auth";


const ESTADOS_VALIDOS = [
  "ACTIVO",
  "INACTIVO",
  "SUSPENDIDO",
] as const;


type EstadoValido =
  (typeof ESTADOS_VALIDOS)[number];


export async function PATCH(
  req: NextRequest,
  context: {
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
            "Solo el Super Admin puede cambiar el estado de un miembro",
        },
        {
          status: 403,
        }
      );
    }


    const {
      id,
    } =
      await context.params;


    const body =
      await req.json();


    const estado =
      String(
        body.estado || ""
      ).toUpperCase();


    if (
      !ESTADOS_VALIDOS.includes(
        estado as EstadoValido
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Estado de miembro no válido",
        },
        {
          status: 400,
        }
      );
    }


    const miembro =
      await prisma.miembro.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          estado: true,
        },
      });


    if (!miembro) {
      return NextResponse.json(
        {
          error:
            "El miembro no existe",
        },
        {
          status: 404,
        }
      );
    }


    if (
      miembro.estado === estado
    ) {
      return NextResponse.json({
        ok: true,
        estado:
          miembro.estado,
      });
    }


    const actualizado =
      await prisma.miembro.update({
        where: {
          id,
        },

        data: {
          estado:
            estado as EstadoValido,
        },

        select: {
          id: true,
          estado: true,
        },
      });


    revalidatePath(
      `/admin/multinivel/${id}`
    );

    revalidatePath(
      "/admin/multinivel"
    );

    revalidatePath(
      "/admin/multinivel/miembros"
    );

    revalidatePath(
      "/admin/multinivel/red"
    );


    return NextResponse.json({
      ok: true,
      estado:
        actualizado.estado,
    });

  } catch (error) {

    console.error(
      "Error al cambiar estado del miembro:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar el estado del miembro",
      },
      {
        status: 500,
      }
    );
  }
}
