"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [saliendo, setSaliendo] =
    useState(false);

  async function handleLogout() {
    if (saliendo) {
      return;
    }

    try {
      setSaliendo(true);

      await fetch(
        "/api/admin/logout",
        {
          method: "POST",
        }
      );

      router.push(
        "/admin/login"
      );

      router.refresh();
    } finally {
      setSaliendo(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={saliendo}
      className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px]"
      >
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
      </svg>

      {saliendo
        ? "Cerrando sesión..."
        : "Cerrar sesión"}
    </button>
  );
}
