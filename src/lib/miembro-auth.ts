import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

export async function obtenerMiembroActual() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "miembro_token"
    )?.value;

  if (!token) {
    return null;
  }

  const sesion =
    await verificarSesion(token);

  if (
    !sesion ||
    typeof sesion.usuario !== "string"
  ) {
    return null;
  }

  const miembro =
    await prisma.miembro.findUnique({
      where: {
        id: sesion.usuario,
      },

      select: {
        id: true,
        nombres: true,
        apellidos: true,
        codigoReferido: true,
        estado: true,
      },
    });

  if (
    !miembro ||
    miembro.estado !== "ACTIVO"
  ) {
    return null;
  }

  return miembro;
}
