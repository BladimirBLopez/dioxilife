export function abrirWhatsApp(
  telefono: string,
  mensaje: string
) {
  const digitos =
    String(telefono).replace(/\D/g, "");

  const numero =
    digitos.startsWith("591") &&
    digitos.length > 8
      ? digitos
      : `591${digitos}`;

  window.open(
    `https://wa.me/${numero}?text=${encodeURIComponent(
      mensaje
    )}`,
    "_blank"
  );
}
