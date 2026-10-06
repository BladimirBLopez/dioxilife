"use client";

import {
  useState,
} from "react";

import {
  toast,
} from "sonner";

type Medicion = {
  cantidad: number;

  inicial: {
    diaPlan: number;
    valor: number;
  } | null;

  ultima: {
    diaPlan: number;
    valor: number;
  } | null;

  promedio:
    | number
    | null;

  cambio:
    | number
    | null;
};

type Participante = {
  seguimientoId: string;
  nombre: string;

  estadoMiembro:
    | "ACTIVO"
    | "RETIRADO";

  diaIngreso: number;

  fechaRetiro:
    | string
    | null;

  diaRetiro:
    | number
    | null;

  hastaDia: number;
  participaHoy: boolean;

  ultimoRegistro:
    | number
    | null;

  cumplimientoHoy: {
    completados: number;
    total: number;
    porcentaje: number;
  };

  cumplimientoAcumulado: {
    completados: number;
    total: number;
    porcentaje: number;
  };

  peso: Medicion & {
    perdidaKg:
      | number
      | null;

    perdidaPorcentaje:
      | number
      | null;
  };

  cintura: Medicion;

  glucemia: Medicion;
};

type RankingCumplimiento = {
  puesto: number;
  seguimientoId: string;
  nombre: string;
  porcentaje: number;
  completados: number;
  total: number;
};

type RankingPeso = {
  puesto: number;
  seguimientoId: string;
  nombre: string;
  inicial:
    | number
    | null;
  promedio:
    | number
    | null;
  perdidaKg:
    | number
    | null;
  perdidaPorcentaje:
    | number
    | null;
};

type DatosInformeGrupo = {
  generadoAt: string;

  grupo: {
    id: string;
    nombre: string;
    objetivo: string;
    descripcion:
      | string
      | null;
    protocolo: string;
    estado: string;
    fechaInicio: string;

    fechaFinalizado:
      | string
      | null;

    diaActual: number;
    duracionDias: number;
    participantes: number;
    activos: number;
    retirados: number;
    promedioHoy: number;
    promedioAcumulado: number;
  };

  participantes:
    Participante[];

  rankings: {
    cumplimientoHoy:
      RankingCumplimiento[];

    cumplimientoAcumulado:
      RankingCumplimiento[];

    peso:
      RankingPeso[];
  };

  graficas: {
    cumplimiento: {
      diaPlan: number;
      porcentaje: number;
      acumulado: number;
      completados: number;
      total: number;
      participantes: number;
    }[];

    peso: {
      diaPlan: number;
      promedio: number;
      registros: number;
    }[];

    cintura: {
      diaPlan: number;
      promedio: number;
      registros: number;
    }[];

    glucemia: {
      diaPlan: number;
      promedio: number;
      registros: number;
    }[];
  };
};

type PuntoGraficoPdf = {
  diaPlan: number;
  principal: number;
  secundaria?: number;
};

