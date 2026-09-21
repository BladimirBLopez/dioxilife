import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

export async function obtenerAdminActual() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("session")?.value;

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

  const admin =
    await prisma.admin.findUnique({
      where: {
        usuario: sesion.usuario,
      },

      select: {
        id: true,
        usuario: true,
        rol: true,
      },
    });

  return admin;
}
