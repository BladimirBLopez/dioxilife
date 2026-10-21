import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeguimientoPublico from "@/components/seguimiento/SeguimientoPublico";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Mi seguimiento | DioxiLife Bolivia",
  description:
    "Acceso privado a tu seguimiento DioxiLife Bolivia",
  openGraph: {
    title: "Mi seguimiento | DioxiLife Bolivia",
    description:
      "Agenda personal de seguimiento DioxiLife Bolivia",
    siteName: "DioxiLife Bolivia",
    images: [
      {
        url: "/og-dioxilife.png",
        width: 1200,
        height: 630,
        alt: "DioxiLife Bolivia",
      },
    ],
    locale: "es_BO",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

export default async function SeguimientoCortoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  // Un token de 256 bits en Base64URL sin padding
  // ocupa exactamente 43 caracteres.
  if (!/^[A-Za-z0-9_-]{43}$/.test(codigo)) {
    notFound();
  }

  const bytes = Buffer.from(
    codigo,
    "base64url"
  );

  // Evita aceptar representaciones ambiguas.
  if (
    bytes.length !== 32 ||
    bytes.toString("base64url") !== codigo
  ) {
    notFound();
  }

  const token = bytes.toString("hex");

  return (
    <SeguimientoPublico token={token} />
  );
}
