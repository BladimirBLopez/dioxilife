"use client";

type EnvioWhatsApp = {
  id: string;
  telefono: string;
  mensaje: string;
  fechaEnvio: Date | string;
  enviadoPorUsuario: string | null;
};

export default function HistorialWhatsApp({
  envios,
}: {
  envios: EnvioWhatsApp[];
}) {
  return (
    <div className="mt-5 w-full max-w-full overflow-hidden border-t pt-5">

      <h3 className="text-sm font-semibold text-gray-900">
        Historial WhatsApp
      </h3>

      {envios.length === 0 ? (

        <p className="mt-3 text-xs text-gray-500">
          No existen envíos registrados.
        </p>

      ) : (

        <div className="mt-3 w-full max-w-full space-y-3">

          {envios.map((envio) => (

            <div
              key={envio.id}
              className="w-full max-w-full overflow-hidden rounded-xl border bg-gray-50 p-3"
            >

              <p className="break-all text-xs font-semibold text-gray-700">
                📱 {envio.telefono}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {new Date(
                  envio.fechaEnvio
                ).toLocaleString(
                  "es-BO",
                  {
                    timeZone:
                      "America/La_Paz",
                  }
                )}
              </p>

              <p className="mt-1 break-words text-xs text-gray-500">
                Enviado por:{" "}
                {envio.enviadoPorUsuario || "Sistema"}
              </p>


              <details className="mt-3">

                <summary className="cursor-pointer text-xs font-medium text-green-700">
                  Ver mensaje
                </summary>


                <div className="mt-2 overflow-hidden rounded-lg bg-white p-3">

                  <p className="whitespace-pre-line break-words text-xs leading-5 text-gray-700">
                    {envio.mensaje}
                  </p>

                </div>

              </details>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}
