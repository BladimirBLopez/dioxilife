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
    titulo: "1. Entrega de protocolos por etapas",
    descripcion:
      "Definir cómo recibirá las instrucciones cada cliente.",
    preguntas: [
      {
        id: "p1",
        texto:
          "¿Cómo desea organizar las etapas de un seguimiento de 90 días?",
        opciones: [
          "Una secuencia base de 3, 7, 15 días y luego variable",
          "Una duración diferente para cada cliente",
          "Una secuencia base que pueda modificarse",
        ],
      },
      {
        id: "p2",
        texto:
          "Cuando comience una nueva etapa, ¿qué debe ver el cliente?",
        opciones: [
          "Solamente la etapa actual",
          "La etapa actual y un historial de las anteriores",
          "Que el administrador pueda decidir",
        ],
      },
      {
        id: "p3",
        texto:
          "¿Qué debe pasar con las actividades de una etapa anterior?",
        opciones: [
          "Terminar cuando finalice esa etapa",
          "Continuar hasta su fecha final",
          "Decidir por cada actividad cuáles continúan",
        ],
      },
      {
        id: "p4",
        texto:
          "Si modifica instrucciones ya enviadas, ¿qué debe ocurrir?",
        opciones: [
          "Avisar al cliente e indicar qué cambió",
          "Avisar sin mostrar los detalles del cambio",
          "Actualizar sin enviar un aviso adicional",
        ],
      },
      {
        id: "p5",
        texto:
          "Al entregar una nueva etapa, ¿cómo debe funcionar el enlace?",
        opciones: [
          "Utilizar siempre el mismo enlace del cliente",
          "Crear un enlace nuevo por etapa",
          "Disponer de ambas posibilidades",
        ],
      },
    ],
  },
  {
    titulo: "2. Mediciones y gráficas",
    descripcion:
      "Definir qué datos registrará el cliente y con qué frecuencia.",
    preguntas: [
      {
        id: "p6",
        texto:
          "¿Qué mediciones debe poder registrar el cliente?",
        opciones: [
          "Peso, cintura y glucosa",
          "Elegir qué mediciones necesita cada cliente",
          "Peso y cintura; glucosa solamente cuando corresponda",
        ],
      },
      {
        id: "p7",
        texto:
          "¿Con qué frecuencia debe registrar sus mediciones?",
        opciones: [
          "Todos los días",
          "Solamente en los días indicados",
          "Cuando el cliente lo considere necesario",
          "Combinar días programados y registros libres",
        ],
      },
      {
        id: "p8",
        texto:
          "¿En qué momento del día debe introducir las mediciones?",
        opciones: [
          "Por la mañana",
          "En cualquier momento, indicando la hora",
          "Según lo que indique el administrador",
        ],
      },
      {
        id: "p9",
        texto:
          "¿Cómo desea consultar las gráficas de evolución?",
        opciones: [
          "Una gráfica por cada medición",
          "Comparar los resultados entre etapas",
          "Ambas posibilidades",
        ],
      },
    ],
  },
  {
    titulo: "3. Comentarios y estado del cliente",
    descripcion:
      "Definir cómo podrá comunicar su evolución y posibles malestares.",
    preguntas: [
      {
        id: "p10",
        texto:
          "¿Qué opciones rápidas debe ver el cliente para informar cómo se siente?",
        opciones: [
          "Bien, mejorando, con malestar y otro",
          "Una lista detallada de síntomas o molestias",
          "Opciones sencillas y detalles adicionales",
        ],
      },
      {
        id: "p11",
        texto:
          "¿Desea permitir mensajes de voz además de comentarios y fotografías?",
        opciones: [
          "Sí, desde el inicio",
          "Sí, pero en una segunda etapa del desarrollo",
          "No, solo texto y fotografías",
        ],
      },
      {
        id: "p12",
        texto:
          "¿Cómo debe señalarse un reporte que necesita atención rápida?",
        opciones: [
          "El cliente podrá marcarlo como importante",
          "El sistema lo destacará según el tipo de malestar",
          "Disponer de ambas posibilidades",
        ],
      },
    ],
  },
  {
    titulo: "4. Alertas y atención administrativa",
    descripcion:
      "Definir quién revisará los reportes y cómo se gestionarán.",
    preguntas: [
      {
        id: "p13",
        texto:
          "¿Quiénes atenderán los avisos de los clientes?",
        opciones: [
          "Únicamente el dueño o administrador principal",
          "El administrador y asistentes autorizados",
          "Un responsable asignado a cada cliente",
        ],
      },
      {
        id: "p14",
        texto:
          "¿Qué estados necesita para organizar las alertas?",
        opciones: [
          "Pendiente, leída y resuelta",
          "Pendiente, en atención y resuelta",
          "Poder personalizar los estados",
        ],
      },
      {
        id: "p15",
        texto:
          "¿Quién podrá consultar los comentarios, mediciones y fotografías privadas?",
        opciones: [
          "Solo el administrador principal",
          "Administrador y asistentes autorizados",
          "Definir permisos según cada cliente",
        ],
      },
    ],
  },
];

const todas = secciones.flatMap((s) => s.preguntas);

export default function CuestionarioEtapasPage() {
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
      "*DIOXILIFE - CUESTIONARIO DE ETAPAS Y ALERTAS*",
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
                Segunda ronda de consultas
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
            Cuestionario de etapas,
            mediciones y alertas
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
