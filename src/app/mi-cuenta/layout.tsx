import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { obtenerMiembroActual } from "@/lib/miembro-auth";
import MiCuentaShell from "@/components/MiCuentaShell";

export default async function MiCuentaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const miembro =
    await obtenerMiembroActual();

  if (!miembro) {
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
