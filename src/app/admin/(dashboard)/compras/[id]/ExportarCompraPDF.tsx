"use client";

import { FileDown } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type ProductoPDF = {
  nombre: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
};

type Props = {
  codigo: string;
  proveedor: string;
  estado: string;
  fechaCompra: string;
  fechaRegistro: string;
  fechaRecepcion: string;
  total: number;
  productos: ProductoPDF[];
};

function dinero(valor: number) {
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function nombreEstado(estado: string) {
  if (estado === "RECIBIDA") {
    return "Recibida";
  }

  if (estado === "ANULADA") {
    return "Anulada";
  }

  return "Pendiente de recibir";
}

export default function ExportarCompraPDF({
  codigo,
  proveedor,
  estado,
  fechaCompra,
  fechaRegistro,
  fechaRecepcion,
  total,
  productos,
}: Props) {
  function exportar() {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("DioxiLife Bolivia", 14, 18);

    doc.setFontSize(13);
    doc.text(`Compra ${codigo}`, 14, 28);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(`Proveedor: ${proveedor}`, 14, 39);
    doc.text(`Estado: ${nombreEstado(estado)}`, 14, 45);
    doc.text(`Fecha de compra: ${fechaCompra}`, 14, 51);
    doc.text(`Registro en sistema: ${fechaRegistro}`, 14, 57);
    doc.text(`Recepción: ${fechaRecepcion}`, 14, 63);

    autoTable(doc, {
      startY: 73,

      head: [[
        "Producto",
        "Cantidad",
        "Costo unit.",
        "Subtotal",
      ]],

      body: productos.map((producto) => [
        producto.nombre,
        String(producto.cantidad),
        `Bs ${dinero(producto.costoUnitario)}`,
        `Bs ${dinero(producto.subtotal)}`,
      ]),

      styles: {
        font: "helvetica",
        fontSize: 9,
      },

      headStyles: {
        fontStyle: "bold",
      },

      columnStyles: {
        0: {
          cellWidth: 80,
        },
        1: {
          halign: "center",
        },
        2: {
          halign: "right",
        },
        3: {
          halign: "right",
        },
      },
    });

    const finalY =
      (doc as jsPDF & {
        lastAutoTable?: {
          finalY: number;
        };
      }).lastAutoTable?.finalY ?? 80;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    doc.text(
      `TOTAL: Bs ${dinero(total)}`,
      196,
      finalY + 12,
      {
        align: "right",
      }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.text(
      "Documento generado desde el sistema administrativo DioxiLife Bolivia.",
      14,
      finalY + 25
    );

    doc.save(`Compra-${codigo}.pdf`);
  }

  return (
    <button
      type="button"
      onClick={exportar}
      className="admin-btn-secondary inline-flex items-center gap-2"
    >
      <FileDown className="h-4 w-4" />
      Exportar PDF
    </button>
  );
}
