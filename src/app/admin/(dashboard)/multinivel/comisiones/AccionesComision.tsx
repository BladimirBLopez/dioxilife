import { actualizarEstadoComision } from "./acciones";

type Props = {
  id: string;
  estado: string;
};

export default function AccionesComision({
  id,
  estado,
}: Props) {
  if (estado === "PAGADA") {
    return (
      <span className="text-xs font-medium text-green-600">
        Finalizada
      </span>
    );
  }

  if (estado === "ANULADA") {
    return (
      <span className="text-xs font-medium text-red-500">
        Sin acciones
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">

      {estado === "PENDIENTE" && (
        <form
          action={actualizarEstadoComision.bind(
            null,
            id,
            "APROBADA"
          )}
        >
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Aprobar
          </button>
        </form>
      )}


      {estado === "APROBADA" && (
        <form
          action={actualizarEstadoComision.bind(
            null,
            id,
            "PAGADA"
          )}
        >
          <button
            type="submit"
            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
          >
            Marcar pagada
          </button>
        </form>
      )}


      {(estado === "PENDIENTE" ||
        estado === "APROBADA") && (
        <form
          action={actualizarEstadoComision.bind(
            null,
            id,
            "ANULADA"
          )}
        >
          <button
            type="submit"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
          >
            Anular
          </button>
        </form>
      )}

    </div>
  );
}
