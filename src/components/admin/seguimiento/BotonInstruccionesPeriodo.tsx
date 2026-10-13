"use client";

import { useState } from "react";
import { toast } from "sonner";

type Indicacion = {
  id: string;
  hora: string | null;
  texto: string;
  orden: number;
};

type Protocolo = {
  id: string;
  seccion?: "PRINCIPAL" | "ADICIONAL";
  titulo: string;
  descripcion: string | null;
  momento: string | null;
  hora: string | null;
  diaInicio: number;
  diaFin: number | null;
  orden: number;
  indicaciones: Indicacion[];
};

type Datos = {
  cliente: {
    nombreCliente: string | null;
    nombrePlan: string;
    duracionDias: number;
  };
  protocolos: Protocolo[];
};

type Periodo = {
  inicio: number;
  fin: number;
  protocolos: Protocolo[];
};

function obtenerPeriodos(datos: Datos): Periodo[] {
  const total = datos.cliente.duracionDias;

  if (!Number.isInteger(total) || total < 1) {
    return [];
  }

  const validos = datos.protocolos.filter(
    (p) =>
      Number.isInteger(p.diaInicio) &&
      p.diaInicio >= 1 &&
      p.diaInicio <= total &&
      (p.diaFin === null ||
        (Number.isInteger(p.diaFin) &&
          p.diaFin >= p.diaInicio))
  );

  const cortes = new Set<number>([1, total + 1]);

  for (const p of validos) {
    if (p.seccion === "PRINCIPAL") continue;
    const fin = Math.min(p.diaFin ?? total, total);
    cortes.add(p.diaInicio);
    cortes.add(fin + 1);
  }

  const limites = [...cortes].sort((a, b) => a - b);
  const resultado: Periodo[] = [];

  for (let i = 0; i < limites.length - 1; i++) {
    const inicio = limites[i];
    const fin = limites[i + 1] - 1;

    const protocolos = validos
      .filter(
        (p) =>
          p.diaInicio <= fin &&
          (p.diaFin ?? total) >= inicio
      )
      .sort(
        (a, b) =>
          (a.seccion === "PRINCIPAL" ? 0 : 1) -
            (b.seccion === "PRINCIPAL" ? 0 : 1) ||
          (a.hora ?? "").localeCompare(b.hora ?? "") ||
          a.orden - b.orden
      );

    if (protocolos.length) {
      resultado.push({ inicio, fin, protocolos });
    }
  }

  return resultado;
}

