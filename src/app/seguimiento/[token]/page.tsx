import type { Metadata } from "next";

import SeguimientoPublico from "@/components/seguimiento/SeguimientoPublico";

export const metadata: Metadata = {
  title: "Mi seguimiento | DioxiLife Bolivia",
  description: "Agenda personal de seguimiento DioxiLife Bolivia",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SeguimientoPage({
  params,
}: {
  params: Promise<{
    token: string;
  }>;
}) {
  const { token } =
    await params;

  return (
    <SeguimientoPublico
      token={token}
    />
  );
}
