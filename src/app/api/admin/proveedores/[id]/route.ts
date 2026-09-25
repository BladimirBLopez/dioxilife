import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";


export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {

  const admin =
    await obtenerAdminActual();


  if (!admin) {
    return NextResponse.json(
      {
        error: "No autorizado",
      },
      {
        status: 401,
      }
    );
  }


  const { id } =
    await params;


  const body =
    await req.json();


  const proveedor =
    await prisma.proveedor.update({
      where: {
        id,
      },

      data: {
        nombre:
          typeof body.nombre === "string"
            ? body.nombre.trim()
            : undefined,

        telefono:
          typeof body.telefono === "string"
            ? body.telefono.trim() || null
            : undefined,

        email:
          typeof body.email === "string"
            ? body.email.trim() || null
            : undefined,

        direccion:
          typeof body.direccion === "string"
            ? body.direccion.trim() || null
            : undefined,

        activo:
          typeof body.activo === "boolean"
            ? body.activo
            : undefined,
      },
    });


  return NextResponse.json(
    proveedor
  );
}
