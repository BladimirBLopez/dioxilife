"use client";

import { useEffect } from "react";

export default function ReferralTracker() {
  useEffect(() => {
    const parametros =
      new URLSearchParams(
        window.location.search
      );

    const codigo =
      parametros
        .get("ref")
        ?.trim();

    if (!codigo) {
      return;
    }

    fetch("/api/referido", {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "same-origin",

      body: JSON.stringify({
        codigo,
      }),
    }).catch((error) => {
      console.error(
        "No se pudo registrar el referido:",
        error
      );
    });
  }, []);

  return null;
}
