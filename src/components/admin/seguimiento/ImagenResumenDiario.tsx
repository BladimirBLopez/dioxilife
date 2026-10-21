"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Indicacion = {
  id: string;
  hora: string;
  texto: string;
  orden: number;
  activo: boolean;
  completado: boolean;
};

type Actividad = {
  id: string;
  tipo: "TAREA" | "INFORMACION" | "CONTROL";
  titulo: string;
  descripcion: string | null;
  momento: string | null;
  hora: string | null;
  orden: number;
  activo: boolean;
  completado: boolean | null;
  indicaciones: Indicacion[];
};

type DatosDia = {
  seguimiento: {
    id: string;
    nombreCliente: string | null;
    nombrePlan: string;
  };
  registro: {
    peso: number | null;
  };
  actividades: Actividad[];
  resumen: {
    realizadas: number;
    total: number;
  };
};

type Evento = {
  titulo: string;
  detalle: string;
  hora: string | null;
  momento: string | null;
  completado: boolean | null;
  clase: string;
  orden: number;
};

type Tarjeta = {
  evento: Evento;
  titulo: string[];
  detalle: string[];
  alto: number;
};

type ImagenLista = {
  url: string;
  archivo: File;
};

const ANCHO = 1080;
const INICIO = 330;
const PIE = 125;
const LIMITE = 6800;

function minutos(hora: string | null) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(
    (hora || "").trim()
  );

  if (!match) return 9999;

  const h = Number(match[1]);
  const m = Number(match[2]);

  return h < 24 && m < 60
    ? h * 60 + m
    : 9999;
}

function crearEventos(datos: DatosDia): Evento[] {
  const eventos: Evento[] = [];

  for (const actividad of datos.actividades) {
    if (!actividad.activo) continue;

    const orden = Number.isFinite(actividad.orden)
      ? actividad.orden
      : 0;

    eventos.push({
      titulo: actividad.titulo || "Actividad",
      detalle: actividad.descripcion || "",
      hora: actividad.hora,
      momento: actividad.momento,
      completado: actividad.completado,
      clase:
        actividad.tipo === "INFORMACION"
          ? "Información"
          : actividad.tipo === "CONTROL"
            ? "Control"
            : "Actividad",
      orden: orden * 10000,
    });

    for (const indicacion of actividad.indicaciones || []) {
      if (!indicacion.activo) continue;

      eventos.push({
        titulo: `Indicación · ${actividad.titulo || "Actividad"}`,
        detalle: indicacion.texto || "",
        hora: indicacion.hora || actividad.hora,
        momento: actividad.momento,
        completado: indicacion.completado,
        clase: "Indicación",
        orden:
          orden * 10000 +
          (Number.isFinite(indicacion.orden)
            ? indicacion.orden
            : 0) +
          1,
      });
    }
  }

  return eventos.sort(
    (a, b) =>
      minutos(a.hora) - minutos(b.hora) ||
      a.orden - b.orden
  );
}

function envolver(
  ctx: CanvasRenderingContext2D,
  texto: string,
  ancho: number,
  fuente: string
) {
  ctx.font = fuente;

  const lineas: string[] = [];

  for (const parrafo of texto.replace(/\r/g, "").split("\n")) {
    let linea = "";

    for (const palabra of parrafo.trim().split(/\s+/).filter(Boolean)) {
      const propuesta = linea
        ? `${linea} ${palabra}`
        : palabra;

      if (ctx.measureText(propuesta).width <= ancho) {
        linea = propuesta;
        continue;
      }

      if (linea) lineas.push(linea);

      linea = "";

      for (const caracter of palabra) {
        if (
          linea &&
          ctx.measureText(linea + caracter).width > ancho
        ) {
          lineas.push(linea);
          linea = "";
        }

        linea += caracter;
      }
    }

    if (linea) lineas.push(linea);
  }

  return lineas;
}

function maquetar(
  ctx: CanvasRenderingContext2D,
  eventos: Evento[]
): Tarjeta[] {
  return eventos.map((evento) => {
    const titulo = envolver(
      ctx,
      evento.titulo,
      890,
      "bold 34px Arial"
    );

    const detalle = envolver(
      ctx,
      [evento.momento, evento.detalle]
        .filter(Boolean)
        .join("\n"),
      890,
      "29px Arial"
    );

    return {
      evento,
      titulo,
      detalle,
      alto:
        100 +
        Math.max(1, titulo.length) * 44 +
        (detalle.length
          ? 14 + detalle.length * 38
          : 0) +
        28,
    };
  });
}

