import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerDiaSeguimiento } from "@/lib/seguimiento-publico";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function autorizado(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;

  if (!secreto) return false;

  const recibido = Buffer.from(
    req.headers.get("authorization") ?? ""
  );

  const esperado = Buffer.from(
    `Bearer ${secreto}`
  );

  return (
    recibido.length === esperado.length &&
    timingSafeEqual(recibido, esperado)
  );
}

function horaValida(hora: string | null) {
  return Boolean(
    hora &&
      /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora)
  );
}

type Resultado =
  | "publicada"
  | "pendiente"
  | "vencida"
  | "invalida"
  | "omitida";

export async function GET(req: NextRequest) {
  if (!autorizado(req)) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  const ahora = new Date();

  // Consultar solo etapas automaticas
  // de seguimientos activos.
  const candidatas =
    await prisma.etapaSeguimiento.findMany({
      where: {
        estado: "PROGRAMADA",
        modoPublicacion: "AUTOMATICA",
        publicadaAt: null,
        seguimiento: {
          is: {
            estado: "ACTIVO",
            fechaInicio: {
              not: null,
            },
          },
        },
      },
      select: {
        id: true,
        seguimientoId: true,
        diaInicio: true,
        diaFin: true,
        seguimiento: {
          select: {
            fechaInicio: true,
          },
        },
      },
    });

  const resumen = {
    revisadas: candidatas.length,
    publicadas: 0,
    pendientes: 0,
    vencidas: 0,
    invalidas: 0,
    omitidas: 0,
    errores: 0,
  };

  for (const candidata of candidatas) {
    const fechaInicio =
      candidata.seguimiento.fechaInicio;

    if (!fechaInicio) {
      resumen.omitidas++;
      continue;
    }

    const diaPrevisto =
      obtenerDiaSeguimiento(fechaInicio, ahora);

    // No abrir una etapa antes de tiempo.
    if (diaPrevisto < candidata.diaInicio) {
      resumen.pendientes++;
      continue;
    }

    // Una etapa vencida no se publica
    // retroactivamente sin revision.
    if (diaPrevisto > candidata.diaFin) {
      resumen.vencidas++;
      continue;
    }

    try {
      const resultado: Resultado =
        await prisma.$transaction(async (tx) => {
          // Coordinar con operaciones administrativas.
          const bloqueo =
            await tx.$queryRaw<
              Array<{ id: string }>
            >`
              SELECT "id"
              FROM "SeguimientoCliente"
              WHERE "id" = ${candidata.seguimientoId}
              FOR UPDATE
            `;

          if (bloqueo.length === 0) {
            return "omitida";
          }

          // Volver a comprobar el seguimiento.
          const seguimiento =
            await tx.seguimientoCliente.findUnique({
              where: {
                id: candidata.seguimientoId,
              },
              select: {
                estado: true,
                fechaInicio: true,
                duracionDias: true,
              },
            });

          if (
            !seguimiento ||
            seguimiento.estado !== "ACTIVO" ||
            !seguimiento.fechaInicio
          ) {
            return "omitida";
          }

          // Volver a leer la etapa bajo el bloqueo.
          const etapa =
            await tx.etapaSeguimiento.findFirst({
              where: {
                id: candidata.id,
                seguimientoId:
                  candidata.seguimientoId,
              },
              select: {
                id: true,
                estado: true,
                modoPublicacion: true,
                publicadaAt: true,
                diaInicio: true,
                diaFin: true,
                actividades: {
                  select: {
                    activo: true,
                    titulo: true,
                    seccion: true,
                    hora: true,
                    diaInicio: true,
                    diaFin: true,
                    indicaciones: {
                      where: {
                        activo: true,
                      },
                      select: {
                        hora: true,
                        texto: true,
                      },
                    },
                  },
                },
              },
            });

          if (
            !etapa ||
            etapa.estado !== "PROGRAMADA" ||
            etapa.modoPublicacion !==
              "AUTOMATICA" ||
            etapa.publicadaAt !== null
          ) {
            return "omitida";
          }

          const diaActual =
            obtenerDiaSeguimiento(
              seguimiento.fechaInicio,
              new Date()
            );

          if (diaActual < etapa.diaInicio) {
            return "pendiente";
          }

          if (diaActual > etapa.diaFin) {
            return "vencida";
          }

          if (
            etapa.diaInicio < 1 ||
            etapa.diaFin < etapa.diaInicio ||
            etapa.diaFin >
              seguimiento.duracionDias
          ) {
            return "invalida";
          }

          const activas =
            etapa.actividades.filter(
              (actividad) => actividad.activo
            );

          if (activas.length === 0) {
            return "invalida";
          }

          // Validar fechas y contenido otra vez
          // antes de autorizar la publicacion.
          for (const actividad of etapa.actividades) {
            const fin =
              actividad.diaFin ?? etapa.diaFin;

            if (
              actividad.diaInicio <
                etapa.diaInicio ||
              actividad.diaInicio >
                etapa.diaFin ||
              fin < actividad.diaInicio ||
              fin > etapa.diaFin ||
              fin > seguimiento.duracionDias
            ) {
              return "invalida";
            }

            if (!actividad.activo) continue;

            if (!actividad.titulo.trim()) {
              return "invalida";
            }

            if (
              actividad.seccion === "ADICIONAL" &&
              !horaValida(actividad.hora)
            ) {
              return "invalida";
            }

            if (
              actividad.indicaciones.some(
                (indicacion) =>
                  !horaValida(indicacion.hora) ||
                  !indicacion.texto.trim()
              )
            ) {
              return "invalida";
            }
          }

          // La condicion evita una segunda
          // publicacion del mismo borrador.
          const actualizacion =
            await tx.etapaSeguimiento.updateMany({
              where: {
                id: etapa.id,
                seguimientoId:
                  candidata.seguimientoId,
                estado: "PROGRAMADA",
                modoPublicacion: "AUTOMATICA",
                publicadaAt: null,
              },
              data: {
                estado: "PUBLICADA",
                publicadaAt: new Date(),
              },
            });

          return actualizacion.count === 1
            ? "publicada"
            : "omitida";
        });

      switch (resultado) {
        case "publicada":
          resumen.publicadas++;
          break;
        case "pendiente":
          resumen.pendientes++;
          break;
        case "vencida":
          resumen.vencidas++;
          break;
        case "invalida":
          resumen.invalidas++;
          break;
        default:
          resumen.omitidas++;
      }
    } catch (error) {
      console.error(
        "Error al publicar etapa automatica:",
        candidata.id,
        error
      );
      resumen.errores++;
    }
  }


  // PASO 234: cierre automatico seguro de etapas vencidas.
  // No modifica actividades, indicaciones ni progresos.
  const candidatasCierre =
    await prisma.etapaSeguimiento.findMany({
      where: {
        estado: "PUBLICADA",
        publicadaAt: {
          not: null,
        },
        seguimiento: {
          is: {
            estado: "ACTIVO",
            fechaInicio: {
              not: null,
            },
          },
        },
      },
      select: {
        id: true,
        seguimientoId: true,
        diaFin: true,
        seguimiento: {
          select: {
            fechaInicio: true,
          },
        },
      },
    });

  const cierre = {
    revisadas: candidatasCierre.length,
    vencidas: 0,
    finalizadas: 0,
    omitidas: 0,
    errores: 0,
  };

  for (const candidata of candidatasCierre) {
    const fechaInicio =
      candidata.seguimiento.fechaInicio;

    if (!fechaInicio) {
      cierre.omitidas++;
      continue;
    }

    const diaPrevisto =
      obtenerDiaSeguimiento(fechaInicio, ahora);

    // El ultimo dia todavia pertenece a la etapa.
    if (diaPrevisto <= candidata.diaFin) {
      continue;
    }

    cierre.vencidas++;

    try {
      const finalizada =
        await prisma.$transaction(async (tx) => {
          // Coordinar con cambios administrativos
          // mediante el bloqueo del seguimiento.
          const bloqueo =
            await tx.$queryRaw<
              Array<{ id: string }>
            >`
              SELECT "id"
              FROM "SeguimientoCliente"
              WHERE "id" = ${candidata.seguimientoId}
              FOR UPDATE
            `;

          if (bloqueo.length === 0) {
            return false;
          }

          // Revalidar el seguimiento tras el bloqueo.
          const seguimiento =
            await tx.seguimientoCliente.findUnique({
              where: {
                id: candidata.seguimientoId,
              },
              select: {
                estado: true,
                fechaInicio: true,
                duracionDias: true,
              },
            });

          if (
            !seguimiento ||
            seguimiento.estado !== "ACTIVO" ||
            !seguimiento.fechaInicio
          ) {
            return false;
          }

          // Revalidar el estado de la etapa.
          const etapa =
            await tx.etapaSeguimiento.findFirst({
              where: {
                id: candidata.id,
                seguimientoId:
                  candidata.seguimientoId,
              },
              select: {
                id: true,
                estado: true,
                publicadaAt: true,
                diaInicio: true,
                diaFin: true,
              },
            });

          if (
            !etapa ||
            etapa.estado !== "PUBLICADA" ||
            etapa.publicadaAt === null
          ) {
            return false;
          }

          if (
            etapa.diaInicio < 1 ||
            etapa.diaFin < etapa.diaInicio ||
            etapa.diaFin > seguimiento.duracionDias
          ) {
            return false;
          }

          const diaActual =
            obtenerDiaSeguimiento(
              seguimiento.fechaInicio,
              new Date()
            );

          if (diaActual <= etapa.diaFin) {
            return false;
          }

          // Actualizar unicamente el estado.
          // Los datos historicos permanecen intactos.
          const resultado =
            await tx.etapaSeguimiento.updateMany({
              where: {
                id: etapa.id,
                seguimientoId:
                  candidata.seguimientoId,
                estado: "PUBLICADA",
                publicadaAt: {
                  not: null,
                },
              },
              data: {
                estado: "FINALIZADA",
              },
            });

          return resultado.count === 1;
        });

      if (finalizada) {
        cierre.finalizadas++;
      } else {
        cierre.omitidas++;
      }
    } catch (error) {
      console.error(
        "Error al finalizar etapa automatica:",
        candidata.id,
        error
      );

      cierre.errores++;
    }
  }

  return NextResponse.json({
    ok: resumen.errores === 0 && cierre.errores === 0,
    fechaRevision: ahora.toISOString(),
    ...resumen,
    cierre,
  });
}
