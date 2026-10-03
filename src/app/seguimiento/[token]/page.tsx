import type { Metadata } from "next";

import SeguimientoPublico from "@/components/seguimiento/SeguimientoPublico";

export const metadata: Metadata = {
  title: "Mi seguimiento | DioxiLife Bolivia",
  description: "Agenda personal de seguimiento DioxiLife Bolivia",

  openGraph: {
    title: "Mi seguimiento | DioxiLife Bolivia",
    description: "Agenda personal de seguimiento DioxiLife Bolivia",
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

  twitter: {
    card: "summary_large_image",
    title: "Mi seguimiento | DioxiLife Bolivia",
    description: "Agenda personal de seguimiento DioxiLife Bolivia",
    images: ["/og-dioxilife.png"],
  },

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
