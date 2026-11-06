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
    ultimoPeso?: number | null;
  };
  protocolos: Protocolo[];
};

type Periodo = {
  inicio: number;
  fin: number;
  protocolos: Protocolo[];
};

type RGB = [number, number, number];
type Tema = { fondo: RGB; borde: RGB; pildora: RGB };

const AZUL: RGB = [15, 45, 94];

const TEMAS: Record<string, Tema> = {
  ayunas: { fondo: [255, 248, 225], borde: [240, 190, 60], pildora: [214, 150, 0] },
  desayuno: { fondo: [236, 247, 237], borde: [120, 190, 130], pildora: [46, 125, 50] },
  almuerzo: { fondo: [255, 240, 230], borde: [240, 160, 110], pildora: [220, 100, 30] },
  cena: { fondo: [241, 236, 250], borde: [170, 150, 210], pildora: [103, 70, 170] },
  aviso: { fondo: [253, 236, 236], borde: [225, 100, 100], pildora: [190, 40, 40] },
  general: { fondo: [234, 243, 252], borde: [140, 180, 225], pildora: [25, 100, 190] },
};

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function elegirTema(p: Protocolo): Tema {
  const s = normalizar(`${p.momento ?? ""} ${p.titulo}`);
  if (s.includes("import")) return TEMAS.aviso;
  if (s.includes("desayun")) return TEMAS.desayuno;
  if (s.includes("ayun")) return TEMAS.ayunas;
  if (s.includes("almuerz")) return TEMAS.almuerzo;
  if (s.includes("cena")) return TEMAS.cena;
  return TEMAS.general;
}

// Separa texto corrido en líneas: viñetas, guiones al inicio y pasos "1. 2. 3."
function aLineas(texto: string): { t: string; viñeta: boolean }[] {
  const limpio = texto
    .replace(/\r/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s*•\s*/g, "\n• ")
    .replace(/ (\d{1,2})\.\s+(?=[A-ZÁÉÍÓÚÑ])/g, "\n$1. ")
    .replace(/^\s*[-–]\s*/gm, "• ");

  return limpio
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) =>
      l.startsWith("• ")
        ? { t: l.slice(2).trim(), viñeta: true }
        : { t: l, viñeta: false }
    )
    .filter((l) => l.t.length > 0);
}

function limpiarIndicacion(texto: string): string {
  return texto.replace(/^[\s\-–]+/, "").trim();
}

function tieneContenido(p: Protocolo): boolean {
  return (
    !!p.descripcion?.trim() ||
    p.indicaciones.some((i) => i.texto.trim().length > 0)
  );
}

