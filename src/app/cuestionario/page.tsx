"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
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

const TELEFONO = "59169356292";

const secciones: Seccion[] = [
  {
    titulo: "Protocolos por períodos",
    descripcion: "Cómo entregará las instrucciones a cada cliente.",
    preguntas: [
      {
        id: "p1",
        texto: "¿Cada cuántos días entregará nuevas instrucciones?",
        opciones: [
          "Cada 3 días",
          "Cada 7 días",
          "Dependerá de cada cliente",
          "Aún no lo he decidido",
        ],
      },
      {
        id: "p2",
        texto: "¿Cómo decidirá cuándo comienza el siguiente período?",
        opciones: [
          "Yo decidiré según cómo avance el cliente",
          "Quiero programar los períodos por adelantado",
          "Quiero disponer de ambas formas",
          "Aún no lo he decidido",
        ],
      },
      {
        id: "p3",
        texto: "¿El protocolo principal se mantendrá durante todo el seguimiento?",
        opciones: [
          "Sí, se mantendrá",
          "No, también cambiará por períodos",
          "Dependerá de cada cliente",
          "Aún no lo he decidido",
        ],
      },
      {
        id: "p4",
        texto: "¿Cómo debe enterarse el cliente de que tiene nuevas instrucciones?",
        opciones: [
          "Con un aviso en su página",
          "Por WhatsApp",
          "De ambas formas",
          "No necesita aviso",
        ],
      },
    ],
  },
  {
    titulo: "Impresión de protocolos",
    descripcion: "Qué documentos podrá descargar el cliente.",
    preguntas: [
      {
        id: "p5",
        texto: "¿Qué períodos podrá descargar o imprimir?",
        opciones: [
          "Solamente el período actual",
          "El actual y los períodos anteriores",
          "Todos los períodos y el seguimiento completo",
          "Aún no lo he decidido",
        ],
      },
      {
        id: "p6",
        texto: "¿Cómo deben aparecer las instrucciones en el PDF?",
        opciones: [
          "Protocolo principal y adicionales juntos",
          "Cada protocolo por separado",
          "Que el cliente pueda elegir",
          "Aún no lo he decidido",
        ],
      },
    ],
  },
  {
    titulo: "Observaciones del cliente",
    descripcion: "Cómo informará el cliente sobre su evolución.",
    preguntas: [
      {
        id: "p7",
        texto: "¿Cuándo podrá informar cómo se siente?",
        opciones: [
          "Todos los días",
          "Solamente cuando note un cambio",
          "En cualquier momento",
          "Aún no lo he decidido",
        ],
      },
      {
        id: "p8",
        texto: "¿Cómo le gustaría que informe su estado?",
        opciones: [
          "Marcando opciones como 'Me siento bien' o 'Tengo malestar'",
          "Escribiendo libremente cómo se siente",
          "Marcando una opción y pudiendo escribir más detalles",
          "Aún no lo he decidido",
        ],
      },
      {
        id: "p9",
        texto: "¿El cliente podrá adjuntar fotografías de su evolución?",
        opciones: [
          "Sí, una fotografía por registro",
          "Sí, varias fotografías por registro",
          "Por ahora no",
          "Aún no lo he decidido",
        ],
      },
      {
        id: "p10",
        texto: "¿El cliente podrá corregir sus observaciones después de enviarlas?",
        opciones: [
          "Sí, cuando lo necesite",
          "Solo durante el mismo día",
          "No, deben quedar como fueron enviadas",
          "Aún no lo he decidido",
        ],
      },
    ],
  },
  {
    titulo: "Avisos al administrador",
    descripcion: "Cómo quiere enterarse de las novedades de los clientes.",
    preguntas: [
      {
        id: "p11",
        texto: "¿Cuándo quiere recibir un aviso de un cliente?",
        opciones: [
          "Cuando informe algún malestar",
          "Cada vez que envíe una observación",
          "Cuando informe un malestar o agregue fotografías",
          "Aún no lo he decidido",
        ],
      },
      {
        id: "p12",
        texto: "¿Dónde desea recibir esos avisos?",
        opciones: [
          "En mi panel de DioxiLife",
          "Por WhatsApp",
          "En ambos lugares",
          "Aún no lo he decidido",
        ],
      },
      {
        id: "p13",
        texto: "¿Cómo quiere responder a las observaciones de los clientes?",
        opciones: [
          "Desde el mismo seguimiento",
          "Por WhatsApp",
          "De ambas formas",
          "Solo necesito consultar los registros",
        ],
      },
    ],
  },
];

