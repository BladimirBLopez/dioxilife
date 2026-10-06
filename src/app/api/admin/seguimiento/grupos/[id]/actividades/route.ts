import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

import {
  crearActividadGrupoConCopias,
  normalizarActividadGrupo,
  obtenerContextoAgendaGrupo,
} from "@/lib/seguimiento-grupo-agenda";

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const admin =
    await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      {
        error:
          "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  const { id } =
    await params;

  const grupo =
    await obtenerContextoAgendaGrupo(
      id
    );

  if (!grupo) {
    return NextResponse.json(
      {
        error:
          "Grupo no encontrado.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    grupo.estado !==
    "ACTIVO"
  ) {
    return NextResponse.json(
      {
        error:
          "La Agenda grupal solo puede modificarse cuando el grupo está activo o programado.",
      },
      {
        status: 409,
      }
    );
  }

  const body =
    await req
      .json()
      .catch(() => null);

  const normalizada =
    normalizarActividadGrupo({
      body,

      duracionDias:
        grupo.duracionDias,
    });

  if (
    !normalizada.ok
  ) {
    return NextResponse.json(
      {
        error:
          normalizada.error,
      },
      {
        status: 400,
      }
    );
  }

  const actividad =
    await prisma.$transaction(
      (
        tx
      ) =>
        crearActividadGrupoConCopias(
          tx,
          {
            planId:
              grupo.planId,

            seguimientoIds:
              grupo.seguimientosActivos,

            datos:
              normalizada.datos,
          }
        )
    );

  return NextResponse.json(
    actividad
  );
}
