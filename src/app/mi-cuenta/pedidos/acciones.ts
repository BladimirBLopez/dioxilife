"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

async function obtenerMiembroActual() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("miembro_token")?.value;

  if (!token) {
    throw new Error("No autorizado.");
  }

  const sesion =
    await verificarSesion(token);

  if (
    !sesion ||
    typeof sesion.usuario !== "string"
  ) {
    throw new Error(
      "Sesión no válida."
    );
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
