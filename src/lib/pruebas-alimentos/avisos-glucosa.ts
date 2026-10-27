import {
  evaluarMedicion,
  type RangoAprobado,
} from "./analisis-mejoras";

export type RangosEfectivos = {
  antes: RangoAprobado | null;
  despues: RangoAprobado | null;
};

export type MedicionParaAvisos = {
  alimento: string;
  glucosaAntes: number;
  glucosaDespues: number | null;
};

export function prepararAvisosGlucosa(
  medicion: MedicionParaAvisos,
  rangos: RangosEfectivos | null
) {
  const antes = evaluarMedicion(
    medicion.glucosaAntes,
    rangos?.antes ?? null
  );

  const despues = evaluarMedicion(
    medicion.glucosaDespues,
    rangos?.despues ?? null
  );

  const avisos = [
    {
      etapa: "antes",
      valor: medicion.glucosaAntes,
      estado: antes,
      rango: rangos?.antes ?? null,
    },
    {
      etapa: "despues",
      valor: medicion.glucosaDespues,
      estado: despues,
      rango: rangos?.despues ?? null,
    },
  ].filter(item =>
    item.valor !== null &&
    item.rango !== null &&
    (item.estado === "por_debajo" ||
     item.estado === "por_encima")
  ).map(item => ({
    ...item,
    alimento: medicion.alimento.trim(),
  }));

  return {
    antes,
    despues,
    pendiente: medicion.glucosaDespues === null,
    avisos,
  };
}
