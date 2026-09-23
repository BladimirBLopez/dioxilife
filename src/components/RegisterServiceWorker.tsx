"use client";

import { useEffect } from "react";

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => {
        console.error("No se pudo registrar la aplicación:", error);
      });
  }, []);

  return null;
}
