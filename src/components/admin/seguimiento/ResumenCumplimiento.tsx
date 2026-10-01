import { calcularCumplimiento } from "@/lib/seguimiento-cumplimiento";
import BotonRecordarPendientes from "@/components/admin/seguimiento/BotonRecordarPendientes";

function colorPorcentaje(porcentaje: number | null) {
  if (porcentaje === null) {
    return "text-gray-500";
  }

  if (porcentaje >= 80) {
    return "text-green-700";
  }

  if (porcentaje >= 50) {
    return "text-amber-700";
  }

  return "text-red-700";
}

export default async function ResumenCumplimiento({
  seguimientoId,
  tieneTelefono,
}: {
  seguimientoId: string;
  tieneTelefono: boolean;
}) {
  const cumplimiento =
    await calcularCumplimiento(
      seguimientoId
    );

  if (!cumplimiento) {
    return null;
  }

  const {
    totalHoy,
    completadasHoy,
    pendientesHoy,
    semanaTotal,
    semanaCompletadas,
    semanaPorcentaje,
    diaActual,
  } = cumplimiento;

  const porcentajeHoy =
    totalHoy > 0
      ? Math.round(
          (completadasHoy / totalHoy) * 100
        )
      : 0;

  return (
    <section className="space-y-4 rounded-xl bg-white p-4 shadow sm:p-5">

      <h2 className="text-base font-semibold text-gray-900">
        Cómo va el cliente
      </h2>


      <div className="grid grid-cols-2 gap-2 text-center">

        <div className="rounded-xl bg-gray-50 p-3">

          <p className="text-[11px] text-gray-500">
            Hoy
          </p>

          <p className="mt-1 text-sm font-bold text-gray-900">
            {totalHoy > 0
              ? `${completadasHoy} de ${totalHoy} tareas`
              : "Sin tareas hoy"}
          </p>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{
                width: `${porcentajeHoy}%`,
              }}
            />
          </div>

        </div>


        <div className="rounded-xl bg-gray-50 p-3">

          <p className="text-[11px] text-gray-500">
            {diaActual >= 7
              ? "Últimos 7 días"
              : "Desde el inicio"}
          </p>

          <p
            className={`mt-1 text-sm font-bold ${colorPorcentaje(
              semanaPorcentaje
            )}`}
          >
            {semanaPorcentaje === null
              ? "Aún sin datos"
              : `${semanaPorcentaje}% cumplido`}
          </p>

          {semanaPorcentaje !== null && (
            <p className="mt-1 text-[11px] text-gray-500">
              {semanaCompletadas} de {semanaTotal} tareas
            </p>
          )}

        </div>

      </div>


      {pendientesHoy.length > 0 ? (

        <div className="space-y-3">

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">

            <p className="text-xs font-semibold text-amber-900">
              Le falta hoy
            </p>

            <ul className="mt-1.5 space-y-1">

              {pendientesHoy.map((pendiente) => (
                <li
                  key={pendiente.id}
                  className="text-xs text-amber-800"
                >
                  • {pendiente.titulo}
                  {pendiente.hora
                    ? ` (${pendiente.hora})`
                    : ""}
                </li>
              ))}

            </ul>

          </div>

          {tieneTelefono && (
            <BotonRecordarPendientes
              seguimientoId={seguimientoId}
            />
          )}

        </div>

      ) : totalHoy > 0 &&
        completadasHoy === totalHoy ? (

        <p className="rounded-xl bg-green-50 p-3 text-xs font-semibold text-green-800">
          ✅ Hoy completó todas sus tareas.
        </p>

      ) : (

        <p className="text-xs text-gray-500">
          No tiene nada atrasado por ahora.
        </p>

      )}

    </section>
  );
}
