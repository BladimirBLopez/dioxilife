type EnviarCorreoParams = {
  para: string;
  asunto: string;
  html: string;
};

export async function enviarCorreo({
  para,
  asunto,
  html,
}: EnviarCorreoParams) {
  const apiKey =
    process.env.RESEND_API_KEY;

  const remitente =
    process.env.EMAIL_FROM;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY no está configurado"
    );
  }

  if (!remitente) {
    throw new Error(
      "EMAIL_FROM no está configurado"
    );
  }

  const respuesta =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          from: remitente,
          to: [para],
          subject: asunto,
          html,
        }),
      }
    );

  if (!respuesta.ok) {
    const detalle =
      await respuesta.text();

    throw new Error(
      `Error Resend ${respuesta.status}: ${detalle}`
    );
  }

  return respuesta.json();
}
