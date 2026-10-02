import {
  NextRequest,
  NextResponse,
} from "next/server";

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
  {
    nombre: "Importante",
    orden: 5,
    requiereHora: false,
  },
] as const;

type NombreSeccion =
  (typeof SECCIONES)[number]["nombre"];

type IndicacionRecibida = {
  hora: string;
  texto: string;
  orden: number;
};

type ActividadRecibida = {
  id: string | null;
  nombre: NombreSeccion;
  hora: string | null;
  indicaciones: IndicacionRecibida[];
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

function obtenerIndicaciones(
  valor: Record<string, unknown>,
  nombre: NombreSeccion
):
  | {
      ok: true;
      indicaciones: IndicacionRecibida[];
    }
  | {
      ok: false;
      error: string;
    } {
  if (
    valor.indicaciones ===
      undefined ||
    valor.indicaciones ===
      null
  ) {
    return {
      ok: true,
      indicaciones: [],
    };
  }

  if (
    !Array.isArray(
      valor.indicaciones
    )
  ) {
    return {
      ok: false,
      error:
        `Las indicaciones de ${nombre} no son válidas.`,
    };
  }

  const indicaciones:
    IndicacionRecibida[] = [];

  for (
    let indice = 0;
    indice <
    valor.indicaciones.length;
    indice++
  ) {
    const item =
      valor.indicaciones[
        indice
      ];

    if (!esRegistro(item)) {
      return {
        ok: false,
        error:
          `La indicación ${indice + 1} de ${nombre} no es válida.`,
      };
    }

    const texto =
      typeof item.texto ===
      "string"
        ? item.texto
            .replace(
              /\r?\n/g,
              " "
            )
            .trim()
        : "";

    /*
     * Una fila totalmente vacía
     * simplemente se ignora.
     */
    if (!texto) {
      continue;
    }

    if (
      texto.length >
      5000
    ) {
      return {
        ok: false,
        error:
          `La indicación ${indice + 1} de ${nombre} es demasiado larga.`,
      };
    }

    const hora =
      typeof item.hora ===
      "string"
        ? item.hora.trim()
        : "";

    if (
      !hora ||
      !horaValida(hora)
    ) {
      return {
        ok: false,
        error:
          `Define un horario válido para la indicación ${indice + 1} de ${nombre}.`,
      };
    }

    indicaciones.push({
      hora,
      texto,
      orden:
        indicaciones.length,
    });
  }

  const descripcion =
    indicaciones
      .map(
        (indicacion) =>
          indicacion.texto
      )
      .join("\n");

  if (
    descripcion.length >
    5000
  ) {
    return {
      ok: false,
      error:
        `Las indicaciones de ${nombre} superan los 5000 caracteres.`,
    };
  }

  return {
    ok: true,
    indicaciones,
  };
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
            `Define la hora general de ${seccion.nombre}.`,
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

    const resultadoIndicaciones =
      obtenerIndicaciones(
        valor,
        seccion.nombre
      );

    if (
      !resultadoIndicaciones.ok
    ) {
      return {
        ok: false,
        error:
          resultadoIndicaciones.error,
      };
    }

    recibidas.push({
      id,

      nombre:
        seccion.nombre,

      hora,

      indicaciones:
        resultadoIndicaciones
          .indicaciones,
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

        const descripcion =
          actividad.indicaciones
            .map(
              (indicacion) =>
                indicacion.texto
            )
            .join("\n") ||
          null;

        const data = {
          seccion:
            "PRINCIPAL" as const,

          tipo:
            actividad.nombre ===
            "Importante"
              ? "INFORMACION" as const
              : "TAREA" as const,

          titulo:
            actividad.nombre,

          descripcion,

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

        const indicacionesNuevas =
          actividad.indicaciones.map(
            (
              indicacion
            ) => ({
              hora:
                indicacion.hora,

              texto:
                indicacion.texto,

              orden:
                indicacion.orden,

              activo:
                true,
            })
          );

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

              indicaciones: {
                deleteMany: {},

                create:
                  indicacionesNuevas,
              },

              ...(
                actividad.nombre ===
                  "Ayunas" ||
                actividad.nombre ===
                  "Importante"
                  ? {
                      recordatorio:
                        "NINGUNO" as const,
                    }
                  : {}
              ),
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

            indicaciones: {
              create:
                indicacionesNuevas,
            },
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

      include: {
        indicaciones: {
          where: {
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
        },
      },
    });

  return NextResponse.json({
    ok: true,
    actividades,
  });
}
