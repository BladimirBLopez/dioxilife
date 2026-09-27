type PrecioLike =
  | number
  | string
  | {
      toString(): string;
    };

export function formatearPrecio(valor: PrecioLike) {
  const numero = Number(valor.toString());

  if (!Number.isFinite(numero)) {
    return valor.toString();
  }

  return Number.isInteger(numero)
    ? numero.toFixed(0)
    : numero.toFixed(2);
}
