"use client";

import { useState } from "react";

import {
  FORMATO_PROTOCOLO,
  guardarContenidoProtocolo,
  leerContenidoProtocolo,
  type DocumentoProtocolo,
  type SeccionProtocolo,
} from "@/lib/protocolos-contenido";

type Props = {
  value: string;
  onChange: (valor: string) => void;
  disabled?: boolean;
};

function organizarBloquesOriginales(
  texto: string
): SeccionProtocolo[] {
  const bloques = texto
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n+/)
    .filter((bloque) => bloque.trim().length > 0);

  // Conservar todos los bloques incluso si hay muchos.
  const grupos = bloques.slice(0, 39);

  if (bloques.length > 39) {
    grupos.push(bloques.slice(39).join("\n\n"));
  }

  return grupos.map((bloque, indice) => {
    const primeraLinea = bloque.split("\n")[0];

    const encabezado = primeraLinea.match(
      /^([^:\n]{2,45}):\s*/
    );

    return {
      titulo:
        encabezado?.[1].trim() ||
        `Información adicional ${indice + 1}`,
      contenido: bloque.trim(),
    };
  });
}


const TIPOS_SECCION: string[] = [
  "Objetivo",
  "Descripción",
  "Información general",
  "Características",
  "Consideraciones",
  "Advertencias y seguridad",
  "Evidencia científica",
  "Preguntas frecuentes",
  "Referencias"
];


function IconoSeccionAdmin({ titulo }: { titulo: string }) {
  const t = titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const tipo =
    /objetivo/.test(t) ? "objetivo" :
    /advertencia|seguridad|consideracion/.test(t) ? "escudo" :
    /evidencia|referencia/.test(t) ? "libro" :
    /pregunta/.test(t) ? "pregunta" :
    /caracteristica/.test(t) ? "lista" :
    /informacion/.test(t) ? "informacion" :
    "documento";

  const rutas: Record<string, string> = {
    escudo: "M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Zm0 6v5m0 3h.01",
    libro: "M3 5c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 1-3-2-6-2-9-1V5Zm9 1v15",
    pregunta: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4m.1 3h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18",
    lista: "M9 6h12M9 12h12M9 18h12M3 6h2M3 12h2M3 18h2",
    informacion: "M12 11v5m0-8h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18",
    documento: "M6 3h9l4 4v14H6V3Zm9 0v4h4M9 12h7M9 16h7",
  };

  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {tipo === "objetivo" ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1" />
          </>
        ) : (
          <path d={rutas[tipo]} />
        )}
      </svg>
    </span>
  );
}

