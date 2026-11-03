"use client";

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

export default function EditorContenidoProtocolo({
  value,
  onChange,
  disabled = false,
}: Props) {
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
          <div
            key={indice}
            className="rounded-xl border border-gray-200 p-3 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">
                Apartado {indice + 1}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={disabled || indice === 0}
                  onClick={() => mover(indice, -1)}
                  className="text-sm disabled:opacity-30"
                  aria-label="Subir apartado"
                >
                  ↑
                </button>

                <button
                  type="button"
                  disabled={
                    disabled ||
                    indice === documento.secciones.length - 1
                  }
                  onClick={() => mover(indice, 1)}
                  className="text-sm disabled:opacity-30"
                  aria-label="Bajar apartado"
                >
                  ↓
                </button>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    actualizar({
                      secciones:
                        documento.secciones.filter(
                          (_, i) => i !== indice
                        ),
                    })
                  }
                  className="text-sm font-medium text-red-600 disabled:opacity-30"
                >
                  Quitar
                </button>
              </div>
            </div>

            <input
              value={seccion.titulo}
              onChange={(e) =>
                actualizarSeccion(indice, {
                  titulo: e.target.value,
                })
              }
              disabled={disabled}
              className="admin-input"
              placeholder="Título del apartado"
            />

            <textarea
              value={seccion.contenido}
              onChange={(e) =>
                actualizarSeccion(indice, {
                  contenido: e.target.value,
                })
              }
              disabled={disabled}
              rows={4}
              className="admin-input"
              placeholder="Información del apartado"
            />
          </div>
        ))}

        <button
          type="button"
          disabled={
            disabled || documento.secciones.length >= 40
          }
          onClick={() =>
            actualizar({
              secciones: [
                ...documento.secciones,
                { titulo: "", contenido: "" },
              ],
            })
          }
          className="rounded-lg border border-brand-pink px-3 py-2 text-sm font-semibold text-brand-pink disabled:opacity-50"
        >
          + Añadir apartado
        </button>
      </div>

      {documento.textoOriginal && (
        <details open className="rounded-lg border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Información original completa (solo administrador)
          </summary>
          <p className="mt-3 text-xs text-gray-600">
            Se conserva todo el contenido original.
            Revisa cada bloque antes de incorporarlo
            a los apartados públicos.
          </p>

          <div className="mt-3 space-y-2">
            {documento.textoOriginal
              .split(/\r?\n/)
              .map((bloque) => bloque.trim())
              .filter(Boolean)
              .map((bloque, indice) => (
                <div
                  key={indice}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                >
                  <p className="mb-1 text-xs font-semibold text-gray-600">
                    Bloque original {indice + 1}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm text-gray-800">
                    {bloque}
                  </p>
                </div>
              ))}
          </div>

          <textarea
            readOnly
            rows={7}
            value={documento.textoOriginal}
            className="admin-input mt-3"
          />
        </details>
      )}

      <p className="text-xs text-gray-500">
        Los cambios solo serán definitivos después
        de guardar el formulario.
      </p>
    </div>
  );
}
