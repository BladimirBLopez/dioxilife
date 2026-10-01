const OFFSET_BOLIVIA_MS = 4 * 60 * 60_000;

export const TARDANZA_MAXIMA_MIN = 20;

export function minutosAntes(
  recordatorio: string
): number | null {
  switch (recordatorio) {
    case "A_LA_HORA":
      return 0;

    case "MIN_15_ANTES":
      return 15;

    case "MIN_30_ANTES":
      return 30;

    case "MIN_60_ANTES":
      return 60;

    default:
      return null;
  }
}

function leerHora(hora: string | null) {
  const partes =
    /^([01]\d|2[0-3]):([0-5]\d)$/.exec(
      (hora || "").trim()
    );

  if (!partes) {
    return null;
  }

  return {
    horas: Number(partes[1]),
    minutos: Number(partes[2]),
  };
}

export function momentosRecordatorio(
  ahora: Date,
  hora: string | null,
  recordatorio: string
) {
  const antes =
    minutosAntes(recordatorio);

  const hm = leerHora(hora);

  if (antes === null || !hm) {
    return null;
  }

  const local = new Date(
    ahora.getTime() - OFFSET_BOLIVIA_MS
  );

  const evento = new Date(
    Date.UTC(
      local.getUTCFullYear(),
      local.getUTCMonth(),
      local.getUTCDate(),
      hm.horas,
      hm.minutos
    ) + OFFSET_BOLIVIA_MS
  );

  const envio = new Date(
    evento.getTime() - antes * 60_000
  );

  return {
    evento,
    envio,
    antes,
  };
}

export function recordatorioVigente(
  ahora: Date,
  momentos: {
    evento: Date;
    envio: Date;
  }
) {
  return (
    ahora.getTime() >=
      momentos.envio.getTime() &&
    ahora.getTime() <=
      momentos.evento.getTime() +
        TARDANZA_MAXIMA_MIN * 60_000
  );
}

export function mensajeRecordatorio({
  titulo,
  hora,
  antes,
}: {
  titulo: string;
  hora: string;
  antes: number;
}) {
  if (antes === 0) {
    return `Es hora de: ${titulo}`;
  }

  const cuando =
    antes === 60
      ? "1 hora"
      : `${antes} min`;

  return `En ${cuando} (${hora}): ${titulo}`;
}


export const MINUTOS_SEGUNDO_AVISO = 30;

export function recordatorioTardioVigente(
  ahora: Date,
  evento: Date
) {
  const desde =
    evento.getTime() +
    MINUTOS_SEGUNDO_AVISO * 60_000;

  const hasta =
    desde +
    TARDANZA_MAXIMA_MIN * 60_000;

  return (
    ahora.getTime() >= desde &&
    ahora.getTime() <= hasta
  );
}

export function mensajeRecordatorioTardio({
  titulo,
  hora,
}: {
  titulo: string;
  hora: string;
}) {
  return `Ya pasó la hora de: ${titulo} (${hora}). Aún estás a tiempo, márcala cuando la hagas.`;
}
