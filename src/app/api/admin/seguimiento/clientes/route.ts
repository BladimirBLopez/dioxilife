import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function hashToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function fechaValida(valor: unknown) {
  return (
    typeof valor === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(valor)
  );
}

export async function POST(req: NextRequest) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const {
    pedidoId,
    planId,
    fechaInicioPrevista,
    observacionInterna,
  } = await req.json();

  if (
    typeof pedidoId !== "string" ||
    !pedidoId.trim() ||
    typeof planId !== "string" ||
    !planId.trim()
  ) {
    return NextResponse.json(
      {
        error:
          "Pedido y plan de seguimiento son obligatorios.",
      },
      { status: 400 }
    );
  }

  if (
    fechaInicioPrevista &&
    !fechaValida(fechaInicioPrevista)
  ) {
    return NextResponse.json(
      {
        error:
          "La fecha prevista de inicio no es válida.",
      },
      { status: 400 }
    );
  }

  const pedido = await prisma.pedido.findUnique({
    where: {
      id: pedidoId,
    },
    select: {
      id: true,
      estado: true,
      nombreCliente: true,
      telefonoCliente: true,
      miembro: {
        select: {
          nombres: true,
          apellidos: true,
        },
      },
    },
  });

  if (!pedido) {
    return NextResponse.json(
      { error: "Pedido no encontrado." },
      { status: 404 }
    );
  }

  if (
    pedido.estado !== "PAGADO" &&
    pedido.estado !== "COMPLETADO"
  ) {
    return NextResponse.json(
      {
        error:
          "El seguimiento solo puede asignarse después de aprobar el pago.",
      },
      { status: 409 }
    );
  }

  const plan =
    await prisma.planSeguimiento.findUnique({
      where: {
        id: planId,
      },
      select: {
        id: true,
        nombre: true,
        estado: true,
        duracionDias: true,
        actividades: {
          where: {
            activo: true,
          },
          orderBy: [
            { diaInicio: "asc" },
            { orden: "asc" },
            { createdAt: "asc" },
          ],
          select: {
            titulo: true,
            descripcion: true,
            momento: true,
            hora: true,
            diaInicio: true,
            diaFin: true,
            orden: true,
            activo: true,
          },
        },
      },
    });

  if (!plan) {
    return NextResponse.json(
      { error: "Plan no encontrado." },
      { status: 404 }
    );
  }

  if (plan.estado !== "ACTIVO") {
    return NextResponse.json(
      {
        error:
          "Solo se pueden asignar planes activos.",
      },
      { status: 409 }
    );
  }

  if (plan.actividades.length === 0) {
    return NextResponse.json(
      {
        error:
          "El plan debe tener al menos una actividad activa antes de asignarlo.",
      },
      { status: 409 }
    );
  }

  const seguimientoVigente =
    await prisma.seguimientoCliente.findFirst({
      where: {
        pedidoId,
        estado: {
          in: [
            "PENDIENTE",
            "ACTIVO",
            "PAUSADO",
          ],
        },
      },
      select: {
        id: true,
      },
    });

  if (seguimientoVigente) {
    return NextResponse.json(
      {
        error:
          "Este pedido ya tiene un seguimiento vigente.",
      },
      { status: 409 }
    );
  }

  const token =
    randomBytes(32).toString("hex");

  const observacion =
    typeof observacionInterna === "string"
      ? observacionInterna.trim().slice(0, 1500)
      : "";

  const seguimiento =
    await prisma.seguimientoCliente.create({
      data: {
        pedidoId,
        planId,

        nombreCliente:
          pedido.nombreCliente ||
          (pedido.miembro
            ? `${pedido.miembro.nombres}${
                pedido.miembro.apellidos
                  ? ` ${pedido.miembro.apellidos}`
                  : ""
              }`
            : null),

        telefonoCliente:
          pedido.telefonoCliente || null,

        nombrePlan:
          plan.nombre,

        duracionDias:
          plan.duracionDias,

        tokenAccesoHash:
          hashToken(token),

        tokenCreadoAt:
          new Date(),

        fechaInicioPrevista:
          fechaInicioPrevista
            ? new Date(
                `${fechaInicioPrevista}T00:00:00.000Z`
              )
            : null,

        observacionInterna:
          observacion || null,

        estado: "PENDIENTE",

        actividades: {
          create: plan.actividades.map(
            (actividad) => ({
              titulo: actividad.titulo,
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
            })
          ),
        },
      },

      select: {
        id: true,
        estado: true,
        fechaInicioPrevista: true,
        observacionInterna: true,
        tokenCreadoAt: true,
        nombrePlan: true,
        duracionDias: true,

        plan: {
          select: {
            id: true,
            nombre: true,
            duracionDias: true,
          },
        },
      },
    });

  return NextResponse.json({
    seguimiento,
    token,
  });
}
