"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

const transiciones = {
  CONFIRMADO: [
    "NUEVO",
    "PAGO_REPORTADO",
  ],

  PAGADO: [
    "PAGO_REPORTADO",
  ],

  COMPLETADO: [
    "PAGADO",
  ],

  CANCELADO: [
    "NUEVO",
    "CONFIRMADO",
  ],
} as const;

type EstadoDestino =
  keyof typeof transiciones;

async function generarComisionesDelPedido(
  tx: Prisma.TransactionClient,
  pedidoId: string
) {
  const pedido =
    await tx.pedido.findUnique({
      where: {
        id: pedidoId,
      },

      select: {
        id: true,
        codigo: true,
        totalCV: true,
        referidoPorId: true,
      },
    });

  if (!pedido) {
    throw new Error(
      "Pedido no encontrado al procesar comisiones."
    );
  }

  /*
   * Solo las ventas atribuidas a un vendedor
   * generan este tipo de comisión.
   */
  if (!pedido.referidoPorId) {
    return;
  }

  /*
   * Un pedido sin CV no genera dinero
   * para el plan de compensación.
   */
  if (pedido.totalCV.lte(0)) {
    return;
  }

  const configuracion =
    await tx.configuracionComisiones.findUnique({
      where: {
        id: "GLOBAL",
      },

      select: {
        activo: true,
        comisionDirecta: true,
        nivel1: true,
        nivel2: true,
        nivel3: true,
      },
    });

  if (!configuracion) {
    throw new Error(
      "No existe la configuración global de comisiones."
    );
  }

  /*
   * Un plan desactivado pausa la generación
   * de nuevas comisiones, pero nunca debe
   * impedir registrar un pago real.
   */
  if (!configuracion.activo) {
    return;
  }

  const vendedor =
    await tx.miembro.findUnique({
      where: {
        id: pedido.referidoPorId,
      },

      select: {
        id: true,
        estado: true,
        patrocinadorId: true,
      },
    });

  if (!vendedor) {
    throw new Error(
      "No se encontró al vendedor que originó el pedido."
    );
  }

  const comisiones:
    Prisma.ComisionMultinivelCreateManyInput[] =
    [];

  const agregarComision = (
    beneficiarioId: string,
    nivel: number,
    porcentaje: Prisma.Decimal,
    concepto: string
  ) => {
    if (porcentaje.lte(0)) {
      return;
    }

    const monto =
      pedido.totalCV
        .mul(porcentaje)
        .div(100)
        .toDecimalPlaces(
          2,
          Prisma.Decimal.ROUND_HALF_UP
        );

    if (monto.lte(0)) {
      return;
    }

    comisiones.push({
      pedidoId: pedido.id,
      beneficiarioId,
      origenMiembroId:
        vendedor.id,
      nivel,
      montoBase:
        pedido.totalCV,
      porcentaje,
      monto,
      concepto,
      estado: "PENDIENTE",
    });
  };

  /*
   * NIVEL 0 INTERNO:
   * Comisión directa del vendedor.
   *
   * En la interfaz nunca la llamaremos
   * "Nivel 0", sino "Comisión directa".
   */
  if (
    vendedor.estado === "ACTIVO"
  ) {
    agregarComision(
      vendedor.id,
      0,
      configuracion.comisionDirecta,
      `Comisión directa - pedido ${pedido.codigo}`
    );
  }

  const porcentajesRed = [
    configuracion.nivel1,
    configuracion.nivel2,
    configuracion.nivel3,
  ];

  let miembroActual = vendedor;

  /*
   * Evita bucles si algún día existiera
   * una estructura de patrocinio inválida.
   */
  const visitados =
    new Set<string>([
      vendedor.id,
    ]);

  for (
    let indice = 0;
    indice < porcentajesRed.length;
    indice++
  ) {
    if (
      !miembroActual.patrocinadorId
    ) {
      break;
    }

    if (
      visitados.has(
        miembroActual.patrocinadorId
      )
    ) {
      break;
    }

    const patrocinador =
      await tx.miembro.findUnique({
        where: {
          id:
            miembroActual.patrocinadorId,
        },

        select: {
          id: true,
          estado: true,
          patrocinadorId: true,
        },
      });

    if (!patrocinador) {
      break;
    }

    visitados.add(
      patrocinador.id
    );

    const nivel =
      indice + 1;

    /*
     * El nivel mantiene su posición real.
     * No comprimimos niveles por miembros
     * inactivos.
     */
    if (
      patrocinador.estado ===
      "ACTIVO"
    ) {
      agregarComision(
        patrocinador.id,
        nivel,
        porcentajesRed[indice],
        `Comisión nivel ${nivel} - pedido ${pedido.codigo}`
      );
    }

    miembroActual =
      patrocinador;
  }

  if (
    comisiones.length === 0
  ) {
    return;
  }

  /*
   * Segunda protección contra duplicados.
   *
   * La primera es el índice único:
   * pedidoId + beneficiarioId + nivel.
   */
  await tx.comisionMultinivel.createMany({
    data: comisiones,
    skipDuplicates: true,
  });
}

