import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function horaValida(valor: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
    valor
  );
}

async function obtenerContexto(
  seguimientoId: string,
  actividadId: string
) {
  return prisma.seguimientoCliente.findFirst({
    where: {
      id: seguimientoId,

      actividades: {
        some: {
          id: actividadId,
        },
      },
    },

    select: {
      id: true,
      estado: true,
      preparadoAt: true,

      actividades: {
        where: {
          id: actividadId,
        },

        select: {
          id: true,
          titulo: true,
        },

        take: 1,
      },
    },
  });
}

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      actividadId: string;
    }>;
  }
) {
  const admin =
    await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      {
        error: "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  const {
    id,
    actividadId,
  } = await params;

  const contexto =
    await obtenerContexto(
      id,
      actividadId
    );

  if (!contexto) {
    return NextResponse.json(
      {
        error:
          "Actividad no encontrada.",
      },
      {
        status: 404,
      }
    );
  }

  const indicaciones =
    await prisma.indicacionActividadSeguimiento.findMany({
      where: {
        actividadSeguimientoId:
          actividadId,

        activo: true,
      },

      orderBy: [
        {
          hora: "asc",
        },
        {
          orden: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

  return NextResponse.json({
    indicaciones,
  });
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      actividadId: string;
    }>;
  }
) {
  const admin =
    await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      {
        error: "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  const {
    id,
    actividadId,
  } = await params;

  const contexto =
    await obtenerContexto(
      id,
      actividadId
    );

  if (!contexto) {
    return NextResponse.json(
      {
        error:
          "Actividad no encontrada.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    contexto.estado !==
      "PENDIENTE" ||
    contexto.preparadoAt
  ) {
    return NextResponse.json(
      {
        error:
          "Las indicaciones solo pueden modificarse durante la preparación del seguimiento.",
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

  const hora =
    typeof body?.hora === "string"
      ? body.hora.trim()
      : "";

  const texto =
    typeof body?.texto === "string"
      ? body.texto
          .trim()
          .slice(0, 5000)
      : "";

  if (!horaValida(hora)) {
    return NextResponse.json(
      {
        error:
          "Selecciona un horario válido.",
      },
      {
        status: 400,
      }
    );
  }

  if (!texto) {
    return NextResponse.json(
      {
        error:
          "La indicación es obligatoria.",
      },
      {
        status: 400,
      }
    );
  }

  const ultima =
    await prisma.indicacionActividadSeguimiento.findFirst({
      where: {
        actividadSeguimientoId:
          actividadId,
      },

      orderBy: {
        orden: "desc",
      },

      select: {
        orden: true,
      },
    });

  const indicacion =
    await prisma.indicacionActividadSeguimiento.create({
      data: {
        actividadSeguimientoId:
          actividadId,

        hora,

        texto,

        orden:
          (ultima?.orden ?? -1) +
          1,

        activo: true,
      },
    });

  return NextResponse.json(
    indicacion
  );
}
