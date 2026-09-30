import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

const SECCIONES = [
  {
    nombre: "Ayunas",
    orden: 1,
    requiereHora: false,
  },
  {
    nombre: "Desayuno",
    orden: 2,
    requiereHora: true,
  },
  {
    nombre: "Almuerzo",
    orden: 3,
    requiereHora: true,
  },
  {
    nombre: "Cena",
    orden: 4,
    requiereHora: true,
  },
] as const;

type NombreSeccion =
  (typeof SECCIONES)[number]["nombre"];

type ActividadRecibida = {
  id: string | null;
  nombre: NombreSeccion;
  hora: string | null;
  instrucciones: string | null;
};

function esRegistro(
  valor: unknown
): valor is Record<string, unknown> {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor)
  );
}

function horaValida(
  hora: string
) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
    hora
  );
}

function obtenerActividades(
  body: unknown
):
  | {
      ok: true;
      actividades: ActividadRecibida[];
    }
  | {
      ok: false;
      error: string;
    } {
  if (
    !esRegistro(body) ||
    !Array.isArray(
      body.actividades
    )
  ) {
    return {
      ok: false,
      error:
        "Las actividades enviadas no son válidas.",
    };
  }

  const recibidas:
    ActividadRecibida[] = [];

  for (
    const seccion of
    SECCIONES
  ) {
    const valor =
      body.actividades.find(
        (item) =>
          esRegistro(item) &&
          item.nombre ===
            seccion.nombre
      );

    if (
      !valor ||
      !esRegistro(valor)
    ) {
      return {
        ok: false,
        error:
          `Falta la actividad ${seccion.nombre}.`,
      };
    }

    const id =
      typeof valor.id ===
        "string" &&
      valor.id.trim()
        ? valor.id.trim()
        : null;

    const instrucciones =
      typeof valor.instrucciones ===
        "string" &&
      valor.instrucciones.trim()
        ? valor.instrucciones
            .trim()
            .slice(0, 5000)
        : null;

    let hora: string | null =
      null;

    if (
      seccion.requiereHora
    ) {
      hora =
        typeof valor.hora ===
          "string" &&
        valor.hora.trim()
          ? valor.hora.trim()
          : null;

      if (!hora) {
        return {
          ok: false,
          error:
            `Define la hora de ${seccion.nombre}.`,
        };
      }

      if (
        !horaValida(hora)
      ) {
        return {
          ok: false,
          error:
            `La hora de ${seccion.nombre} no es válida.`,
        };
      }
    }

    recibidas.push({
      id,
      nombre:
        seccion.nombre,
      hora,
      instrucciones,
    });
  }

  return {
    ok: true,
    actividades:
      recibidas,
  };
}

export async function PUT(
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

  const plan =
    await prisma.planSeguimiento.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        duracionDias: true,

        actividades: {
          select: {
            id: true,
            titulo: true,
            momento: true,
          },
        },
      },
    });

  if (!plan) {
    return NextResponse.json(
      {
        error:
          "Plantilla no encontrada.",
      },
      {
        status: 404,
      }
    );
  }

  const body: unknown =
    await req.json();

  const resultado =
    obtenerActividades(
      body
    );

  if (!resultado.ok) {
    return NextResponse.json(
      {
        error:
          resultado.error,
      },
      {
        status: 400,
      }
    );
  }

  const idsPlan =
    new Set(
      plan.actividades.map(
        (actividad) =>
          actividad.id
      )
    );

  const idsRecibidos =
    resultado.actividades
      .map(
        (actividad) =>
          actividad.id
      )
      .filter(
        (
          actividadId
        ): actividadId is string =>
          Boolean(
            actividadId
          )
      );

  if (
    new Set(
      idsRecibidos
    ).size !==
    idsRecibidos.length
  ) {
    return NextResponse.json(
      {
        error:
          "Una misma actividad no puede utilizarse en dos secciones.",
      },
      {
        status: 400,
      }
    );
  }

  for (
    const actividadId of
    idsRecibidos
  ) {
    if (
      !idsPlan.has(
        actividadId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Una de las actividades no pertenece a esta plantilla.",
        },
        {
          status: 409,
        }
      );
    }
  }

  const idsUsados =
    new Set<string>();

  const operaciones =
    resultado.actividades.map(
      (actividad) => {
        const seccion =
          SECCIONES.find(
            (item) =>
              item.nombre ===
              actividad.nombre
          )!;

        let idObjetivo =
          actividad.id;

        if (
          idObjetivo
        ) {
          idsUsados.add(
            idObjetivo
          );
        }

        if (
          !idObjetivo
        ) {
          const existente =
            plan.actividades.find(
              (item) =>
                !idsUsados.has(
                  item.id
                ) &&
                item.momento ===
                  actividad.nombre &&
                item.titulo ===
                  actividad.nombre
            );

          if (existente) {
            idObjetivo =
              existente.id;

            idsUsados.add(
              existente.id
            );
          }
        }

        const data = {
          tipo:
            "TAREA" as const,

          titulo:
            actividad.nombre,

          descripcion:
            actividad.instrucciones,

          momento:
            actividad.nombre,

          hora:
            actividad.hora,

          diaInicio:
            1,

          diaFin:
            plan.duracionDias,

          orden:
            seccion.orden,

          activo:
            true,
        };

        if (
          idObjetivo
        ) {
          return prisma.actividadPlan.update({
            where: {
              id:
                idObjetivo,
            },

            data: {
              ...data,

              ...(actividad.nombre ===
              "Ayunas"
                ? {
                    recordatorio:
                      "NINGUNO" as const,
                  }
                : {}),
            },
          });
        }

        return prisma.actividadPlan.create({
          data: {
            planId:
              plan.id,

            recordatorio:
              "NINGUNO",

            ...data,
          },
        });
      }
    );

  await prisma.$transaction(
    operaciones
  );

  const actividades =
    await prisma.actividadPlan.findMany({
      where: {
        planId:
          plan.id,
      },

      orderBy: [
        {
          diaInicio:
            "asc",
        },
        {
          orden:
            "asc",
        },
        {
          hora: {
            sort:
              "asc",
            nulls:
              "last",
          },
        },
        {
          createdAt:
            "asc",
        },
      ],
    });

  return NextResponse.json({
    ok: true,
    actividades,
  });
}
