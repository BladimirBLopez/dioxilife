"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const transiciones = {
  CONFIRMADO: ["NUEVO"],
  PAGADO: ["CONFIRMADO"],
  COMPLETADO: ["PAGADO"],
  CANCELADO: ["NUEVO", "CONFIRMADO"],
} as const;

type EstadoDestino = keyof typeof transiciones;

export async function actualizarEstadoPedido(
  id: string,
  nuevoEstado: EstadoDestino
) {
  if (!id) {
    throw new Error("Pedido no válido.");
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

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
}
