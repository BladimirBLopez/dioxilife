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
    "titulo": "1. Seguimientos pausados",
    "descripcion": "Definir las reglas de las pausas.",
    "preguntas": [
      {
        "id": "p1",
        "texto": "Si una etapa se publica mientras el seguimiento está pausado, ¿qué debe ver el cliente?",
        "opciones": [
          "La nueva etapa inmediatamente",
          "La nueva etapa cuando se reactive el seguimiento"
        ]
      },
      {
        "id": "p2",
        "texto": "Si un seguimiento de 30 días se pausa durante 5 días, ¿qué debe pasar?",
        "opciones": [
          "Los 30 días siguen contando normalmente",
          "Los días de pausa no cuentan y las fechas se recorren"
        ]
      },
      {
        "id": "p3",
        "texto": "Mientras esté pausado, ¿el cliente podrá completar actividades?",
        "opciones": [
          "Sí, normalmente",
          "No, solamente podrá consultar información",
          "El administrador decidirá por cliente"
        ]
      }
    ]
  },
  {
    "titulo": "2. Edición y publicación de etapas",
    "descripcion": "Definir aprobaciones y modificaciones.",
    "preguntas": [
      {
        "id": "p4",
        "texto": "Antes de programar una etapa automática, ¿cómo desea aprobarla?",
        "opciones": [
          "Revisar la vista previa y aprobar una vez",
          "Revisar al programar y volver a aprobar antes de publicar"
        ]
      },
      {
        "id": "p5",
        "texto": "Si se modifica una etapa programada y aprobada, ¿qué debe pasar?",
        "opciones": [
          "Guardar el historial y mantener la programación",
          "Solicitar una nueva revisión y aprobación"
        ]
      },
      {
        "id": "p6",
        "texto": "¿Se podrán modificar actividades de una etapa publicada?",
        "opciones": [
          "Sí, solamente actividades futuras",
          "Sí, también anteriores, sin borrar los registros",
          "No, las etapas publicadas no podrán modificarse"
        ]
      },
      {
        "id": "p7",
        "texto": "¿Quién podrá consultar el historial de cambios?",
        "opciones": [
          "Solamente el administrador",
          "El administrador y el cliente cuando corresponda"
        ]
      },
      {
        "id": "p8",
        "texto": "Si dos etapas tienen actividades el mismo día, ¿cómo deben mostrarse?",
        "opciones": [
          "Separadas por etapa",
          "Unidas por horario, identificando cada etapa"
        ]
      },
      {
        "id": "p9",
        "texto": "Si se reduce la duración y una etapa futura queda fuera del plazo, ¿qué hacer?",
        "opciones": [
          "Cancelar la etapa conservando su registro",
          "Reubicarla dentro del nuevo plazo",
          "Solicitar una decisión al administrador"
        ]
      }
    ]
  },
  {
    "titulo": "3. Actividades, retrasos y alertas",
    "descripcion": "Definir cumplimiento e inactividad.",
    "preguntas": [
      {
        "id": "p10",
        "texto": "Si una actividad se marca después del horario, ¿cómo determinar cuándo se realizó?",
        "opciones": [
          "Usar la hora en que el cliente pulsa Realizada",
          "Preguntar a qué hora la realizó realmente"
        ]
      },
      {
        "id": "p11",
        "texto": "¿El cliente podrá corregir una actividad de un día anterior?",
        "opciones": [
          "Sí, mientras su seguimiento esté activo",
          "Una vez registrada, solo el administrador podrá corregirla"
        ]
      },
      {
        "id": "p12",
        "texto": "¿Cómo deben funcionar los avisos cuando un cliente deja de registrar actividades?",
        "opciones": [
          "Un aviso por cada período de inactividad",
          "Un aviso cada día mientras continúe inactivo",
          "Aviso inicial y alerta más importante si continúa"
        ]
      },
      {
        "id": "p13",
        "texto": "Si un día no hay actividades previstas, ¿debe considerarse inactividad?",
        "opciones": [
          "No, solo cuando existan registros previstos",
          "Sí, debe registrar información todos los días"
        ]
      }
    ]
  },
  {
    "titulo": "4. Finalización del seguimiento",
    "descripcion": "Definir acceso al historial.",
    "preguntas": [
      {
        "id": "p14",
        "texto": "Al finalizar el seguimiento, ¿qué debe pasar con el acceso del cliente?",
        "opciones": [
          "Consultar su historial sin registrar nuevas actividades",
          "Desactivar el enlace y permitir acceso solo al administrador",
          "Que el administrador decida si conserva acceso de consulta"
        ]
      }
    ]
  }
];

const todas = secciones.flatMap((s) => s.preguntas);

export default function CuestionarioCuatroPage() {
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
      "*DIOXILIFE - CUESTIONARIO 4: ACLARACIONES FINALES*",
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
                Cuarta ronda de consultas
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
            Cuestionario 4: aclaraciones finales
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
