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

export function tokenSeguimientoValido(
  token: string
) {
  return /^[a-f0-9]{64}$/i.test(
    token
  );
}
