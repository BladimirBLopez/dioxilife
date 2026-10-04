import {
  createHash,
  randomBytes,
} from "crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function hashToken(
  token: string
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function fechaBoliviaActual() {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/La_Paz",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const obtener = (
    tipo: string
  ) =>
    partes.find(
      (parte) =>
        parte.type === tipo
    )?.value || "";

  return `${obtener(
    "year"
  )}-${obtener(
    "month"
  )}-${obtener(
    "day"
  )}`;
}

function fechaUtcDesdeTexto(
  valor: string
) {
  return new Date(
    `${valor}T00:00:00.000Z`
  );
}

function soloFechaUtc(
  fecha: Date
) {
  return Date.UTC(
    fecha.getUTCFullYear(),
    fecha.getUTCMonth(),
    fecha.getUTCDate()
  );
}

function calcularDiaIngreso(
  fechaInicio: Date,
  duracionDias: number
) {
  const hoyTexto =
    fechaBoliviaActual();

  const hoy =
    fechaUtcDesdeTexto(
      hoyTexto
    );

  const diferencia =
    Math.floor(
      (
        soloFechaUtc(hoy) -
        soloFechaUtc(
          fechaInicio
        )
      ) /
        86400000
    ) + 1;

  if (
    diferencia <= 1
  ) {
    return 1;
  }

  if (
    diferencia >
    duracionDias
  ) {
    return null;
  }

  return diferencia;
}

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

  const {
    id: grupoId,
  } = await params;

  const body =
    await req
      .json()
      .catch(() => null);

  if (
    !body ||
    typeof body !==
      "object"
  ) {
    return NextResponse.json(
      {
        error:
          "Los datos del participante no son válidos.",
      },
      {
        status: 400,
      }
    );
  }

  const nombreCliente =
    typeof body.nombreCliente ===
      "string"
      ? body.nombreCliente
          .trim()
          .slice(0, 120)
      : "";

  const telefonoCliente =
    typeof body.telefonoCliente ===
      "string"
      ? body.telefonoCliente.replace(
          /\D/g,
          ""
        )
      : "";

  if (!nombreCliente) {
    return NextResponse.json(
      {
        error:
          "El nombre del participante es obligatorio.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !/^[0-9]{8}$/.test(
      telefonoCliente
    )
  ) {
    return NextResponse.json(
      {
        error:
          "El WhatsApp debe contener exactamente 8 números.",
      },
      {
        status: 400,
      }
    );
  }

  const grupo =
    await prisma.grupoSeguimiento.findUnique({
      where: {
        id: grupoId,
      },

      select: {
        id: true,
        nombre: true,
        estado: true,
        fechaInicio: true,
        duracionDias: true,

        plan: {
          select: {
            id: true,
            nombre: true,

            actividades: {
              where: {
                activo: true,
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
                  where: {
                    activo:
                      true,
                  },

                  orderBy: [
                    {
                      hora:
                        "asc",
                    },
                    {
                      orden:
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
        },

        miembros: {
          where: {
            seguimiento: {
              telefonoCliente,
            },
          },

          take: 1,

          select: {
            id: true,
          },
        },
      },
    });

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
    grupo.estado ===
      "FINALIZADO" ||
    grupo.estado ===
      "CANCELADO"
  ) {
    return NextResponse.json(
      {
        error:
          "No se pueden agregar participantes a un grupo finalizado o cancelado.",
      },
      {
        status: 409,
      }
    );
  }

  if (
    grupo.miembros.length >
    0
  ) {
    return NextResponse.json(
      {
        error:
          "Este WhatsApp ya pertenece a un participante del grupo.",
      },
      {
        status: 409,
      }
    );
  }

  if (
    grupo.plan.actividades
      .length === 0
  ) {
    return NextResponse.json(
      {
        error:
          "El protocolo del grupo no tiene actividades activas.",
      },
      {
        status: 409,
      }
    );
  }

  const diaIngreso =
    calcularDiaIngreso(
      grupo.fechaInicio,
      grupo.duracionDias
    );

  if (
    diaIngreso === null
  ) {
    return NextResponse.json(
      {
        error:
          "El periodo del grupo ya terminó. Amplía primero la duración para agregar participantes.",
      },
      {
        status: 409,
      }
    );
  }

  const fechaIngresoTexto =
    fechaBoliviaActual();

  const fechaIngreso =
    fechaUtcDesdeTexto(
      fechaIngresoTexto
    );

  const token =
    randomBytes(32)
      .toString("hex");

  const ahora =
    new Date();

  const resultado =
    await prisma.$transaction(
      async (tx) => {
        const seguimiento =
          await tx.seguimientoCliente.create({
            data: {
              planId:
                grupo.plan.id,

              nombreCliente,
              telefonoCliente,

              origen:
                "WHATSAPP",

              nombrePlan:
                grupo.plan.nombre,

              duracionDias:
                grupo.duracionDias,

              tokenAccesoHash:
                hashToken(
                  token
                ),

              tokenCreadoAt:
                ahora,

              /*
               * El seguimiento nace preparado
               * porque el protocolo del grupo
               * ya está definido.
               */
              preparadoAt:
                ahora,

              /*
               * Todos los integrantes comparten
               * la línea temporal del grupo.
               */
              fechaInicioPrevista:
                grupo.fechaInicio,

              fechaInicio:
                grupo.fechaInicio,

              estado:
                grupo.estado ===
                "ACTIVO"
                  ? "ACTIVO"
                  : "PENDIENTE",

              observacionInterna:
                `Participante del grupo: ${grupo.nombre}`,

              actividades: {
                create:
                  grupo.plan.actividades.map(
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
              nombreCliente: true,
              telefonoCliente: true,
              estado: true,
              fechaInicio: true,
              preparadoAt: true,
            },
          });

        const miembro =
          await tx.miembroGrupoSeguimiento.create({
            data: {
              grupoId:
                grupo.id,

              seguimientoId:
                seguimiento.id,

              fechaIngreso,

              diaIngreso,

              estado:
                "ACTIVO",
            },

            select: {
              id: true,
              diaIngreso: true,
              fechaIngreso: true,
              estado: true,
            },
          });

        return {
          seguimiento,
          miembro,
        };
      }
    );

  return NextResponse.json(
    {
      ...resultado,
      token,
    },
    {
      status: 201,
    }
  );
}
