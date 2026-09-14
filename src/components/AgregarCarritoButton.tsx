"use client";

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
      onClick={() =>
        addItem({ id, nombre, precio, mostrarPrecio, imagenUrl })
      }
      className="block w-full text-center text-xs font-semibold text-white bg-brand-pink rounded py-1.5 hover:opacity-90"
    >
      Agregar al carrito
    </button>
  );
}
