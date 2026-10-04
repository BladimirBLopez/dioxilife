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
        usarFechas = false,
        fechaInicio = null,
      }: {
        puntos: PuntoGrafico[];
        minimoY: number;
        maximoY: number;
        sufijo: string;
        maximoDia: number;
        conectarSaltos: boolean;
        usarFechas?: boolean;
        fechaInicio?: string | null;
      }) {
        if (
          puntos.length === 0
        ) {
          return;
        }

        asegurar(
          82
        );

        const puntosOrdenados =
          [...puntos].sort(
            (
              a,
              b
            ) =>
              a.dia -
              b.dia
          );

        const ultimoPunto =
          puntosOrdenados[
            puntosOrdenados.length -
              1
          ];

        const esPorcentaje =
          sufijo === "%";

        const tarjetaX =
          margen;

        const tarjetaY =
          y;

        const tarjetaW =
          anchoUtil;

        const tarjetaH =
          73;

        const graficoX =
          margen + 16;

        const graficoY =
          y + 18;

        const graficoW =
          anchoUtil - 22;

        const graficoH =
          42;

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


        function fechaDeDia(
          dia: number
        ) {
          if (
            !fechaInicio
          ) {
            return `Dia ${dia}`;
          }

          const fecha =
            new Date(
              fechaInicio
            );

          fecha.setUTCDate(
            fecha.getUTCDate() +
              dia -
              1
          );

          return fecha.toLocaleDateString(
            "es-BO",
            {
              timeZone:
                "America/La_Paz",
              day:
                "2-digit",
              month:
                "2-digit",
            }
          );
        }


        function formatoValor(
          valor: number
        ) {
          if (
            esPorcentaje
          ) {
            return `${Math.round(
              valor
            )}%`;
          }

          return `${valor
            .toFixed(1)
            .replace(
              ".0",
              ""
            )} kg`;
        }


        /*
         * Tarjeta
         */
        doc.setFillColor(
          252,
          251,
          254
        );

        doc.setDrawColor(
          232,
          227,
          240
        );

        doc.setLineWidth(
          0.35
        );

        doc.roundedRect(
          tarjetaX,
          tarjetaY,
          tarjetaW,
          tarjetaH,
          3.5,
          3.5,
          "FD"
        );


        /*
         * Encabezado interno
         */
        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(
          8.5
        );

        doc.setTextColor(
          66,
          55,
          82
        );

        doc.text(
          esPorcentaje
            ? "Evolucion del cumplimiento"
            : "Tendencia del peso",
          margen + 5,
          y + 7
        );


        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(
          6.8
        );

        doc.setTextColor(
          135,
          128,
          145
        );

        doc.text(
          esPorcentaje
            ? `Ultimo registro · Dia ${ultimoPunto.dia}`
            : usarFechas
              ? `Ultimo pesaje · ${fechaDeDia(
                  ultimoPunto.dia
                )}`
              : `Ultimo pesaje · Dia ${ultimoPunto.dia}`,
          margen + 5,
          y + 11.5
        );


        /*
         * Valor destacado
         */
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
          formatoValor(
            ultimoPunto.valor
          ),
          ancho -
            margen -
            5,
          y + 8.5,
          {
            align:
              "right",
          }
        );


        /*
         * Cuadricula horizontal
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
            i === 0
              ? 215
              : 237,
            i === 0
              ? 210
              : 233,
            i === 0
              ? 225
              : 241
          );

          doc.setLineWidth(
            i === 0
              ? 0.35
              : 0.2
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
            6.5
          );

          doc.setTextColor(
            145,
            139,
            154
          );

          const etiqueta =
            esPorcentaje
              ? `${Math.round(
                  valor
                )}%`
              : valor
                  .toFixed(
                    rangoY <
                    10
                      ? 1
                      : 0
                  )
                  .replace(
                    ".0",
                    ""
                  );

          doc.text(
            etiqueta,
            graficoX - 2.5,
            posY + 1.6,
            {
              align:
                "right",
            }
          );
        }


        /*
         * Dias que se mostrarán
         * en el eje horizontal
         */
        const maxEtiquetas =
          Math.min(
            6,
            ultimoDiaEje
          );

        const diasEtiqueta =
          new Set<number>();

        diasEtiqueta.add(
          1
        );

        diasEtiqueta.add(
          ultimoDiaEje
        );

        if (
          maxEtiquetas >
          2
        ) {
          for (
            let i = 1;
            i <
            maxEtiquetas -
              1;
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
                    (
                      maxEtiquetas -
                      1
                    )
              )
            );
          }
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


        /*
         * Guias verticales y
         * etiquetas Dia N
         */
        for (
          const dia of
          diasOrdenados
        ) {
          const posX =
            posicionX(
              dia
            );

          doc.setDrawColor(
            244,
            241,
            247
          );

          doc.setLineWidth(
            0.15
          );

          doc.line(
            posX,
            graficoY,
            posX,
            graficoY +
              graficoH
          );


          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setFontSize(
            6.5
          );

          doc.setTextColor(
            135,
            129,
            145
          );

          doc.text(
            usarFechas
              ? fechaDeDia(
                  dia
                )
              : `Dia ${dia}`,
            posX,
            graficoY +
              graficoH +
              5.5,
            {
              align:
                "center",
            }
          );
        }


        /*
         * Linea principal
         */
        doc.setDrawColor(
          93,
          61,
          174
        );

        doc.setLineWidth(
          1
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
         * Puntos
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

            const esUltimo =
              indice ===
              puntosOrdenados.length -
                1;


            /*
             * Halo blanco
             */
            doc.setFillColor(
              255,
              255,
              255
            );

            doc.circle(
              posX,
              posY,
              esUltimo
                ? 2.6
                : 2.1,
              "F"
            );


            /*
             * Punto de color
             */
            doc.setFillColor(
              esUltimo
                ? 218
                : 111,
              esUltimo
                ? 55
                : 74,
              esUltimo
                ? 126
                : 191
            );

            doc.circle(
              posX,
              posY,
              esUltimo
                ? 1.8
                : 1.35,
              "F"
            );


            /*
             * Valores visibles:
             * todos hasta 7 puntos.
             * Después solo primero y último.
             */
            const mostrarValor =
              puntosOrdenados.length <=
                7 ||
              indice === 0 ||
              esUltimo;

            if (
              mostrarValor
            ) {
              const valor =
                formatoValor(
                  punto.valor
                );

              const anchoEtiqueta =
                Math.max(
                  13,
                  doc.getTextWidth(
                    valor
                  ) +
                    5
                );

              const etiquetaX =
                Math.min(
                  Math.max(
                    posX,
                    margen +
                      anchoEtiqueta /
                        2 +
                      2
                  ),
                  ancho -
                    margen -
                    anchoEtiqueta /
                      2 -
                    2
                );

              let etiquetaY =
                posY - 4;

              if (
                etiquetaY <
                graficoY + 3
              ) {
                etiquetaY =
                  posY + 7;
              }


              doc.setFillColor(
                255,
                255,
                255
              );

              doc.setDrawColor(
                229,
                224,
                237
              );

              doc.setLineWidth(
                0.25
              );

              doc.roundedRect(
                etiquetaX -
                  anchoEtiqueta /
                    2,
                etiquetaY -
                  4,
                anchoEtiqueta,
                6,
                2,
                2,
                "FD"
              );


              doc.setFont(
                "helvetica",
                "bold"
              );

              doc.setFontSize(
                6.3
              );

              doc.setTextColor(
                esUltimo
                  ? 180
                  : 78,
                esUltimo
                  ? 46
                  : 66,
                esUltimo
                  ? 105
                  : 95
              );

              doc.text(
                valor,
                etiquetaX,
                etiquetaY,
                {
                  align:
                    "center",
                }
              );
            }
          }
        );


        y +=
          tarjetaH +
          5;
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


      /*
       * Tarjetas resumen de peso
       */
      asegurar(
        30
      );

      const pesoInicialValor =
        informe.resumen
          .pesoInicial
          ?.peso ??
        null;

      const pesoActualValor =
        informe.resumen
          .ultimoPeso
          ?.peso ??
        null;

      const pesoPromedioValor =
        informe.resumen
          .pesoPromedio;

      const cambioPesoValor =
        informe.resumen
          .cambioPeso;


      const tarjetasPeso = [
        {
          etiqueta:
            "INICIAL",

          valor:
            pesoInicialValor !==
            null
              ? `${pesoInicialValor} kg`
              : "Sin registro",

          detalle:
            informe.resumen
              .pesoInicial
              ? `Dia ${informe.resumen.pesoInicial.diaPlan}`
              : "—",
        },

        {
          etiqueta:
            informe.seguimiento
              .estado ===
            "COMPLETADO"
              ? "FINAL"
              : "ACTUAL",

          valor:
            pesoActualValor !==
            null
              ? `${pesoActualValor} kg`
              : "Sin registro",

          detalle:
            informe.resumen
              .ultimoPeso
              ? `Dia ${informe.resumen.ultimoPeso.diaPlan}`
              : "—",
        },

        {
          etiqueta:
            "CAMBIO",

          valor:
            cambioPesoValor !==
            null
              ? `${
                  cambioPesoValor >
                  0
                    ? "+"
                    : ""
                }${cambioPesoValor} kg`
              : "—",

          detalle:
            cambioPesoValor !==
            null
              ? "Desde el inicio"
              : "Sin datos",
        },

        {
          etiqueta:
            "PROMEDIO",

          valor:
            pesoPromedioValor !==
            null
              ? `${pesoPromedioValor} kg`
              : "Sin registro",

          detalle:
            informe.resumen
              .cantidadPesajes >
            0
              ? `${informe.resumen.cantidadPesajes} pesaje${
                  informe.resumen
                    .cantidadPesajes ===
                  1
                    ? ""
                    : "s"
                }`
              : "Sin pesajes",
        },
      ];


      const separacionTarjeta =
        3;

      const anchoTarjeta =
        (
          anchoUtil -
          separacionTarjeta *
            3
        ) /
        4;

      const altoTarjeta =
        22;

      const tarjetasY =
        y;


      tarjetasPeso.forEach(
        (
          tarjeta,
          indice
        ) => {
          const tarjetaX =
            margen +
            indice *
              (
                anchoTarjeta +
                separacionTarjeta
              );


          /*
           * Fondo y borde
           */
          doc.setFillColor(
            250,
            248,
            253
          );

          doc.setDrawColor(
            232,
            226,
            240
          );

          doc.setLineWidth(
            0.3
          );

          doc.roundedRect(
            tarjetaX,
            tarjetasY,
            anchoTarjeta,
            altoTarjeta,
            2.5,
            2.5,
            "FD"
          );


          /*
           * Etiqueta
           */
          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.setFontSize(
            6.5
          );

          doc.setTextColor(
            130,
            120,
            145
          );

          doc.text(
            tarjeta.etiqueta,
            tarjetaX + 3,
            tarjetasY + 5
          );


          /*
           * Valor principal
           */
          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.setFontSize(
            tarjeta.valor.length >
              12
              ? 8
              : 10
          );

          if (
            tarjeta.etiqueta ===
              "CAMBIO" &&
            cambioPesoValor !==
              null
          ) {
            if (
              cambioPesoValor <
              0
            ) {
              doc.setTextColor(
                40,
                145,
                95
              );
            } else if (
              cambioPesoValor >
              0
            ) {
              doc.setTextColor(
                205,
                105,
                45
              );
            } else {
              doc.setTextColor(
                79,
                46,
                145
              );
            }
          } else {
            doc.setTextColor(
              55,
              45,
              68
            );
          }

          const valorLineas =
            doc.splitTextToSize(
              tarjeta.valor,
              anchoTarjeta -
                6
            );

          doc.text(
            valorLineas,
            tarjetaX + 3,
            tarjetasY + 11
          );


          /*
           * Detalle
           */
          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setFontSize(
            6
          );

          doc.setTextColor(
            145,
            138,
            154
          );

          doc.text(
            tarjeta.detalle,
            tarjetaX + 3,
            tarjetasY + 18
          );
        }
      );

      y +=
        altoTarjeta +
        6;


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

          usarFechas:
            true,

          fechaInicio:
            informe
              .seguimiento
              .fechaInicio,
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
