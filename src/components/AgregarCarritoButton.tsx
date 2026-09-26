"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function AgregarCarritoButton({
  id,
  nombre,
  precio,
  mostrarPrecio,
  imagenUrl,
}: {
  id: string;
  nombre: string;
  precio: number;
  mostrarPrecio: boolean;
  imagenUrl: string | null;
}) {
  const { addItem } = useCart();

  return (
    <button
      type="button"
      onClick={() =>
        addItem({
          id,
          nombre,
          precio,
          mostrarPrecio,
          imagenUrl,
        })
      }
      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-pink px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 active:scale-[0.99]"
    >
      <ShoppingCart className="h-3.5 w-3.5" />
      Agregar al carrito
    </button>
  );
}
