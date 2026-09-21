import {
  randomBytes,
} from "crypto";

import {
  prisma,
} from "@/lib/prisma";


export async function generarCodigoReferido() {

  for (
    let intento = 0;
    intento < 10;
    intento++
  ) {
    const codigo =
      randomBytes(4)
        .toString("hex")
        .toUpperCase();

    const existe =
      await prisma.miembro.findUnique({
        where: {
          codigoReferido:
            codigo,
        },

        select: {
          id: true,
        },
      });


    if (!existe) {
      return codigo;
    }
  }


  throw new Error(
    "No se pudo generar un código de referido único"
  );
}
