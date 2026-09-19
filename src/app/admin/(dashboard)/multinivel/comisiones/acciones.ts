"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const transiciones = {
  APROBADA: ["PENDIENTE"],
  PAGADA: ["APROBADA"],
  ANULADA: ["PENDIENTE", "APROBADA"],
} as const;

type EstadoDestino = keyof typeof transiciones;

export async function actualizarEstadoComision(
  id: string,
  nuevoEstado: EstadoDestino
) {
  if (!id) {
    throw new Error("Comisión no válida.");
  }

  const estadosPermitidos = [...transiciones[nuevoEstado]];

  const resultado = await prisma.comisionMultinivel.updateMany({
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
      "No se pudo actualizar la comisión. El estado pudo haber cambiado."
    );
  }

  revalidatePath("/admin/multinivel/comisiones");
}
