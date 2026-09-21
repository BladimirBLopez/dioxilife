"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerMiembroActual } from "@/lib/miembro-auth";

function obtenerTexto(
  formData: FormData,
  campo: string,
  maximo: number
) {
  const valor =
    String(
      formData.get(campo) || ""
    ).trim();

  if (valor.length > maximo) {
    throw new Error(
      `El campo ${campo} es demasiado largo.`
    );
  }

  return valor || null;
}

export async function actualizarDatosCliente(
  pedidoId: string,
  formData: FormData
) {
  if (!pedidoId) {
    throw new Error(
      "Pedido no válido."
    );
  }

  const miembro =
    await obtenerMiembroActual();

  if (!miembro) {
    throw new Error(
      "No autorizado o cuenta inactiva."
    );
  }

  const nombreCliente =
    obtenerTexto(
      formData,
      "nombreCliente",
      120
    );

  const telefonoCliente =
    obtenerTexto(
      formData,
      "telefonoCliente",
      30
    );

  const ciudadCliente =
    obtenerTexto(
      formData,
      "ciudadCliente",
      100
    );

  const direccionCliente =
    obtenerTexto(
      formData,
      "direccionCliente",
      250
    );

  const observaciones =
    obtenerTexto(
      formData,
      "observaciones",
      500
    );

  const resultado =
    await prisma.pedido.updateMany({
      where: {
        id: pedidoId,

        referidoPorId:
          miembro.id,

        estado: {
          in: [
            "NUEVO",
            "CONFIRMADO",
            "PAGO_REPORTADO",
          ],
        },
      },

      data: {
        nombreCliente,
        telefonoCliente,
        ciudadCliente,
        direccionCliente,
        observaciones,
      },
    });

  if (resultado.count === 0) {
    throw new Error(
      "No puedes modificar este pedido o ya se encuentra cerrado."
    );
  }

  revalidatePath(
    "/mi-cuenta/pedidos"
  );

  revalidatePath(
    `/mi-cuenta/pedidos/${pedidoId}`
  );

  revalidatePath(
    "/admin/pedidos"
  );

  revalidatePath(
    `/admin/pedidos/${pedidoId}`
  );

  redirect(
    `/mi-cuenta/pedidos/${pedidoId}?guardado=1`
  );
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

  if (!miembro) {
    throw new Error(
      "No autorizado o cuenta inactiva."
    );
  }

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
    `/mi-cuenta/pedidos/${pedidoId}`
  );

  revalidatePath(
    "/admin/pedidos"
  );

  revalidatePath(
    `/admin/pedidos/${pedidoId}`
  );
}
