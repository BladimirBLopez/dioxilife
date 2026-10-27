import type {
  RegistroHistorialCliente,
} from "./historial-formulario-cliente";

/**
 * Resumen descriptivo por alimento.
 *
 * Utiliza únicamente el historial previamente
 * validado y autorizado por la API privada.
 *
 * No diagnostica enfermedades.
 * No modifica registros.
 * No se conecta a bases de datos.
 */

type Acumulado = {
  alimento: string;
  cantidad: number;
  totalAntes: number;
  totalDespues: number;
};

export type ResumenAlimento = {
  alimento: string;
  pruebas: number;
  promedioAntes: number;
  promedioDespues: number;
  diferencia: number;
};

export type ResumenHistorialCliente = {
  totalCompletadas: number;
  alimentos: ResumenAlimento[];
};

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function glucosaValida(valor: number): boolean {
  return (
    Number.isFinite(valor) &&
    valor > 0 &&
    valor <= 1000
  );
}

export function calcularResumenHistorial(
  registros: readonly RegistroHistorialCliente[]
): ResumenHistorialCliente {
  const grupos = new Map<string, Acumulado>();

  let totalCompletadas = 0;

  // La API entrega como máximo 50 registros.
  // Aplicamos aquí el mismo límite defensivo.
  for (const registro of registros.slice(0, 50)) {
    if (
      registro.glucosaDespues === null ||
      registro.horaMedicionDespues === null ||
      !glucosaValida(registro.glucosaAntes) ||
      !glucosaValida(registro.glucosaDespues)
    ) {
      continue;
    }

    const nombre = registro.alimento
      .trim()
      .replace(/\s+/g, " ");

    if (nombre.length < 2) {
      continue;
    }

    const clave = nombre.toLocaleLowerCase("es");

    let grupo = grupos.get(clave);

    if (!grupo) {
      grupo = {
        alimento: nombre,
        cantidad: 0,
        totalAntes: 0,
        totalDespues: 0,
      };

      grupos.set(clave, grupo);
    }

    grupo.cantidad++;
    grupo.totalAntes += registro.glucosaAntes;
    grupo.totalDespues += registro.glucosaDespues;

    totalCompletadas++;
  }

  const alimentos = Array.from(grupos.values())
    .map((grupo): ResumenAlimento => {
      const promedioAntes =
        grupo.totalAntes / grupo.cantidad;

      const promedioDespues =
        grupo.totalDespues / grupo.cantidad;

      return {
        alimento: grupo.alimento,
        pruebas: grupo.cantidad,
        promedioAntes: redondear(promedioAntes),
        promedioDespues: redondear(promedioDespues),
        diferencia: redondear(
          promedioDespues - promedioAntes
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
    totalCompletadas,
    alimentos,
  };
}
