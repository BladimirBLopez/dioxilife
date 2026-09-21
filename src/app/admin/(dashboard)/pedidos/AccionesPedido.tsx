import {
  actualizarEstadoPedido,
} from "./acciones";

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
      <div className="rounded-lg bg-emerald-50 p-4">

        <p className="text-sm font-semibold text-emerald-700">
          Pedido completado
        </p>

        <p className="mt-1 text-xs text-emerald-600">
          La operación comercial fue finalizada.
        </p>

      </div>
    );
  }


  if (estado === "CANCELADO") {
    return (
      <div className="rounded-lg bg-red-50 p-4">

        <p className="text-sm font-semibold text-red-600">
          Pedido cancelado
        </p>

        <p className="mt-1 text-xs text-red-500">
          Este pedido ya no puede continuar.
        </p>

      </div>
    );
  }


  if (estado === "CONFIRMADO") {
    return (
      <div className="space-y-4">

        <div className="rounded-lg bg-blue-50 p-4">

          <p className="text-sm font-semibold text-blue-700">
            Esperando reporte de pago
          </p>

          <p className="mt-1 text-xs text-blue-600">
            El vendedor debe reportar el pago desde su panel.
          </p>

        </div>


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
            Cancelar pedido
          </button>
        </form>

      </div>
    );
  }


  if (estado === "PAGO_REPORTADO") {
    return (
      <div className="space-y-4">

        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">

          <p className="font-semibold text-orange-700">
            Pago reportado
          </p>

          <p className="mt-1 text-sm text-orange-600">
            El vendedor indicó que el cliente realizó el pago.
            Verifica el pago antes de aprobarlo.
          </p>

        </div>


        <div className="flex flex-wrap gap-2">

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
              Aprobar pago
            </button>
          </form>


          <form
            action={actualizarEstadoPedido.bind(
              null,
              id,
              "CONFIRMADO"
            )}
          >
            <button
              type="submit"
              className="rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
            >
              Rechazar reporte
            </button>
          </form>

        </div>

      </div>
    );
  }


  if (estado === "PAGADO") {
    return (
      <div className="space-y-4">

        <div className="rounded-lg bg-green-50 p-4">

          <p className="text-sm font-semibold text-green-700">
            Pago aprobado
          </p>

          <p className="mt-1 text-xs text-green-600">
            El pago fue validado por administración.
          </p>

        </div>


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

      </div>
    );
  }


  return (
    <div className="flex flex-wrap gap-2">

      {estado === "NUEVO" && (
        <>
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
              Cancelar pedido
            </button>
          </form>
        </>
      )}

    </div>
  );
}
