import { z } from "zod";

export const proveedorSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(
      2,
      "El nombre debe tener al menos 2 caracteres"
    )
    .max(
      120,
      "El nombre es demasiado largo"
    ),

  telefono: z
    .string()
    .trim()
    .max(
      30,
      "El teléfono es demasiado largo"
    ),

  email: z
    .union([
      z.literal(""),
      z.email(
        "Ingresa un correo electrónico válido"
      ),
    ]),

  direccion: z
    .string()
    .trim()
    .max(
      240,
      "La dirección es demasiado larga"
    ),
});

export type ProveedorFormValues =
  z.infer<typeof proveedorSchema>;
