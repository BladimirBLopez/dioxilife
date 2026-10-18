"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Copy,
  MessageCircle,
  Send,
} from "lucide-react";

type Pregunta = {
  id: string;
  texto: string;
  opciones: string[];
};

type Seccion = {
  titulo: string;
  descripcion: string;
  preguntas: Pregunta[];
};

const WHATSAPP = "59169356292";

const secciones: Seccion[] = [
  {
    "titulo": "1. Publicación automática de protocolos",
    "descripcion": "Definir cómo se entregarán las nuevas instrucciones.",
    "preguntas": [
      {
        "id": "p1",
        "texto": "Si llega el día de una nueva etapa y el cliente tiene actividades pendientes, ¿qué debe ocurrir?",
        "opciones": [
          "Publicar la nueva etapa aunque existan pendientes",
          "Esperar hasta que complete las actividades anteriores",
          "Avisar al administrador para que decida"
        ]
      },
      {
        "id": "p2",
        "texto": "Si el seguimiento está pausado cuando corresponde publicar una etapa, ¿qué debe pasar?",
        "opciones": [
          "Mantenerla pendiente hasta reactivar el seguimiento",
          "Publicarla igualmente",
          "Solicitar una decisión del administrador"
        ]
      },
      {
        "id": "p3",
        "texto": "¿A qué hora deben aparecer automáticamente las nuevas instrucciones?",
        "opciones": [
          "A las 00:00, hora de Bolivia",
          "A una hora elegida por el administrador",
          "A la hora en que comenzó el seguimiento"
        ]
      },
      {
        "id": "p4",
        "texto": "Si falla la publicación automática, ¿qué debe hacer el sistema?",
        "opciones": [
          "Reintentar y avisar al administrador",
          "Esperar a que el administrador publique manualmente",
          "Enviar una alerta y esperar instrucciones"
        ]
      }
    ]
  },
  {
    "titulo": "2. Cambios y control de etapas",
    "descripcion": "Definir cómo manejar modificaciones y fechas.",
    "preguntas": [
      {
        "id": "p5",
        "texto": "¿Se podrán modificar actividades de una etapa programada que todavía no fue publicada?",
        "opciones": [
          "Sí, hasta el momento de publicación",
          "Sí, conservando un historial de cambios",
          "Primero se debe cancelar su programación"
        ]
      },
      {
        "id": "p6",
        "texto": "Si dos etapas tienen actividades para los mismos días, ¿qué debe ocurrir?",
        "opciones": [
          "Bloquear las etapas superpuestas",
          "Permitir ambas simultáneamente",
          "Advertir y dejar decidir al administrador"
        ]
      },
      {
        "id": "p7",
        "texto": "Si se reduce la duración del seguimiento y existen etapas futuras, ¿qué debe pasar?",
        "opciones": [
          "Ajustar automáticamente las etapas futuras",
          "Bloquear el cambio hasta revisar las etapas",
          "Solicitar confirmación para cancelar las etapas afectadas"
        ]
      },
      {
        "id": "p8",
        "texto": "¿Hasta cuándo podrá completar el cliente actividades de días anteriores?",
        "opciones": [
          "En cualquier momento mientras siga activo",
          "Durante un plazo configurable",
          "Solo con autorización del administrador"
        ]
      }
    ]
  },
  {
    "titulo": "3. Cumplimiento y cierre del seguimiento",
    "descripcion": "Definir alertas, retrasos y finalización.",
    "preguntas": [
      {
        "id": "p9",
        "texto": "Si un cliente deja de registrar sus actividades, ¿cuándo debe generarse una alerta?",
        "opciones": [
          "Después de un día sin registros",
          "Después de tres días sin registros",
          "Después de una cantidad configurable de días"
        ]
      },
      {
        "id": "p10",
        "texto": "Si el cliente realiza una actividad fuera de la hora indicada, ¿cómo debe registrarse?",
        "opciones": [
          "Como realizada normalmente",
          "Como realizada, indicando el retraso",
          "Solo con autorización del administrador"
        ]
      },
      {
        "id": "p11",
        "texto": "Si llega el último día y todavía quedan actividades pendientes, ¿qué debe pasar?",
        "opciones": [
          "Finalizar en la fecha prevista y conservar los pendientes",
          "Mantener activo hasta que decida el administrador",
          "Permitir ampliar la duración del seguimiento"
        ]
      },
      {
        "id": "p12",
        "texto": "Antes de publicar una etapa, ¿desea revisar cómo la verá el cliente?",
        "opciones": [
          "Sí, siempre",
          "Sí, cuando el administrador lo solicite",
          "No, basta con revisar las actividades en el panel"
        ]
      }
    ]
  }
];

const todas = secciones.flatMap((s) => s.preguntas);

