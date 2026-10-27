/**
 * Reportes individuales administrativos.
 *
 * Máximo 50 mediciones recientes.
 * Hasta 50 alimentos agrupados de los registros recientes.
 * Solo mediciones completas para promedios.
 *
 * No realiza diagnósticos.
 * No expone tokens ni hashes.
 */

export type ClienteReporteAdmin = {
  id: string;
  nombre: string;
};

export type RegistroReporteAdmin = {
  alimento: string;
  glucosaAntes: number;
  glucosaDespues: number | null;
  horaMedicionDespues: Date | null;
};

export type RepositorioReporteAdmin = {
  buscarCliente: (
    id: string
  ) => Promise<ClienteReporteAdmin | null>;

  listarRegistros: (
    clienteId: string,
    limite: number
  ) => Promise<RegistroReporteAdmin[]>;
};

export type AlimentoReporteAdmin = {
  alimento: string;
  pruebas: number;
  promedioAntes: number;
  promedioDespues: number;
  diferencia: number;
};

const FORMATO_ID = /^[A-Za-z0-9_-]{5,128}$/;

function glucosaValida(valor: unknown): valor is number {
  return (
    typeof valor === "number" &&
    Number.isFinite(valor) &&
    valor > 0 &&
    valor <= 1000
  );
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export async function construirReporteIndividualAdmin(
  repositorio: RepositorioReporteAdmin,
  clienteId: string
) {
  if (
    typeof clienteId !== "string" ||
    !FORMATO_ID.test(clienteId)
  ) {
    throw new Error("Identificador no válido");
  }

  const cliente = await repositorio.buscarCliente(
    clienteId
  );

  if (cliente === null) {
    return null;
  }

  if (
    cliente.id !== clienteId ||
    typeof cliente.nombre !== "string" ||
    !cliente.nombre.trim() ||
    cliente.nombre.length > 120
  ) {
    throw new Error("Cliente no válido");
  }

  const registros =
    await repositorio.listarRegistros(
      clienteId,
      50
    );

  if (
    !Array.isArray(registros) ||
    registros.length > 50
  ) {
    throw new Error("Historial no válido");
  }

  const medicionesCompletas: Array<{
    alimento: string;
    glucosaAntes: number;
    glucosaDespues: number;
    diferencia: number;
    fecha: string;
  }> = [];

  const grupos = new Map<
    string,
    {
      alimento: string;
      pruebas: number;
      totalAntes: number;
      totalDespues: number;
    }
  >();

  let pruebasCompletas = 0;

  for (const registro of registros) {
    if (
      typeof registro.alimento !== "string" ||
      registro.alimento.trim().length < 2 ||
      registro.alimento.length > 120 ||
      !glucosaValida(registro.glucosaAntes)
    ) {
      throw new Error("Medición no válida");
    }

    if (
      registro.glucosaDespues === null &&
      registro.horaMedicionDespues === null
    ) {
      continue;
    }

    if (
      !glucosaValida(registro.glucosaDespues) ||
      !(registro.horaMedicionDespues instanceof Date) ||
      !Number.isFinite(
        registro.horaMedicionDespues.getTime()
      )
    ) {
      throw new Error("Medición final no válida");
    }

    const alimento = registro.alimento
      .trim()
      .replace(/\s+/g, " ");

    medicionesCompletas.push({
    alimento,
    glucosaAntes: registro.glucosaAntes,
    glucosaDespues: registro.glucosaDespues,
    diferencia: redondear(
      registro.glucosaDespues - registro.glucosaAntes
    ),
    fecha: registro.horaMedicionDespues.toISOString(),
  });

  const clave = alimento.toLocaleLowerCase("es");

    let grupo = grupos.get(clave);

    if (!grupo) {
      grupo = {
        alimento,
        pruebas: 0,
        totalAntes: 0,
        totalDespues: 0,
      };

      grupos.set(clave, grupo);
    }

    grupo.pruebas++;
    grupo.totalAntes += registro.glucosaAntes;
    grupo.totalDespues += registro.glucosaDespues;

    pruebasCompletas++;
  }

  const alimentos = [...grupos.values()]
    .map((grupo): AlimentoReporteAdmin => {
      const antes =
        grupo.totalAntes / grupo.pruebas;

      const despues =
        grupo.totalDespues / grupo.pruebas;

      return {
        alimento: grupo.alimento,
        pruebas: grupo.pruebas,
        promedioAntes: redondear(antes),
        promedioDespues: redondear(despues),
        diferencia: redondear(
          despues - antes
        ),
      };
    })
    .sort(
      (a, b) =>
        b.pruebas - a.pruebas ||
        a.alimento.localeCompare(
          b.alimento,
          "es"
        )
    );

  return {
    cliente: {
      id: cliente.id,
      nombre: cliente.nombre,
    },
    registrosRevisados: registros.length,
    pruebasCompletas,
    alimentos,
    mediciones: medicionesCompletas
      .sort((a, b) =>
        b.diferencia - a.diferencia ||
        b.fecha.localeCompare(a.fecha)
      )
      .slice(0, 8),
  };
}
