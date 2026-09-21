import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";
import MiCuentaShell from "@/components/MiCuentaShell";

export default async function MiCuentaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "miembro_token"
    )?.value;

  if (!token) {
    redirect(
      "/login-miembro"
    );
  }

  const sesion =
    await verificarSesion(token);

  if (
    !sesion ||
    typeof sesion.usuario !== "string"
  ) {
    redirect(
      "/login-miembro"
    );
  }

  const miembro =
    await prisma.miembro.findUnique({
      where: {
        id: sesion.usuario,
      },

      select: {
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
    redirect(
      "/login-miembro"
    );
  }

  return (
    <MiCuentaShell
      miembro={{
        nombres:
          miembro.nombres,

        apellidos:
          miembro.apellidos,

        codigoReferido:
          miembro.codigoReferido,
      }}
    >
      {children}
    </MiCuentaShell>
  );
}
