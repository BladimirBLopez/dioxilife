"use client";

import {
  useState,
} from "react";

import {
  toast,
} from "sonner";

type DiaInforme = {
  diaPlan: number;
  total: number;
  completadas: number;
  pendientes: number;
  porcentaje:
    | number
    | null;
  peso:
    | number
    | null;
  observacion:
    | string
    | null;
};

type DatosInforme = {
  generadoAt: string;

  seguimiento: {
    id: string;
    nombreCliente:
      | string
      | null;
    nombrePlan: string;
    estado: string;
    duracionDias: number;
    diaActual: number;
    fechaInicio:
      | string
      | null;
    fechaFinalizado:
      | string
      | null;
  };

  resumen: {
    total: number;
    completadas: number;
    pendientes: number;
    porcentaje:
      | number
      | null;

    cantidadPesajes: number;

    pesoInicial: {
      diaPlan: number;
      peso: number;
    } | null;

    ultimoPeso: {
      diaPlan: number;
      peso: number;
    } | null;

    pesoPromedio:
      | number
      | null;

    cambioPeso:
      | number
      | null;
  };

  dias:
    DiaInforme[];
};

function fechaVisible(
  valor:
    | string
    | null
) {
  if (!valor) {
    return "No registrado";
  }

  return new Date(
    valor
  ).toLocaleDateString(
    "es-BO",
    {
      timeZone:
        "America/La_Paz",
      day:
        "2-digit",
      month:
        "2-digit",
      year:
        "numeric",
    }
  );
}

function nombreArchivo(
  nombre:
    | string
    | null
) {
  return (
    nombre ||
    "Cliente"
  )
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-zA-Z0-9_-]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    ) ||
    "Cliente";
}

async function cargarLogo() {
  try {
    const res =
      await fetch(
        "/logo.png"
      );

    if (!res.ok) {
      return null;
    }

    const blob =
      await res.blob();

    return await new Promise<
      string
    >(
      (
        resolve,
        reject
      ) => {
        const reader =
          new FileReader();

        reader.onload =
          () =>
            resolve(
              String(
                reader.result
              )
            );

        reader.onerror =
          reject;

        reader.readAsDataURL(
          blob
        );
      }
    );
  } catch {
    return null;
  }
}

function observacionCorta(
  texto:
    | string
    | null
) {
  if (!texto) {
    return "-";
  }

  const limpio =
    texto
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  return limpio.length >
    280
    ? `${limpio.slice(
        0,
        277
      )}...`
    : limpio;
}

