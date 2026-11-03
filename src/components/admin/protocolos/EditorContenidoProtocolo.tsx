"use client";

import { useState } from "react";

import {
  FORMATO_PROTOCOLO,
  MAX_SECCIONES_PROTOCOLO,
  guardarContenidoProtocolo,
  leerContenidoProtocolo,
  type DocumentoProtocolo,
  type SeccionProtocolo,
} from "@/lib/protocolos-contenido";

type Props = {
  value: string;
  onChange: (valor: string) => void;
  disabled?: boolean;
  onCambiosBorrador?: (hay: boolean) => void;
};

function organizarBloquesOriginales(
  texto: string
): SeccionProtocolo[] | null {
  const bloques = texto
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n+/)
    .filter((bloque) => bloque.trim().length > 0);

  if (bloques.length > MAX_SECCIONES_PROTOCOLO) {
    return null;
  }

  return bloques.map((bloque) => {
    const primeraLinea = bloque.split("\n")[0];

    const encabezado = primeraLinea.match(
      /^([^:\n]{2,45}):\s*/
    );

    return {
      titulo:
        encabezado?.[1].trim() ||
        "Pendiente de clasificar",
      contenido: bloque,
    };
  });
}

function textoVistaPrevia(
  seccion: SeccionProtocolo
): string {
  const encabezado = seccion.contenido.match(
    /^([^:\n]{2,45}):[ \t]*/
  );

  if (
    encabezado &&
    encabezado[1].trim() === seccion.titulo
  ) {
    return seccion.contenido.slice(
      encabezado[0].length
    );
  }

  return seccion.contenido;
}

