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
  title: "DioxiLife Bolivia",
  description: "Tienda online DioxiLife Bolivia",
  applicationName: "DioxiLife Bolivia",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
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
