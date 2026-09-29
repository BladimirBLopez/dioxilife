import webpush from "web-push";

let configurado = false;

export function obtenerWebPush() {
  if (configurado) {
    return webpush;
  }

  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const privateKey =
    process.env.VAPID_PRIVATE_KEY;

  const subject =
    process.env.VAPID_SUBJECT;

  if (
    !publicKey ||
    !privateKey ||
    !subject
  ) {
    throw new Error(
      "Faltan variables VAPID para Web Push."
    );
  }

  webpush.setVapidDetails(
    subject,
    publicKey,
    privateKey
  );

  configurado = true;

  return webpush;
}

export function obtenerVapidPublicKey() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error(
      "Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY."
    );
  }

  return publicKey;
}
