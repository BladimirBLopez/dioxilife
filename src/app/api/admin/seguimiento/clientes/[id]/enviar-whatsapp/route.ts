import {
  createHash,
  randomBytes,
} from "crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";


function hashToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}


export async function POST(
  _req: NextRequest,
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
        error:
          "No autorizado",
      },
      {
        status:401,
      }
    );
  }


  const { id } =
    await params;


  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where:{
        id,
      },

      select:{
        id:true,
        nombreCliente:true,
        telefonoCliente:true,
        estado:true,
      },
    });


  if (!seguimiento) {
    return NextResponse.json(
      {
        error:
          "Seguimiento no encontrado",
      },
      {
        status:404,
      }
    );
  }


  if (!seguimiento.telefonoCliente) {
    return NextResponse.json(
      {
        error:
          "El cliente no tiene WhatsApp registrado",
      },
      {
        status:400,
      }
    );
  }


  const token =
    randomBytes(32)
      .toString("hex");


  await prisma.seguimientoCliente.update({
    where:{
      id,
    },

    data:{
      tokenAccesoHash:
        hashToken(token),

      tokenCreadoAt:
        new Date(),
    },
  });


  const url =
    `${process.env.NEXT_PUBLIC_APP_URL}/seguimiento/${token}`;


  const mensaje =
`Hola ${seguimiento.nombreCliente || "cliente"} 👋

Te compartimos tu seguimiento personalizado DioxiLife.

Ingresa aquí:
${url}

Sigue las indicaciones de tu agenda diaria.`;


  await prisma.seguimientoEnvioWhatsApp.create({
    data:{
      seguimientoId:
        seguimiento.id,

      telefono:
        seguimiento.telefonoCliente,

      mensaje,

      enviadoPorId:
        admin.id,

      enviadoPorUsuario:
        admin.usuario,
    },
  });


  return NextResponse.json({
    telefono:
      seguimiento.telefonoCliente,

    mensaje,

    url,
  });
}