async function cargarLogo(): Promise<HTMLImageElement | null> {
  return new Promise((resolver) => {
    const img = new Image();

    img.onload = () => resolver(img);
    img.onerror = () => resolver(null);
    img.src = "/logo.png";
  });
}

function dibujarTarjeta(
  ctx: CanvasRenderingContext2D,
  tarjeta: Tarjeta,
  y: number
) {
  const x = 55;
  const { evento, alto } = tarjeta;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, 970, alto);

  ctx.fillStyle = "#0f766e";
  ctx.fillRect(x, y, 7, alto);

  ctx.font = "bold 26px Arial";
  ctx.fillStyle = "#176d69";

  const hora = minutos(evento.hora) === 9999
    ? "SIN HORARIO"
    : evento.hora || "";

  ctx.fillText(
    `${hora} · ${evento.clase.toUpperCase()}`,
    x + 30,
    y + 45,
    665
  );

  ctx.textAlign = "right";

  ctx.fillStyle =
    evento.completado === null
      ? "#64748b"
      : evento.completado
        ? "#15803d"
        : "#a16207";

  ctx.fillText(
    evento.completado === null
      ? "INFORMATIVA"
      : evento.completado
        ? "REALIZADA"
        : "PENDIENTE",
    x + 940,
    y + 45,
    230
  );

  ctx.textAlign = "left";

  let ty = y + 97;

  ctx.font = "bold 34px Arial";
  ctx.fillStyle = "#102b3b";

  for (const linea of tarjeta.titulo) {
    ctx.fillText(linea, x + 30, ty);
    ty += 44;
  }

  if (tarjeta.detalle.length) {
    ty += 7;

    ctx.font = "29px Arial";
    ctx.fillStyle = "#475569";

    for (const linea of tarjeta.detalle) {
      ctx.fillText(linea, x + 30, ty);
      ty += 38;
    }
  }
}

