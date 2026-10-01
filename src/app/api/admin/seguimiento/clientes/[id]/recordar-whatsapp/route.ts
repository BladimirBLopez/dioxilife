import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";
import { calcularCumplimiento } from "@/lib/seguimiento-cumplimiento";


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


  const cumplimiento =
    await calcularCumplimiento(
      seguimiento.id
    );


  if (
    !cumplimiento ||
    cumplimiento.pendientesHoy.length === 0
  ) {
    return NextResponse.json(
      {
        error:
          "No hay actividades pendientes por recordar.",
      },
      {
        status:409,
      }
    );
  }


  // El enlace del cliente solo vive dentro de los mensajes ya
  // enviados. Sirve el de un envío posterior al último cambio de enlace.
  const envios =
    await prisma.seguimientoEnvioWhatsApp.findMany({
      where:{
        seguimientoId:
          seguimiento.id,

        fechaEnvio:{
          gte:
            seguimiento.tokenCreadoAt,
        },
      },

      orderBy:{
        fechaEnvio:"desc",
      },

      select:{
        mensaje:true,
      },

      take:10,
    });


  let enlace: string | null = null;

  for (const envio of envios) {
    const encontrado =
      /https?:\/\/\S+\/seguimiento\/[A-Za-z0-9_-]+/.exec(
        envio.mensaje
      );

    if (encontrado) {
      enlace =
        encontrado[0];

      break;
    }
  }


  if (!enlace) {
    return NextResponse.json(
      {
        error:
          "Primero envíale su enlace con 'Enviar por WhatsApp'.",
      },
      {
        status:409,
      }
    );
  }


  const nombre =
    (seguimiento.nombreCliente || "")
      .trim()
      .split(/\s+/)[0];

  const lista =
    cumplimiento.pendientesHoy
      .map(
        (pendiente) =>
          `• ${pendiente.titulo}${
            pendiente.hora
              ? ` (${pendiente.hora})`
              : ""
          }`
      )
      .join("\n");


  const mensaje =
`${nombre ? `Hola ${nombre} 👋` : "Hola 👋"}

Hoy te falta:
${lista}

Márcalas cuando las hagas:
${enlace}`;


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
  });
}