export default function BotonInformeSeguimiento({
  seguimientoId,
}: {
  seguimientoId: string;
}) {
  const [
    generando,
    setGenerando,
  ] =
    useState(false);

  async function descargar() {
    if (generando) {
      return;
    }

    setGenerando(
      true
    );

    const toastId =
      toast.loading(
        "Generando informe PDF..."
      );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/clientes/${seguimientoId}/informe`,
          {
            method:
              "GET",
            cache:
              "no-store",
          }
        );

      const data =
        await res
          .json()
          .catch(
            () =>
              null
          );

      if (!res.ok) {
        throw new Error(
          data?.error ||
            "No se pudo generar el informe."
        );
      }

      const informe =
        data as DatosInforme;

      const [
        modulo,
        logo,
      ] =
        await Promise.all([
          import(
            "jspdf"
          ),
          cargarLogo(),
        ]);

      const {
        jsPDF,
      } =
        modulo;

      const doc =
        new jsPDF({
          orientation:
            "portrait",
          unit:
            "mm",
          format:
            "a4",
        });

      const ancho =
        210;

      const alto =
        297;

      const margen =
        14;

      const anchoUtil =
        ancho -
        margen * 2;

      let y =
        14;

      function nuevaPagina() {
        doc.addPage();
        y = 16;
      }

      function asegurar(
        espacio: number
      ) {
        if (
          y + espacio >
          280
        ) {
          nuevaPagina();
        }
      }

      function tituloSeccion(
        titulo: string
      ) {
        asegurar(
          16
        );

        y += 4;

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(
          11
        );

        doc.setTextColor(
          79,
          46,
          145
        );

        doc.text(
          titulo,
          margen,
          y
        );

        y += 3;

        doc.setDrawColor(
          225,
          218,
          240
        );

        doc.line(
          margen,
          y,
          ancho -
            margen,
          y
        );

        y += 6;
      }

      function texto(
        valor: string,
        opciones?: {
          negrita?:
            boolean;
          tamano?:
            number;
          color?: [
            number,
            number,
            number
          ];
          ancho?: number;
        }
      ) {
        const tamano =
          opciones
            ?.tamano ??
          9;

        const color =
          opciones
            ?.color ??
          [
            55,
            55,
            60,
          ];

        const lineas =
          doc.splitTextToSize(
            valor,
            opciones
              ?.ancho ??
              anchoUtil
          );

        asegurar(
          Math.max(
            5,
            lineas.length *
              4.4
          )
        );

        doc.setFont(
          "helvetica",
          opciones
            ?.negrita
            ? "bold"
            : "normal"
        );

        doc.setFontSize(
          tamano
        );

        doc.setTextColor(
          ...color
        );

        doc.text(
          lineas,
          margen,
          y
        );

        y +=
          lineas.length *
            4.4 +
          1;
      }


      type PuntoGrafico = {
        dia: number;
        valor: number;
      };

      function dibujarGraficoLinea({
        puntos,
        minimoY,
        maximoY,
        sufijo,
        maximoDia,
        conectarSaltos,
      }: {
        puntos: PuntoGrafico[];
        minimoY: number;
        maximoY: number;
        sufijo: string;
        maximoDia: number;
        conectarSaltos: boolean;
      }) {
        if (
          puntos.length === 0
        ) {
          return;
        }

        asegurar(
          72
        );

        const graficoX =
          margen + 14;

        const graficoY =
          y + 4;

        const graficoW =
          anchoUtil - 20;

        const graficoH =
          48;

        const rangoY =
          Math.max(
            maximoY -
              minimoY,
            1
          );

        const ultimoDiaEje =
          Math.max(
            maximoDia,
            1
          );

        function posicionX(
          dia: number
        ) {
          if (
            ultimoDiaEje <= 1
          ) {
            return (
              graficoX +
              graficoW / 2
            );
          }

          return (
            graficoX +
            (
              (dia - 1) /
              (ultimoDiaEje - 1)
            ) *
              graficoW
          );
        }

        function posicionY(
          valor: number
        ) {
          return (
            graficoY +
            graficoH -
            (
              (valor -
                minimoY) /
              rangoY
            ) *
              graficoH
          );
        }


        /*
         * Fondo
         */
        doc.setFillColor(
          252,
          251,
          254
        );

        doc.roundedRect(
          margen,
          y,
          anchoUtil,
          62,
          3,
          3,
          "F"
        );


        /*
         * Lineas horizontales y
         * etiquetas del eje Y
         */
        for (
          let i = 0;
          i <= 4;
          i++
        ) {
          const valor =
            minimoY +
            (
              rangoY *
              i
            ) /
              4;

          const posY =
            posicionY(
              valor
            );

          doc.setDrawColor(
            231,
            227,
            238
          );

          doc.setLineWidth(
            0.25
          );

          doc.line(
            graficoX,
            posY,
            graficoX +
              graficoW,
            posY
          );

          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setFontSize(
            7
          );

          doc.setTextColor(
            130,
            125,
            140
          );

          const etiquetaY =
            sufijo === "%"
              ? `${Math.round(
                  valor
                )}%`
              : valor
                  .toFixed(
                    rangoY < 10
                      ? 1
                      : 0
                  )
                  .replace(
                    ".0",
                    ""
                  );

          doc.text(
            etiquetaY,
            graficoX - 2,
            posY + 1.8,
            {
              align:
                "right",
            }
          );
        }


        /*
         * Etiquetas del eje X
         */
        const cantidadIntervalos =
          Math.min(
            5,
            Math.max(
              1,
              ultimoDiaEje - 1
            )
          );

        const diasEtiqueta =
          new Set<number>();

        diasEtiqueta.add(
          1
        );

        diasEtiqueta.add(
          ultimoDiaEje
        );

        for (
          let i = 1;
          i <
          cantidadIntervalos;
          i++
        ) {
          diasEtiqueta.add(
            Math.round(
              1 +
                (
                  (ultimoDiaEje -
                    1) *
                  i
                ) /
                  cantidadIntervalos
            )
          );
        }

        const diasOrdenados =
          Array.from(
            diasEtiqueta
          ).sort(
            (
              a,
              b
            ) =>
              a - b
          );

        for (
          const dia of
          diasOrdenados
        ) {
          const posX =
            posicionX(
              dia
            );

          doc.setDrawColor(
            225,
            221,
            233
          );

          doc.line(
            posX,
            graficoY +
              graficoH,
            posX,
            graficoY +
              graficoH +
              1.5
          );

          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setFontSize(
            6.8
          );

          doc.setTextColor(
            125,
            120,
            135
          );

          doc.text(
            `D${dia}`,
            posX,
            graficoY +
              graficoH +
              5,
            {
              align:
                "center",
            }
          );
        }


        /*
         * Linea del grafico
         */
        const puntosOrdenados =
          [...puntos].sort(
            (
              a,
              b
            ) =>
              a.dia -
              b.dia
          );

        doc.setDrawColor(
          111,
          74,
          191
        );

        doc.setLineWidth(
          0.8
        );

        for (
          let i = 1;
          i <
          puntosOrdenados.length;
          i++
        ) {
          const anterior =
            puntosOrdenados[
              i - 1
            ];

          const actual =
            puntosOrdenados[
              i
            ];

          if (
            !conectarSaltos &&
            actual.dia -
              anterior.dia >
              1
          ) {
            continue;
          }

          doc.line(
            posicionX(
              anterior.dia
            ),
            posicionY(
              anterior.valor
            ),
            posicionX(
              actual.dia
            ),
            posicionY(
              actual.valor
            )
          );
        }


        /*
         * Puntos y valores
         */
        puntosOrdenados.forEach(
          (
            punto,
            indice
          ) => {
            const posX =
              posicionX(
                punto.dia
              );

            const posY =
              posicionY(
                punto.valor
              );

            doc.setFillColor(
              218,
              55,
              126
            );

            doc.circle(
              posX,
              posY,
              1.5,
              "F"
            );

            const mostrarValor =
              puntosOrdenados.length <=
                10 ||
              indice === 0 ||
              indice ===
                puntosOrdenados.length -
                  1;

            if (
              mostrarValor
            ) {
              doc.setFont(
                "helvetica",
                "bold"
              );

              doc.setFontSize(
                6.8
              );

              doc.setTextColor(
                80,
                70,
                95
              );

              const etiqueta =
                sufijo === "%"
                  ? `${Math.round(
                      punto.valor
                    )}%`
                  : `${punto.valor} kg`;

              doc.text(
                etiqueta,
                posX,
                Math.max(
                  graficoY + 3,
                  posY - 3
                ),
                {
                  align:
                    "center",
                }
              );
            }
          }
        );

        y += 67;
      }


      /*
       * CABECERA
       */
      if (logo) {
        try {
          doc.addImage(
            logo,
            "PNG",
            margen,
            10,
            24,
            20
          );
        } catch {
          // El informe continúa
          // aunque el logo no pueda cargarse.
        }
      }

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(
        15
      );

      doc.setTextColor(
        79,
        46,
        145
      );

      doc.text(
        "DIOXILIFE BOLIVIA",
        logo
          ? 42
          : margen,
        17
      );

      doc.setFontSize(
        11
      );

      doc.setTextColor(
        218,
        55,
        126
      );

      doc.text(
        "INFORME DE AVANCE DEL SEGUIMIENTO",
        logo
          ? 42
          : margen,
        23
      );

      doc.setDrawColor(
        218,
        55,
        126
      );

      doc.setLineWidth(
        0.7
      );

      doc.line(
        margen,
        33,
        ancho -
          margen,
        33
      );

      y =
        42;


      /*
       * DATOS GENERALES
       */
      texto(
        `Cliente: ${
          informe
            .seguimiento
            .nombreCliente ||
          "Sin nombre"
        }`,
        {
          negrita:
            true,
          tamano:
            11,
        }
      );

      texto(
        `Protocolo: ${informe.seguimiento.nombrePlan}`
      );

      texto(
        `Estado: ${informe.seguimiento.estado}`
      );

      texto(
        `Avance temporal: Dia ${informe.seguimiento.diaActual} de ${informe.seguimiento.duracionDias}`
      );

      texto(
        `Inicio: ${fechaVisible(
          informe.seguimiento
            .fechaInicio
        )}`
      );

      texto(
        `Informe generado: ${fechaVisible(
          informe.generadoAt
        )}`
      );


      /*
       * CUMPLIMIENTO
       */
      tituloSeccion(
        "RESUMEN GENERAL"
      );

      const porcentaje =
        informe.resumen
          .porcentaje;

      texto(
        porcentaje ===
        null
          ? "Cumplimiento acumulado: Sin datos"
          : `Cumplimiento acumulado: ${porcentaje}%`,
        {
          negrita:
            true,
          tamano:
            12,
        }
      );

      if (
        porcentaje !==
        null
      ) {
        const barraX =
          margen;

        const barraY =
          y + 1;

        const barraW =
          anchoUtil;

        doc.setFillColor(
          237,
          233,
          244
        );

        doc.roundedRect(
          barraX,
          barraY,
          barraW,
          5,
          2,
          2,
          "F"
        );

        doc.setFillColor(
          111,
          74,
          191
        );

        doc.roundedRect(
          barraX,
          barraY,
          barraW *
            (
              porcentaje /
              100
            ),
          5,
          2,
          2,
          "F"
        );

        y += 10;
      }

      texto(
        `${informe.resumen.completadas} checks completados · ${informe.resumen.pendientes} pendientes · ${informe.resumen.total} totales`
      );


      /*
       * GRAFICO DE CUMPLIMIENTO
       */
      tituloSeccion(
        "CUMPLIMIENTO DIARIO"
      );

      const puntosCumplimiento =
        informe.dias
          .filter(
            (
              dia
            ) =>
              dia.porcentaje !==
              null
          )
          .map(
            (
              dia
            ) => ({
              dia:
                dia.diaPlan,

              valor:
                dia.porcentaje as number,
            })
          );

      if (
        puntosCumplimiento.length >
        0
      ) {
        dibujarGraficoLinea({
          puntos:
            puntosCumplimiento,

          minimoY:
            0,

          maximoY:
            100,

          sufijo:
            "%",

          maximoDia:
            Math.max(
              informe
                .seguimiento
                .diaActual,
              1
            ),

          conectarSaltos:
            false,
        });
      } else {
        texto(
          "Aun no hay datos de cumplimiento para graficar.",
          {
            color: [
              120,
              115,
              130,
            ],
          }
        );
      }


      /*
       * PESO
       */
      tituloSeccion(
        "EVOLUCION DE PESO"
      );

      texto(
        `Peso inicial: ${
          informe.resumen
            .pesoInicial
            ? `${informe.resumen.pesoInicial.peso} kg (Dia ${informe.resumen.pesoInicial.diaPlan})`
            : "Sin registro"
        }`
      );

      texto(
        `Ultimo peso: ${
          informe.resumen
            .ultimoPeso
            ? `${informe.resumen.ultimoPeso.peso} kg (Dia ${informe.resumen.ultimoPeso.diaPlan})`
            : "Sin registro"
        }`
      );

      texto(
        `Peso promedio: ${
          informe.resumen
            .pesoPromedio !==
          null
            ? `${informe.resumen.pesoPromedio} kg`
            : "Sin registro"
        }`
      );

      texto(
        `Variacion: ${
          informe.resumen
            .cambioPeso !==
          null
            ? `${
                informe.resumen
                  .cambioPeso >
                0
                  ? "+"
                  : ""
              }${informe.resumen.cambioPeso} kg`
            : "-"
        }`
      );


      const puntosPeso =
        informe.dias
          .filter(
            (
              dia
            ) =>
              dia.peso !==
              null
          )
          .map(
            (
              dia
            ) => ({
              dia:
                dia.diaPlan,

              valor:
                dia.peso as number,
            })
          );

      if (
        puntosPeso.length >
        0
      ) {
        const valoresPeso =
          puntosPeso.map(
            (
              punto
            ) =>
              punto.valor
          );

        const pesoMinimoDato =
          Math.min(
            ...valoresPeso
          );

        const pesoMaximoDato =
          Math.max(
            ...valoresPeso
          );

        const diferenciaPeso =
          pesoMaximoDato -
          pesoMinimoDato;

        const margenPeso =
          diferenciaPeso ===
          0
            ? 1
            : Math.max(
                0.5,
                diferenciaPeso *
                  0.2
              );

        let minimoPeso =
          Math.floor(
            (
              pesoMinimoDato -
              margenPeso
            ) *
              2
          ) / 2;

        let maximoPeso =
          Math.ceil(
            (
              pesoMaximoDato +
              margenPeso
            ) *
              2
          ) / 2;

        if (
          maximoPeso <=
          minimoPeso
        ) {
          minimoPeso -=
            1;

          maximoPeso +=
            1;
        }

        dibujarGraficoLinea({
          puntos:
            puntosPeso,

          minimoY:
            minimoPeso,

          maximoY:
            maximoPeso,

          sufijo:
            "kg",

          maximoDia:
            Math.max(
              informe
                .seguimiento
                .diaActual,
              1
            ),

          conectarSaltos:
            true,
        });
      } else {
        texto(
          "Sin registros de peso para graficar.",
          {
            color: [
              120,
              115,
              130,
            ],
          }
        );
      }


      /*
       * AVANCE POR DIA
       */
      tituloSeccion(
        "AVANCE POR DIA"
      );

      const colDia =
        margen;

      const colCumplimiento =
        margen + 18;

      const colPeso =
        margen + 62;

      const colObservacion =
        margen + 92;

      function cabeceraTabla() {
        asegurar(
          10
        );

        doc.setFillColor(
          247,
          245,
          251
        );

        doc.rect(
          margen,
          y - 4,
          anchoUtil,
          8,
          "F"
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(
          8
        );

        doc.setTextColor(
          80,
          75,
          90
        );

        doc.text(
          "DIA",
          colDia,
          y
        );

        doc.text(
          "CUMPLIMIENTO",
          colCumplimiento,
          y
        );

        doc.text(
          "PESO",
          colPeso,
          y
        );

        doc.text(
          "OBSERVACION",
          colObservacion,
          y
        );

        y += 7;
      }

      cabeceraTabla();

      for (
        const dia of
        informe.dias
      ) {
        const observacion =
          observacionCorta(
            dia.observacion
          );

        const lineasObservacion =
          doc.splitTextToSize(
            observacion,
            100
          );

        const altoFila =
          Math.max(
            8,
            lineasObservacion
              .length *
              4 +
              3
          );

        if (
          y +
            altoFila >
          278
        ) {
          nuevaPagina();
          cabeceraTabla();
        }

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(
          8.5
        );

        doc.setTextColor(
          55,
          55,
          60
        );

        doc.text(
          String(
            dia.diaPlan
          ),
          colDia,
          y
        );

        doc.text(
          dia.porcentaje ===
          null
            ? "Sin tareas"
            : `${dia.completadas}/${dia.total} (${dia.porcentaje}%)`,
          colCumplimiento,
          y
        );

        doc.text(
          dia.peso !==
          null
            ? `${dia.peso} kg`
            : "-",
          colPeso,
          y
        );

        doc.text(
          lineasObservacion,
          colObservacion,
          y
        );

        y +=
          altoFila;

        doc.setDrawColor(
          238,
          235,
          242
        );

        doc.line(
          margen,
          y - 2,
          ancho -
            margen,
          y - 2
        );
      }


      /*
       * PIE DE PAGINA
       */
      const paginas =
        doc.getNumberOfPages();

      for (
        let pagina = 1;
        pagina <= paginas;
        pagina++
      ) {
        doc.setPage(
          pagina
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(
          7.5
        );

        doc.setTextColor(
          130,
          125,
          140
        );

        doc.text(
          "DioxiLife Bolivia - Informe de avance",
          margen,
          alto - 7
        );

        doc.text(
          `Pagina ${pagina} de ${paginas}`,
          ancho -
            margen,
          alto - 7,
          {
            align:
              "right",
          }
        );
      }


      const fechaArchivo =
        new Date()
          .toISOString()
          .slice(
            0,
            10
          );

      doc.save(
        `DioxiLife_Avance_${nombreArchivo(
          informe
            .seguimiento
            .nombreCliente
        )}_${fechaArchivo}.pdf`
      );

      toast.success(
        "Informe PDF generado",
        {
          id:
            toastId,
        }
      );

    } catch (
      error
    ) {
      toast.error(
        "No se pudo generar el informe",
        {
          id:
            toastId,

          description:
            error instanceof
            Error
              ? error.message
              : "Inténtalo nuevamente.",
        }
      );

    } finally {
      setGenerando(
        false
      );
    }
  }

  return (
    <button
      type="button"
      disabled={
        generando
      }
      onClick={() =>
        void descargar()
      }
      className="inline-flex flex-1 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50 sm:flex-none"
    >
      {generando
        ? "Generando PDF..."
        : "📄 Descargar informe PDF"}
    </button>
  );
}
