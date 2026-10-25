/**
 * Recuperación tras una respuesta de escritura fallida.
 *
 * Solo interpreta un historial ya validado.
 * No realiza consultas ni repite escrituras.
 *
 * Una prueba pendiente no demuestra por sí sola
 * que la última solicitud haya tenido éxito.
 */

type TipoGuardado = "inicio" | "finalizacion";

type RegistroLeido = {
  id: string;
  glucosaDespues: number | null;
  horaMedicionDespues: string | null;
};

type HistorialLeido = {
  registros: readonly RegistroLeido[];
  pendiente: {
    id: string;
  } | null;
};

export type ResultadoRecuperacion =
  | {
      estado: "pendiente";
      registroId: string;
    }
  | {
      estado: "completado";
      registroId: string;
    }
  | {
      estado: "no_confirmado";
    };

const ID_VALIDO = /^[A-Za-z0-9_-]{5,128}$/;

export function decidirRecuperacionGuardado(
  tipo: TipoGuardado,
  registroId: string | null,
  datos: HistorialLeido
): ResultadoRecuperacion {
  if (!datos || !Array.isArray(datos.registros)) {
    return {estado: "no_confirmado"};
  }

  if (tipo === "inicio") {
    const idPendiente = datos.pendiente?.id;

    if (
      typeof idPendiente === "string" &&
      ID_VALIDO.test(idPendiente)
    ) {
      return {
        estado: "pendiente",
        registroId: idPendiente,
      };
    }

    return {estado: "no_confirmado"};
  }

  if (
    tipo !== "finalizacion" ||
    typeof registroId !== "string" ||
    !ID_VALIDO.test(registroId)
  ) {
    return {estado: "no_confirmado"};
  }

  const encontrado = datos.registros.find(
    registro => registro.id === registroId
  );

  if (
    encontrado &&
    typeof encontrado.glucosaDespues === "number" &&
    Number.isFinite(encontrado.glucosaDespues) &&
    typeof encontrado.horaMedicionDespues === "string"
  ) {
    return {
      estado: "completado",
      registroId,
    };
  }

  if (datos.pendiente?.id === registroId) {
    return {
      estado: "pendiente",
      registroId,
    };
  }

  return {estado: "no_confirmado"};
}
