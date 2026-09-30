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

const ORIGENES_MANUALES = [
  "WHATSAPP",
  "LLAMADA",
  "TIENDA",
  "OTRO",
] as const;

export async function POST(req: NextRequest) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const body = await req.json();

  const pedidoId =
    typeof body.pedidoId === "string" &&
    body.pedidoId.trim()
      ? body.pedidoId.trim()
      : null;

  const planId =
    typeof body.planId === "string"
      ? body.planId.trim()
      : "";

  const nombreManual =
    typeof body.nombreCliente === "string"
      ? body.nombreCliente.trim().slice(0, 120)
      : "";

  const telefonoManual =
    typeof body.telefonoCliente === "string"
      ? body.telefonoCliente.replace(/\D/g, "")
      : "";


  const referenciaCompra =
    typeof body.referenciaCompra === "string"
      ? body.referenciaCompra.trim().slice(0, 500)
      : "";

  const observacion =
    typeof body.observacionInterna === "string"
      ? body.observacionInterna.trim().slice(0, 1500)
      : "";

  const fechaInicioPrevista =
    body.fechaInicioPrevista;

  if (
    telefonoManual &&
    !/^[0-9]{8}$/.test(telefonoManual)
  ) {
    return NextResponse.json(
      {
        error:
          "El WhatsApp debe contener exactamente 8 números.",
      },
      { status: 400 }
    );
  }

  if (!planId) {
    return NextResponse.json(
      {
        error:
          "El plan de seguimiento es obligatorio.",
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

  let nombreCliente: string | null =
    null;

  let telefonoCliente: string | null =
    null;

  let origen:
    | "PEDIDO_WEB"
    | "WHATSAPP"
    | "LLAMADA"
    | "TIENDA"
    | "OTRO";

  if (pedidoId) {
    const pedido =
      await prisma.pedido.findUnique({
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
        {
          error:
            "Pedido no encontrado.",
        },
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
            "El seguimiento desde un pedido solo puede crearse después de aprobar el pago.",
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

    nombreCliente =
      pedido.nombreCliente ||
      (pedido.miembro
        ? `${pedido.miembro.nombres}${
            pedido.miembro.apellidos
              ? ` ${pedido.miembro.apellidos}`
              : ""
          }`
        : null);

    telefonoCliente =
      pedido.telefonoCliente ||
      null;

    origen =
      "PEDIDO_WEB";
  } else {
    if (!nombreManual) {
      return NextResponse.json(
        {
          error:
            "El nombre del cliente es obligatorio.",
        },
        { status: 400 }
      );
    }

    if (!telefonoManual) {
      return NextResponse.json(
        {
          error:
            "El WhatsApp del cliente es obligatorio.",
        },
        { status: 400 }
      );
    }

    const origenSolicitado =
      typeof body.origen === "string"
        ? body.origen
        : "WHATSAPP";

    if (
      !ORIGENES_MANUALES.includes(
        origenSolicitado as
          (typeof ORIGENES_MANUALES)[number]
      )
    ) {
      return NextResponse.json(
        {
          error:
            "El origen del seguimiento no es válido.",
        },
        { status: 400 }
      );
    }

    nombreCliente =
      nombreManual;

    telefonoCliente =
      telefonoManual;

    origen =
      origenSolicitado as
        (typeof ORIGENES_MANUALES)[number];
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
            {
              diaInicio: "asc",
            },
            {
              orden: "asc",
            },
            {
              hora: {
                sort: "asc",
                nulls: "last",
              },
            },
            {
              createdAt: "asc",
            },
          ],

          select: {
            tipo: true,
            recordatorio: true,
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
      {
        error:
          "Plan no encontrado.",
      },
      { status: 404 }
    );
  }

  if (
    plan.estado !== "ACTIVO"
  ) {
    return NextResponse.json(
      {
        error:
          "Solo se pueden asignar planes activos.",
      },
      { status: 409 }
    );
  }

  if (
    plan.actividades.length === 0
  ) {
    return NextResponse.json(
      {
        error:
          "El plan debe tener al menos una actividad activa antes de asignarlo.",
      },
      { status: 409 }
    );
  }

  const token =
    randomBytes(32).toString("hex");

  const seguimiento =
    await prisma.seguimientoCliente.create({
      data: {
        pedidoId,
        planId,

        nombreCliente,
        telefonoCliente,

        origen,

        referenciaCompra:
          referenciaCompra ||
          null,

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
          observacion ||
          null,

        estado:
          "PENDIENTE",

        actividades: {
          create:
            plan.actividades.map(
              (actividad) => ({
                tipo:
                  actividad.tipo,

                recordatorio:
                  actividad.recordatorio,

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
              })
            ),
        },
      },

      select: {
        id: true,
        estado: true,
        nombreCliente: true,
        telefonoCliente: true,
        origen: true,
        referenciaCompra: true,
        pedidoId: true,
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