const todas = secciones.flatMap((s) => s.preguntas);

export default function CuestionarioPage() {
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] =
    useState<Record<string, string>>({});
  const [nombre, setNombre] = useState("");
  const [comentarios, setComentarios] = useState("");

  const respondidas = todas.filter(
    (p) => Boolean(respuestas[p.id])
  ).length;

  const total = todas.length;
  const porcentaje = Math.round((respondidas / total) * 100);
  const seccion = secciones[paso];

  function irA(indice: number) {
    setPaso(indice);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function enviar() {
    if (respondidas === 0) return;

    const lineas = [
      "*DIOXILIFE - CUESTIONARIO DE MEJORAS*",
      "",
      `Responsable: ${nombre.trim() || "No indicado"}`,
      `Preguntas respondidas: ${respondidas} de ${total}`,
      "",
    ];

    for (const grupo of secciones) {
      lineas.push(`*${grupo.titulo.toUpperCase()}*`, "");

      for (const pregunta of grupo.preguntas) {
        lineas.push(
          pregunta.texto,
          `Respuesta: ${respuestas[pregunta.id] || "Pendiente"}`,
          ""
        );
      }
    }

    if (comentarios.trim()) {
      lineas.push(
        "*COMENTARIOS ADICIONALES*",
        comentarios.trim()
      );
    }

    const url =
      `https://wa.me/${TELEFONO}?text=` +
      encodeURIComponent(lineas.join("\n"));

    window.location.href = url;
  }

  return (
    <main className="min-h-screen bg-[#F8F7FC] px-4 py-6 text-gray-900">
      <div className="mx-auto max-w-3xl space-y-5">

        <header className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo DioxiLife"
              width={60}
              height={60}
              className="h-14 w-14 rounded-xl object-contain"
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
                DioxiLife Bolivia
              </p>
              <h1 className="text-xl font-extrabold">
                Cuestionario de mejoras
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-gray-600">
            Queremos conocer cómo desea organizar los protocolos,
            las observaciones de los clientes y los avisos.
            Seleccione una respuesta por pregunta.
          </p>

          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="font-semibold">
              Preguntas respondidas
            </span>
            <span className="font-bold text-violet-700">
              {respondidas}/{total}
            </span>
          </div>

          <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-violet-600 transition-all"
              style={{ width: `${porcentaje}%` }}
            />
          </div>

          <p className="mt-2 text-xs text-gray-500">
            {respondidas === total
              ? "¡Cuestionario completo!"
              : `Faltan ${total - respondidas} preguntas.`}
          </p>
        </header>

        <nav
          aria-label="Secciones del cuestionario"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {secciones.map((grupo, i) => {
            const hechas = grupo.preguntas.filter(
              (p) => Boolean(respuestas[p.id])
            ).length;

            const completa = hechas === grupo.preguntas.length;

            return (
              <button
                key={grupo.titulo}
                type="button"
                onClick={() => irA(i)}
                className={`rounded-2xl border p-3 text-left text-xs ${
                  paso === i
                    ? "border-violet-400 bg-violet-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <span className="mb-2 flex items-center justify-between">
                  <span className="font-bold">
                    Sección {i + 1}
                  </span>
                  {completa ? (
                    <CheckCircle2
                      size={18}
                      className="text-emerald-600"
                    />
                  ) : (
                    <ClipboardList size={18} />
                  )}
                </span>

                <span className="block font-semibold">
                  {grupo.titulo}
                </span>

                <span className="mt-1 block text-gray-500">
                  {hechas}/{grupo.preguntas.length} respondidas
                </span>
              </button>
            );
          })}
        </nav>

        <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
            Sección {paso + 1} de {secciones.length}
          </p>

          <h2 className="mt-2 text-xl font-bold">
            {seccion.titulo}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {seccion.descripcion}
          </p>

          <div className="mt-6 space-y-5">
            {seccion.preguntas.map((pregunta) => {
              const respuesta = respuestas[pregunta.id];

              return (
                <fieldset
                  key={pregunta.id}
                  className={`rounded-2xl border p-4 ${
                    respuesta
                      ? "border-emerald-200 bg-emerald-50/30"
                      : "border-gray-200"
                  }`}
                >
                  <legend className="px-1 text-sm font-bold leading-6">
                    {pregunta.texto}
                  </legend>

                  {respuesta && (
                    <p className="mb-3 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={16} />
                      Respondida
                    </p>
                  )}

                  <div className="space-y-2">
                    {pregunta.opciones.map((opcion) => {
                      const elegida = respuesta === opcion;

                      return (
                        <label
                          key={opcion}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-5 ${
                            elegida
                              ? "border-violet-400 bg-violet-50 text-violet-900"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name={pregunta.id}
                            checked={elegida}
                            onChange={() =>
                              setRespuestas((actuales) => ({
                                ...actuales,
                                [pregunta.id]: opcion,
                              }))
                            }
                            className="mt-1 accent-violet-700"
                          />
                          <span>{opcion}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>

          <div className="mt-7 flex justify-between gap-3">
            {paso > 0 ? (
              <button
                type="button"
                onClick={() => irA(paso - 1)}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold"
              >
                <ArrowLeft size={17} />
                Anterior
              </button>
            ) : (
              <span />
            )}

            {paso < secciones.length - 1 && (
              <button
                type="button"
                onClick={() => irA(paso + 1)}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white"
              >
                Siguiente
                <ArrowRight size={17} />
              </button>
            )}
          </div>
        </section>

        {paso === secciones.length - 1 && (
          <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-2">
              <MessageCircle className="text-violet-700" />
              <h2 className="text-lg font-bold">
                Revisar y enviar respuestas
              </h2>
            </div>

            <p className="mt-2 text-sm text-gray-600">
              Puede revisar sus respuestas antes de enviarlas.
              También puede dejar preguntas pendientes.
            </p>

            <label
              htmlFor="responsable"
              className="mt-5 block text-sm font-semibold"
            >
              Su nombre (opcional)
            </label>

            <input
              id="responsable"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={80}
              placeholder="Nombre del responsable"
              className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-sm"
            />

            <label
              htmlFor="comentarios"
              className="mt-5 block text-sm font-semibold"
            >
              Comentarios adicionales
            </label>

            <textarea
              id="comentarios"
              rows={3}
              maxLength={600}
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="¿Quiere explicar algo más?"
              className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-sm"
            />

            <details className="mt-5 rounded-xl border p-4">
              <summary className="cursor-pointer text-sm font-bold">
                Ver todas mis respuestas
              </summary>

              <div className="mt-4 space-y-3">
                {todas.map((pregunta) => (
                  <div key={pregunta.id}>
                    <p className="text-xs font-semibold">
                      {pregunta.texto}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {respuestas[pregunta.id] || "Pendiente"}
                    </p>
                  </div>
                ))}
              </div>
            </details>

            <button
              type="button"
              disabled={respondidas === 0}
              onClick={enviar}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-4 text-sm font-bold text-white disabled:opacity-50"
            >
              <Send size={18} />
              Enviar respuestas por WhatsApp
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-gray-500">
              Se abrirá WhatsApp con el mensaje preparado.
              Confirme allí el envío. Las respuestas no se
              guardan en la base de datos de DioxiLife.
            </p>
          </section>
        )}

        <p className="pb-5 text-center text-xs text-gray-400">
          DioxiLife · Cuestionario de mejoras
        </p>
      </div>
    </main>
  );
}
