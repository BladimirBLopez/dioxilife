import { z } from "zod";

/**
 * Validaciones del módulo Pruebas de alimentos.
 * No realizan operaciones de base de datos.
 */

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function fechaCalendarioValida(valor: string): boolean {
  if (!FECHA.test(valor)) return false;

  const fecha = new Date(`${valor}T00:00:00Z`);

  return (
    Number.isFinite(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === valor
  );
}

export const fechaPruebaSchema = z
  .string()
  .refine(fechaCalendarioValida, {
    message: "Fecha no válida",
  });

export const horaPruebaSchema = z
  .string()
  .regex(HORA, "Hora no válida");

export const glucosaPruebaSchema = z
  .number()
  .finite()
  .positive("La medición debe ser mayor que cero")
  .max(1000, "Revisar el valor introducido")
  .refine(
    (valor) =>
      Math.abs(
        valor * 100 - Math.round(valor * 100)
      ) < 0.000001,
    {
      message: "Máximo dos decimales",
    }
  );

/**
 * Datos que podrá introducir el administrador
 * al preparar el acceso de un cliente.
 *
 * El token nunca se acepta desde este formulario:
 * siempre se generará en el servidor.
 */
export const crearClientePruebaSchema = z.strictObject({
  nombre: z.string().trim().min(2).max(120),
  telefono: z.string().trim().max(30).optional(),
});

/**
 * Primera etapa: datos registrados antes de comer.
 * El cliente se identificará con el token de la URL,
 * no mediante un ID enviado por el formulario.
 */
export const iniciarRegistroAlimentoSchema = z.strictObject({
  fecha: fechaPruebaSchema,
  glucosaAyunas: glucosaPruebaSchema.nullable(),
  glucosaAntes: glucosaPruebaSchema,
  alimento: z.string().trim().min(2).max(120),
  cantidad: z.string().trim().max(100).optional(),
  horaComida: horaPruebaSchema,
  observacion: z.string().trim().max(1500).optional(),
});

/**
 * Segunda etapa: medición posterior a la comida.
 * La API deberá comprobar que el registro pertenece
 * al cliente identificado por el token.
 */
export const completarRegistroAlimentoSchema = z.strictObject({
  glucosaDespues: glucosaPruebaSchema,
  horaMedicionDespues: horaPruebaSchema,
});

/**
 * Suma 120 minutos a una fecha y hora de calendario.
 *
 * Opera con valores de hora local, sin convertirlos
 * a un instante UTC. También contempla el cambio de día.
 */
export function calcularHoraSegundaMedicion(
  fecha: string,
  horaComida: string
) {
  const fechaValida = fechaPruebaSchema.safeParse(fecha);
  const horaValida = horaPruebaSchema.safeParse(horaComida);

  if (!fechaValida.success || !horaValida.success) {
    throw new Error("Fecha u hora no válida");
  }

  const instante = new Date(
    `${fecha}T${horaComida}:00Z`
  );

  instante.setUTCMinutes(
    instante.getUTCMinutes() + 120
  );

  const resultado = instante.toISOString();

  return {
    fecha: resultado.slice(0, 10),
    hora: resultado.slice(11, 16),
    siguienteDia: resultado.slice(0, 10) !== fecha,
  };
}

/**
 * Diferencia descriptiva en mg/dL.
 * No clasifica alimentos ni diagnostica enfermedades.
 */
export function calcularVariacionGlucosa(
  antes: number,
  despues: number
): number {
  if (
    !glucosaPruebaSchema.safeParse(antes).success ||
    !glucosaPruebaSchema.safeParse(despues).success
  ) {
    throw new Error("Mediciones no válidas");
  }

  return Math.round((despues - antes) * 100) / 100;
}
