"use client";

type Props = {
  inicio: string;
  fin: string;
  duracionDias: number;
  onFinChange: (diaFin: string) => void;
};

export default function DuracionRapidaProtocolo({
  inicio,
  fin,
  duracionDias,
  onFinChange,
}: Props) {
  const desde = Number(inicio);
  const hasta = Number(fin);

  const inicioValido =
    inicio.trim() !== "" &&
    Number.isInteger(desde) &&
    desde >= 1 &&
    desde <= duracionDias;

  const finValido =
    fin.trim() !== "" &&
    Number.isInteger(hasta) &&
    inicioValido &&
    hasta >= desde &&
    hasta <= duracionDias;

  const cantidad = finValido
    ? hasta - desde + 1
    : null;

  function elegir(dias: number) {
    if (!inicioValido) return;

    const ultimo = desde + dias - 1;

    if (ultimo > duracionDias) return;

    onFinChange(String(ultimo));
  }

  return (
    <div className="col-span-full rounded-xl border border-purple-200 bg-purple-50 p-3">
      <p className="text-sm font-bold text-purple-900">
        Duración del protocolo
      </p>

      <p className="mt-1 text-xs text-purple-800">
        Elige 3 o 7 días. También puedes escribir
        otro día final en el formulario.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {[3, 7].map((dias) => {
          const seleccionado = cantidad === dias;
          const permitido =
            inicioValido &&
            desde + dias - 1 <= duracionDias;

          return (
            <button
              key={dias}
              type="button"
              disabled={!permitido}
              aria-pressed={seleccionado}
              onClick={() => elegir(dias)}
              className={`rounded-lg border px-3 py-3 text-sm font-bold disabled:opacity-40 ${
                seleccionado
                  ? "border-purple-700 bg-purple-700 text-white"
                  : "border-purple-300 bg-white text-purple-800 hover:bg-purple-100"
              }`}
            >
              {dias} días
            </button>
          );
        })}
      </div>

      {finValido ? (
        <p className="mt-3 text-xs font-semibold text-purple-900">
          Del día {desde} al {hasta}
          {" "}({cantidad} días)
        </p>
      ) : (
        <p className="mt-3 text-xs text-purple-800">
          Selecciona un período válido.
          En un adicional manual, dejar el día final
          vacío significa continuar hasta terminar
          el seguimiento.
        </p>
      )}
    </div>
  );
}
