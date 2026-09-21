import { actualizarEstadoPedido } from "./acciones";

type Props = {
  id: string;
  estado: string;
};

export default function AccionesPedido({
  id,
  estado,
}: Props) {
  if (estado === "COMPLETADO") {
    return (
      <span className="text-sm font-semibold text-emerald-600">
        Pedido completado
      </span>
    );
  }

  if (estado === "CANCELADO") {
    return (
      <span className="text-sm font-semibold text-red-500">
        Pedido cancelado
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">

      {estado === "NUEVO" && (
        <form
          action={actualizarEstadoPedido.bind(
            null,
            id,
            "CONFIRMADO"
          )}
        >
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Confirmar pedido
          </button>
        </form>
      )}


      {estado === "CONFIRMADO" && (
        <form
          action={actualizarEstadoPedido.bind(
            null,
            id,
            "PAGADO"
          )}
        >
          <button
            type="submit"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            Marcar pagado
          </button>
        </form>
      )}


      {estado === "PAGADO" && (
        <form
          action={actualizarEstadoPedido.bind(
            null,
            id,
            "COMPLETADO"
          )}
        >
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Completar pedido
          </button>
        </form>
      )}


      {(estado === "NUEVO" ||
        estado === "CONFIRMADO") && (
        <form
          action={actualizarEstadoPedido.bind(
            null,
            id,
            "CANCELADO"
          )}
        >
          <button
            type="submit"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            Cancelar
          </button>
        </form>
      )}

    </div>
  );
}
