import {
  obtenerDiaSeguimiento,
} from "@/lib/seguimiento-publico";

type MiembroGrupoPublico =
  | {
      estado: string;
      diaIngreso: number;

      grupo: {
        estado: string;
        fechaInicio: Date;
        duracionDias: number;
      };
    }
  | null;

export function resolverDiaRegistroPublico({
  estado,
  fechaInicio,
  duracionDias,
  miembroGrupo,
}: {
  estado: string;
  fechaInicio: Date | null;
  duracionDias: number;
  miembroGrupo: MiembroGrupoPublico;
}) {
  /*
   * SEGUIMIENTO GRUPAL
   *
   * El calendario lo controla el grupo,
   * no el participante.
   */
  if (miembroGrupo) {
    if (
      miembroGrupo.estado !==
      "ACTIVO"
    ) {
      return {
        ok: false as const,
        status: 409,
        error:
          "Ya no formas parte activa de este grupo.",
      };
    }

    if (
      miembroGrupo.grupo.estado ===
      "BORRADOR"
    ) {
      return {
        ok: false as const,
        status: 409,
        error:
          "El grupo todavía está en preparación.",
      };
    }

    if (
      miembroGrupo.grupo.estado ===
      "FINALIZADO"
    ) {
      return {
        ok: false as const,
        status: 409,
        error:
          "El grupo ya finalizó.",
      };
    }

    if (
      miembroGrupo.grupo.estado ===
      "CANCELADO"
    ) {
      return {
        ok: false as const,
        status: 409,
        error:
          "El grupo fue cancelado.",
      };
    }

    if (
      miembroGrupo.grupo.estado !==
      "ACTIVO"
    ) {
      return {
        ok: false as const,
        status: 409,
        error:
          "El grupo no está activo.",
      };
    }

    if (
      estado !==
      "ACTIVO"
    ) {
      return {
        ok: false as const,
        status: 409,
        error:
          "El seguimiento no está activo.",
      };
    }

    const diaPlan =
      obtenerDiaSeguimiento(
        miembroGrupo.grupo
          .fechaInicio
      );

    if (
      diaPlan < 1
    ) {
      return {
        ok: false as const,
        status: 409,
        error:
          "El grupo todavía no ha comenzado.",
      };
    }

    if (
      diaPlan >
      miembroGrupo.grupo
        .duracionDias
    ) {
      return {
        ok: false as const,
        status: 409,
        error:
          "El periodo del grupo ya terminó.",
      };
    }

    if (
      diaPlan <
      miembroGrupo.diaIngreso
    ) {
      return {
        ok: false as const,
        status: 409,
        error:
          "Todavía no corresponde registrar actividades para este participante.",
      };
    }

    return {
      ok: true as const,
      diaPlan,
      duracionDias:
        miembroGrupo.grupo
          .duracionDias,
    };
  }

  /*
   * SEGUIMIENTO INDIVIDUAL
   *
   * Mantiene el comportamiento actual.
   */
  if (
    estado !==
      "ACTIVO" ||
    !fechaInicio
  ) {
    return {
      ok: false as const,
      status: 409,
      error:
        "El seguimiento no está activo.",
    };
  }

  const diaPlan =
    obtenerDiaSeguimiento(
      fechaInicio
    );

  if (
    diaPlan < 1 ||
    diaPlan >
      duracionDias
  ) {
    return {
      ok: false as const,
      status: 409,
      error:
        "El día actual está fuera del periodo de seguimiento.",
    };
  }

  return {
    ok: true as const,
    diaPlan,
    duracionDias,
  };
}