function fechaVisible(
  valor:
    | string
    | null
) {
  if (!valor) {
    return "No registrada";
  }

  return new Date(
    valor
  ).toLocaleDateString(
    "es-BO",
    {
      timeZone:
        "UTC",

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
  nombre: string
) {
  return nombre
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
    "Grupo";
}

function numero(
  valor:
    | number
    | null,
  unidad = ""
) {
  if (
    valor === null ||
    !Number.isFinite(
      valor
    )
  ) {
    return "—";
  }

  const texto =
    valor.toLocaleString(
      "es-BO",
      {
        maximumFractionDigits:
          2,
      }
    );

  return unidad
    ? `${texto} ${unidad}`
    : texto;
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

export default function BotonInformeGrupoSeguimiento({
  grupoId,
}: {
  grupoId: string;
}) {
  const [
    generando,
    setGenerando,
  ] = useState(false);

  async function descargar() {
    if (generando) {
      return;
    }

    setGenerando(true);

    const toastId =
      toast.loading(
        "Generando informe grupal..."
      );

    try {
      const res =
        await fetch(
          `/api/admin/seguimiento/grupos/${grupoId}/resumen`,
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
            () => null
          );

      if (!res.ok) {
        throw new Error(
          data?.error ||
            "No se pudo generar el informe grupal."
        );
      }

      const informe =
        data as DatosInformeGrupo;

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
      } = modulo;

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
          278
        ) {
          nuevaPagina();
        }
      }

      function tituloSeccion(
        titulo: string
      ) {
        asegurar(14);

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
          224,
          218,
          235
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

      function campo(
        etiqueta: string,
        valor: string
      ) {
        asegurar(12);

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(
          7.5
        );

        doc.setTextColor(
          125,
          120,
          135
        );

        doc.text(
          etiqueta.toUpperCase(),
          margen,
          y
        );

        y += 4;

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(
          9.5
        );

        doc.setTextColor(
          40,
          37,
          45
        );

        const lineas =
          doc.splitTextToSize(
            valor,
            anchoUtil
          );

        doc.text(
          lineas,
          margen,
          y
        );

        y +=
          lineas.length *
            4.2 +
          3;
      }

      function graficoLineas({
        titulo,
        subtitulo,
        datos,
        unidad,
        etiquetaPrincipal,
        etiquetaSecundaria,
      }: {
        titulo: string;
        subtitulo: string;
        datos: PuntoGraficoPdf[];
        unidad: string;
        etiquetaPrincipal: string;
        etiquetaSecundaria?: string;
      }) {
        asegurar(78);

        tituloSeccion(
          titulo
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(
          7.2
        );

        doc.setTextColor(
          115,
          108,
          122
        );

        const descripcion =
          doc.splitTextToSize(
            subtitulo,
            anchoUtil
          );

        doc.text(
          descripcion,
          margen,
          y
        );

        y +=
          descripcion.length *
            3.4 +
          4;

        if (
          datos.length ===
          0
        ) {
          doc.setFontSize(
            8.5
          );

          doc.setTextColor(
            110,
            105,
            115
          );

          doc.text(
            "Todavía no hay datos suficientes.",
            margen,
            y
          );

          y += 10;

          return;
        }

        const valores =
          datos.flatMap(
            (
              punto
            ) => {
              const resultado =
                [
                  punto.principal,
                ];

              if (
                punto.secundaria !==
                undefined
              ) {
                resultado.push(
                  punto.secundaria
                );
              }

              return resultado;
            }
          ).filter(
            (
              valor
            ) =>
              Number.isFinite(
                valor
              )
          );

        let minimo =
          Math.min(
            ...valores
          );

        let maximo =
          Math.max(
            ...valores
          );

        if (
          unidad === "%"
        ) {
          minimo = 0;
          maximo = 100;
        } else if (
          minimo === maximo
        ) {
          const margenValor =
            Math.max(
              Math.abs(
                minimo
              ) * 0.05,
              1
            );

          minimo -=
            margenValor;

          maximo +=
            margenValor;
        } else {
          const margenValor =
            (
              maximo -
              minimo
            ) * 0.08;

          minimo -=
            margenValor;

          maximo +=
            margenValor;
        }

        const plotX =
          margen + 15;

        const plotY =
          y + 8;

        const plotW =
          anchoUtil - 22;

        const plotH =
          43;

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(
          6.5
        );

        doc.setTextColor(
          100,
          95,
          110
        );

        doc.text(
          etiquetaPrincipal,
          plotX,
          y + 2
        );

        if (
          etiquetaSecundaria
        ) {
          doc.setTextColor(
            180,
            60,
            125
          );

          doc.text(
            `· ${etiquetaSecundaria}`,
            plotX + 45,
            y + 2
          );
        }

        doc.setDrawColor(
          230,
          226,
          236
        );

        for (
          let linea = 0;
          linea <= 4;
          linea++
        ) {
          const yy =
            plotY +
            (
              plotH *
              linea
            ) /
              4;

          doc.line(
            plotX,
            yy,
            plotX +
              plotW,
            yy
          );
        }

        doc.setDrawColor(
          160,
          155,
          170
        );

        doc.line(
          plotX,
          plotY,
          plotX,
          plotY +
            plotH
        );

        doc.line(
          plotX,
          plotY +
            plotH,
          plotX +
            plotW,
          plotY +
            plotH
        );

        const primerDia =
          Math.min(
            ...datos.map(
              (
                punto
              ) =>
                punto.diaPlan
            )
          );

        const ultimoDia =
          Math.max(
            ...datos.map(
              (
                punto
              ) =>
                punto.diaPlan
            )
          );

        function xDia(
          dia: number
        ) {
          if (
            ultimoDia ===
            primerDia
          ) {
            return (
              plotX +
              plotW / 2
            );
          }

          return (
            plotX +
            (
              (
                dia -
                primerDia
              ) /
              (
                ultimoDia -
                primerDia
              )
            ) *
              plotW
          );
        }

        function yValor(
          valor: number
        ) {
          if (
            maximo ===
            minimo
          ) {
            return (
              plotY +
              plotH / 2
            );
          }

          return (
            plotY +
            plotH -
            (
              (
                valor -
                minimo
              ) /
              (
                maximo -
                minimo
              )
            ) *
              plotH
          );
        }

        function dibujarSerie(
          clave:
            | "principal"
            | "secundaria",
          color: [
            number,
            number,
            number
          ],
          discontinua = false
        ) {
          const puntos =
            datos.filter(
              (
                punto
              ) =>
                punto[
                  clave
                ] !==
                  undefined &&
                Number.isFinite(
                  Number(
                    punto[
                      clave
                    ]
                  )
                )
            );

          if (
            puntos.length ===
            0
          ) {
            return;
          }

          doc.setDrawColor(
            ...color
          );

          doc.setFillColor(
            ...color
          );

          doc.setLineWidth(
            clave ===
              "principal"
              ? 0.7
              : 0.45
          );

          if (
            discontinua
          ) {
            doc.setLineDashPattern(
              [
                2,
                1.5,
              ],
              0
            );
          } else {
            doc.setLineDashPattern(
              [],
              0
            );
          }

          for (
            let indice = 1;
            indice <
            puntos.length;
            indice++
          ) {
            const anterior =
              puntos[
                indice - 1
              ];

            const actual =
              puntos[
                indice
              ];

            doc.line(
              xDia(
                anterior.diaPlan
              ),
              yValor(
                Number(
                  anterior[
                    clave
                  ]
                )
              ),
              xDia(
                actual.diaPlan
              ),
              yValor(
                Number(
                  actual[
                    clave
                  ]
                )
              )
            );
          }

          doc.setLineDashPattern(
            [],
            0
          );

          for (
            const punto of
            puntos
          ) {
            doc.circle(
              xDia(
                punto.diaPlan
              ),
              yValor(
                Number(
                  punto[
                    clave
                  ]
                )
              ),
              0.75,
              "F"
            );
          }
        }

        dibujarSerie(
          "principal",
          [
            103,
            80,
            164,
          ]
        );

        if (
          etiquetaSecundaria
        ) {
          dibujarSerie(
            "secundaria",
            [
              219,
              63,
              133,
            ],
            true
          );
        }

        doc.setFontSize(
          6.2
        );

        doc.setTextColor(
          115,
          110,
          120
        );

        const formato =
          (
            valor: number
          ) =>
            `${redondearGrafico(
              valor
            )}${unidad}`;

        doc.text(
          formato(
            maximo
          ),
          plotX - 2,
          plotY + 2,
          {
            align:
              "right",
          }
        );

        doc.text(
          formato(
            minimo
          ),
          plotX - 2,
          plotY +
            plotH,
          {
            align:
              "right",
          }
        );

        const diaMedio =
          Math.round(
            (
              primerDia +
              ultimoDia
            ) / 2
          );

        doc.text(
          `D${primerDia}`,
          plotX,
          plotY +
            plotH +
            5
        );

        if (
          ultimoDia !==
          primerDia
        ) {
          doc.text(
            `D${diaMedio}`,
            xDia(
              diaMedio
            ),
            plotY +
              plotH +
              5,
            {
              align:
                "center",
            }
          );

          doc.text(
            `D${ultimoDia}`,
            plotX +
              plotW,
            plotY +
              plotH +
              5,
            {
              align:
                "right",
            }
          );
        }

        y =
          plotY +
          plotH +
          11;
      }

      function redondearGrafico(
        valor: number
      ) {
        return (
          Math.round(
            valor * 10
          ) / 10
        ).toLocaleString(
          "es-BO",
          {
            maximumFractionDigits:
              1,
          }
        );
      }


      /*
       * ENCABEZADO
       */
      if (logo) {
        try {
          doc.addImage(
            logo,
            "PNG",
            margen,
            y,
            22,
            18
          );
        } catch {
          // El informe puede generarse
          // aunque el logo no cargue.
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
        "DioxiLife Bolivia",
        margen + 28,
        y + 5
      );

      doc.setFontSize(
        11
      );

      doc.setTextColor(
        45,
        42,
        50
      );

      doc.text(
        "Informe de seguimiento grupal",
        margen + 28,
        y + 11
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
        `Generado: ${fechaVisible(
          informe.generadoAt
        )}`,
        margen + 28,
        y + 16
      );

      y += 24;

      doc.setDrawColor(
        225,
        220,
        235
      );

      doc.line(
        margen,
        y,
        ancho -
          margen,
        y
      );

      y += 8;


      /*
       * INFORMACION DEL GRUPO
       */
      tituloSeccion(
        "INFORMACIÓN DEL GRUPO"
      );

      campo(
        "Grupo",
        informe.grupo.nombre
      );

      campo(
        "Objetivo",
        informe.grupo.objetivo
      );

      campo(
        "Protocolo común",
        informe.grupo.protocolo
      );

      if (
        informe.grupo
          .descripcion
      ) {
        campo(
          "Descripción",
          informe.grupo
            .descripcion
        );
      }


      asegurar(22);

      const columnas =
        [
          {
            titulo:
              "Inicio",
            valor:
              fechaVisible(
                informe.grupo
                  .fechaInicio
              ),
          },
          {
            titulo:
              "Cierre",
            valor:
              fechaVisible(
                informe.grupo
                  .fechaFinalizado
              ),
          },
          {
            titulo:
              "Duración",
            valor:
              `${informe.grupo.duracionDias} días`,
          },
          {
            titulo:
              "Estado",
            valor:
              informe.grupo.estado,
          },
          {
            titulo:
              "Participantes",
            valor:
              `${informe.grupo.participantes} (${informe.grupo.activos} activos · ${informe.grupo.retirados} retirados)`,
          },
        ];

      const anchoColumna =
        anchoUtil /
        columnas.length;

      columnas.forEach(
        (
          columna,
          indice
        ) => {
          const x =
            margen +
            indice *
              anchoColumna;

          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.setFontSize(
            7
          );

          doc.setTextColor(
            130,
            125,
            140
          );

          doc.text(
            columna.titulo
              .toUpperCase(),
            x,
            y
          );

          doc.setFontSize(
            8
          );

          doc.setTextColor(
            45,
            42,
            50
          );

          doc.text(
            columna.valor,
            x,
            y + 5
          );
        }
      );

      y += 14;


      /*
       * RESUMEN
       */
      tituloSeccion(
        "RESUMEN GENERAL"
      );

      const tarjetas =
        [
          {
            titulo:
              informe.grupo
                .estado ===
              "FINALIZADO"
                ? "ÚLTIMO DÍA"
                : "CUMPLIMIENTO HOY",

            valor:
              `${informe.grupo.promedioHoy}%`,
          },
          {
            titulo:
              "CUMPLIMIENTO ACUMULADO",

            valor:
              `${informe.grupo.promedioAcumulado}%`,
          },
          {
            titulo:
              "JORNADA",

            valor:
              `${informe.grupo.diaActual}/${informe.grupo.duracionDias}`,
          },
          {
            titulo:
              "PARTICIPANTES",

            valor:
              `${informe.grupo.participantes} total`,
          },
        ];

      const tarjetaW =
        (
          anchoUtil -
          6
        ) / 2;

      const tarjetaH =
        20;

      tarjetas.forEach(
        (
          tarjeta,
          indice
        ) => {
          if (
            indice === 2
          ) {
            y +=
              tarjetaH +
              3;
          }

          const columna =
            indice % 2;

          const x =
            margen +
            columna *
              (
                tarjetaW +
                6
              );

          doc.setFillColor(
            248,
            246,
            252
          );

          doc.setDrawColor(
            232,
            226,
            242
          );

          doc.roundedRect(
            x,
            y,
            tarjetaW,
            tarjetaH,
            2,
            2,
            "FD"
          );

          doc.setFont(
            "helvetica",
            "bold"
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
            tarjeta.titulo,
            x + 4,
            y + 6
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
            tarjeta.valor,
            x + 4,
            y + 15
          );
        }
      );

      y +=
        tarjetaH +
        8;


      /*
       * GRÁFICAS
       */
      graficoLineas({
        titulo:
          "EVOLUCIÓN DEL CUMPLIMIENTO",

        subtitulo:
          "Línea continua: cumplimiento diario. Línea discontinua: cumplimiento acumulado del grupo.",

        datos:
          informe.graficas
            .cumplimiento.map(
              (
                punto
              ) => ({
                diaPlan:
                  punto.diaPlan,

                principal:
                  punto.porcentaje,

                secundaria:
                  punto.acumulado,
              })
            ),

        unidad:
          "%",

        etiquetaPrincipal:
          "Cumplimiento diario",

        etiquetaSecundaria:
          "Cumplimiento acumulado",
      });

      graficoLineas({
        titulo:
          "EVOLUCIÓN DEL PESO",

        subtitulo:
          "Promedio de los pesos registrados por los participantes en cada jornada.",

        datos:
          informe.graficas
            .peso.map(
              (
                punto
              ) => ({
                diaPlan:
                  punto.diaPlan,

                principal:
                  punto.promedio,
              })
            ),

        unidad:
          " kg",

        etiquetaPrincipal:
          "Peso promedio",
      });

      graficoLineas({
        titulo:
          "EVOLUCIÓN DE CINTURA",

        subtitulo:
          "Promedio de las mediciones de cintura registradas en cada jornada.",

        datos:
          informe.graficas
            .cintura.map(
              (
                punto
              ) => ({
                diaPlan:
                  punto.diaPlan,

                principal:
                  punto.promedio,
              })
            ),

        unidad:
          " cm",

        etiquetaPrincipal:
          "Cintura promedio",
      });

      graficoLineas({
        titulo:
          "GLUCEMIA EN AYUNAS",

        subtitulo:
          "Promedio descriptivo de los registros informados en cada jornada. No corresponde a una clasificación competitiva.",

        datos:
          informe.graficas
            .glucemia.map(
              (
                punto
              ) => ({
                diaPlan:
                  punto.diaPlan,

                principal:
                  punto.promedio,
              })
            ),

        unidad:
          " mg/dL",

        etiquetaPrincipal:
          "Promedio registrado",
      });


      function tablaCumplimiento(
        titulo: string,
        items:
          RankingCumplimiento[]
      ) {
        tituloSeccion(
          titulo
        );

        if (
          items.length ===
          0
        ) {
          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setFontSize(
            9
          );

          doc.setTextColor(
            110,
            105,
            115
          );

          doc.text(
            "Sin datos disponibles.",
            margen,
            y
          );

          y += 8;

          return;
        }

        const colPuesto =
          margen;

        const colNombre =
          margen + 18;

        const colChecks =
          margen + 116;

        const colPorcentaje =
          ancho -
          margen;

        asegurar(10);

        doc.setFillColor(
          245,
          243,
          249
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
          7
        );

        doc.setTextColor(
          95,
          90,
          105
        );

        doc.text(
          "PUESTO",
          colPuesto,
          y
        );

        doc.text(
          "PARTICIPANTE",
          colNombre,
          y
        );

        doc.text(
          "CHECKS",
          colChecks,
          y
        );

        doc.text(
          "%",
          colPorcentaje,
          y,
          {
            align:
              "right",
          }
        );

        y += 7;

        for (
          const item of
          items
        ) {
          asegurar(8);

          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setFontSize(
            8
          );

          doc.setTextColor(
            50,
            47,
            55
          );

          doc.text(
            String(
              item.puesto
            ),
            colPuesto,
            y
          );

          const nombre =
            doc.splitTextToSize(
              item.nombre,
              90
            )[0];

          doc.text(
            nombre,
            colNombre,
            y
          );

          doc.text(
            `${item.completados}/${item.total}`,
            colChecks,
            y
          );

          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.text(
            `${item.porcentaje}%`,
            colPorcentaje,
            y,
            {
              align:
                "right",
            }
          );

          y += 6;

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

        y += 3;
      }


      tablaCumplimiento(
        informe.grupo.estado ===
          "FINALIZADO"
          ? "RANKING DE CUMPLIMIENTO - ÚLTIMO DÍA"
          : "RANKING DE CUMPLIMIENTO - HOY",
        informe.rankings
          .cumplimientoHoy
      );

      tablaCumplimiento(
        "RANKING DE CUMPLIMIENTO - ACUMULADO",
        informe.rankings
          .cumplimientoAcumulado
      );


      /*
       * RANKING PESO
       */
      tituloSeccion(
        "RANKING POR PÉRDIDA DE PESO"
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(
        7.5
      );

      doc.setTextColor(
        105,
        100,
        112
      );

      doc.text(
        "Criterio: peso inicial menos promedio de las mediciones registradas.",
        margen,
        y
      );

      y += 6;

      if (
        informe.rankings.peso
          .length === 0
      ) {
        doc.setFontSize(
          9
        );

        doc.text(
          "Sin datos suficientes de peso.",
          margen,
          y
        );

        y += 8;
      } else {
        const xPuesto =
          margen;

        const xNombre =
          margen + 14;

        const xInicial =
          margen + 89;

        const xPromedio =
          margen + 116;

        const xKg =
          margen + 148;

        const xPct =
          ancho - margen;

        asegurar(10);

        doc.setFillColor(
          245,
          243,
          249
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
          6.5
        );

        doc.setTextColor(
          95,
          90,
          105
        );

        doc.text(
          "#",
          xPuesto,
          y
        );

        doc.text(
          "PARTICIPANTE",
          xNombre,
          y
        );

        doc.text(
          "INICIAL",
          xInicial,
          y
        );

        doc.text(
          "PROM.",
          xPromedio,
          y
        );

        doc.text(
          "PÉRDIDA",
          xKg,
          y
        );

        doc.text(
          "%",
          xPct,
          y,
          {
            align:
              "right",
          }
        );

        y += 7;

        for (
          const item of
          informe.rankings.peso
        ) {
          asegurar(8);

          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setFontSize(
            7.6
          );

          doc.setTextColor(
            50,
            47,
            55
          );

          doc.text(
            String(
              item.puesto
            ),
            xPuesto,
            y
          );

          doc.text(
            doc.splitTextToSize(
              item.nombre,
              68
            )[0],
            xNombre,
            y
          );

          doc.text(
            numero(
              item.inicial,
              "kg"
            ),
            xInicial,
            y
          );

          doc.text(
            numero(
              item.promedio,
              "kg"
            ),
            xPromedio,
            y
          );

          doc.text(
            numero(
              item.perdidaKg,
              "kg"
            ),
            xKg,
            y
          );

          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.text(
            item.perdidaPorcentaje !==
            null
              ? `${numero(
                  item.perdidaPorcentaje
                )}%`
              : "—",
            xPct,
            y,
            {
              align:
                "right",
            }
          );

          y += 6;

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

        y += 3;
      }


      /*
       * INDICADORES
       */
      tituloSeccion(
        "INDICADORES POR PARTICIPANTE"
      );

      for (
        const participante of
        informe.participantes
      ) {
        asegurar(51);

        const altoCaja =
          45;

        doc.setFillColor(
          250,
          249,
          252
        );

        doc.setDrawColor(
          232,
          228,
          238
        );

        doc.roundedRect(
          margen,
          y,
          anchoUtil,
          altoCaja,
          2,
          2,
          "FD"
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(
          9.5
        );

        doc.setTextColor(
          55,
          50,
          62
        );

        doc.text(
          participante.nombre,
          margen + 4,
          y + 6
        );

        doc.setFontSize(
          7
        );

        doc.setTextColor(
          115,
          108,
          122
        );

        doc.text(
          participante.estadoMiembro,
          ancho -
            margen -
            4,
          y + 6,
          {
            align:
              "right",
          }
        );


        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(
          7.4
        );

        doc.setTextColor(
          65,
          61,
          70
        );

        doc.text(
          participante.estadoMiembro ===
              "RETIRADO"
            ? `Periodo: día ${participante.diaIngreso} al ${participante.hastaDia} · retiro ${fechaVisible(
                participante.fechaRetiro
              )}`
            : `Periodo: desde día ${participante.diaIngreso} hasta día ${participante.hastaDia}`,
          margen + 4,
          y + 13
        );

        doc.text(
          participante.participaHoy
            ? `Cumplimiento: hoy ${participante.cumplimientoHoy.porcentaje}% (${participante.cumplimientoHoy.completados}/${participante.cumplimientoHoy.total}) · acumulado ${participante.cumplimientoAcumulado.porcentaje}% (${participante.cumplimientoAcumulado.completados}/${participante.cumplimientoAcumulado.total})`
            : `Cumplimiento acumulado: ${participante.cumplimientoAcumulado.porcentaje}% (${participante.cumplimientoAcumulado.completados}/${participante.cumplimientoAcumulado.total})`,
          margen + 4,
          y + 20
        );

        doc.text(
          `Peso: inicial ${numero(
            participante.peso.inicial?.valor ??
              null,
            "kg"
          )} · último ${numero(
            participante.peso.ultima?.valor ??
              null,
            "kg"
          )} · promedio ${numero(
            participante.peso.promedio,
            "kg"
          )} · pérdida ${numero(
            participante.peso.perdidaKg,
            "kg"
          )} (${participante.peso.perdidaPorcentaje !== null ? `${numero(participante.peso.perdidaPorcentaje)}%` : "—"})`,
          margen + 4,
          y + 27
        );

        doc.text(
          `Cintura: inicial ${numero(
            participante.cintura.inicial?.valor ??
              null,
            "cm"
          )} · última ${numero(
            participante.cintura.ultima?.valor ??
              null,
            "cm"
          )} · promedio ${numero(
            participante.cintura.promedio,
            "cm"
          )}`,
          margen + 4,
          y + 34
        );

        doc.text(
          `Glucemia en ayunas: inicial ${numero(
            participante.glucemia.inicial?.valor ??
              null,
            "mg/dL"
          )} · última ${numero(
            participante.glucemia.ultima?.valor ??
              null,
            "mg/dL"
          )} · promedio ${numero(
            participante.glucemia.promedio,
            "mg/dL"
          )}`,
          margen + 4,
          y + 41
        );

        y +=
          altoCaja +
          4;
      }


      /*
       * NOTA FINAL
       */
      asegurar(24);

      y += 3;

      doc.setFillColor(
        250,
        248,
        240
      );

      doc.setDrawColor(
        235,
        224,
        185
      );

      doc.roundedRect(
        margen,
        y,
        anchoUtil,
        18,
        2,
        2,
        "FD"
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(
        7.2
      );

      doc.setTextColor(
        105,
        90,
        55
      );

      const nota =
        doc.splitTextToSize(
          "Las mediciones incluidas en este informe corresponden a registros del seguimiento. La glucemia en ayunas se presenta únicamente como información descriptiva y no forma parte de ningún ranking competitivo ni implica una interpretación clínica.",
          anchoUtil - 8
        );

      doc.text(
        nota,
        margen + 4,
        y + 6
      );


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
          "DioxiLife Bolivia - Informe de seguimiento grupal",
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
        `DioxiLife_Grupo_${nombreArchivo(
          informe.grupo.nombre
        )}_${fechaArchivo}.pdf`
      );

      toast.success(
        "Informe grupal generado",
        {
          id:
            toastId,
        }
      );

    } catch (
      error
    ) {
      toast.error(
        "No se pudo generar el informe grupal",
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
      className="inline-flex items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {generando
        ? "Generando PDF..."
        : "📄 Informe PDF"}
    </button>
  );
}
