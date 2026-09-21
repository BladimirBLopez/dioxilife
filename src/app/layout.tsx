import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

import { CartProvider } from "@/lib/cart-context";
import ReferralTracker from "@/components/ReferralTracker";

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
  title:
    "DioxiLife Bolivia",

  description:
    "Tienda online DioxiLife Bolivia",
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
