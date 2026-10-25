/**
 * DioxiLife Bolivia.
 *
 * Listado administrativo de enlaces.
 *
 * Nunca expone el token original ni su hash.
 * No modifica clientes o registros.
 * No realiza consultas al importar el módulo.
 */

export type FilaEnlaceAdministrativo = {
  id: string;
  nombre: string;
  seguimientoId: string | null;
  tokenCreadoAt: Date;
  tokenExpiraAt: Date | null;
  tokenRevocadoAt: Date | null;
};

export type DependenciasListadoAdmin = {
  listar: (
    limite: number
  ) => Promise<FilaEnlaceAdministrativo[]>;
};

export type EstadoEnlaceAdministrativo =
  | "vigente"
  | "vencido"
  | "revocado"
  | "sin_vigencia";

const MAXIMO_ENLACES = 100;

function fechaValida(valor: unknown): valor is Date {
  return (
    valor instanceof Date &&
    Number.isFinite(valor.getTime())
  );
}

export async function listarEnlacesAdministrativos(
  dependencias: DependenciasListadoAdmin,
  ahora: Date = new Date()
) {
  if (!fechaValida(ahora)) {
    throw new Error("Fecha actual no válida");
  }

  const filas = await dependencias.listar(
    MAXIMO_ENLACES
  );

  if (
    !Array.isArray(filas) ||
    filas.length > MAXIMO_ENLACES
  ) {
    throw new Error("Listado no válido");
  }

  return filas.map(fila => {
    if (
      typeof fila.id !== "string" ||
      !/^[A-Za-z0-9_-]{5,128}$/.test(fila.id) ||
      typeof fila.nombre !== "string" ||
      !fila.nombre.trim() ||
      !fechaValida(fila.tokenCreadoAt) ||
      (
        fila.tokenExpiraAt !== null &&
        !fechaValida(fila.tokenExpiraAt)
      ) ||
      (
        fila.tokenRevocadoAt !== null &&
        !fechaValida(fila.tokenRevocadoAt)
      )
    ) {
      throw new Error("Enlace inválido");
    }

    let estado: EstadoEnlaceAdministrativo;

    if (fila.tokenRevocadoAt !== null) {
      estado = "revocado";
    } else if (fila.tokenExpiraAt === null) {
      estado = "sin_vigencia";
    } else if (
      fila.tokenExpiraAt.getTime() <= ahora.getTime()
    ) {
      estado = "vencido";
    } else {
      estado = "vigente";
    }

    return {
      id: fila.id,
      nombre: fila.nombre,
      seguimientoId: fila.seguimientoId,
      tokenCreadoAt: fila.tokenCreadoAt.toISOString(),
      tokenExpiraAt:
        fila.tokenExpiraAt?.toISOString() ?? null,
      tokenRevocadoAt:
        fila.tokenRevocadoAt?.toISOString() ?? null,
      estado,
    };
  });
}
