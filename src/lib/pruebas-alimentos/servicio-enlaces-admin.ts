import {
  crearAccesoPruebaSchema,
  revocarAccesoPruebaSchema,
  calcularVencimientoAcceso,
} from "./contratos-admin";

import {
  crearCredencialesPruebaAlimento,
} from "./token";

/**
 * Contrato administrativo independiente
 * de Prisma y de las rutas HTTP.
 *
 * La autenticación y la protección CSRF
 * deben ejecutarse antes de invocarlo.
 */

export type SeguimientoParaPrueba = {
  id: string;
  nombreCliente: string | null;
  telefonoCliente: string | null;
};

export type DatosNuevoAcceso = {
  nombre: string;
  telefono: string | null;
  seguimientoId: string | null;
  tokenAccesoHash: string;
  tokenCreadoAt: Date;
  tokenExpiraAt: Date;
  tokenRevocadoAt: null;
};

export type DependenciasEnlacesAdmin = {
  buscarSeguimiento: (
    id: string
  ) => Promise<SeguimientoParaPrueba | null>;

  crearCliente: (
    datos: DatosNuevoAcceso
  ) => Promise<{ id: string }>;

  revocarCliente: (
    id: string,
    fecha: Date
  ) => Promise<number>;
};

export type ResultadoCrearEnlace =
  | {
      estado: "creado";
      clientePruebaId: string;
      nombre: string;
      token: string;
      tokenExpiraAt: Date;
    }
  | {
      estado:
        | "solicitud_invalida"
        | "seguimiento_no_disponible"
        | "seguimiento_incompleto";
    };

export type ResultadoRevocarEnlace =
  | { estado: "revocado" }
  | {
      estado:
        | "solicitud_invalida"
        | "acceso_no_disponible";
    };

function nombreValido(valor: unknown): valor is string {
  return (
    typeof valor === "string" &&
    valor.trim().length >= 2 &&
    valor.trim().length <= 120
  );
}

function telefonoSeguro(valor: unknown): string | null {
  if (typeof valor !== "string") {
    return null;
  }

  const limpio = valor.trim();

  return limpio.length > 0 && limpio.length <= 30
    ? limpio
    : null;
}

/**
 * Crea un enlace para cliente nuevo
 * o para uno vinculado a Seguimiento.
 *
 * Guarda únicamente el hash en el repositorio.
 * Devuelve el token sin procesar solo al llamador
 * administrativo, para compartir el enlace.
 */
export async function crearEnlaceAdministrativo(
  entrada: unknown,
  dependencias: DependenciasEnlacesAdmin,
  ahora: Date = new Date()
): Promise<ResultadoCrearEnlace> {
  const validacion =
    crearAccesoPruebaSchema.safeParse(entrada);

  if (
    !validacion.success ||
    !Number.isFinite(ahora.getTime())
  ) {
    return { estado: "solicitud_invalida" };
  }

  const solicitud = validacion.data;

  let nombre: string;
  let telefono: string | null;
  let seguimientoId: string | null;

  if (solicitud.origen === "existente") {
    const seguimiento =
      await dependencias.buscarSeguimiento(
        solicitud.seguimientoId
      );

    if (
      !seguimiento ||
      seguimiento.id !== solicitud.seguimientoId
    ) {
      return {
        estado: "seguimiento_no_disponible",
      };
    }

    if (!nombreValido(seguimiento.nombreCliente)) {
      return {
        estado: "seguimiento_incompleto",
      };
    }

    nombre = seguimiento.nombreCliente.trim();
    telefono = telefonoSeguro(
      seguimiento.telefonoCliente
    );
    seguimientoId = seguimiento.id;
  } else {
    nombre = solicitud.nombre;
    telefono = telefonoSeguro(solicitud.telefono);
    seguimientoId = null;
  }

  const tokenExpiraAt = calcularVencimientoAcceso(
    solicitud.vigenciaDias,
    ahora
  );

  const credenciales =
    crearCredencialesPruebaAlimento();

  const creado = await dependencias.crearCliente({
    nombre,
    telefono,
    seguimientoId,
    tokenAccesoHash:
      credenciales.tokenAccesoHash,
    tokenCreadoAt: ahora,
    tokenExpiraAt,
    tokenRevocadoAt: null,
  });

  if (
    !creado ||
    typeof creado.id !== "string" ||
    !creado.id.trim()
  ) {
    throw new Error(
      "Resultado de creación no válido"
    );
  }

  return {
    estado: "creado",
    clientePruebaId: creado.id,
    nombre,
    token: credenciales.token,
    tokenExpiraAt,
  };
}

/**
 * Revocación condicional.
 *
 * No elimina el cliente ni sus mediciones.
 * No permite sobrescribir la fecha de una
 * revocación anterior.
 */
export async function revocarEnlaceAdministrativo(
  entrada: unknown,
  dependencias: DependenciasEnlacesAdmin,
  ahora: Date = new Date()
): Promise<ResultadoRevocarEnlace> {
  const validacion =
    revocarAccesoPruebaSchema.safeParse(entrada);

  if (
    !validacion.success ||
    !Number.isFinite(ahora.getTime())
  ) {
    return { estado: "solicitud_invalida" };
  }

  const cantidad = await dependencias.revocarCliente(
    validacion.data.clientePruebaId,
    ahora
  );

  if (
    !Number.isInteger(cantidad) ||
    cantidad < 0 ||
    cantidad > 1
  ) {
    throw new Error(
      "Resultado de revocación inesperado"
    );
  }

  return cantidad === 1
    ? { estado: "revocado" }
    : { estado: "acceso_no_disponible" };
}
