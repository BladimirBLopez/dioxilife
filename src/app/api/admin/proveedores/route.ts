import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  prisma,
} from "@/lib/prisma";

import {
  obtenerAdminActual,
} from "@/lib/admin-auth";

import {
  proveedorSchema,
} from "@/lib/validations/proveedor";


export async function GET() {

  const admin =
    await obtenerAdminActual();


  if (!admin) {
    return NextResponse.json(
      {
        error:
          "No autorizado",
      },
      {
        status: 401,
      }
    );
  }


  const proveedores =
    await prisma.proveedor.findMany({
      orderBy: {
        nombre:
          "asc",
      },
    });


  return NextResponse.json(
    proveedores
  );
}


export async function POST(
  req: NextRequest
) {

  const admin =
    await obtenerAdminActual();


  if (!admin) {
    return NextResponse.json(
      {
        error:
          "No autorizado",
      },
      {
        status: 401,
      }
    );
  }


  const body =
    await req.json();


  const resultado =
    proveedorSchema.safeParse(
      {
        nombre:
          String(
            body.nombre || ""
          ),

        telefono:
          String(
            body.telefono || ""
          ),

        email:
          String(
            body.email || ""
          ),

        direccion:
          String(
            body.direccion || ""
          ),
      }
    );


  if (!resultado.success) {

    const primerError =
      resultado.error.issues[0];


    return NextResponse.json(
      {
        error:
          primerError?.message ||
          "Datos inválidos",
      },
      {
        status: 400,
      }
    );
  }


  const data =
    resultado.data;


  const proveedor =
    await prisma.proveedor.create({
      data: {
        nombre:
          data.nombre,

        telefono:
          data.telefono ||
          null,

        email:
          data.email ||
          null,

        direccion:
          data.direccion ||
          null,
      },
    });


  return NextResponse.json(
    proveedor
  );
}