export default function CuestionarioTresPage() {
  const [nombre, setNombre] = useState("");
  const [respuestas, setRespuestas] =
    useState<Record<string, string>>({});
  const [comentarios, setComentarios] =
    useState<Record<string, string>>({});
  const [general, setGeneral] = useState("");
  const [copiado, setCopiado] = useState(false);

  const respondidas = todas.filter(
    (p) => Boolean(respuestas[p.id])
  ).length;

  const porcentaje = Math.round(
    (respondidas / todas.length) * 100
  );

  const hayContenido =
    respondidas > 0 ||
    general.trim().length > 0 ||
    Object.values(comentarios).some(
      (v) => v.trim().length > 0
    );

  function construirMensaje() {
    const lineas: string[] = [
      "*DIOXILIFE - CUESTIONARIO 3: DECISIONES PENDIENTES*",
      "",
      `Responsable: ${nombre.trim() || "No indicado"}`,
      `Respondidas: ${respondidas} de ${todas.length}`,
      "",
    ];

    for (const seccion of secciones) {
      lineas.push(
        `*${seccion.titulo.toUpperCase()}*`,
        ""
      );

      for (const pregunta of seccion.preguntas) {
        lineas.push(
          pregunta.texto,
          `Respuesta: ${
            respuestas[pregunta.id] || "Sin responder"
          }`
        );

        const nota = comentarios[pregunta.id]?.trim();

        if (nota) {
          lineas.push(`Comentario: ${nota}`);
        }

        lineas.push("");
      }
    }

    if (general.trim()) {
      lineas.push(
        "*COMENTARIO GENERAL*",
        general.trim()
      );
    }

    return lineas.join("\n");
  }

  function enviarWhatsApp() {
    if (!hayContenido) return;

    const texto = encodeURIComponent(
      construirMensaje()
    );

    window.location.href =
      `https://wa.me/${WHATSAPP}?text=${texto}`;
  }

  async function copiarRespuestas() {
    if (!hayContenido) return;

    try {
      await navigator.clipboard.writeText(
        construirMensaje()
      );
      setCopiado(true);
    } catch {
      alert(
        "No se pudo copiar automáticamente. Intenta abrir WhatsApp."
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-7 rounded-3xl bg-slate-900 p-6 text-white shadow-lg sm:p-9">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/20 p-3">
              <ClipboardList
                className="text-emerald-300"
                size={28}
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                DioxiLife Bolivia
              </p>
              <p className="text-sm text-slate-300">
                Tercera ronda de consultas
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
            Cuestionario 3: decisiones pendientes
            del seguimiento de clientes
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Selecciona la respuesta que mejor describa
            cómo deseas que funcione DioxiLife.
            También puedes explicar tu respuesta
            en el espacio de comentarios de cada pregunta.
          </p>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span>Progreso</span>
              <span className="font-bold">
                {respondidas} de {todas.length}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>
        </header>

        <div className="mb-7 rounded-2xl border border-slate-200 bg-white p-5">
          <label
            htmlFor="responsable"
            className="mb-2 block text-sm font-semibold"
          >
            Nombre del responsable (opcional)
          </label>
          <input
            id="responsable"
            value={nombre}
            maxLength={100}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Escribe tu nombre"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600"
          />
        </div>

        {secciones.map((seccion) => (
          <section
            key={seccion.titulo}
            className="mb-7"
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold">
                {seccion.titulo}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {seccion.descripcion}
              </p>
            </div>

            <div className="space-y-4">
              {seccion.preguntas.map((pregunta) => (
                <article
                  key={pregunta.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-start gap-3">
                    {respuestas[pregunta.id] ? (
                      <CheckCircle2
                        className="mt-0.5 shrink-0 text-emerald-600"
                        size={20}
                      />
                    ) : (
                      <MessageCircle
                        className="mt-0.5 shrink-0 text-slate-400"
                        size={20}
                      />
                    )}

                    <h3 className="font-semibold leading-6">
                      {pregunta.texto}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {pregunta.opciones.map(
                      (opcion, indice) => {
                        const seleccionada =
                          respuestas[pregunta.id] ===
                          opcion;

                        return (
                          <label
                            key={opcion}
                            htmlFor={`${pregunta.id}-${indice}`}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${
                              seleccionada
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              id={`${pregunta.id}-${indice}`}
                              type="radio"
                              name={pregunta.id}
                              checked={seleccionada}
                              onChange={() =>
                                setRespuestas((prev) => ({
                                  ...prev,
                                  [pregunta.id]:
                                    opcion,
                                }))
                              }
                              className="mt-1 accent-emerald-600"
                            />
                            <span>{opcion}</span>
                          </label>
                        );
                      }
                    )}
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <label
                      htmlFor={`comentario-${pregunta.id}`}
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Comentario adicional (opcional)
                    </label>

                    <textarea
                      id={`comentario-${pregunta.id}`}
                      rows={3}
                      maxLength={350}
                      value={
                        comentarios[pregunta.id] ?? ""
                      }
                      onChange={(e) =>
                        setComentarios((prev) => ({
                          ...prev,
                          [pregunta.id]:
                            e.target.value,
                        }))
                      }
                      placeholder="Puedes aclarar tu respuesta, dar un ejemplo o proponer otra idea..."
                      className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold">
            Observaciones generales
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            ¿Hay alguna función que no hayamos
            mencionado o algo que quieras explicar
            con más detalle?
          </p>
          <textarea
            value={general}
            onChange={(e) => setGeneral(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="Escribe aquí todas tus recomendaciones adicionales..."
            className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600"
          />
        </section>

        <footer className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold">
            Enviar tus respuestas
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Puedes enviar el formulario aunque no
            hayas respondido todas las preguntas.
            Los comentarios también se incluirán.
          </p>

          <button
            type="button"
            onClick={enviarWhatsApp}
            disabled={!hayContenido}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={19} />
            Enviar respuestas por WhatsApp
          </button>

          <button
            type="button"
            onClick={() => void copiarRespuestas()}
            disabled={!hayContenido}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 disabled:opacity-40"
          >
            <Copy size={18} />
            {copiado
              ? "Respuestas copiadas"
              : "Copiar preguntas y respuestas"}
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            WhatsApp abrirá el mensaje preparado.
            Debes pulsar Enviar para compartirlo.
            También puedes copiarlo manualmente.
          </p>
        </footer>
      </div>
    </main>
  );
}
