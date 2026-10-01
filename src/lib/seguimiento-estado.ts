export type NivelComunicacion =
  | "ok"
  | "aviso"
  | "alerta"
  | "neutro";

export type IndicadorComunicacion = {
  nivel: NivelComunicacion;
  titulo: string;
  detalle: string;
};

const MS_DIA = 86_400_000;

export function diasDesde(
  fecha: Date | string,
  ahora: Date = new Date()
) {
  return Math.floor(
    (ahora.getTime() -
      new Date(fecha).getTime()) /
      MS_DIA
  );
}

export function tiempoRelativo(
  fecha: Date | string | null,
  ahora: Date = new Date()
) {
  if (!fecha) {
    return "Nunca";
  }

  const diff =
    ahora.getTime() -
    new Date(fecha).getTime();

  if (diff < 60_000) {
    return "Justo ahora";
  }

  const minutos = Math.floor(diff / 60_000);

  if (minutos < 60) {
    return `Hace ${minutos} min`;
  }

  const horas = Math.floor(minutos / 60);

  if (horas < 24) {
    return `Hace ${horas} h`;
  }

  const dias = Math.floor(horas / 24);

  if (dias < 30) {
    return dias === 1
      ? "Hace 1 día"
      : `Hace ${dias} días`;
  }

  const meses = Math.floor(dias / 30);

  return meses === 1
    ? "Hace 1 mes"
    : `Hace ${meses} meses`;
}

export function indicadorComunicacion({
  estado,
  ultimoAccesoAt,
  ultimoEnvioAt,
  ahora = new Date(),
}: {
  estado: string;
  ultimoAccesoAt: Date | string | null;
  ultimoEnvioAt: Date | string | null;
  ahora?: Date;
}): IndicadorComunicacion {

  if (estado === "COMPLETADO") {
    return {
      nivel: "neutro",
      titulo: "Seguimiento completado",
      detalle: "El cliente terminó su plan.",
    };
  }

  if (estado === "CANCELADO") {
    return {
      nivel: "neutro",
      titulo: "Seguimiento cancelado",
      detalle: "No se requieren más acciones.",
    };
  }

  if (estado === "PAUSADO") {
    return {
      nivel: "neutro",
      titulo: "Seguimiento en pausa",
      detalle:
        "Retómalo cuando el cliente vuelva a su plan.",
    };
  }

  if (!ultimoAccesoAt) {

    if (!ultimoEnvioAt) {
      return {
        nivel: "aviso",
        titulo: "Enlace pendiente de enviar",
        detalle:
          "Envíale su enlace por WhatsApp para que empiece.",
      };
    }

    if (diasDesde(ultimoEnvioAt, ahora) >= 1) {
      return {
        nivel: "alerta",
        titulo: "Aún no abrió su enlace",
        detalle: `Se lo enviaste ${tiempoRelativo(
          ultimoEnvioAt,
          ahora
        ).toLowerCase()}. Conviene recordárselo.`,
      };
    }

    return {
      nivel: "aviso",
      titulo: "Enlace enviado",
      detalle:
        "Esperando que abra su seguimiento por primera vez.",
    };
  }

  const dias = diasDesde(ultimoAccesoAt, ahora);

  if (dias <= 1) {
    return {
      nivel: "ok",
      titulo: "Cliente activo",
      detalle: `Último ingreso: ${tiempoRelativo(
        ultimoAccesoAt,
        ahora
      ).toLowerCase()}.`,
    };
  }

  if (dias === 2) {
    return {
      nivel: "aviso",
      titulo: "Atención",
      detalle: "No ingresa hace 2 días.",
    };
  }

  return {
    nivel: "alerta",
    titulo: `Sin ingresar hace ${dias} días`,
    detalle: "Conviene escribirle para retomar.",
  };
}
