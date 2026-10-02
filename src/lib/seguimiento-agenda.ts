import { minutosAntes } from "@/lib/recordatorios-seguimiento";

type RangoDias = {
  diaInicio: number;
  diaFin: number | null;
  seccion?:
    | "PRINCIPAL"
    | "ADICIONAL";
};

export function ultimoDiaActividad(
  actividad: RangoDias,
  duracionDias?: number
) {
  if (
    actividad.diaFin !== null
  ) {
    return actividad.diaFin;
  }

  /*
   * Los protocolos adicionales continúan
   * desde su día de inicio hasta que sean
   * cerrados o termine el seguimiento.
   */
  if (
    actividad.seccion ===
    "ADICIONAL"
  ) {
    return (
      duracionDias ??
      Number.MAX_SAFE_INTEGER
    );
  }

  /*
   * Conservamos la lógica histórica de
   * las actividades principales:
   * sin día final = solo el día inicial.
   */
  return actividad.diaInicio;
}

export function aplicaEnDia(
  actividad: RangoDias,
  dia: number,
  duracionDias?: number
) {
  return (
    dia >= actividad.diaInicio &&
    dia <=
      ultimoDiaActividad(
        actividad,
        duracionDias
      )
  );
}

export function describirDias(
  actividad: RangoDias,
  duracionDias: number,
  diaActual: number | null
) {
  const fin =
    ultimoDiaActividad(
      actividad,
      duracionDias
    );

  if (
    actividad.diaInicio === 1 &&
    fin === duracionDias
  ) {
    return "Todos los días";
  }

  if (
    fin ===
    actividad.diaInicio
  ) {
    return diaActual ===
      actividad.diaInicio
      ? `Hoy · Día ${actividad.diaInicio}`
      : `Día ${actividad.diaInicio}`;
  }

  if (
    fin === duracionDias
  ) {
    return `Desde el día ${actividad.diaInicio}`;
  }

  return `Días ${actividad.diaInicio} al ${fin}`;
}

export function horaDeAviso(
  hora: string,
  recordatorio: string
) {
  const antes =
    minutosAntes(
      recordatorio
    );

  const partes =
    /^(\d{2}):(\d{2})$/.exec(
      hora.trim()
    );

  if (
    antes === null ||
    !partes
  ) {
    return null;
  }

  const total =
    Number(partes[1]) * 60 +
    Number(partes[2]) -
    antes;

  if (total < 0) {
    return {
      texto: "",
      cruzaMedianoche:
        true,
    };
  }

  const h =
    String(
      Math.floor(
        total / 60
      )
    ).padStart(
      2,
      "0"
    );

  const m =
    String(
      total % 60
    ).padStart(
      2,
      "0"
    );

  return {
    texto:
      `${h}:${m}`,
    cruzaMedianoche:
      false,
  };
}
