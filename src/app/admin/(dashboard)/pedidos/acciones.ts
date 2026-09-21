"use server";

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
    pedido.estado === "PAGO_REPORTADO" &&
    nuevoEstado === "CONFIRMADO";

  if (
    (esAprobacionPago ||
      esRechazoPago) &&
    admin.rol !== "SUPER_ADMIN"
  ) {
    throw new Error(
      "Solo el Super Administrador puede aprobar o rechazar pagos reportados."
    );
  }

  const estadosPermitidos = [
    ...transiciones[nuevoEstado],
  ];

  const resultado =
    await prisma.pedido.updateMany({
      where: {
        id,

        estado: {
          in: estadosPermitidos,
        },
      },

      data: {
        estado: nuevoEstado,
      },
    });

  if (resultado.count === 0) {
    throw new Error(
      "No se pudo actualizar el pedido. El estado pudo haber cambiado."
    );
  }

  revalidatePath(
    "/admin/pedidos"
  );

  revalidatePath(
    `/admin/pedidos/${id}`
  );

  revalidatePath(
    "/mi-cuenta/pedidos"
  );
}
