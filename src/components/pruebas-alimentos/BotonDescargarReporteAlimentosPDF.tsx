"use client";

import { useState } from "react";
import type { ReporteIndividualCliente } from "./contrato-reporte-individual-admin";

type Color = [number, number, number];

const colores = {
  texto: [37, 49, 66] as Color,
  gris: [101, 113, 129] as Color,
  azul: [8, 143, 199] as Color,
  fucsia: [188, 30, 193] as Color,
  blanco: [255, 255, 255] as Color,
  fondo: [247, 249, 252] as Color,
  borde: [226, 231, 237] as Color,
};

function numero(valor: number): string {
  return valor.toLocaleString("es-BO", {
    maximumFractionDigits: 2,
  });
}

function cambio(valor: number): string {
  return `${valor > 0 ? "+" : ""}${numero(valor)}`;
}

function fechaHora(valor: Date): string {
  return new Intl.DateTimeFormat("es-BO", {
    timeZone: "America/La_Paz",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(valor);
}

function nombreCorto(
  nombre: string,
  largo = 21
): string {
  return nombre.length <= largo
    ? nombre
    : `${nombre.slice(0, largo - 3)}...`;
}

async function cargarLogo(): Promise<string> {
  const respuesta = await fetch("/logo.png", {
    credentials: "same-origin",
    cache: "force-cache",
  });

  if (!respuesta.ok) {
    throw new Error(
      "No se pudo cargar el logo de DioxiLife."
    );
  }

  const archivo = await respuesta.blob();

  return new Promise<string>((resolver, rechazar) => {
    const lector = new FileReader();

    lector.onload = () => {
      if (typeof lector.result === "string") {
        resolver(lector.result);
      } else {
        rechazar(new Error("Logo no válido."));
      }
    };

    lector.onerror = () =>
      rechazar(new Error("Error al leer el logo."));

    lector.readAsDataURL(archivo);
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
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const ahora = new Date();

      const alimentos = [...reporte.alimentos]
        .sort(
          (a, b) =>
            b.diferencia - a.diferencia ||
            b.pruebas - a.pruebas
        );

      const destacados = alimentos.slice(0, 8);

      const mediciones = [...(reporte.mediciones ?? [])]
        .sort((a, b) =>
          b.fecha.localeCompare(a.fecha)
        );

      const imagen = doc.getImageProperties(logo);

      const proporcion =
        imagen.width / imagen.height;

      if (
        !Number.isFinite(proporcion) ||
        proporcion <= 0
      ) {
        throw new Error(
          "Las dimensiones del logo no son válidas."
        );
      }

      function colocarLogo(
        x: number,
        y: number,
        anchoMaximo: number,
        altoMaximo: number
      ) {
        const ancho = Math.min(
          anchoMaximo,
          altoMaximo * proporcion
        );

        const alto = ancho / proporcion;

        doc.addImage(
          logo,
          "PNG",
          x + (anchoMaximo - ancho) / 2,
          y + (altoMaximo - alto) / 2,
          ancho,
          alto
        );
      }

      function escribir(
        contenido: string,
        x: number,
        y: number,
        tamano = 9,
        negrita = false,
        color: Color = colores.texto
      ) {
        doc.setFont(
          "helvetica",
          negrita ? "bold" : "normal"
        );

        doc.setFontSize(tamano);
        doc.setTextColor(...color);
        doc.text(contenido, x, y);
      }

      function encabezado() {
        doc.setFillColor(...colores.fucsia);
        doc.rect(0, 0, 210, 3, "F");

        colocarLogo(16, 7, 26, 20);

        escribir(
          "DIOXILIFE BOLIVIA",
          48, 17, 11, true
        );

        escribir(
          "Reporte de pruebas de alimentos",
          48, 24, 8, false, colores.gris
        );

        doc.setDrawColor(...colores.borde);
        doc.line(16, 33, 194, 33);
      }

      // PAGINA 1: RESUMEN Y GRAFICA

      doc.setFillColor(...colores.fondo);
      doc.rect(0, 0, 210, 55, "F");

      doc.setFillColor(...colores.fucsia);
      doc.rect(0, 0, 210, 4, "F");

      colocarLogo(16, 10, 32, 31);

      escribir(
        "DIOXILIFE BOLIVIA",
        56, 21, 15, true
      );

      escribir(
        "REPORTE DE PRUEBAS DE ALIMENTOS",
        56, 32, 10, true, colores.fucsia
      );

      escribir(
        `Emisión: ${fechaHora(ahora)}`,
        56, 41, 8, false, colores.gris
      );

      // DATOS DEL CLIENTE

      doc.setFillColor(...colores.fondo);
      doc.roundedRect(
        16, 61, 178, 27, 2.5, 2.5, "F"
      );

      escribir(
        "CLIENTE",
        21, 69, 7.5, true, colores.gris
      );

      const nombre = doc.splitTextToSize(
        reporte.cliente.nombre,
        160
      ) as string[];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...colores.texto);
      doc.text(nombre.slice(0, 2), 21, 77);

      // GRAFICO HORIZONTAL

      escribir(
        "Comparación por alimento",
        16, 101, 13, true
      );

      escribir(
        "Glucosa antes y después de comer (mg/dL)",
        16, 109, 8, false, colores.gris
      );

      doc.setFillColor(...colores.azul);
      doc.roundedRect(
        16, 114, 4, 3, 0.5, 0.5, "F"
      );

      escribir(
        "Antes de comer",
        23, 117, 7.5
      );

      doc.setFillColor(...colores.fucsia);
      doc.roundedRect(
        78, 114, 4, 3, 0.5, 0.5, "F"
      );

      escribir(
        "Después de comer",
        85, 117, 7.5
      );

      if (destacados.length > 0) {
        const maximo = Math.max(
          1,
          ...destacados.flatMap(item => [
            item.promedioAntes,
            item.promedioDespues,
          ])
        );

        const paso =
          maximo <= 150 ? 50 :
          maximo <= 350 ? 100 :
          maximo <= 600 ? 200 : 250;

        const escala = Math.max(
          paso,
          Math.ceil(maximo / paso) * paso
        );

        const inicioX = 77;
        const anchoGrafico = 90;

        // EJES VERTICALES

        for (let i = 0; i <= 4; i++) {
          const x =
            inicioX + anchoGrafico * i / 4;

          doc.setDrawColor(...colores.borde);
          doc.setLineWidth(0.25);
          doc.line(x, 127, x, 261);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(...colores.gris);

          doc.text(
            numero(escala * i / 4),
            x,
            124,
            { align: "center" }
          );
        }

        destacados.forEach((item, indice) => {
          const y = 131 + indice * 16.5;

          escribir(
            nombreCorto(item.alimento),
            17, y + 4, 8, true
          );

          escribir(
            `${item.pruebas} ${
              item.pruebas === 1
                ? "prueba"
                : "pruebas"
            }`,
            17, y + 8.5, 7, false, colores.gris
          );

          const antes =
            anchoGrafico *
            item.promedioAntes / escala;

          const despues =
            anchoGrafico *
            item.promedioDespues / escala;

          if (antes > 0) {
            doc.setFillColor(...colores.azul);
            doc.roundedRect(
              inicioX,
              y,
              Math.max(1.4, antes),
              4,
              0.6,
              0.6,
              "F"
            );
          }

          if (despues > 0) {
            doc.setFillColor(...colores.fucsia);
            doc.roundedRect(
              inicioX,
              y + 6,
              Math.max(1.4, despues),
              4,
              0.6,
              0.6,
              "F"
            );
          }

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(...colores.texto);

          doc.text(
            numero(item.promedioAntes),
            192,
            y + 3.5,
            { align: "right" }
          );

          doc.text(
            numero(item.promedioDespues),
            192,
            y + 9.5,
            { align: "right" }
          );

          escribir(
            `Diferencia: ${cambio(item.diferencia)} mg/dL`,
            17,
            y + 14,
            7,
            false,
            colores.gris
          );
        });

      } else {
        escribir(
          "No existen pruebas completas para graficar.",
          17, 148, 9, false, colores.gris
        );
      }

      escribir(
        "Gráfico de hasta 8 alimentos; promedios de hasta 50 registros recientes.",
        16, 269, 7.2, false, colores.gris
      );

      // PAGINA 2: DETALLE Y FECHAS

      if (
        alimentos.length > 0 ||
        mediciones.length > 0
      ) {
        doc.addPage();

        let siguienteY = 43;

        if (alimentos.length > 0) {
          escribir(
            "Detalle de las mediciones por alimento",
            16, siguienteY, 12, true
          );

          escribir(
            "Promedios de glucosa y diferencia en mg/dL.",
            16, siguienteY + 7,
            8, false, colores.gris
          );

          autoTable(doc, {
            startY: siguienteY + 12,

            margin: {
              left: 16,
              right: 16,
              top: 40,
              bottom: 24,
            },

            theme: "grid",

            head: [[
              "Alimento",
              "Pruebas",
              "Antes",
              "Después",
              "Diferencia",
            ]],

            body: alimentos.map(item => [
              item.alimento,
              String(item.pruebas),
              numero(item.promedioAntes),
              numero(item.promedioDespues),
              cambio(item.diferencia),
            ]),

            styles: {
              font: "helvetica",
              fontSize: 8,
              cellPadding: 3,
              textColor: colores.texto,
              overflow: "linebreak",
            },

            headStyles: {
              fillColor: colores.fucsia,
              textColor: colores.blanco,
              fontStyle: "bold",
            },

            alternateRowStyles: {
              fillColor: colores.fondo,
            },

            columnStyles: {
              0: { cellWidth: 55 },
              1: {
                cellWidth: 18,
                halign: "center",
              },
              2: {
                cellWidth: 33,
                halign: "right",
              },
              3: {
                cellWidth: 35,
                halign: "right",
              },
              4: {
                cellWidth: 37,
                halign: "right",
              },
            },
          });

          const ultimaTabla = (
            doc as typeof doc & {
              lastAutoTable?: {
                finalY: number;
              };
            }
          ).lastAutoTable;

          siguienteY =
            (ultimaTabla?.finalY ?? 55) + 17;
        }

        // FECHA Y HORA DE LA SEGUNDA MEDICION

        if (mediciones.length > 0) {
          if (siguienteY > 232) {
            doc.addPage();
            siguienteY = 44;
          }

          escribir(
            "Reporte por fecha y hora",
            16, siguienteY, 12, true
          );

          escribir(
            "Fecha y hora de la medición después de comer.",
            16,
            siguienteY + 7,
            8,
            false,
            colores.gris
          );

          autoTable(doc, {
            startY: siguienteY + 13,

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

            body: mediciones.map(item => [
              fechaHora(new Date(item.fecha)),
              item.alimento,
              numero(item.glucosaAntes),
              numero(item.glucosaDespues),
              cambio(item.diferencia),
            ]),

            styles: {
              font: "helvetica",
              fontSize: 7.7,
              cellPadding: 3,
              textColor: colores.texto,
              overflow: "linebreak",
            },

            headStyles: {
              fillColor: colores.azul,
              textColor: colores.blanco,
              fontStyle: "bold",
            },

            alternateRowStyles: {
              fillColor: colores.fondo,
            },

            columnStyles: {
              0: { cellWidth: 42 },
              1: { cellWidth: 50 },
              2: {
                cellWidth: 27,
                halign: "right",
              },
              3: {
                cellWidth: 29,
                halign: "right",
              },
              4: {
                cellWidth: 30,
                halign: "right",
              },
            },
          });

          const ultimaTabla = (
            doc as typeof doc & {
              lastAutoTable?: {
                finalY: number;
              };
            }
          ).lastAutoTable;

          const notaY =
            (ultimaTabla?.finalY ?? 250) + 8;

          if (notaY < 269) {
            escribir(
              "Se muestran hasta 8 mediciones disponibles, seleccionadas por mayor diferencia.",
              16, notaY, 7, false, colores.gris
            );
          }
        }
      }

      // ENCABEZADOS Y PIES

      const paginas = doc.getNumberOfPages();

      for (
        let pagina = 1;
        pagina <= paginas;
        pagina++
      ) {
        doc.setPage(pagina);

        if (pagina > 1) {
          encabezado();
        }

        doc.setDrawColor(...colores.borde);
        doc.line(16, 278, 194, 278);

        escribir(
          "Informe descriptivo. No constituye un diagnóstico médico.",
          16, 284, 7.2, false, colores.gris
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.2);
        doc.setTextColor(...colores.gris);

        doc.text(
          `Página ${pagina} de ${paginas}`,
          194, 289,
          { align: "right" }
        );
      }

      const archivo = reporte.cliente.nombre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Za-z0-9_-]+/g, "_")
        .slice(0, 40) || "Cliente";

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
        `DioxiLife_Reporte_${archivo}_${dia}.pdf`
      );

    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo generar el reporte PDF."
      );
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={generando}
        onClick={() => void descargar()}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-fuchsia-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-fuchsia-800 disabled:opacity-60"
      >
        {generando
          ? "Preparando PDF..."
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
