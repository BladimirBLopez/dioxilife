import type {
  RangosEfectivos,
} from "./avisos-glucosa";

type Aprobacion = Readonly<{
  autorizado: boolean;
  rangos: RangosEfectivos;
}>;

export type ConfiguracionRangos = Readonly<{
  general: Aprobacion | null;
  excepcionCliente: Aprobacion | null;
}>;

function rangosValidos(r: RangosEfectivos): boolean {
  return [r.antes, r.despues].every(x =>
    x !== null &&
    Number.isFinite(x.minimo) &&
    Number.isFinite(x.maximo) &&
    x.minimo > 0 &&
    x.maximo <= 1000 &&
    x.minimo <= x.maximo
  );
}

// Solo debe recibir configuracion verificada
// por un servicio autorizado del servidor.
export function resolverRangosAutorizados(
  configuracion: ConfiguracionRangos | null
): RangosEfectivos | null {
  const general = configuracion?.general;

  if (!general?.autorizado) return null;
  if (!rangosValidos(general.rangos)) return null;

  const individual = configuracion?.excepcionCliente;

  if (!individual?.autorizado) {
    return general.rangos;
  }

  if (!rangosValidos(individual.rangos)) {
    return null;
  }

  return individual.rangos;
}
