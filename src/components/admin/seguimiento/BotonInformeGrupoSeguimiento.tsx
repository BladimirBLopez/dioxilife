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
  diaIngreso: number;
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
    diaActual: number;
    duracionDias: number;
    participantes: number;
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
              String(
                informe.grupo
                  .participantes
              ),
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
            9
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
              String(
                informe.grupo
                  .participantes
              ),
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
        "RANKING DE CUMPLIMIENTO - HOY",
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
        asegurar(43);

        const altoCaja =
          37;

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
          `Ingreso día ${participante.diaIngreso}`,
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
          `Cumplimiento: hoy ${participante.cumplimientoHoy.porcentaje}% (${participante.cumplimientoHoy.completados}/${participante.cumplimientoHoy.total}) · acumulado ${participante.cumplimientoAcumulado.porcentaje}% (${participante.cumplimientoAcumulado.completados}/${participante.cumplimientoAcumulado.total})`,
          margen + 4,
          y + 13
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
          y + 20
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
          y + 27
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
          y + 34
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
          "Las mediciones de glucemia se presentan como información descriptiva de seguimiento. No forman parte de un ranking competitivo entre participantes.",
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
