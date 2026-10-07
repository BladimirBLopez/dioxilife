import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

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

  const body =
    await req
      .json()
      .catch(() => null);

  const nombre =
    typeof body?.nombre ===
      "string"
      ? body.nombre
          .trim()
          .slice(
            0,
            200
          )
      : "";

  if (!nombre) {
    return NextResponse.json(
      {
        error:
          "Escribe el nombre de la nueva plantilla.",
      },
      {
        status: 400,
      }
    );
  }

  const original =
    await prisma.planSeguimiento.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        nombre: true,
        descripcion: true,
        duracionDias: true,
        esCopiaGrupo: true,

        actividades: {
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
              createdAt:
                "asc",
            },
          ],

          select: {
            tipo: true,
            recordatorio: true,
            seccion: true,
            titulo: true,
            descripcion: true,
            momento: true,
            hora: true,
            diaInicio: true,
            diaFin: true,
            orden: true,
            activo: true,

            indicaciones: {
              orderBy: [
                {
                  orden:
                    "asc",
                },
                {
                  createdAt:
                    "asc",
                },
              ],

              select: {
                hora: true,
                texto: true,
                orden: true,
                activo: true,
              },
            },
          },
        },
      },
    });

  if (!original) {
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

  if (
    original.esCopiaGrupo
  ) {
    return NextResponse.json(
      {
        error:
          "Las copias internas de grupos no pueden utilizarse como plantillas base.",
      },
      {
        status: 409,
      }
    );
  }

  const nueva =
    await prisma.planSeguimiento.create({
      data: {
        nombre,

        descripcion:
          original.descripcion,

        duracionDias:
          original.duracionDias,

        /*
         * La copia nace en borrador para
         * evitar que se asigne antes de
         * terminar su personalización.
         */
        estado:
          "BORRADOR",

        esCopiaGrupo:
          false,

        actividades: {
          create:
            original.actividades.map(
              (
                actividad
              ) => ({
                tipo:
                  actividad.tipo,

                recordatorio:
                  actividad.recordatorio,

                seccion:
                  actividad.seccion,

                titulo:
                  actividad.titulo,

                descripcion:
                  actividad.descripcion,

                momento:
                  actividad.momento,

                hora:
                  actividad.hora,

                diaInicio:
                  actividad.diaInicio,

                diaFin:
                  actividad.diaFin,

                orden:
                  actividad.orden,

                activo:
                  actividad.activo,

                indicaciones: {
                  create:
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
                          indicacion.activo,
                      })
                    ),
                },
              })
            ),
        },
      },

      select: {
        id: true,
        nombre: true,
        descripcion: true,
        duracionDias: true,
        estado: true,

        _count: {
          select: {
            actividades:
              true,
          },
        },
      },
    });

  return NextResponse.json(
    nueva,
    {
      status: 201,
    }
  );
}