async function crearImagenes(
  datos: DatosDia,
  dia: number,
  incluirPeso: boolean
): Promise<Blob[]> {
  const medida = document.createElement("canvas");
  const medidaCtx = medida.getContext("2d");

  if (!medidaCtx) {
    throw new Error(
      "Este navegador no permite generar imágenes."
    );
  }

  const eventos = crearEventos(datos);
  const tarjetas = maquetar(medidaCtx, eventos);

  const paginas: Tarjeta[][] = [[]];

  let usado = 0;

  for (const tarjeta of tarjetas) {
    if (tarjeta.alto + 20 > LIMITE - INICIO - PIE) {
      throw new Error(
        "Una indicación es demasiado extensa para una imagen. Revisa su texto."
      );
    }

    if (
      usado + tarjeta.alto + 20 >
        LIMITE - INICIO - PIE &&
      paginas[paginas.length - 1].length
    ) {
      paginas.push([]);
      usado = 0;
    }

    paginas[paginas.length - 1].push(tarjeta);
    usado += tarjeta.alto + 20;
  }

  if (paginas.length > 20) {
    throw new Error(
      "La agenda tiene demasiadas páginas para exportar de una vez."
    );
  }

  const logo = await cargarLogo();
  const resultado: Blob[] = [];

  for (let i = 0; i < paginas.length; i++) {
    const lista = paginas[i];

    const contenido = lista.reduce(
      (s, t) => s + t.alto + 20,
      0
    );

    const canvas = document.createElement("canvas");

    canvas.width = ANCHO;
    canvas.height = Math.max(
      750,
      INICIO + contenido + PIE
    );

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No se pudo crear la imagen.");
    }

    ctx.fillStyle = "#f0f5f5";
    ctx.fillRect(0, 0, ANCHO, canvas.height);

    ctx.fillStyle = "#103b45";
    ctx.fillRect(0, 0, ANCHO, 118);

    if (logo) {
      try {
        ctx.drawImage(logo, 54, 20, 78, 78);
      } catch {
        // El logo es opcional.
      }
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px Arial";

    ctx.fillText(
      "DioxiLife Bolivia",
      logo ? 155 : 58,
      74
    );

    ctx.font = "26px Arial";
    ctx.textAlign = "right";

    ctx.fillText(
      `Página ${i + 1} de ${paginas.length}`,
      1020,
      72
    );

    ctx.textAlign = "left";
    ctx.fillStyle = "#102b3b";
    ctx.font = "bold 38px Arial";

    ctx.fillText(
      `Agenda del día ${dia}`,
      58,
      172
    );

    ctx.font = "30px Arial";

    ctx.fillText(
      `Cliente: ${datos.seguimiento.nombreCliente || "Sin nombre"}`,
      58,
      220,
      965
    );

    ctx.font = "25px Arial";
    ctx.fillStyle = "#475569";

    ctx.fillText(
      `Plan: ${datos.seguimiento.nombrePlan}`,
      58,
      262,
      965
    );

    const avance =
      datos.resumen &&
      typeof datos.resumen.total === "number"
        ? `Avance registrado: ${datos.resumen.realizadas}/${datos.resumen.total}`
        : "Resumen de actividades";

    const peso =
      incluirPeso && datos.registro?.peso != null
        ? `  ·  Peso registrado: ${datos.registro.peso} kg`
        : "";

    ctx.fillText(
      avance + peso,
      58,
      303,
      965
    );

    let y = INICIO;

    for (const tarjeta of lista) {
      dibujarTarjeta(ctx, tarjeta, y);
      y += tarjeta.alto + 20;
    }

    if (tarjetas.length === 0) {
      ctx.font = "30px Arial";
      ctx.fillStyle = "#475569";

      ctx.fillText(
        "No hay actividades programadas para este día.",
        58,
        425,
        950
      );
    }

    const fecha = new Intl.DateTimeFormat(
      "es-BO",
      {
        timeZone: "America/La_Paz",
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(new Date());

    ctx.fillStyle = "#475569";
    ctx.font = "23px Arial";

    ctx.fillText(
      `Generado: ${fecha} (Bolivia)`,
      58,
      canvas.height - 73
    );

    ctx.font = "22px Arial";

    ctx.fillText(
      "Documento privado. Comparte únicamente con el destinatario autorizado.",
      58,
      canvas.height - 34,
      965
    );

    const blob = await new Promise<Blob>(
      (resolver, rechazar) => {
        canvas.toBlob(
          (b) =>
            b
              ? resolver(b)
              : rechazar(
                  new Error(
                    "No se pudo exportar el PNG."
                  )
                ),
          "image/png"
        );
      }
    );

    resultado.push(blob);
  }

  return resultado;
}

export default function ImagenResumenDiario({
  seguimientoId,
  duracionDias,
  diaInicial,
}: {
  seguimientoId: string;
  duracionDias: number;
  diaInicial: number;
}) {
  const inicial = Math.min(
    Math.max(1, diaInicial),
    Math.max(1, duracionDias)
  );

  const [dia, setDia] = useState(inicial);
  const [incluirPeso, setIncluirPeso] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagenes, setImagenes] = useState<ImagenLista[]>([]);

  const imagenesRef = useRef<ImagenLista[]>([]);
  const turnoRef = useRef(0);

  const limpiar = useCallback(() => {
    for (const imagen of imagenesRef.current) {
      URL.revokeObjectURL(imagen.url);
    }

    imagenesRef.current = [];
    setImagenes([]);
  }, []);

  useEffect(
    () => () => {
      turnoRef.current++;

      for (const imagen of imagenesRef.current) {
        URL.revokeObjectURL(imagen.url);
      }

      imagenesRef.current = [];
    },
    []
  );

  function cambiarDia(valor: number) {
    turnoRef.current++;
    limpiar();
    setGenerando(false);
    setError(null);
    setDia(valor);
  }

  function cambiarPeso(valor: boolean) {
    turnoRef.current++;
    limpiar();
    setGenerando(false);
    setError(null);
    setIncluirPeso(valor);
  }

  async function generar() {
    const turno = ++turnoRef.current;

    limpiar();
    setError(null);
    setGenerando(true);

    try {
      const respuesta = await fetch(
        `/api/admin/seguimiento/clientes/${encodeURIComponent(seguimientoId)}/registro-diario/${dia}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const datos = await respuesta
        .json()
        .catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          datos?.error ||
            "No se pudo consultar la agenda."
        );
      }

      if (
        !datos?.seguimiento ||
        !Array.isArray(datos.actividades)
      ) {
        throw new Error(
          "La agenda del día no tiene un formato válido."
        );
      }

      const blobs = await crearImagenes(
        datos as DatosDia,
        dia,
        incluirPeso
      );

      if (turno !== turnoRef.current) return;

      const nuevas = blobs.map((blob, i) => ({
        url: URL.createObjectURL(blob),
        archivo: new File(
          [blob],
          `dioxilife-dia-${dia}-${i + 1}.png`,
          { type: "image/png" }
        ),
      }));

      imagenesRef.current = nuevas;
      setImagenes(nuevas);
    } catch (e) {
      if (turno === turnoRef.current) {
        setError(
          e instanceof Error
            ? e.message
            : "No se pudo generar la imagen."
        );
      }
    } finally {
      if (turno === turnoRef.current) {
        setGenerando(false);
      }
    }
  }

  async function compartir() {
    const archivos = imagenesRef.current.map(
      (i) => i.archivo
    );

    if (!archivos.length) return;

    try {
      if (
        typeof navigator.share !== "function" ||
        (
          typeof navigator.canShare === "function" &&
          !navigator.canShare({ files: archivos })
        )
      ) {
        setError(
          "Este dispositivo no permite compartir imágenes directamente. Descarga el PNG y adjúntalo en WhatsApp."
        );
        return;
      }

      setError(null);

      await navigator.share({
        files: archivos,
        title: "DioxiLife Bolivia · Agenda diaria",
        text: `Resumen de actividades del día ${dia}.`,
      });
    } catch (e) {
      if (
        e instanceof Error &&
        e.name === "AbortError"
      ) {
        return;
      }

      setError(
        "No se pudo abrir el menú de compartir. Descarga la imagen y envíala manualmente."
      );
    }
  }

  return (
    <section className="rounded-xl border border-teal-100 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-lg font-bold text-slate-900">
        Imagen diaria para WhatsApp
      </h3>

      <p className="mt-1 text-sm text-slate-600">
        Genera una imagen con las actividades y las indicaciones
        guardadas para el día seleccionado.
        No se modifica ningún registro del cliente.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Día del seguimiento

          <select
            value={dia}
            onChange={(e) =>
              cambiarDia(Number(e.target.value))
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          >
            {Array.from(
              { length: Math.max(1, duracionDias) },
              (_, i) => i + 1
            ).map((n) => (
              <option key={n} value={n}>
                Día {n}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={generando}
          onClick={() => void generar()}
          className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {generando
            ? "Generando imagen..."
            : "Generar imagen del día"}
        </button>
      </div>

      <label className="mt-3 flex items-start gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={incluirPeso}
          onChange={(e) =>
            cambiarPeso(e.target.checked)
          }
          className="mt-1"
        />

        Incluir peso registrado ese día (dato privado, opcional).
      </label>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
        >
          {error}
        </p>
      )}

      {imagenes.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-medium text-slate-700">
            Vista previa · {imagenes.length}{" "}
            {imagenes.length === 1
              ? "imagen"
              : "imágenes"}.
            La vista es una copia del momento en que la generaste.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void compartir()}
              className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white"
            >
              Compartir imagen
            </button>

            {imagenes.map((img, i) => (
              <a
                key={img.url}
                href={img.url}
                download={img.archivo.name}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
              >
                Descargar PNG{" "}
                {imagenes.length > 1 ? i + 1 : ""}
              </a>
            ))}
          </div>

          <p className="text-xs text-slate-500">
            Verifica el contenido y el destinatario antes de
            compartir información privada.
            El envío por WhatsApp requiere tu confirmación.
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            {imagenes.map((img, i) => (
              <img
                key={img.url}
                src={img.url}
                alt={`Vista previa de la agenda, página ${i + 1}`}
                className="h-auto w-full rounded-lg border border-slate-200"
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