async function cargarLogo(): Promise<string | null> {
  try {
    const respuesta = await fetch("/logo.png");

    if (!respuesta.ok) return null;

    const blob = await respuesta.blob();

    return await new Promise<string>((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(String(lector.result));
      lector.onerror = reject;
      lector.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function BotonInstruccionesPeriodo({
  seguimientoId,
  datosCliente,
}: {
  seguimientoId?: string;
  datosCliente?: Datos;
}) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [datos, setDatos] = useState<Datos | null>(
    datosCliente ?? null
  );
  const [indice, setIndice] = useState("0");
  const [frase, setFrase] = useState(
    "Cada paso cuenta. Sigue adelante con constancia."
  );

  const periodos = datos ? obtenerPeriodos(datos) : [];

  async function abrir() {
    setAbierto(true);
    setIndice("0");

    if (datosCliente) {
      setDatos(datosCliente);
      setCargando(false);
      return;
    }

    setCargando(true);
    setDatos(null);

    try {
      const respuesta = await fetch(
        `/api/admin/seguimiento/clientes/${seguimientoId}/instrucciones`,
        { cache: "no-store" }
      );

      const contenido = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          contenido.error || "No se pudieron cargar las instrucciones."
        );
      }

      setDatos(contenido as Datos);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las instrucciones."
      );
    } finally {
      setCargando(false);
    }
  }

  async function descargar() {
    const periodo = periodos[Number(indice)];

    if (!datos || !periodo || generando) return;

    setGenerando(true);

    try {
      const [{ jsPDF }, logo] = await Promise.all([
        import("jspdf"),
        cargarLogo(),
      ]);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      });

      const ancho = doc.internal.pageSize.getWidth();
      const alto = doc.internal.pageSize.getHeight();
      const margen = 16;
      let y = 39;

      function nuevaPagina() {
        doc.addPage();
        y = 19;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(
          `DioxiLife - Instrucciones, dias ${periodo.inicio} al ${periodo.fin}`,
          margen,
          y
        );
        y += 11;
      }

      function asegurar(espacio: number) {
        if (y + espacio > alto - 19) {
          nuevaPagina();
        }
      }

      function escribir(
        texto: string,
        tamano = 10,
        negrita = false
      ) {
        if (!texto.trim()) return;

        doc.setFont(
          "helvetica",
          negrita ? "bold" : "normal"
        );
        doc.setFontSize(tamano);

        const alturaLinea = tamano >= 13 ? 7 : 5;

        for (const parrafo of texto.trim().split(/\r?\n/)) {
          const lineas = doc.splitTextToSize(
            parrafo || " ",
            ancho - margen * 2
          ) as string[];

          for (const linea of lineas) {
            asegurar(alturaLinea);
            doc.text(linea, margen, y);
            y += alturaLinea;
          }
        }

        y += 2;
      }

      if (logo) {
        try {
          doc.addImage(logo, "PNG", margen, 12, 22, 22);
        } catch {
          // El documento continúa sin imagen si el logo no es válido.
        }
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.text("DIOXILIFE", margen + 28, 19);

      doc.setFontSize(11);
      doc.text("INSTRUCCIONES DEL SEGUIMIENTO", margen + 28, 26);

      doc.setDrawColor(210);
      doc.line(margen, 35, ancho - margen, 35);

      escribir(
        `Cliente: ${datos.cliente.nombreCliente || "Sin nombre"}`,
        11,
        true
      );
      escribir(`Plan: ${datos.cliente.nombrePlan}`);
      escribir(
        `Periodo: dias ${periodo.inicio} al ${periodo.fin}`,
        11,
        true
      );

      y += 4;

      let seccionAnterior = "";

      for (const protocolo of periodo.protocolos) {
        if (datosCliente) {
          const seccion =
            protocolo.seccion === "PRINCIPAL"
              ? "PROTOCOLO PRINCIPAL"
              : "PROTOCOLOS ADICIONALES";

          if (seccion !== seccionAnterior) {
            asegurar(17);
            escribir(seccion, 12, true);
            seccionAnterior = seccion;
          }
        }

        asegurar(23);

        doc.setDrawColor(210);
        doc.line(margen, y, ancho - margen, y);
        y += 7;

        escribir(protocolo.titulo, 13, true);

        escribir(
          `Aplicacion: dia ${protocolo.diaInicio} al ${
            protocolo.diaFin ??
              datos.cliente.duracionDias
          }`
        );

        if (protocolo.hora) {
          escribir(`Horario: ${protocolo.hora}`);
        }

        if (protocolo.momento) {
          escribir(`Momento: ${protocolo.momento}`);
        }

        if (protocolo.descripcion) {
          escribir(protocolo.descripcion);
        }

        for (const indicacion of [...protocolo.indicaciones].sort(
          (a, b) =>
            (a.hora ?? "").localeCompare(b.hora ?? "") ||
            a.orden - b.orden
        )) {
          escribir(
            `${indicacion.hora ? indicacion.hora + " - " : ""}${indicacion.texto}`
          );
        }

        y += 3;
      }

      if (frase.trim()) {
        asegurar(24);
        doc.setDrawColor(210);
        doc.line(margen, y, ancho - margen, y);
        y += 9;
        escribir(frase.trim(), 11, true);
      }

      const paginas = doc.getNumberOfPages();

      for (let i = 1; i <= paginas; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(110);
        doc.text(
          `DioxiLife | Pagina ${i} de ${paginas}`,
          margen,
          alto - 10
        );
      }

      doc.save(
        `DioxiLife_Instrucciones_Dias_${periodo.inicio}_${periodo.fin}.pdf`
      );

      toast.success("Documento generado correctamente.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo generar el PDF."
      );
    } finally {
      setGenerando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void abrir()}
        className="inline-flex flex-1 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-100 sm:flex-none"
      >
        {datosCliente
          ? "Imprimir mis protocolos"
          : "Imprimir instrucciones"}
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Imprimir instrucciones por período"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900">
                {datosCliente
                  ? "Mis protocolos para imprimir"
                  : "Imprimir instrucciones"}
              </h2>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                Cerrar
              </button>
            </div>

            <p className="mt-2 text-sm text-gray-600">
              {datosCliente
                ? "Selecciona un período. El PDF incluirá las actividades principales y adicionales que correspondan."
                : "Selecciona un período. Se incluirán juntos todos los protocolos adicionales que correspondan."}
            </p>

            {cargando ? (
              <p className="mt-5 text-sm text-gray-600">
                Cargando protocolos...
              </p>
            ) : !datos ? (
              <p className="mt-5 text-sm text-red-700">
                No se pudieron cargar los datos. Cierra e inténtalo nuevamente.
              </p>
            ) : periodos.length === 0 ? (
              <p className="mt-5 text-sm text-gray-600">
                No hay actividades disponibles para imprimir
                en este seguimiento.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="periodo-instrucciones"
                    className="mb-1 block text-sm font-semibold"
                  >
                    Período
                  </label>
                  <select
                    id="periodo-instrucciones"
                    value={indice}
                    onChange={(e) => setIndice(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-3 text-sm"
                  >
                    {periodos.map((p, i) => (
                      <option key={`${p.inicio}-${p.fin}`} value={i}>
                        Días {p.inicio} al {p.fin}
                        {" - "}
                        {p.protocolos.length} protocolo(s)
                      </option>
                    ))}
                  </select>
                </div>

                {periodos[Number(indice)] && (
                  <div className="rounded-xl bg-gray-50 p-3 text-sm">
                    <p className="mb-2 font-semibold">
                      Protocolos incluidos:
                    </p>
                    {periodos[Number(indice)].protocolos.map((p) => (
                      <p key={p.id} className="py-1 text-gray-700">
                        {p.hora ? `${p.hora} - ` : ""}
                        {p.titulo}
                      </p>
                    ))}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="frase-instrucciones"
                    className="mb-1 block text-sm font-semibold"
                  >
                    Frase motivadora
                  </label>
                  <textarea
                    id="frase-instrucciones"
                    rows={3}
                    value={frase}
                    onChange={(e) => setFrase(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-3 text-sm"
                    placeholder="Opcional"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Puedes editarla antes de cada impresión.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={generando}
                  onClick={() => void descargar()}
                  className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {generando
                    ? "Generando PDF..."
                    : "Descargar PDF para imprimir"}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
