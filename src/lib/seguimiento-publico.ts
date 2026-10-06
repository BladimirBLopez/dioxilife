import { createHash } from "crypto";

export function hashTokenSeguimiento(
  token: string
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function fechaLocalBolivia(
  fecha: Date
) {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/La_Paz",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(fecha);

  const obtener = (
    tipo:
      | "year"
      | "month"
      | "day"
  ) =>
    Number(
      partes.find(
        (parte) =>
          parte.type === tipo
      )?.value || 0
    );

  return {
    year:
      obtener("year"),
    month:
      obtener("month"),
    day:
      obtener("day"),
  };
}

export function obtenerDiaSeguimiento(
  fechaInicio: Date,
  ahora = new Date()
) {
  const inicio =
    fechaLocalBolivia(
      fechaInicio
    );

  const actual =
    fechaLocalBolivia(
      ahora
    );

  const inicioUtc =
    Date.UTC(
      inicio.year,
      inicio.month - 1,
      inicio.day
    );

  const actualUtc =
    Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day
    );

  return (
    Math.floor(
      (
        actualUtc -
        inicioUtc
      ) /
        86_400_000
    ) + 1
  );
}

/*
 * Para fechas guardadas como @db.Date.
 *
 * Un grupo con fecha 2026-10-06 debe
 * representar siempre el 06/10/2026,
 * sin convertir esa medianoche UTC
 * al día anterior en Bolivia.
 */
export function obtenerDiaSeguimientoFechaCalendario(
  fechaInicio: Date,
  ahora = new Date()
) {
  const actual =
    fechaLocalBolivia(
      ahora
    );

  const inicioUtc =
    Date.UTC(
      fechaInicio.getUTCFullYear(),
      fechaInicio.getUTCMonth(),
      fechaInicio.getUTCDate()
    );

  const actualUtc =
    Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day
    );

  return (
    Math.floor(
      (
        actualUtc -
        inicioUtc
      ) /
        86_400_000
    ) + 1
  );
}

export function obtenerDiaEntreFechasCalendario(
  fechaInicio: Date,
  fechaReferencia: Date
) {
  const inicioUtc =
    Date.UTC(
      fechaInicio.getUTCFullYear(),
      fechaInicio.getUTCMonth(),
      fechaInicio.getUTCDate()
    );

  const referenciaUtc =
    Date.UTC(
      fechaReferencia.getUTCFullYear(),
      fechaReferencia.getUTCMonth(),
      fechaReferencia.getUTCDate()
    );

  return (
    Math.floor(
      (
        referenciaUtc -
        inicioUtc
      ) /
        86_400_000
    ) + 1
  );
}


export function tokenSeguimientoValido(
  token: string
) {
  return /^[a-f0-9]{64}$/i.test(
    token
  );
}
