"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function generarComisiones(
  formData: FormData
) {
  const origenMiembroId = String(
    formData.get("origenMiembroId") ?? ""
  );

  const montoBaseTexto = String(
    formData.get("montoBase") ?? ""
  );

  const concepto =
    String(formData.get("concepto") ?? "").trim() ||
    "Comisión multinivel";

  const porcentajesTexto = [
    String(formData.get("nivel1") ?? "0"),
    String(formData.get("nivel2") ?? "0"),
    String(formData.get("nivel3") ?? "0"),
  ];

  if (!origenMiembroId) {
    throw new Error(
      "Debe seleccionar el miembro que origina la operación."
    );
  }

  let montoBase: Prisma.Decimal;

  try {
    montoBase = new Prisma.Decimal(montoBaseTexto);
  } catch {
    throw new Error("El monto base no es válido.");
  }

  if (montoBase.lte(0)) {
    throw new Error(
      "El monto base debe ser mayor a cero."
    );
  }

  const porcentajes = porcentajesTexto.map(
    (valor) => {
      try {
        return new Prisma.Decimal(valor || "0");
      } catch {
        throw new Error(
          "Uno de los porcentajes no es válido."
        );
      }
    }
  );

  for (const porcentaje of porcentajes) {
    if (
      porcentaje.lt(0) ||
      porcentaje.gt(100)
    ) {
      throw new Error(
        "Los porcentajes deben estar entre 0 y 100."
      );
    }
  }

  if (
    porcentajes.every((porcentaje) =>
      porcentaje.eq(0)
    )
  ) {
    throw new Error(
      "Debe indicar al menos un porcentaje."
    );
  }

  const origen =
    await prisma.miembro.findUnique({
      where: {
        id: origenMiembroId,
      },
      select: {
        id: true,
        estado: true,
      },
    });

  if (!origen) {
    throw new Error(
      "El miembro de origen no existe."
    );
  }

  if (origen.estado !== "ACTIVO") {
    throw new Error(
      "El miembro de origen no está activo."
    );
  }

  const comisiones: Prisma.ComisionMultinivelCreateManyInput[] =
    [];

  let miembroActualId = origenMiembroId;

  for (let nivel = 1; nivel <= 3; nivel++) {
    const miembroActual =
      await prisma.miembro.findUnique({
        where: {
          id: miembroActualId,
        },
        select: {
          patrocinadorId: true,
        },
      });

    if (
      !miembroActual ||
      !miembroActual.patrocinadorId
    ) {
      break;
    }

    const patrocinador =
      await prisma.miembro.findUnique({
        where: {
          id: miembroActual.patrocinadorId,
        },
        select: {
          id: true,
          estado: true,
        },
      });

    if (!patrocinador) {
      break;
    }

    const porcentaje =
      porcentajes[nivel - 1];

    if (
      patrocinador.estado === "ACTIVO" &&
      porcentaje.gt(0)
    ) {
      const monto = montoBase
        .mul(porcentaje)
        .div(100);

      comisiones.push({
        beneficiarioId: patrocinador.id,
        origenMiembroId,
        nivel,
        montoBase,
        porcentaje,
        monto,
        concepto,
        estado: "PENDIENTE",
      });
    }

    miembroActualId = patrocinador.id;
  }

  if (comisiones.length === 0) {
    throw new Error(
      "No existen patrocinadores activos con comisión para esta operación."
    );
  }

  await prisma.comisionMultinivel.createMany({
    data: comisiones,
  });

  redirect("/admin/multinivel/comisiones");
}
