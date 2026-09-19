"use client";

import { useState } from "react";
import Image from "next/image";
import Modal from "./Modal";
import { useCart } from "@/lib/cart-context";
import { NUMERO_WHATSAPP } from "@/lib/constants";

type PedidoCreado = {
  codigo: string;
  total: string;
  requiereCotizacion: boolean;
  detalles: {
    id: string;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: string;
    mostrarPrecio: boolean;
    subtotal: string;
  }[];
};

export default function CartDrawer() {
  const [abierto, setAbierto] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const {
    items,
    removeItem,
    updateCantidad,
    clear,
    totalItems,
    totalPrecio,
    tieneItemsAConsultar,
  } = useCart();

  function armarMensaje(pedido: PedidoCreado) {
    const lineas = pedido.detalles.map((detalle) => {
      const precioTexto = detalle.mostrarPrecio
        ? `Bs ${Number(detalle.subtotal).toFixed(2)}`
        : "a consultar";

      return `${detalle.cantidad}x ${detalle.nombreProducto} - ${precioTexto}`;
    });

    let mensaje =
      `Hola, realicé el pedido *${pedido.codigo}* en DioxiLife.\n\n` +
      lineas.join("\n");

    const total = Number(pedido.total);

    if (total > 0) {
      mensaje += `\n\nTotal registrado: Bs ${total.toFixed(2)}`;

      if (pedido.requiereCotizacion) {
        mensaje += " (más productos a consultar)";
      }
    } else if (pedido.requiereCotizacion) {
      mensaje += "\n\nProductos con precio a consultar";
    }

    mensaje += `\n\nCódigo de pedido: ${pedido.codigo}`;

    return mensaje;
  }

  async function finalizarPedido() {
    if (items.length === 0 || finalizando) {
      return;
    }

    setFinalizando(true);

    // Abrimos la pestaña inmediatamente para evitar
    // que el navegador bloquee WhatsApp después del await.
    const ventanaWhatsapp = window.open("", "_blank");

    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            cantidad: item.cantidad,
          })),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.pedido) {
        ventanaWhatsapp?.close();

        alert(
          data?.error ||
            "No se pudo registrar el pedido. Intenta nuevamente."
        );

        return;
      }

      const pedido = data.pedido as PedidoCreado;

      const mensaje = encodeURIComponent(
        armarMensaje(pedido)
      );

      const url =
        `https://wa.me/${NUMERO_WHATSAPP}?text=${mensaje}`;

      if (ventanaWhatsapp) {
        ventanaWhatsapp.location.href = url;
      } else {
        window.location.href = url;
      }

      clear();
      setAbierto(false);

    } catch {
      ventanaWhatsapp?.close();

      alert(
        "No se pudo conectar con el servidor para registrar el pedido."
      );
    } finally {
      setFinalizando(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        aria-label="Ver carrito"
        className="relative w-9 h-9 flex items-center justify-center rounded-full text-brand-blue hover:bg-brand-blue/5 active:bg-brand-blue/10 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5.5 h-5.5">
          <path
            d="M3 4h1.6l1.2 2M6.6 6l1.9 9.4a1.5 1.5 0 0 0 1.47 1.2h8.2a1.5 1.5 0 0 0 1.47-1.17L21 8H6.6Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="20.5" r="1.15" fill="currentColor" stroke="none" />
          <circle cx="17.5" cy="20.5" r="1.15" fill="currentColor" stroke="none" />
        </svg>
        {totalItems > 0 && (
          <span className="absolute top-0 right-0 bg-brand-pink text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center ring-2 ring-white">
            {totalItems}
          </span>
        )}
      </button>

      {abierto && (
        <Modal title="Tu carrito" onClose={() => setAbierto(false)}>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 mx-auto text-gray-300">
                <path
                  d="M3 4h1.6l1.2 2M6.6 6l1.9 9.4a1.5 1.5 0 0 0 1.47 1.2h8.2a1.5 1.5 0 0 0 1.47-1.17L21 8H6.6Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm text-brand-gray mt-3">
                Tu carrito está vacío
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-3">
                  <div className="w-14 h-14 shrink-0 rounded-lg bg-gray-100 overflow-hidden relative">
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
                    <p className="text-sm font-medium text-[#1F1B24] line-clamp-1">
                      {i.nombre}
                    </p>
                    <p className="text-xs text-brand-gray mt-0.5">
                      {i.mostrarPrecio
                        ? `Bs ${i.precio.toFixed(2)} c/u`
                        : "A consultar"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 rounded-full px-1 py-1 shrink-0">
                    <button
                      onClick={() => updateCantidad(i.id, i.cantidad - 1)}
                      aria-label="Restar"
                      className="w-6 h-6 flex items-center justify-center rounded-full text-brand-gray hover:bg-white hover:shadow-sm transition"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                        <path d="M5 12h14" strokeLinecap="round" />
                      </svg>
                    </button>
                    <span className="text-sm font-medium w-5 text-center">
                      {i.cantidad}
                    </span>
                    <button
                      onClick={() => updateCantidad(i.id, i.cantidad + 1)}
                      aria-label="Sumar"
                      className="w-6 h-6 flex items-center justify-center rounded-full text-brand-gray hover:bg-white hover:shadow-sm transition"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(i.id)}
                    aria-label="Quitar"
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ))}

              <div className="border-t border-gray-100 pt-3">
                {totalPrecio > 0 && (
                  <p className="text-sm font-semibold text-right text-[#1F1B24]">
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
                disabled={finalizando}
                className="flex items-center justify-center gap-2 w-full text-sm font-semibold text-white bg-[#25D366] rounded-lg py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.05-1.35A10 10 0 1 0 12 2Zm0 18.2a8.16 8.16 0 0 1-4.17-1.14l-.3-.18-3 .8.8-2.93-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.13c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.44-1.34-1.68-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
                </svg>
                {finalizando
                  ? "Registrando pedido..."
                  : "Finalizar pedido por WhatsApp"}
              </button>
              <button
                onClick={clear}
                className="block w-full text-center text-xs text-brand-gray hover:text-red-500 transition-colors"
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
