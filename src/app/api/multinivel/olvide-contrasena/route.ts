import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createHash,
  randomBytes,
} from "crypto";

import {
  prisma,
} from "@/lib/prisma";

import {
  enviarCorreo,
} from "@/lib/email";


function obtenerHashToken(
  token: string
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}


function escaparHtml(
  valor: string
) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


const RESPUESTA_GENERICA = {
  ok: true,

  mensaje:
    "Si existe una cuenta asociada a ese correo, recibirás las instrucciones para restablecer tu contraseña.",
};


export async function POST(
  req: NextRequest
) {
  try {

    const body =
      await req.json();


    const email =
      String(
        body.email || ""
      )
        .trim()
        .toLowerCase();


    if (!email) {
      return NextResponse.json(
        {
          error:
            "El correo electrónico es obligatorio",
        },
        {
          status: 400,
        }
      );
    }


    if (
      !process.env.RESEND_API_KEY ||
      !process.env.EMAIL_FROM
    ) {
      console.error(
        "Recuperación de contraseña: servicio de correo no configurado"
      );

      return NextResponse.json(
        {
          error:
            "El servicio de recuperación no está disponible temporalmente",
        },
        {
          status: 503,
        }
      );
    }


    const miembro =
      await prisma.miembro.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
          nombres: true,
          email: true,
          activado: true,
          passwordResetExpira:
            true,
        },
      });


    /*
     * No revelamos si el correo existe
     * o si la cuenta está activada.
     */
    if (
      !miembro ||
      !miembro.activado
    ) {
      return NextResponse.json(
        RESPUESTA_GENERICA
      );
    }


    /*
     * Evita generar muchos correos
     * seguidos para la misma cuenta.
     *
     * Como el token dura 30 minutos,
     * si su expiración está a más de
     * 29 minutos significa que fue
     * solicitado hace menos de 1 minuto.
     */
    const limiteReciente =
      new Date(
        Date.now() +
          29 *
            60 *
            1000
      );


    if (
      miembro.passwordResetExpira &&
      miembro.passwordResetExpira >
        limiteReciente
    ) {
      return NextResponse.json(
        RESPUESTA_GENERICA
      );
    }


    const token =
      randomBytes(32).toString(
        "hex"
      );


    const tokenHash =
      obtenerHashToken(
        token
      );


    const expira =
      new Date(
        Date.now() +
          30 *
            60 *
            1000
      );


    await prisma.miembro.update({
      where: {
        id:
          miembro.id,
      },

      data: {
        passwordResetTokenHash:
          tokenHash,

        passwordResetExpira:
          expira,
      },
    });


    const baseUrl =
      String(
        process.env.APP_URL ||
          req.nextUrl.origin
      ).replace(
        /\/$/,
        ""
      );


    const enlace =
      `${baseUrl}/restablecer-contrasena/${token}`;


    try {

      await enviarCorreo({
        para:
          miembro.email,

        asunto:
          "Restablece tu contraseña - DioxiLife Bolivia",

        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033;">
            <h2>Restablece tu contraseña</h2>

            <p>
              Hola ${escaparHtml(miembro.nombres)}.
            </p>

            <p>
              Recibimos una solicitud para cambiar la contraseña de tu cuenta de DioxiLife Bolivia.
            </p>

            <p style="margin:28px 0;">
              <a
                href="${enlace}"
                style="background:#10182D;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:bold;display:inline-block;"
              >
                Crear nueva contraseña
              </a>
            </p>

            <p>
              Este enlace vence en 30 minutos y solo puede utilizarse una vez.
            </p>

            <p style="font-size:13px;color:#64748b;">
              Si tú no solicitaste este cambio, puedes ignorar este mensaje. Tu contraseña actual continuará funcionando.
            </p>
          </div>
        `,
      });

    } catch (error) {

      /*
       * Si el correo falla,
       * invalidamos el token que
       * acabamos de generar.
       */
      await prisma.miembro.update({
        where: {
          id:
            miembro.id,
        },

        data: {
          passwordResetTokenHash:
            null,

          passwordResetExpira:
            null,
        },
      });


      console.error(
        "Error enviando recuperación de contraseña:",
        error
      );


      return NextResponse.json(
        {
          error:
            "No se pudo enviar el correo de recuperación",
        },
        {
          status: 503,
        }
      );
    }


    return NextResponse.json(
      RESPUESTA_GENERICA
    );

  } catch (error) {

    console.error(
      "Error en recuperación de contraseña:",
      error
    );


    return NextResponse.json(
      {
        error:
          "No se pudo procesar la solicitud",
      },
      {
        status: 500,
      }
    );
  }
}
