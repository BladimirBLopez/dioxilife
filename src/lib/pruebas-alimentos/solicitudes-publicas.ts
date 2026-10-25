import { z } from "zod";

import {
  iniciarRegistroAlimentoSchema,
  fechaPruebaSchema,
  horaPruebaSchema,
  glucosaPruebaSchema,
} from "./validaciones";

/**
 * Pruebas de alimentos - DioxiLife Bolivia.
 *
 * Validaciones para futuras solicitudes POST.
 *
 * IMPORTANTE:
 * Este archivo NO habilita ninguna API.
 * No consulta clientes ni bases de datos.
 *
 * Antes de utilizar estas funciones, la futura
 * ruta deberá realizar la limitación de intentos
 * y autorización del enlace.
 */

export const MAX_BYTES_SOLICITUD_PRUEBA = 4096;

export type MotivoSolicitudInvalida =
  | "metodo"
  | "origen"
  | "contenido"
  | "tamano"
  | "json"
  | "datos";

export class SolicitudPublicaInvalida extends Error {
  constructor(
    public readonly motivo: MotivoSolicitudInvalida
  ) {
    super("Solicitud de prueba no válida");

    this.name = "SolicitudPublicaInvalida";
  }
}

const completarSolicitudSchema = z.strictObject({
  registroId: z.string().regex(
    /^[A-Za-z0-9_-]{5,128}$/
  ),
  fechaMedicionReal: fechaPruebaSchema,
  horaMedicionDespues: horaPruebaSchema,
  glucosaDespues: glucosaPruebaSchema,
});

/**
 * Defensa adicional contra peticiones iniciadas
 * desde otras páginas web.
 *
 * No sustituye la validación del token ni
 * constituye autenticación por sí misma.
 */
function verificarOrigen(solicitud: Request) {
  if (solicitud.method !== "POST") {
    throw new SolicitudPublicaInvalida("metodo");
  }

  const origen =
    solicitud.headers.get("origin");

  if (!origen) {
    throw new SolicitudPublicaInvalida("origen");
  }

  try {
    const esperado = new URL(
      solicitud.url
    ).origin;

    const recibido = new URL(
      origen
    );

    if (
      recibido.origin !== origen ||
      recibido.origin !== esperado
    ) {
      throw new Error("Origen diferente");
    }
  } catch {
    throw new SolicitudPublicaInvalida("origen");
  }

  const contexto =
    solicitud.headers.get("sec-fetch-site");

  if (
    contexto !== null &&
    contexto !== "same-origin"
  ) {
    throw new SolicitudPublicaInvalida("origen");
  }
}

/**
 * Lee un máximo de 4096 bytes directamente
 * del flujo, sin utilizar Request.json().
 *
 * La cabecera content-length es una comprobación
 * adicional, no el único control de tamaño.
 */
async function leerJSONLimitado(
  solicitud: Request
): Promise<unknown> {
  verificarOrigen(solicitud);

  const tipo =
    solicitud.headers.get("content-type");

  if (
    !tipo ||
    !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
      tipo.trim()
    )
  ) {
    throw new SolicitudPublicaInvalida(
      "contenido"
    );
  }

  const codificacion =
    solicitud.headers.get("content-encoding");

  if (
    codificacion &&
    codificacion.toLowerCase() !== "identity"
  ) {
    throw new SolicitudPublicaInvalida(
      "contenido"
    );
  }

  const largo =
    solicitud.headers.get("content-length");

  if (largo !== null) {
    if (!/^\d+$/.test(largo.trim())) {
      throw new SolicitudPublicaInvalida(
        "contenido"
      );
    }

    if (
      Number(largo.trim()) >
      MAX_BYTES_SOLICITUD_PRUEBA
    ) {
      throw new SolicitudPublicaInvalida(
        "tamano"
      );
    }
  }

  if (!solicitud.body) {
    throw new SolicitudPublicaInvalida(
      "contenido"
    );
  }

  const lector = solicitud.body.getReader();
  const bloques: Uint8Array[] = [];

  let total = 0;

  try {
    while (true) {
      const parte = await lector.read();

      if (parte.done) {
        break;
      }

      total += parte.value.byteLength;

      if (
        total > MAX_BYTES_SOLICITUD_PRUEBA
      ) {
        throw new SolicitudPublicaInvalida(
          "tamano"
        );
      }

      bloques.push(parte.value);
    }
  } catch (error) {
    if (error instanceof SolicitudPublicaInvalida) {
      throw error;
    }

    throw new SolicitudPublicaInvalida(
      "contenido"
    );
  } finally {
    lector.releaseLock();
  }

  if (total === 0) {
    throw new SolicitudPublicaInvalida(
      "contenido"
    );
  }

  const bytes = new Uint8Array(total);
  let posicion = 0;

  for (const bloque of bloques) {
    bytes.set(bloque, posicion);
    posicion += bloque.byteLength;
  }

  try {
    const texto = new TextDecoder(
      "utf-8",
      { fatal: true }
    ).decode(bytes);

    return JSON.parse(texto) as unknown;
  } catch {
    throw new SolicitudPublicaInvalida("json");
  }
}

/**
 * Valida el formulario para iniciar una prueba.
 *
 * No acepta clienteId ni tokenAccesoHash
 * dentro del cuerpo JSON.
 */
export async function leerSolicitudInicioPrueba(
  solicitud: Request
) {
  const entrada = await leerJSONLimitado(
    solicitud
  );

  const resultado =
    iniciarRegistroAlimentoSchema.safeParse(
      entrada
    );

  if (!resultado.success) {
    throw new SolicitudPublicaInvalida(
      "datos"
    );
  }

  return resultado.data;
}

/**
 * Valida la segunda medición.
 *
 * registroId identifica la prueba solicitada;
 * la futura API deberá comprobar que pertenece
 * al cliente autorizado por el enlace.
 */
export async function leerSolicitudCompletarPrueba(
  solicitud: Request
) {
  const entrada = await leerJSONLimitado(
    solicitud
  );

  const resultado =
    completarSolicitudSchema.safeParse(
      entrada
    );

  if (!resultado.success) {
    throw new SolicitudPublicaInvalida(
      "datos"
    );
  }

  return resultado.data;
}
