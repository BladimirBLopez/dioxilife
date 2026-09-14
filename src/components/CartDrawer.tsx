"use client";

import { useState } from "react";
import Image from "next/image";
import Modal from "./Modal";
import { useCart } from "@/lib/cart-context";
import { NUMERO_WHATSAPP } from "@/lib/constants";

export default function CartDrawer() {
  const [abierto, setAbierto] = useState(false);
  const {
    items,
    removeItem,
    updateCantidad,
    clear,
    totalItems,
    totalPrecio,
    tieneItemsAConsultar,
  } = useCart();

  function armarMensaje() {
    const lineas = items.map((i) => {
      const precioTexto = i.mostrarPrecio
        ? `Bs ${(i.precio * i.cantidad).toFixed(2)}`
        : "a consultar";
      return `${i.cantidad}x ${i.nombre} - ${precioTexto}`;
    });

    let mensaje =
      "Hola, quiero hacer el siguiente pedido:\n\n" + lineas.join("\n");

    if (totalPrecio > 0) {
      mensaje += `\n\nTotal: Bs ${totalPrecio.toFixed(2)}`;
      if (tieneItemsAConsultar) mensaje += " (más productos a consultar)";
    } else if (tieneItemsAConsultar) {
      mensaje += "\n\nTodos los productos son a consultar";
    }

    return mensaje;
  }

  function finalizarPedido() {
    const mensaje = encodeURIComponent(armarMensaje());
    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${mensaje}`, "_blank");
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        aria-label="Ver carrito"
        className="relative text-2xl leading-none px-1 text-brand-blue"
      >
        🛒
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-brand-pink text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </button>

      {abierto && (
        <Modal title="Tu carrito" onClose={() => setAbierto(false)}>
          {items.length === 0 ? (
            <p className="text-sm text-brand-gray text-center py-6">
              Tu carrito está vacío
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 shrink-0 rounded bg-gray-100 overflow-hidden relative">
                    {i.imagenUrl && (
                      <Image
                        src={i.imagenUrl}
                        alt={i.nombre}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">
                      {i.nombre}
                    </p>
                    <p className="text-xs text-brand-gray">
                      {i.mostrarPrecio
                        ? `Bs ${i.precio.toFixed(2)} c/u`
                        : "A consultar"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateCantidad(i.id, i.cantidad - 1)}
                      className="w-6 h-6 rounded border text-sm"
                    >
                      −
                    </button>
                    <span className="text-sm w-4 text-center">
                      {i.cantidad}
                    </span>
                    <button
                      onClick={() => updateCantidad(i.id, i.cantidad + 1)}
                      className="w-6 h-6 rounded border text-sm"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(i.id)}
                    aria-label="Quitar"
                    className="text-gray-400 hover:text-red-500 text-lg leading-none px-1"
                  >
                    ×
                  </button>
                </div>
              ))}

              <div className="border-t pt-3">
                {totalPrecio > 0 && (
                  <p className="text-sm font-semibold text-right">
                    Total: Bs {totalPrecio.toFixed(2)}
                    {tieneItemsAConsultar && (
                      <span className="block text-xs font-normal text-brand-gray">
                        + productos a consultar
                      </span>
                    )}
                  </p>
                )}
                {totalPrecio === 0 && tieneItemsAConsultar && (
                  <p className="text-xs text-brand-gray text-right">
                    Todos los productos son a consultar
                  </p>
                )}
              </div>

              <button
                onClick={finalizarPedido}
                className="block w-full text-center text-sm font-semibold text-white bg-[#25D366] rounded py-2.5 hover:opacity-90"
              >
                Finalizar pedido por WhatsApp
              </button>
              <button
                onClick={clear}
                className="block w-full text-center text-xs text-brand-gray hover:text-red-500"
              >
                Vaciar carrito
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
