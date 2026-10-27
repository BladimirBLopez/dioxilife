"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function TarjetaQRPrivada({
  url,
}: {
  url: string;
}) {
  const [visible, setVisible] = useState(false);
  const qr = useRef<HTMLCanvasElement>(null);

  function descargar() {
    if (!qr.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 620;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 600, 620);

    ctx.textAlign = "center";
    ctx.fillStyle = "#86198f";
    ctx.font = "bold 32px Arial";
    ctx.fillText("DioxiLife Bolivia", 300, 65);

    ctx.fillStyle = "#334155";
    ctx.font = "20px Arial";
    ctx.fillText("Acceso privado del cliente", 300, 105);

    ctx.drawImage(qr.current, 120, 135, 360, 360);

    ctx.font = "18px Arial";
    ctx.fillText("Escanea para abrir tu registro", 300, 540);

    ctx.font = "15px Arial";
    ctx.fillText("No compartir publicamente", 300, 585);

    const a = document.createElement("a");
    a.download = "dioxilife-acceso-privado.png";
    a.href = canvas.toDataURL("image/png");
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="mt-4 space-y-3">
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        className="rounded-xl border border-fuchsia-300 px-4 py-3 text-sm font-semibold text-fuchsia-800"
      >
        {visible ? "Ocultar QR" : "Mostrar QR privado"}
      </button>

      {visible && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <QRCodeCanvas
            ref={qr}
            value={url}
            size={280}
            level="M"
            marginSize={4}
            title="Acceso privado DioxiLife"
          />

          <button
            type="button"
            onClick={descargar}
            className="block rounded-xl bg-fuchsia-700 px-4 py-3 text-sm font-semibold text-white"
          >
            Descargar tarjeta PNG
          </button>

          <p className="text-xs text-amber-900">
            Este QR contiene un enlace privado.
            Cualquier persona que lo obtenga
            podria acceder mientras este vigente.
            Guardalo y compartelo con cuidado.
          </p>
        </div>
      )}
    </div>
  );
}
