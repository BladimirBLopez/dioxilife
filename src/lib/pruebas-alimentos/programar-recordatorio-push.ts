/**
 * Planificador independiente de Pruebas de alimentos.
 * No accede a Neon, Upstash ni Seguimiento.
 * No envia notificaciones.
 */

const DOS_HORAS = 120 * 60 * 1000;
const TOLERANCIA = 15 * 60 * 1000;

type Entrada = {
  registroId: string;
  horaComida: Date;
  horaMedicionDespues: Date | null;
  consentimientoPush: boolean;
  accesoVigente: boolean;
  ahora: Date;
};

export function decidirRecordatorioPush(e: Entrada) {
  if (
    !/^[A-Za-z0-9_-]{5,128}$/.test(e.registroId) ||
    !Number.isFinite(e.horaComida?.getTime()) ||
    !Number.isFinite(e.ahora?.getTime())
  ) {
    throw new Error("Datos de programacion invalidos");
  }

  if (!e.consentimientoPush || !e.accesoVigente) {
    return { estado: "omitido" as const };
  }

  if (e.horaMedicionDespues !== null) {
    return { estado: "omitido" as const };
  }

  const cuando = new Date(
    e.horaComida.getTime() + DOS_HORAS
  );

  if (e.ahora.getTime() > cuando.getTime() + TOLERANCIA) {
    return { estado: "vencido" as const };
  }

  return {
    estado: e.ahora < cuando
      ? "programar" as const
      : "enviar" as const,
    ejecutarEn: cuando.toISOString(),
    claveUnica: `prueba-glucosa:${e.registroId}:120m`,
  };
}

export const MENSAJE_RECORDATORIO_PUSH = {
  title: "DioxiLife Bolivia",
  body: "Es momento de completar tu segunda medicion.",
} as const;
