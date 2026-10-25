import { prisma } from "@/lib/prisma";

/**
 * Historial individual de pruebas de alimentos.
 *
 * No acepta tokens originales.
 * No consulta por teléfono ni nombre.
 * Solo admite el ID obtenido después de
 * autorizar el enlace privado.
 *
 * No realiza consultas al importar este módulo.
 */

const MAX_REGISTROS = 50;

const SELECCION = {
  id: true,
  clienteId: true,
  fecha: true,
  glucosaAyunas: true,
  glucosaAntes: true,
  alimento: true,
  cantidad: true,
  horaComida: true,
  glucosaDespues: true,
  horaMedicionDespues: true,
  observacion: true,
} as const;

type RegistroLeido = {
  id: string;
  clienteId: string;
  fecha: Date;
  glucosaAyunas: unknown;
  glucosaAntes: unknown;
  alimento: string;
  cantidad: string | null;
  horaComida: Date;
  glucosaDespues: unknown;
  horaMedicionDespues: Date | null;
  observacion: string | null;
};

function fechaISO(valor: Date): string {
  if (
    !(valor instanceof Date) ||
    !Number.isFinite(valor.getTime())
  ) {
    throw new Error("Fecha no válida");
  }

  return valor.toISOString();
}

function glucosaNumero(
  valor: unknown,
  nullable: boolean
): number | null {
  if (valor === null && nullable) {
    return null;
  }

  if (valor === null || valor === undefined) {
    throw new Error("Medición ausente");
  }

  const numero = Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero <= 0 ||
    numero > 1000
  ) {
    throw new Error("Medición fuera de rango");
  }

  return numero;
}

function presentarRegistro(
  registro: RegistroLeido,
  clienteId: string
) {
  if (registro.clienteId !== clienteId) {
    throw new Error("Propiedad de registro inválida");
  }

  return {
    id: registro.id,
    fecha: fechaISO(registro.fecha).slice(0, 10),
    glucosaAyunas: glucosaNumero(
      registro.glucosaAyunas,
      true
    ),
    glucosaAntes: glucosaNumero(
      registro.glucosaAntes,
      false
    ),
    alimento: registro.alimento,
    cantidad: registro.cantidad,
    horaComida: fechaISO(registro.horaComida),
    glucosaDespues: glucosaNumero(
      registro.glucosaDespues,
      true
    ),
    horaMedicionDespues:
      registro.horaMedicionDespues === null
        ? null
        : fechaISO(registro.horaMedicionDespues),
    observacion: registro.observacion,
  };
}

/**
 * Se invocará únicamente después de comprobar:
 * - formato y hash del token;
 * - vencimiento y revocación;
 * - cuota distribuida de solicitudes.
 *
 * Siempre filtra por clienteId.
 */
export async function consultarHistorialCliente(
  clienteId: string
) {
  if (
    !/^[A-Za-z0-9_-]{5,128}$/.test(clienteId)
  ) {
    throw new Error("Cliente no válido");
  }

  const registros =
    await prisma.registroPruebaAlimento.findMany({
      where: {
        clienteId,
      },
      select: SELECCION,
      orderBy: [
        { fecha: "desc" },
        { horaComida: "desc" },
        { createdAt: "desc" },
      ],
      take: MAX_REGISTROS,
    });

  /**
   * Se busca por separado el último pendiente.
   * Así podrá recuperarse incluso cuando existan
   * más de 50 pruebas en el historial.
   */
  const pendiente =
    await prisma.registroPruebaAlimento.findFirst({
      where: {
        clienteId,
        glucosaDespues: null,
        horaMedicionDespues: null,
      },
      select: SELECCION,
      orderBy: [
        { fecha: "desc" },
        { horaComida: "desc" },
        { createdAt: "desc" },
      ],
    });

  return {
    registros: registros.map(registro =>
      presentarRegistro(registro, clienteId)
    ),
    pendiente: pendiente
      ? presentarRegistro(pendiente, clienteId)
      : null,
  };
}