function obtenerPeriodos(datos: Datos): Periodo[] {
  const total = datos.cliente.duracionDias;

  if (!Number.isInteger(total) || total < 1) {
    return [];
  }

  const validos = datos.protocolos.filter(
    (p) =>
      tieneContenido(p) &&
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
      const margen = 14;
      const LH = 4.6;
      const xPildora = margen;
      const wPildora = 22;
      const xTarjeta = margen + wPildora + 4;
      const wTarjeta = ancho - margen - xTarjeta;
      const pie = 18;
      let y = 0;

      const rango = `${periodo.inicio} al ${periodo.fin}`;
      const nombre = datos.cliente.nombreCliente || "Sin nombre";
      const peso =
        datos.cliente.ultimoPeso != null
          ? `${datos.cliente.ultimoPeso} kg`
          : "________ kg";

      function nuevaPagina() {
        doc.addPage();
        doc.setFillColor(...AZUL);
        doc.rect(0, 0, ancho, 12, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(
          `DioxiLife · Mi protocolo · ${nombre} · Días ${rango}`,
          margen,
          7.5
        );
        y = 20;
      }

      function asegurar(espacio: number) {
        if (y + espacio > alto - pie) nuevaPagina();
      }

      // ---------- Cabecera ----------
      doc.setFillColor(...AZUL);
      doc.rect(0, 0, ancho, 34, "F");

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margen, 6, 22, 22, 3, 3, "F");

      if (logo) {
        try {
          doc.addImage(logo, "PNG", margen + 1, 7, 20, 20);
        } catch {
          // continúa sin logo
        }
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("Mi protocolo", margen + 28, 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("DioxiLife · Instrucciones del seguimiento", margen + 28, 25);
      doc.text("WhatsApp +591 70758200", ancho - margen, 25, { align: "right" });

      y = 42;

      // ---------- Tarjeta del cliente ----------
      doc.setFillColor(240, 246, 253);
      doc.setDrawColor(140, 180, 225);
      doc.roundedRect(margen, y, ancho - margen * 2, 26, 3, 3, "FD");

      const mitad = margen + (ancho - margen * 2) / 2;

      function dato(etiqueta: string, valor: string, x: number, yy: number) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(etiqueta.toUpperCase(), x, yy);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        const recorte = doc.splitTextToSize(valor, mitad - margen - 8) as string[];
        doc.text(recorte[0] ?? "", x, yy + 5);
      }

      dato("Nombre", nombre, margen + 5, y + 7);
      dato("Plan", datos.cliente.nombrePlan, mitad, y + 7);
      dato("Período", `Días ${rango}`, margen + 5, y + 18);
      dato("Peso (último registro)", peso, mitad, y + 18);

      y += 32;

      // ---------- Filas ordenadas por hora ----------
      const ordenados = [...periodo.protocolos].sort(
        (a, b) =>
          (a.hora || "99:99").localeCompare(b.hora || "99:99") ||
          a.orden - b.orden
      );

      // ---------- Resumen del día ----------
      asegurar(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...AZUL);
      doc.text("Resumen del día", margen, y);
      y += 3;
      doc.setDrawColor(...AZUL);
      doc.setLineWidth(0.5);
      doc.line(margen, y, margen + 40, y);
      doc.setLineWidth(0.2);
      y += 6;

      for (const p of ordenados) {
        asegurar(7);
        const etiqueta = p.hora || (p.momento ?? "").slice(0, 10) || "—";
        const t = elegirTema(p);

        doc.setFillColor(...t.pildora);
        doc.roundedRect(xPildora, y - 4, wPildora, 5.8, 2.5, 2.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(etiqueta, xPildora + wPildora / 2, y, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        const linea = (
          doc.splitTextToSize(p.titulo, wTarjeta - 8) as string[]
        )[0];
        doc.text(linea ?? "", xTarjeta, y);

        doc.setDrawColor(120);
        doc.rect(ancho - margen - 4, y - 3.4, 3.6, 3.6);
        y += 7;
      }

      y += 6;

      // ---------- Línea de tiempo ----------
      asegurar(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...AZUL);
      doc.text("Tu día paso a paso", margen, y);
      y += 3;
      doc.setDrawColor(...AZUL);
      doc.setLineWidth(0.5);
      doc.line(margen, y, margen + 40, y);
      doc.setLineWidth(0.2);
      y += 7;

      type Linea = {
        t: string;
        x: number;
        negrita: boolean;
        tam: number;
        color: RGB;
        marca: boolean;
      };

      const wTexto = wTarjeta - 12;

      function construirLineas(p: Protocolo, t: Tema): Linea[] {
        const out: Linea[] = [];

        function agregar(
          texto: string,
          opciones: { negrita?: boolean; tam?: number; color?: RGB; viñeta?: boolean }
        ) {
          const tam = opciones.tam ?? 9.5;
          const sangria = opciones.viñeta ? 4 : 0;
          doc.setFont("helvetica", opciones.negrita ? "bold" : "normal");
          doc.setFontSize(tam);
          const partes = doc.splitTextToSize(texto, wTexto - sangria) as string[];
          partes.forEach((parte, i) => {
            out.push({
              t: parte,
              x: 3 + sangria,
              negrita: !!opciones.negrita,
              tam,
              color: opciones.color ?? [30, 30, 30],
              marca: !!opciones.viñeta && i === 0,
            });
          });
        }

        agregar(p.titulo, { negrita: true, tam: 11.5, color: t.pildora });

        const sub = [p.momento, p.hora]
          .filter((x): x is string => !!x && x.trim().length > 0)
          .filter((x) => normalizar(x) !== normalizar(p.titulo))
          .join(" · ");
        if (sub) agregar(sub, { tam: 8.5, color: [110, 110, 110] });

        if (p.descripcion?.trim()) {
          for (const l of aLineas(p.descripcion)) {
            agregar(l.t, { viñeta: l.viñeta });
          }
        }

        const inds = [...p.indicaciones].sort(
          (a, b) =>
            (a.hora ?? "").localeCompare(b.hora ?? "") ||
            a.orden - b.orden
        );

        for (const ind of inds) {
          const texto = limpiarIndicacion(ind.texto);
          if (!texto) continue;
          if (ind.hora) {
            agregar(ind.hora, { negrita: true, tam: 9.5, color: t.pildora });
          }
          for (const l of aLineas(texto)) {
            agregar(l.t, { viñeta: true });
          }
        }

        return out;
      }

      for (const p of ordenados) {
        const t = elegirTema(p);
        const lineas = construirLineas(p, t);
        let i = 0;
        let primera = true;

        while (i < lineas.length) {
          const disponible = alto - pie - y;
          const capacidad = Math.floor((disponible - 6) / LH);

          if (capacidad < 4) {
            nuevaPagina();
            continue;
          }

          const n = Math.min(capacidad, lineas.length - i);
          const h = n * LH + 6;

          doc.setFillColor(...t.fondo);
          doc.setDrawColor(...t.borde);
          doc.roundedRect(xTarjeta, y, wTarjeta, h, 3, 3, "FD");

          if (primera) {
            const etiqueta = p.hora || (p.momento ?? "").slice(0, 10) || "—";
            doc.setFillColor(...t.pildora);
            doc.roundedRect(xPildora, y + 1, wPildora, 7, 3, 3, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.text(etiqueta, xPildora + wPildora / 2, y + 5.9, {
              align: "center",
            });

            doc.setDrawColor(100);
            doc.rect(xTarjeta + wTarjeta - 7, y + 2.5, 4, 4);
          }

          for (let k = 0; k < n; k++) {
            const l = lineas[i + k];
            doc.setFont("helvetica", l.negrita ? "bold" : "normal");
            doc.setFontSize(l.tam);
            doc.setTextColor(...l.color);
            const yy = y + 5.2 + k * LH;
            if (l.marca) doc.text("•", xTarjeta + l.x - 3, yy);
            doc.text(l.t, xTarjeta + l.x, yy);
          }

          y += h + 4;
          i += n;
          primera = false;
        }
      }

      // ---------- Frase motivadora ----------
      if (frase.trim()) {
        const partes = doc.splitTextToSize(
          frase.trim(),
          ancho - margen * 2 - 12
        ) as string[];
        const h = partes.length * 6 + 10;
        asegurar(h + 4);
        y += 2;
        doc.setFillColor(...AZUL);
        doc.roundedRect(margen, y, ancho - margen * 2, h, 3, 3, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        partes.forEach((l, k) => {
          doc.text(l, ancho / 2, y + 8 + k * 6, { align: "center" });
        });
        y += h + 4;
      }

      // ---------- Pie ----------
      const paginas = doc.getNumberOfPages();

      for (let i = 1; i <= paginas; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(110, 110, 110);
        doc.text(
          `DioxiLife | Página ${i} de ${paginas}`,
          margen,
          alto - 10
        );
        doc.text("WhatsApp +591 70758200", ancho - margen, alto - 10, { align: "right" });
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
