import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

import { CartProvider } from "@/lib/cart-context";
import ReferralTracker from "@/components/ReferralTracker";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";

const geistSans = Geist({
  variable:
    "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono =
  Geist_Mono({
    variable:
      "--font-geist-mono",
    subsets: ["latin"],
  });

export const metadata: Metadata = {
  metadataBase: new URL("https://dioxilifebolivia.online"),
  title: "DioxiLife Bolivia",
  description: "Tienda online DioxiLife Bolivia",
  applicationName: "DioxiLife Bolivia",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "DioxiLife Bolivia",
    description: "Seguimiento personalizado DioxiLife Bolivia",
    url: "https://dioxilifebolivia.online",
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
    title: "DioxiLife Bolivia",
    description: "Seguimiento personalizado DioxiLife Bolivia",
    images: ["/og-dioxilife.png"],
  },

  appleWebApp: {
    capable: true,
    title: "DioxiLife",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">

        <RegisterServiceWorker />
        <ReferralTracker />

        <CartProvider>
          {children}
        </CartProvider>


        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            className:
              "font-sans",
          }}
        />

      </body>
    </html>
  );
}
