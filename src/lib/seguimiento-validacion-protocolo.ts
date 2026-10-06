type SeccionProtocolo =
  | "PRINCIPAL"
  | "ADICIONAL";

type IndicacionRevision = {
  hora: string | null;
  texto: string;
};

type ActividadRevision = {
  titulo: string;
  seccion: SeccionProtocolo;
  hora: string | null;
  diaInicio: number;
  diaFin: number | null;
  indicaciones: IndicacionRevision[];
};

function horaValida(
  hora: string | null
) {
  return Boolean(
    hora &&
      /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
        hora
      )
  );
}

export function validarProtocoloSeguimiento({
  actividades,
  duracionDias,
}: {
  actividades: ActividadRevision[];
  duracionDias: number;
}) {
  const errores: string[] = [];

  if (
    actividades.length ===
    0
  ) {
    errores.push(
      "Agrega al menos una actividad antes de continuar."
    );
  }

  for (
    const actividad of
    actividades
  ) {
    if (
      !actividad.titulo.trim()
    ) {
      errores.push(
        "Hay una actividad sin título."
      );
    }

    if (
      !Number.isInteger(
        actividad.diaInicio
      ) ||
      actividad.diaInicio < 1 ||
      actividad.diaInicio >
        duracionDias
    ) {
      errores.push(
        `${actividad.titulo || "Actividad"}: el día inicial no es válido.`
      );
    }

    if (
      actividad.diaFin !==
        null &&
      (
        !Number.isInteger(
          actividad.diaFin
        ) ||
        actividad.diaFin <
          actividad.diaInicio ||
        actividad.diaFin >
          duracionDias
      )
    ) {
      errores.push(
        `${actividad.titulo || "Actividad"}: el día final no es válido.`
      );
    }

    if (
      actividad.seccion ===
        "ADICIONAL" &&
      !horaValida(
        actividad.hora
      )
    ) {
      errores.push(
        `${actividad.titulo}: el protocolo adicional necesita un horario.`
      );
    }

    for (
      const indicacion of
      actividad.indicaciones
    ) {
      if (
        !horaValida(
          indicacion.hora
        )
      ) {
        errores.push(
          `${actividad.titulo}: hay una indicación sin horario válido.`
        );
      }

      if (
        !indicacion.texto.trim()
      ) {
        errores.push(
          `${actividad.titulo}: hay una indicación vacía.`
        );
      }
    }
  }

  return {
    valida:
      errores.length ===
      0,

    errores,
  };
}