const TIPOS_SECCION: string[] = [
  "Objetivo",
  "Instrucciones",
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
    /dosis/.test(t) ? "gota" :
    /instruccion/.test(t) ? "instrucciones" :
    /advertencia|seguridad|consideracion/.test(t) ? "escudo" :
    /evidencia|referencia/.test(t) ? "libro" :
    /pregunta/.test(t) ? "pregunta" :
    /caracteristica/.test(t) ? "lista" :
    /informacion/.test(t) ? "informacion" :
    "documento";

  const rutas: Record<string, string> = {
    gota: "M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12Z",
    instrucciones: "M7 3h10v4h3v14H4V7h3M9 3v4h6V3M8 12h8M8 16h8",
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
  onCambiosBorrador,
}: Props) {
  const [abiertos, setAbiertos] = useState<number[]>([]);
  const [titulosPrevios, setTitulosPrevios] =
    useState<Record<number, string>>({});
    const [resumenAnterior, setResumenAnterior] = useState("");
    const [avisoAnterior, setAvisoAnterior] = useState("");
  const lectura = leerContenidoProtocolo(value);


    if (lectura.tipo === "anterior") {
      const bloquesOriginales =
        organizarBloquesOriginales(value);

      const vistaPrevia = bloquesOriginales?.map(
        (seccion, indice) => ({
          ...seccion,
          titulo:
            titulosPrevios[indice] ?? seccion.titulo,
        })
      ) ?? null;

      const pendientes = vistaPrevia?.filter(
        (s) =>
          !s.titulo.trim() ||
          s.titulo.trim().toLowerCase() ===
            "pendiente de clasificar"
      ).length ?? 0;

      return (
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#25143C]">
                Vista previa de apartados
              </h3>

              {vistaPrevia !== null && (
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                  {vistaPrevia.length} apartados detectados
                  {" · "}
                  {pendientes} por revisar
                </span>
              )}
            </div>

            {vistaPrevia === null ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                El contenido supera el límite de apartados.
                No se ha dividido ni modificado.
              </p>
            ) : (
              <>
                {vistaPrevia.map((seccion, indice) => (
                  <details
                    key={indice}
                    className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                      <IconoSeccionAdmin
                        titulo={seccion.titulo}
                      />

                      <span className="min-w-0 flex-1 break-words text-sm font-semibold text-[#25143C]">
                        {seccion.titulo}
                      </span>

                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 shrink-0 text-gray-400 group-open:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </summary>

                    <div className="space-y-3 border-t border-gray-100 px-4 py-3">
                      <div>
                        <label className="admin-label">
                          Nombre del apartado
                        </label>
                        <input
                          type="text"
                          value={seccion.titulo}
                          onChange={(e) => {
                            setTitulosPrevios(
                              (actual) => ({
                                ...actual,
                                [indice]: e.target.value,
                              })
                            );
                            onCambiosBorrador?.(true);
                          }}
                          disabled={disabled}
                          className="admin-input"
                          aria-label={
                            "Nombre del apartado " +
                            (indice + 1)
                          }
                        />
                      </div>

                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#514B5C]">
                        {textoVistaPrevia(
                          bloquesOriginales?.[indice] ??
                          seccion
                        )}
                      </p>
                    </div>
                  </details>
                ))}
              </>
            )}
          </div>

          <div>
            <label className="admin-label">
              Descripción breve
            </label>
            <textarea
              value={resumenAnterior}
              onChange={(e) => {
                setResumenAnterior(e.target.value);
                onCambiosBorrador?.(true);
              }}
              disabled={disabled}
              rows={3}
              className="admin-input"
              placeholder="Escribe una descripción breve del protocolo"
            />
          </div>

          <div>
            <label className="admin-label">
              Aviso debajo de la portada
            </label>
            <textarea
              value={avisoAnterior}
              onChange={(e) => {
                setAvisoAnterior(e.target.value);
                onCambiosBorrador?.(true);
              }}
              disabled={disabled}
              rows={4}
              className="admin-input"
              placeholder="Información de seguridad verificada"
            />
          </div>

          <div>
            <label className="admin-label">
              Contenido original
            </label>
            <textarea
              value={value}
              onChange={(e) => {
                setTitulosPrevios({});
                onCambiosBorrador?.(
                  Boolean(
                    resumenAnterior.trim() ||
                    avisoAnterior.trim()
                  )
                );
                onChange(e.target.value);
              }}
              disabled={disabled}
              rows={8}
              className="admin-input"
            />
            <p className="mt-2 text-xs text-gray-500">
              El texto original se mantiene editable.
              Revisa la exactitud y seguridad de la información
              antes de organizarla o publicarla.
            </p>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const originales =
                organizarBloquesOriginales(value);

              const secciones = originales?.map(
                (seccion, indice) => ({
                  ...seccion,
                  titulo:
                    titulosPrevios[indice] ??
                    seccion.titulo,
                })
              ) ?? null;

              if (secciones === null) {
                alert(
                  "Este contenido supera el límite de " +
                  MAX_SECCIONES_PROTOCOLO + " bloques. " +
                  "No se ha realizado la conversión para " +
                  "evitar mezclar información."
                );
                return;
              }

              if (
                secciones.some(
                  (s) => s.titulo === "Pendiente de clasificar"
                )
              ) {
                alert(
                  "Hay apartados pendientes de clasificar. " +
                  "Revisa sus títulos y contenidos antes de guardar."
                );
              }

              const documento: DocumentoProtocolo = {
                formato: FORMATO_PROTOCOLO,
                resumen: resumenAnterior,
                seguridad: avisoAnterior,
                secciones,
                textoOriginal: value,
              };

              onChange(
                guardarContenidoProtocolo(documento)
              );
              setTitulosPrevios({});
              onCambiosBorrador?.(false);
            }}
            className="rounded-xl border border-brand-pink px-4 py-3 text-sm font-semibold text-brand-pink transition-colors hover:bg-pink-50 disabled:opacity-50"
          >
            Organizar en apartados
          </button>

          <p className="text-xs leading-relaxed text-gray-500">
            La descripción y el aviso se incluirán al organizar
            el contenido. Revisa los apartados antes de guardar.
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
          Descripción breve
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
                    Nombre específico del apartado
                  </label>
                  <input
                    type="text"
                    value={seccion.titulo}
                    onChange={(e) =>
                      actualizarSeccion(indice, {
                        titulo: e.target.value,
                      })
                    }
                    disabled={disabled}
                    className="admin-input"
                    placeholder="Nombre del apartado"
                  />
                </div>

                <div>
                  <label className="admin-label">
                    Contenido de la sección
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
                      if (seccion.contenido.trim()) {
                        alert(
                          "Esta sección contiene información. " +
                          "Para evitar una eliminación accidental, " +
                          "no se puede borrar directamente. " +
                          "Puedes editar su título o moverla."
                        );
                        return;
                      }

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


          <div className="space-y-2">
            <label
              htmlFor="agregar-tipo-protocolo"
              className="admin-label"
            >
              Agregar nueva sección
            </label>

            <select
              id="agregar-tipo-protocolo"
              value=""
              onChange={(e) => {
                const titulo = e.target.value;

                if (
                  !titulo ||
                  disabled ||
                  documento.secciones.length >= MAX_SECCIONES_PROTOCOLO ||
                  documento.secciones.some(
                    (item) => item.titulo === titulo
                  )
                ) {
                  return;
                }

                setAbiertos((actual) => [
                  ...actual,
                  documento.secciones.length,
                ]);

                actualizar({
                  secciones: [
                    ...documento.secciones,
                    { titulo, contenido: "" },
                  ],
                });
              }}
              disabled={
                disabled || documento.secciones.length >= MAX_SECCIONES_PROTOCOLO
              }
              className="admin-input"
            >
              <option value="">
                + Selecciona el tipo de sección
              </option>

              {TIPOS_SECCION.map((tipo) => (
                <option
                  key={tipo}
                  value={tipo}
                  disabled={documento.secciones.some(
                    (item) => item.titulo === tipo
                  )}
                >
                  {tipo}
                </option>
              ))}
            </select>

            <p className="text-xs text-gray-500">
              Al seleccionar un tipo se creará la sección
              y se abrirá automáticamente para editarla.
            </p>
          </div>
      </div>



      <p className="text-xs text-gray-500">
        Los cambios solo serán definitivos después
        de guardar el formulario.
      </p>
    </div>
  );
}
