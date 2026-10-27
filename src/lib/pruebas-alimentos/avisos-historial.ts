import {
  prepararAvisosGlucosa,
  type MedicionParaAvisos,
  type RangosEfectivos,
} from "./avisos-glucosa";

type Registro = MedicionParaAvisos & {
  id: string;
};

type Aviso = ReturnType<
  typeof prepararAvisosGlucosa
>["avisos"][number];

export function prepararAvisosHistorial(
  registros: readonly Registro[],
  rangos: RangosEfectivos | null
): Array<{ registroId: string; aviso: Aviso }> {
  if (rangos === null) return [];

  const resultado: Array<{
    registroId: string;
    aviso: Aviso;
  }> = [];

  for (const registro of registros.slice(0, 50)) {
    const evaluacion = prepararAvisosGlucosa(
      registro,
      rangos
    );

    for (const aviso of evaluacion.avisos) {
      resultado.push({
        registroId: registro.id,
        aviso,
      });
    }
  }

  return resultado;
}