export async function actualizarEstadoPedido(
  id: string,
  nuevoEstado: EstadoDestino
) {
  if (!id) {
    throw new Error(
      "Pedido no válido."
    );
  }

  const admin =
    await obtenerAdminActual();

  if (!admin) {
    throw new Error(
      "No autorizado."
    );
  }

  const pedido =
    await prisma.pedido.findUnique({
      where: {
        id,
      },

      select: {
        estado: true,
      },
    });

  if (!pedido) {
    throw new Error(
      "Pedido no encontrado."
    );
  }

  const esAprobacionPago =
    nuevoEstado === "PAGADO";

  const esRechazoPago =
    pedido.estado ===
      "PAGO_REPORTADO" &&
    nuevoEstado ===
      "CONFIRMADO";

  if (
    (
      esAprobacionPago ||
      esRechazoPago
    ) &&
    admin.rol !==
      "SUPER_ADMIN"
  ) {
    throw new Error(
      "Solo el Super Administrador puede aprobar o rechazar pagos reportados."
    );
  }

  const estadosPermitidos = [
    ...transiciones[
      nuevoEstado
    ],
  ];

  if (
    nuevoEstado === "PAGADO"
  ) {
    /*
     * Pago + comisiones ocurren dentro
     * de la misma transacción.
     *
     * Si falla la comisión, también se
     * revierte PAGADO.
     */
    await prisma.$transaction(
      async (tx) => {
        const resultado =
          await tx.pedido.updateMany({
            where: {
              id,

              estado: {
                in:
                  estadosPermitidos,
              },
            },

            data: {
              estado: "PAGADO",
            },
          });

        if (
          resultado.count === 0
        ) {
          throw new Error(
            "No se pudo aprobar el pago. El estado pudo haber cambiado."
          );
        }

        await generarComisionesDelPedido(
          tx,
          id
        );
      }
    );
  } else {
    const resultado =
      await prisma.pedido.updateMany({
        where: {
          id,

          estado: {
            in:
              estadosPermitidos,
          },
        },

        data: {
          estado:
            nuevoEstado,
        },
      });

    if (
      resultado.count === 0
    ) {
      throw new Error(
        "No se pudo actualizar el pedido. El estado pudo haber cambiado."
      );
    }
  }

  revalidatePath(
    "/admin/pedidos"
  );

  revalidatePath(
    `/admin/pedidos/${id}`
  );

  revalidatePath(
    "/admin/multinivel/comisiones"
  );

  revalidatePath(
    "/mi-cuenta/pedidos"
  );

  revalidatePath(
    "/mi-cuenta/comisiones"
  );

  revalidatePath(
    "/mi-cuenta"
  );
}
