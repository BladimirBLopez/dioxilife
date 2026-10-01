"use client";

type EnvioWhatsApp = {
  id: string;
  telefono: string;
  mensaje: string;
  fechaEnvio: Date;
  enviadoPorUsuario: string | null;
};

export default function HistorialWhatsApp({
  envios,
}: {
  envios: EnvioWhatsApp[];
}) {
  return (
    <details className="group rounded-xl bg-white shadow">

      <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-semibold text-gray-900">

        <span>
          Historial de WhatsApp
          {envios.length > 0 && (
            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
              {envios.length}
            </span>
          )}
        </span>

        <span className="text-gray-400 transition group-open:rotate-180">
          ▾
        </span>

      </summary>


      <div className="border-t border-gray-100 p-4">

        {envios.length === 0 ? (

          <p className="text-xs text-gray-500">
            Todavía no hay envíos registrados.
          </p>

        ) : (

          <ul className="space-y-3">

            {envios.map((envio) => (

              <li
                key={envio.id}
                className="rounded-lg bg-gray-50 p-3"
              >

                <div className="flex items-center justify-between gap-2">

                  <p className="text-xs font-semibold text-gray-700">
                    {new Date(
                      envio.fechaEnvio
                    ).toLocaleString(
                      "es-BO",
                      {
                        timeZone:
                          "America/La_Paz",
                        dateStyle: "short",
                        timeStyle: "short",
                      }
                    )}
                  </p>

                  <p className="text-xs text-gray-500">
                    {envio.enviadoPorUsuario ||
                      "Sistema"}
                  </p>

                </div>


                <details className="mt-2">

                  <summary className="cursor-pointer text-xs font-medium text-green-700">
                    Ver mensaje
                  </summary>

                  <p className="mt-2 whitespace-pre-line text-xs text-gray-700">
                    {envio.mensaje}
                  </p>

                </details>

              </li>

            ))}

          </ul>

        )}

      </div>

    </details>
  );
}
