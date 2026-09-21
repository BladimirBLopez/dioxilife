"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

async function obtenerMiembroActual() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("miembro_token")?.value;

  if (!token) {
    throw new Error("No autorizado.");
  }

  const sesion = await verificarSesion(token);

  if (
    !sesion ||
    typeof sesion.usuario !== "string"
  ) {
    throw new Error("Sesión no válida.");
  }

  const miembro =
    await prisma.miembro.findUnique({
      where: {
        id: sesion.usuario,
      },

      select: {
        id: true,
        estado: true,
      },
    });

  if (
    !miembro ||
    miembro.estado !== "ACTIVO"
  ) {
    throw new Error(
      "El miembro no está activo."
    );
  }

  return miembro;
}

export async function reportarPago(
  pedidoId: string
) {
  if (!pedidoId) {
    throw new Error(
      "Pedido no válido."
    );
  }

  const miembro =
    await obtenerMiembroActual();

  const resultado =
    await prisma.pedido.updateMany({
      where: {
        id: pedidoId,

        referidoPorId:
          miembro.id,

        estado:
          "CONFIRMADO",
      },

      data: {
        estado:
          "PAGO_REPORTADO",
      },
    });

  if (resultado.count === 0) {
    throw new Error(
      "No puedes reportar el pago de este pedido o su estado ya cambió."
    );
  }

  revalidatePath(
    "/mi-cuenta/pedidos"
  );

  revalidatePath(
    "/admin/pedidos"
  );

  revalidatePath(
    `/admin/pedidos/${pedidoId}`
  );
}
