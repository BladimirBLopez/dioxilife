import "server-only";

import { prisma } from "@/lib/prisma";
import { leerRangosServidor } from "./rangos-servidor";
import { prepararAvisosHistorial } from "./avisos-historial";

type Registro = {
  id: string;
  alimento: string;
  glucosaAntes: number | null;
  glucosaDespues: number | null;
};

// Usar solamente despues de autenticar al cliente
// o al administrador en la ruta correspondiente.
export async function obtenerAvisosAutorizados(
  clienteId: string,
  registros?: readonly Registro[]
) {
  if (
    process.env.PRUEBAS_ALIMENTOS_ALERTAS_ACTIVAS !== "true"
  ) {
    return { alertasActivas: false, avisos: [] };
  }

  const rangos = leerRangosServidor(clienteId);

  if (!rangos) {
    return { alertasActivas: false, avisos: [] };
  }

  const fuente: readonly Registro[] = registros ??
    (await prisma.registroPruebaAlimento.findMany({
      where: { clienteId },
      select: {
        id: true,
        alimento: true,
        glucosaAntes: true,
        glucosaDespues: true,
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      take: 50,
    })).map(r => ({
      id: r.id,
      alimento: r.alimento,
      glucosaAntes: r.glucosaAntes === null
        ? null : Number(r.glucosaAntes),
      glucosaDespues: r.glucosaDespues === null
        ? null : Number(r.glucosaDespues),
    }));

  const validos = fuente.slice(0, 50).flatMap(r => {
    const antes = r.glucosaAntes;
    const despues = r.glucosaDespues;

    if (
      antes === null ||
      !Number.isFinite(antes) ||
      antes <= 0 || antes > 1000
    ) {
      return [];
    }

    if (
      despues !== null &&
      (!Number.isFinite(despues) ||
       despues <= 0 || despues > 1000)
    ) {
      return [];
    }

    return [{
      id: r.id,
      alimento: r.alimento,
      glucosaAntes: antes,
      glucosaDespues: despues,
    }];
  });

  return {
    alertasActivas: true,
    avisos: prepararAvisosHistorial(validos, rangos),
  };
}
