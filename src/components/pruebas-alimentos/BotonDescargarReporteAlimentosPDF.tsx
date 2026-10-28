"use client";

import { useState } from "react";
import type { ReporteIndividualCliente } from "./contrato-reporte-individual-admin";

function formato(valor: number): string {
  return valor.toLocaleString("es-BO", {
    maximumFractionDigits: 2,
  });
}

function conSigno(valor: number): string {
  return (valor > 0 ? "+" : "") + formato(valor);
}

function fechaBolivia(fecha: Date): string {
  return fecha.toLocaleString("es-BO", {
    timeZone: "America/La_Paz",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function obtenerLogo(): Promise<string> {
  const respuesta = await fetch("/logo.png", {
    credentials: "same-origin",
    cache: "force-cache",
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar el logo de DioxiLife.");
  }

  const blob = await respuesta.blob();

  return new Promise<string>((resolver, rechazar) => {
    const lector = new FileReader();

    lector.onload = () => {
      if (typeof lector.result === "string") {
        resolver(lector.result);
      } else {
        rechazar(new Error("No se pudo preparar el logo."));
      }
    };

    lector.onerror = () =>
      rechazar(new Error("No se pudo leer el logo."));

    lector.readAsDataURL(blob);
  });
}

export default function BotonDescargarReporteAlimentosPDF({
  reporte,
}: {
  reporte: ReporteIndividualCliente;
}) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");

  async function descargar() {
    if (generando) return;

    setGenerando(true);
    setError("");

    try {
      const [
        moduloPDF,
        moduloTabla,
        logo,
      ] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
        obtenerLogo(),
      ]);

      const { jsPDF } = moduloPDF;
      const autoTable = moduloTabla.default;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const azul: [number, number, number] = [12, 144, 200];
      const fucsia: [number, number, number] = [174, 11, 187];
      const oscuro: [number, number, number] = [36, 48, 66];
      const gris: [number, number, number] = [101, 113, 130];

      const propiedadesLogo = doc.getImageProperties(logo);
      const razon = propiedadesLogo.width / propiedadesLogo.height;

      if (!Number.isFinite(razon) || razon <= 0) {
        throw new Error("El logo no tiene dimensiones válidas.");
      }

      const anchoLogo = Math.min(32, 23 * razon);
      const altoLogo = anchoLogo / razon;

      function colocarLogo(x: number, y: number, ancho: number) {
        const altura = ancho / razon;
        doc.addImage(logo, "PNG", x, y, ancho, altura);
      }

      function textoColor(color: [number, number, number]) {
        doc.setTextColor(...color);
      }

      // Encabezado principal
      doc.setFillColor(250, 247, 252);
      doc.rect(0, 0, 210, 66, "F");

      doc.setFillColor(...fucsia);
      doc.rect(0, 0, 210, 4, "F");

      colocarLogo(
        17 + (32 - anchoLogo) / 2,
        12 + (23 - altoLogo) / 2,
        anchoLogo
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      textoColor(oscuro);
      doc.text("DIOXILIFE BOLIVIA", 58, 22);

      doc.setFontSize(13);
      doc.text("Reporte individual", 58, 34);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      textoColor(gris);
      doc.text("Pruebas de alimentos y glucosa", 58, 42);
      doc.text("Informe descriptivo de mediciones", 58, 49);

      // Identificación y resumen
      doc.setFillColor(246, 249, 252);
      doc.roundedRect(16, 72, 178, 31, 3, 3, "F");

      doc.setFontSize(8);
      textoColor(gris);
      doc.text("CLIENTE", 21, 79);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      textoColor(oscuro);

      const nombre = doc.splitTextToSize(
        reporte.cliente.nombre,
        94
      ).slice(0, 2);

      doc.text(nombre, 21, 86);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      textoColor(gris);
      doc.text("Emitido: " + fechaBolivia(new Date()), 21, 99);

      doc.text(
        "Registros revisados: " + reporte.registrosRevisados,
        133,
        82
      );
      doc.text(
        "Pruebas completas: " + reporte.pruebasCompletas,
        133,
        90
      );
      doc.text(
        "Alimentos: " + reporte.alimentos.length,
        133,
        98
      );

      // Gráfico vectorial
      textoColor(oscuro);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Comparación por alimento", 16, 113);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      textoColor(gris);
      doc.text(
        "Promedios de hasta 50 registros recientes. Valores en mg/dL.",
        16,
        120
      );

      doc.setFillColor(...azul);
      doc.roundedRect(16, 124, 4, 3, 1, 1, "F");
      doc.setFillColor(...fucsia);
      doc.roundedRect(72, 124, 4, 3, 1, 1, "F");

      textoColor(oscuro);
      doc.text("Antes de comer", 23, 127);
      doc.text("Después de comer", 79, 127);

      const alimentosOrdenados = [...reporte.alimentos]
        .sort((a, b) => b.diferencia - a.diferencia)
        .slice(0, 8);

      const maximo = Math.max(
        1,
        ...alimentosOrdenados.flatMap(item => [
          item.promedioAntes,
          item.promedioDespues,
        ])
      );

      if (alimentosOrdenados.length === 0) {
        textoColor(gris);
        doc.setFontSize(10);
        doc.text(
          "No hay pruebas completas para mostrar en el gráfico.",
          16,
          148
        );
      }

      alimentosOrdenados.forEach((item, indice) => {
        const y = 134 + indice * 16;
        const nombreCorto =
          item.alimento.length > 21
            ? item.alimento.slice(0, 19) + "..."
            : item.alimento;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        textoColor(oscuro);
        doc.text(nombreCorto, 17, y + 4);

        const anchoAntes =
          item.promedioAntes / maximo * 93;
        const anchoDespues =
          item.promedioDespues / maximo * 93;

        if (anchoAntes > 0) {
          doc.setFillColor(...azul);
          doc.roundedRect(
            76, y, Math.max(0.8, anchoAntes),
            3.5, 1, 1, "F"
          );
        }

        if (anchoDespues > 0) {
          doc.setFillColor(...fucsia);
          doc.roundedRect(
            76, y + 5, Math.max(0.8, anchoDespues),
            3.5, 1, 1, "F"
          );
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        textoColor(gris);
        doc.text(
          formato(item.promedioAntes),
          192,
          y + 3,
          { align: "right" }
        );
        doc.text(
          formato(item.promedioDespues),
          192,
          y + 8,
          { align: "right" }
        );

        doc.text(
          "Diferencia promedio: " +
          conSigno(item.diferencia) + " mg/dL",
          17,
          y + 11
        );
      });

      // Tabla completa de los promedios recibidos
      if (reporte.alimentos.length > 0) {
        doc.addPage();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        textoColor(oscuro);
        doc.text("Resumen detallado por alimento", 16, 42);

        autoTable(doc, {
          startY: 48,
          margin: {
            left: 16,
            right: 16,
            top: 38,
            bottom: 26,
          },
          theme: "grid",
          head: [[
            "Alimento",
            "Pruebas",
            "Antes",
            "Después",
            "Diferencia",
          ]],
          body: [...reporte.alimentos]
            .sort((a, b) => b.diferencia - a.diferencia)
            .map(item => [
              item.alimento,
              String(item.pruebas),
              formato(item.promedioAntes),
              formato(item.promedioDespues),
              conSigno(item.diferencia),
            ]),
          styles: {
            font: "helvetica",
            fontSize: 8,
            cellPadding: 3,
            textColor: oscuro,
          },
          headStyles: {
            fillColor: fucsia,
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [249, 247, 251],
          },
          columnStyles: {
            0: { cellWidth: 57 },
            1: { cellWidth: 18, halign: "center" },
            2: { cellWidth: 34, halign: "right" },
            3: { cellWidth: 35, halign: "right" },
            4: { cellWidth: 34, halign: "right" },
          },
        });

        // Mediciones individuales disponibles en la API
        if (reporte.mediciones && reporte.mediciones.length > 0) {
          const ultimaTabla = (
            doc as unknown as {
              lastAutoTable?: { finalY: number };
            }
          ).lastAutoTable;

          let inicio = (ultimaTabla?.finalY ?? 48) + 13;

          if (inicio > 225) {
            doc.addPage();
            inicio = 42;
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          textoColor(oscuro);
          doc.text(
            "Mediciones individuales disponibles",
            16,
            inicio
          );

          autoTable(doc, {
            startY: inicio + 6,
            margin: {
              left: 16,
              right: 16,
              top: 38,
              bottom: 26,
            },
            theme: "striped",
            head: [[
              "Fecha",
              "Alimento",
              "Antes",
              "Después",
              "Diferencia",
            ]],
            body: reporte.mediciones.map(item => [
              fechaBolivia(new Date(item.fecha)),
              item.alimento,
              formato(item.glucosaAntes),
              formato(item.glucosaDespues),
              conSigno(item.diferencia),
            ]),
            styles: {
              font: "helvetica",
              fontSize: 7.5,
              cellPadding: 2.5,
            },
            headStyles: {
              fillColor: azul,
              textColor: [255, 255, 255],
            },
          });
        }
      }

      // Encabezado secundario y pie en todas las páginas
      const paginas = doc.getNumberOfPages();

      for (let pagina = 1; pagina <= paginas; pagina++) {
        doc.setPage(pagina);

        if (pagina > 1) {
          colocarLogo(16, 11, Math.min(19, 16 * razon));

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          textoColor(oscuro);
          doc.text("DIOXILIFE BOLIVIA", 44, 19);

          doc.setDrawColor(227, 216, 231);
          doc.line(16, 31, 194, 31);
        }

        doc.setDrawColor(221, 224, 231);
        doc.line(16, 276, 194, 276);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        textoColor(gris);

        doc.text(
          "Uso confidencial. Los resultados no constituyen un diagnóstico médico.",
          16,
          282
        );

        doc.text(
          "Página " + pagina + " de " + paginas,
          194,
          288,
          { align: "right" }
        );
      }

      const nombreArchivo = reporte.cliente.nombre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .slice(0, 45) || "Cliente";

      doc.save(
        "DioxiLife_Reporte_" + nombreArchivo + ".pdf"
      );

    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo generar el PDF."
      );
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={generando}
        onClick={() => void descargar()}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-fuchsia-700 px-5 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-50"
      >
        {generando
          ? "Preparando PDF..."
          : "Descargar reporte PDF"}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-2 max-w-sm text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
