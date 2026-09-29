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


function construirMensaje(
  nombre: string | null,
  url: string
) {
  return `Hola ${nombre || "cliente"} 👋

Te compartimos tu seguimiento personalizado DioxiLife.

Ingresa aquí:
${url}

Sigue las indicaciones de tu agenda diaria.`;
}


export async function POST(
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


  const forzarNuevo =
    req.nextUrl.searchParams.get("nuevo") === "1";


  // Token opcional: lo envía el formulario de creación,
  // que es el único momento en que el token existe en claro.
  const body =
    await req.json().catch(() => null);

  const tokenRecibido =
    typeof body?.token === "string"
      ? body.token
      : null;


  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where:{
        id,
      },

      select:{
        id:true,
        nombreCliente:true,
        telefonoCliente:true,
        tokenAccesoHash:true,
        tokenCreadoAt:true,
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


  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    req.nextUrl.origin;


  let mensaje: string | null = null;
  let reutilizado = false;


  // 1) Token recién creado (formulario): se valida contra el hash
  //    y se usa tal cual, sin regenerar.
  if (
    tokenRecibido &&
    hashToken(tokenRecibido) ===
      seguimiento.tokenAccesoHash
  ) {
    mensaje =
      construirMensaje(
        seguimiento.nombreCliente,
        `${baseUrl}/seguimiento/${tokenRecibido}`
      );
  }


  // 2) Si el último envío sigue siendo válido (el token no cambió
  //    después de ese envío), se reutiliza su mensaje y su enlace.
  if (!mensaje && !forzarNuevo) {

    const ultimo =
      await prisma.seguimientoEnvioWhatsApp.findFirst({
        where:{
          seguimientoId:
            seguimiento.id,
        },

        orderBy:{
          fechaEnvio:"desc",
        },

        select:{
          mensaje:true,
          fechaEnvio:true,
        },
      });


    if (
      ultimo &&
      seguimiento.tokenCreadoAt <=
        ultimo.fechaEnvio
    ) {
      mensaje =
        ultimo.mensaje;

      reutilizado =
        true;
    }
  }


  // 3) En cualquier otro caso se genera un enlace nuevo.
  if (!mensaje) {

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


    mensaje =
      construirMensaje(
        seguimiento.nombreCliente,
        `${baseUrl}/seguimiento/${token}`
      );
  }


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

    reutilizado,
  });
}
