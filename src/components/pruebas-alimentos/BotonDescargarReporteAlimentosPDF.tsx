"use client";

import { useState } from "react";
import type { ReporteIndividualCliente } from "./contrato-reporte-individual-admin";

type Color = [number, number, number];

const C = {
  tinta: [30, 45, 64] as Color,
  gris: [100, 115, 132] as Color,
  azul: [8, 145, 190] as Color,
  fucsia: [177, 31, 151] as Color,
  palido: [244, 248, 251] as Color,
  suave: [251, 247, 250] as Color,
  blanco: [255, 255, 255] as Color,
};

const numero = (n: number) =>
  n.toLocaleString("es-BO", {
    maximumFractionDigits: 2,
  });

const cambio = (n: number) =>
  `${n > 0 ? "+" : ""}${numero(n)}`;

const corto = (s: string, longitud = 24) =>
  s.length > longitud
    ? `${s.slice(0, longitud - 3)}...`
    : s;

const fecha = (d: Date) =>
  d.toLocaleString("es-BO", {
    timeZone: "America/La_Paz",
    dateStyle: "medium",
    timeStyle: "short",
  });

async function cargarLogo(): Promise<string> {
  const respuesta = await fetch("/logo.png", {
    credentials: "same-origin",
    cache: "force-cache",
  });

  if (!respuesta.ok) {
    throw new Error(
      "No se pudo obtener el logo de DioxiLife."
    );
  }

  const imagen = await respuesta.blob();

  return await new Promise<string>((resolve, reject) => {
    const lector = new FileReader();

    lector.onload = () =>
      typeof lector.result === "string"
        ? resolve(lector.result)
        : reject(
            new Error("El logo no tiene formato válido.")
          );

    lector.onerror = () =>
      reject(new Error("No se pudo leer el logo."));

    lector.readAsDataURL(imagen);
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
        { jsPDF },
        { default: autoTable },
        logo,
      ] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
        cargarLogo(),
      ]);

      const doc = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      });

      const ahora = new Date();

      const datos = [...reporte.alimentos].sort(
        (a, b) => b.diferencia - a.diferencia
      );

      const destacados = datos.slice(0, 8);

      const logoInfo = doc.getImageProperties(logo);

      const proporcion =
        logoInfo.width / logoInfo.height;

      if (
        !Number.isFinite(proporcion) ||
        proporcion <= 0
      ) {
        throw new Error(
          "No se pudo establecer el tamaño del logo."
        );
      }

      function logoEn(
        x: number,
        y: number,
        maxAncho: number,
        maxAlto: number
      ) {
        const ancho = Math.min(
          maxAncho,
          maxAlto * proporcion
        );

        const alto = ancho / proporcion;

        doc.addImage(
          logo,
          "PNG",
          x + (maxAncho - ancho) / 2,
          y + (maxAlto - alto) / 2,
          ancho,
          alto
        );
      }

      function texto(
        contenido: string,
        x: number,
        y: number,
        tam: number,
        negrita = false,
        color: Color = C.tinta
      ) {
        doc.setFont(
          "helvetica",
          negrita ? "bold" : "normal"
        );

        doc.setFontSize(tam);
        doc.setTextColor(...color);

        doc.text(contenido, x, y);
      }

      function tarjeta(
        x: number,
        y: number,
        ancho: number,
        titulo: string,
        valor: string
      ) {
        doc.setFillColor(...C.palido);

        doc.roundedRect(
          x, y, ancho, 23, 2.5, 2.5, "F"
        );

        texto(
          titulo,
          x + 5,
          y + 7,
          7.5,
          false,
          C.gris
        );

        texto(
          valor,
          x + 5,
          y + 17.5,
          16,
          true
        );
      }

      function encabezadoPagina() {
        doc.setFillColor(...C.fucsia);
        doc.rect(0, 0, 210, 3.2, "F");

        logoEn(16, 8, 24, 19);

        texto(
          "DIOXILIFE BOLIVIA",
          46, 18, 10.2, true
        );

        texto(
          "Reporte de pruebas de alimentos",
          46, 25, 8, false, C.gris
        );

        doc.setDrawColor(223, 230, 236);
        doc.line(16, 32, 194, 32);
      }

      // PAGINA 1: INFORME EJECUTIVO

      doc.setFillColor(...C.palido);
      doc.rect(0, 0, 210, 61, "F");

      doc.setFillColor(...C.fucsia);
      doc.rect(0, 0, 210, 4, "F");

      logoEn(16, 12, 33, 33);

      texto(
        "DIOXILIFE BOLIVIA",
        57, 23, 15.5, true
      );

      texto(
        "INFORME DE RESPUESTA DE GLUCOSA",
        57, 33, 10.7, true, C.fucsia
      );

      texto(
        "Comparación descriptiva de pruebas de alimentos",
        57, 41, 9, false, C.gris
      );

      texto(
        `Emitido: ${fecha(ahora)}`,
        57, 49, 8, false, C.gris
      );

      // IDENTIFICACION DEL CLIENTE

      doc.setFillColor(...C.suave);

      doc.roundedRect(
        16, 69, 178, 33, 3, 3, "F"
      );

      texto(
        "CLIENTE",
        21, 77, 7.5, true, C.fucsia
      );

      const nombre = doc.splitTextToSize(
        reporte.cliente.nombre,
        165
      ) as string[];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(
        nombre.length > 2 ? 9 : 12
      );
      doc.setTextColor(...C.tinta);
      doc.text(nombre.slice(0, 2), 21, 85);

      // INDICADORES DEL REPORTE

      tarjeta(
        16, 108, 56,
        "REGISTROS REVISADOS",
        numero(reporte.registrosRevisados)
      );

      tarjeta(
        77, 108, 56,
        "PRUEBAS COMPLETAS",
        numero(reporte.pruebasCompletas)
      );

      tarjeta(
        138, 108, 56,
        "ALIMENTOS ANALIZADOS",
        numero(reporte.alimentos.length)
      );

      // GRAFICO DE PUNTOS CONECTADOS

      texto(
        "Glucosa antes y después de comer",
        16, 144, 12, true
      );

      texto(
        "Promedios por alimento (mg/dL)",
        16, 151, 8.5, false, C.gris
      );

      doc.setFillColor(...C.azul);
      doc.circle(121, 149, 1.5, "F");

      texto(
        "Antes",
        125, 150, 7.6, false, C.gris
      );

      doc.setFillColor(...C.fucsia);
      doc.circle(153, 149, 1.5, "F");

      texto(
        "Después",
        157, 150, 7.6, false, C.gris
      );

      if (destacados.length) {
        const mayor = Math.max(
          1,
          ...destacados.flatMap(a => [
            a.promedioAntes,
            a.promedioDespues,
          ])
        );

        const paso =
          mayor <= 100 ? 25 :
          mayor <= 250 ? 50 :
          mayor <= 500 ? 100 : 250;

        const techo = Math.max(
          paso,
          Math.ceil(mayor / paso) * paso
        );

        const xInicio = 79;
        const ancho = 80;

        // ESCALA Y EJES

        for (let i = 0; i <= 4; i++) {
          const x =
            xInicio + ancho * i / 4;

          doc.setDrawColor(227, 233, 239);
          doc.setLineWidth(0.3);
          doc.line(x, 163, x, 259);

          const etiqueta = numero(
            techo * i / 4
          );

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(...C.gris);

          doc.text(
            etiqueta,
            x, 160,
            { align: "center" }
          );
        }

        // PUNTOS ANTES Y DESPUES

        destacados.forEach((a, i) => {
          const y = 170 + i * 11.5;

          const aX =
            xInicio +
            ancho * a.promedioAntes / techo;

          const dX =
            xInicio +
            ancho * a.promedioDespues / techo;

          texto(
            corto(a.alimento, 23),
            17, y, 8, true
          );

          texto(
            `${a.pruebas} ${
              a.pruebas === 1
                ? "prueba"
                : "pruebas"
            }`,
            17, y + 4, 7, false, C.gris
          );

          doc.setDrawColor(168, 181, 194);
          doc.setLineWidth(0.9);

          doc.line(
            aX, y + 0.5,
            dX, y + 0.5
          );

          doc.setFillColor(...C.azul);
          doc.circle(aX, y + 0.5, 1.9, "F");

          doc.setFillColor(...C.fucsia);
          doc.circle(dX, y + 0.5, 1.9, "F");

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(...C.gris);

          doc.text(
            `${numero(a.promedioAntes)} / ${numero(a.promedioDespues)}`,
            193,
            y + 1.5,
            { align: "right" }
          );

          if (i < destacados.length - 1) {
            doc.setDrawColor(237, 241, 244);
            doc.line(16, y + 7, 194, y + 7);
          }
        });

      } else {
        texto(
          "Aún no existen pruebas completas para graficar.",
          16, 177, 9, false, C.gris
        );
      }

      texto(
        "Se representan hasta 8 alimentos; se analizan hasta 50 registros recientes.",
        16, 267, 7.5, false, C.gris
      );

      // PAGINA 2: GRAFICO DE VARIACIONES

      if (datos.length) {
        doc.addPage();

        texto(
          "Variación promedio por alimento",
          16, 44, 12, true
        );

        texto(
          "La línea central representa un cambio de cero mg/dL.",
          16, 51, 8, false, C.gris
        );

        const extremo = Math.max(
          1,
          ...destacados.map(
            a => Math.abs(a.diferencia)
          )
        );

        const escala =
          Math.ceil(extremo / 25) * 25;

        const centro = 121;
        const semiancho = 43;

        doc.setDrawColor(170, 180, 192);
        doc.setLineWidth(0.35);

        doc.line(
          centro, 63,
          centro, 163
        );

        texto(
          `-${numero(escala)}`,
          centro - semiancho - 7,
          61, 7, false, C.gris
        );

        texto(
          "0",
          centro - 1,
          61, 7, false, C.gris
        );

        texto(
          `+${numero(escala)}`,
          centro + semiancho - 8,
          61, 7, false, C.gris
        );

        destacados.forEach((a, i) => {
          const y = 70 + i * 11.6;

          texto(
            corto(a.alimento, 22),
            16, y + 1, 8
          );

          const longitud =
            a.diferencia === 0
              ? 0
              : Math.max(
                  0.8,
                  Math.abs(a.diferencia) /
                    escala * semiancho
                );

          if (longitud > 0) {
            doc.setFillColor(
              ...(
                a.diferencia >= 0
                  ? C.fucsia
                  : C.azul
              )
            );

            doc.roundedRect(
              a.diferencia >= 0
                ? centro
                : centro - longitud,
              y - 2,
              longitud,
              4.5,
              0.4,
              0.4,
              "F"
            );
          }

          texto(
            `${cambio(a.diferencia)} mg/dL`,
            173, y + 1, 8, true,
            a.diferencia >= 0
              ? C.fucsia
              : C.azul
          );
        });

        // TABLA DETALLADA

        texto(
          "Resumen completo por alimento",
          16, 179, 11.5, true
        );

        texto(
          "Promedios y diferencias en mg/dL; N = cantidad de pruebas completas.",
          16, 186, 7.5, false, C.gris
        );

        autoTable(doc, {
          startY: 192,

          margin: {
            left: 16,
            right: 16,
            top: 40,
            bottom: 27,
          },

          theme: "grid",

          head: [[
            "Alimento",
            "N",
            "Antes",
            "Después",
            "Diferencia",
          ]],

          body: datos.map(a => [
            a.alimento,
            `${a.pruebas}`,
            numero(a.promedioAntes),
            numero(a.promedioDespues),
            cambio(a.diferencia),
          ]),

          styles: {
            font: "helvetica",
            fontSize: 8.2,
            cellPadding: 3,
            textColor: C.tinta,
            overflow: "linebreak",
          },

          headStyles: {
            fillColor: C.tinta,
            textColor: C.blanco,
            fontStyle: "bold",
          },

          alternateRowStyles: {
            fillColor: C.palido,
          },

          columnStyles: {
            0: { cellWidth: 56 },
            1: {
              cellWidth: 16,
              halign: "center",
            },
            2: {
              cellWidth: 33,
              halign: "right",
            },
            3: {
              cellWidth: 36,
              halign: "right",
            },
            4: {
              cellWidth: 37,
              halign: "right",
            },
          },
        });
      }

      // MEDICIONES INDIVIDUALES

      if (reporte.mediciones?.length) {
        const anterior = (
          doc as typeof doc & {
            lastAutoTable?: {
              finalY: number;
            };
          }
        ).lastAutoTable;

        let inicio = datos.length
          ? (anterior?.finalY ?? 252) + 16
          : 42;

        if (inicio > 225) {
          doc.addPage();
          inicio = 43;
        } else if (!datos.length) {
          doc.addPage();
        }

        texto(
          "Mediciones individuales disponibles",
          16, inicio, 11.5, true
        );

        texto(
          "La API entrega un máximo de 8 mediciones individuales.",
          16, inicio + 7, 8, false, C.gris
        );

        autoTable(doc, {
          startY: inicio + 13,

          margin: {
            left: 16,
            right: 16,
            top: 40,
            bottom: 27,
          },

          theme: "striped",

          head: [[
            "Fecha y hora",
            "Alimento",
            "Antes",
            "Después",
            "Diferencia",
          ]],

          body: reporte.mediciones.map(m => [
            fecha(new Date(m.fecha)),
            m.alimento,
            numero(m.glucosaAntes),
            numero(m.glucosaDespues),
            cambio(m.diferencia),
          ]),

          styles: {
            font: "helvetica",
            fontSize: 7.7,
            cellPadding: 3,
            overflow: "linebreak",
          },

          headStyles: {
            fillColor: C.azul,
            textColor: C.blanco,
            fontStyle: "bold",
          },

          alternateRowStyles: {
            fillColor: C.palido,
          },

          columnStyles: {
            0: { cellWidth: 39 },
            1: { cellWidth: 53 },
            2: {
              cellWidth: 28,
              halign: "right",
            },
            3: {
              cellWidth: 29,
              halign: "right",
            },
            4: {
              cellWidth: 29,
              halign: "right",
            },
          },
        });
      }

      // ENCABEZADOS Y PIES DE PAGINA

      const paginas = doc.getNumberOfPages();

      for (
        let pagina = 1;
        pagina <= paginas;
        pagina++
      ) {
        doc.setPage(pagina);

        if (pagina > 1) {
          encabezadoPagina();
        }

        doc.setDrawColor(224, 231, 237);
        doc.line(16, 276, 194, 276);

        texto(
          "Informe descriptivo, no equivale a diagnóstico ni indicación médica.",
          16, 283, 7.2, false, C.gris
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.2);
        doc.setTextColor(...C.gris);

        doc.text(
          `Página ${pagina} de ${paginas}`,
          194, 288,
          { align: "right" }
        );
      }

      // DESCARGA DEL ARCHIVO

      const nombreArchivo = reporte.cliente.nombre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .slice(0, 42) || "Cliente";

      const dia = new Intl.DateTimeFormat(
        "sv-SE",
        {
          timeZone: "America/La_Paz",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }
      ).format(ahora);

      doc.save(
        `DioxiLife_Informe_${nombreArchivo}_${dia}.pdf`
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
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => void descargar()}
        disabled={generando}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-fuchsia-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-fuchsia-800 disabled:cursor-wait disabled:opacity-60"
      >
        {generando
          ? "Preparando informe PDF..."
          : "Descargar reporte PDF"}
      </button>

      {error && (
        <p
          role="alert"
          className="max-w-sm text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