export default function EditorContenidoProtocolo({
  value,
  onChange,
  disabled = false,
}: Props) {
  const [abiertos, setAbiertos] = useState<number[]>([]);
  const lectura = leerContenidoProtocolo(value);

  if (lectura.tipo === "anterior") {
    return (
      <div className="space-y-3">
        <div>
          <label className="admin-label">
            Aviso debajo de la portada
          </label>

          <textarea
            value=""
            onChange={(e) => {
              const texto = lectura.texto.trim();
              const secciones = organizarBloquesOriginales(texto);

              const documento: DocumentoProtocolo = {
                formato: FORMATO_PROTOCOLO,
                resumen:
                  "Información del protocolo pendiente de revisión editorial.",
                seguridad: e.target.value,
                secciones,
                textoOriginal: lectura.texto,
              };

              onChange(guardarContenidoProtocolo(documento));
            }}
            disabled={disabled}
            rows={3}
            placeholder="Escribe aquí el aviso que aparecerá debajo de la portada"
            className="admin-input"
          />
          <p className="mt-1 text-xs text-gray-500">
            Al editar este campo se organiza el contenido existente
            sin eliminar el texto original.
          </p>
        </div>

        <label className="admin-label">
          Contenido original
        </label>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={7}
          className="admin-input"
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const documento: DocumentoProtocolo = {
              formato: FORMATO_PROTOCOLO,
              resumen: "",
              seguridad: "",
              secciones: organizarBloquesOriginales(value),
              textoOriginal: value,
            };

            onChange(
              guardarContenidoProtocolo(documento)
            );
          }}
          className="rounded-lg border border-brand-pink px-3 py-2 text-sm font-semibold text-brand-pink disabled:opacity-50"
        >
          Organizar en apartados
        </button>

        <p className="text-xs text-gray-500">
          El contenido existente se conservará.
          Puedes cancelar sin guardar.
        </p>
      </div>
    );
  }

  const documento = lectura.documento;

  function actualizar(
    cambios: Partial<DocumentoProtocolo>
  ) {
    onChange(
      guardarContenidoProtocolo({
        ...documento,
        ...cambios,
      })
    );
  }

  function actualizarSeccion(
    indice: number,
    cambios: Partial<SeccionProtocolo>
  ) {
    actualizar({
      secciones: documento.secciones.map((item, i) =>
        i === indice ? { ...item, ...cambios } : item
      ),
    });
  }

  function mover(indice: number, direccion: number) {
    const destino = indice + direccion;
    const lista = [...documento.secciones];

    if (destino < 0 || destino >= lista.length) return;

    [lista[indice], lista[destino]] = [
      lista[destino],
      lista[indice],
    ];

    setAbiertos((actual) =>
        actual.map((i) =>
          i === indice ? destino : i === destino ? indice : i
        )
      );

      actualizar({ secciones: lista });
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="admin-label">
          Resumen principal
        </label>
        <textarea
          value={documento.resumen}
          onChange={(e) =>
            actualizar({ resumen: e.target.value })
          }
          disabled={disabled}
          rows={3}
          className="admin-input"
          placeholder="Descripción breve del protocolo"
        />
      </div>

      <div>
        <label className="admin-label">
          Aviso debajo de la portada
        </label>
        <textarea
          value={documento.seguridad}
          onChange={(e) =>
            actualizar({ seguridad: e.target.value })
          }
          disabled={disabled}
          rows={4}
          className="admin-input"
          placeholder="Información de seguridad verificada"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">
          Apartados del protocolo
        </h3>


          {documento.secciones.map((seccion, indice) => (
            <details
                key={indice}
                open={abiertos.includes(indice)}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <summary
                  className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden"
                  onClick={(e) => {
                    e.preventDefault();
                    setAbiertos((actual) =>
                      actual.includes(indice)
                        ? actual.filter((i) => i !== indice)
                        : [...actual, indice]
                    );
                  }}
                >
                <IconoSeccionAdmin titulo={seccion.titulo} />

                <span className="min-w-0 flex-1 break-words text-sm font-semibold text-[#25143C]">
                  {seccion.titulo.trim() || "Sección sin nombre"}
                </span>

                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>

              <div className="space-y-3 border-t border-gray-100 px-4 pb-4 pt-4">
                <div>
                  <label className="admin-label">
                    Tipo de sección
                  </label>
                  <select
                    value={seccion.titulo}
                    onChange={(e) =>
                      actualizarSeccion(indice, {
                        titulo: e.target.value,
                      })
                    }
                    disabled={disabled}
                    className="admin-input"
                    aria-label={"Tipo de sección " + (indice + 1)}
                  >
                    {!TIPOS_SECCION.includes(seccion.titulo) && (
                      <option value={seccion.titulo}>
                        {seccion.titulo || "Seleccionar sección"}
                      </option>
                    )}
                    {TIPOS_SECCION.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="admin-label">
                    Descripción
                  </label>
                  <textarea
                    value={seccion.contenido}
                    onChange={(e) =>
                      actualizarSeccion(indice, {
                        contenido: e.target.value,
                      })
                    }
                    disabled={disabled}
                    rows={5}
                    className="admin-input"
                    placeholder="Escribe el contenido de esta sección"
                    aria-label={"Descripción de sección " + (indice + 1)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    disabled={disabled || indice === 0}
                    onClick={() => mover(indice, -1)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium disabled:opacity-30"
                  >
                    ↑ Subir
                  </button>

                  <button
                    type="button"
                    disabled={disabled || indice === documento.secciones.length - 1}
                    onClick={() => mover(indice, 1)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium disabled:opacity-30"
                  >
                    ↓ Bajar
                  </button>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setAbiertos((actual) =>
                        actual
                          .filter((i) => i !== indice)
                          .map((i) => i > indice ? i - 1 : i)
                      );

                      actualizar({
                        secciones: documento.secciones.filter(
                          (_, i) => i !== indice
                        ),
                      });
                    }}
                    className="ml-auto rounded-lg px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-30"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </details>
          ))}

        <button
          type="button"
          disabled={
            disabled || documento.secciones.length >= 40
          }
          onClick={() => {
              setAbiertos((actual) => [
                ...actual,
                documento.secciones.length,
              ]);

              actualizar({
                secciones: [
                  ...documento.secciones,
                  { titulo: "", contenido: "" },
                ],
              });
            }}
          className="rounded-lg border border-brand-pink px-3 py-2 text-sm font-semibold text-brand-pink disabled:opacity-50"
        >
          + Añadir apartado
        </button>
      </div>



      <p className="text-xs text-gray-500">
        Los cambios solo serán definitivos después
        de guardar el formulario.
      </p>
    </div>
  );
}
