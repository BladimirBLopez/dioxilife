"use client";

import {
  useRef,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import ListadoEnlacesCliente from "./ListadoEnlacesCliente";
import TarjetaQRPrivada from "./TarjetaQRPrivada";
import SelectorClienteSeguimiento from "./SelectorClienteSeguimiento";

type OrigenCliente = "nuevo" | "existente";
type Vigencia = 7 | 30 | 90;

type EnlaceCreado = {
  clientePruebaId: string;
  nombre: string;
  url: string;
  tokenExpiraAt: string;
};

const RUTA_API =
  "/api/admin/pruebas-alimentos/enlaces";

const FORMATO_RUTA =
  /^\/prueba-alimentos\/[0-9a-f]{64}$/;

const FORMATO_ID =
  /^[A-Za-z0-9_-]{5,128}$/;

const campo =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 focus:border-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-100";

const etiqueta =
  "mb-2 block text-sm font-semibold text-slate-700";

const boton =
  "rounded-xl bg-fuchsia-700 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50";

function esObjeto(
  valor: unknown
): valor is Record<string, unknown> {
  return (
    valor !== null &&
    typeof valor === "object" &&
    !Array.isArray(valor)
  );
}

function mensajeError(status: number): string {
  if (status === 401) {
    return "Tu sesión administrativa no está activa.";
  }

  if (status === 403) {
    return "La solicitud no fue autorizada.";
  }

  if (status === 400 || status === 422) {
    return "Revisa los datos del cliente.";
  }

  if (status === 404) {
    return "El registro solicitado no está disponible.";
  }

  if (status === 503) {
    return "La gestión de enlaces todavía no está habilitada.";
  }

  return "No se pudo completar la operación.";
}

async function solicitar(
  metodo: "POST" | "DELETE",
  datos: unknown
): Promise<unknown> {
  const respuesta = await fetch(RUTA_API, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    body: JSON.stringify(datos),
  });

  if (!respuesta.ok) {
    throw new Error(
      mensajeError(respuesta.status)
    );
  }

  return (await respuesta.json()) as unknown;
}

export default function GestionEnlacesCliente() {
  const ejecutando = useRef(false);

  const [origen, setOrigen] =
    useState<OrigenCliente>("nuevo");

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [seguimientoId, setSeguimientoId] =
    useState("");

  const [vigenciaDias, setVigenciaDias] =
    useState<Vigencia>(30);

  const [idRevocar, setIdRevocar] =
    useState("");

  const [enlace, setEnlace] =
    useState<EnlaceCreado | null>(null);

  const [dialogoEnlaceAbierto, setDialogoEnlaceAbierto] =
    useState(false);

  const dialogoEnlace = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const nodo = dialogoEnlace.current;

    if (!nodo) return;

    if (dialogoEnlaceAbierto && enlace && !nodo.open) {
      nodo.showModal();
    }

    if ((!dialogoEnlaceAbierto || !enlace) && nodo.open) {
      nodo.close();
    }
  }, [dialogoEnlaceAbierto, enlace]);

  const [ocupado, setOcupado] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [versionListado, setVersionListado] =
    useState(0);

  const [error, setError] =
    useState("");

  async function crear(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (ejecutando.current) return;

    setError("");
    setMensaje("");
    setDialogoEnlaceAbierto(false);
    setEnlace(null);

    if (origen === "existente" && !seguimientoId.trim()) {
      setError("Selecciona un cliente del seguimiento.");
      return;
    }

    const datos =
      origen === "nuevo"
        ? {
            origen: "nuevo" as const,
            nombre: nombre.trim(),
            ...(telefono.trim()
              ? {telefono: telefono.trim()}
              : {}),
            vigenciaDias,
          }
        : {
            origen: "existente" as const,
            seguimientoId: seguimientoId.trim(),
            vigenciaDias,
          };

    ejecutando.current = true;
    setOcupado(true);

    try {
      const resultado = await solicitar(
        "POST",
        datos
      );

      if (
        !esObjeto(resultado) ||
        resultado.ok !== true ||
        typeof resultado.clientePruebaId !==
          "string" ||
        !FORMATO_ID.test(
          resultado.clientePruebaId
        ) ||
        typeof resultado.nombre !== "string" ||
        typeof resultado.enlaceRuta !== "string" ||
        !FORMATO_RUTA.test(
          resultado.enlaceRuta
        ) ||
        typeof resultado.tokenExpiraAt !==
          "string" ||
        !Number.isFinite(
          Date.parse(resultado.tokenExpiraAt)
        )
      ) {
        throw new Error(
          "La respuesta de creación no es válida."
        );
      }

      const url = new URL(
        resultado.enlaceRuta,
        window.location.origin
      ).href;

      setEnlace({
        clientePruebaId: resultado.clientePruebaId,
        nombre: resultado.nombre,
        url,
        tokenExpiraAt:
          resultado.tokenExpiraAt,
      });

      setDialogoEnlaceAbierto(true);

      setIdRevocar(
        resultado.clientePruebaId
      );

      setVersionListado(
        valor => valor + 1
      );

      setMensaje(
        "Enlace generado. Cópialo y compártelo únicamente con el cliente correspondiente."
      );
    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo generar el enlace."
      );
    } finally {
      ejecutando.current = false;
      setOcupado(false);
    }
  }

  async function copiarEnlace() {
    if (!enlace) return;

    try {
      await navigator.clipboard.writeText(
        enlace.url
      );

      setMensaje(
        "Enlace copiado. Envíalo únicamente al cliente correspondiente."
      );
    } catch {
      setMensaje(
        "Selecciona y copia manualmente el enlace."
      );
    }
  }

  async function revocar(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (ejecutando.current) return;

    setError("");
    setMensaje("");

    const id = idRevocar.trim();

    if (!FORMATO_ID.test(id)) {
      setError(
        "Introduce un identificador de acceso válido."
      );
      return;
    }

    ejecutando.current = true;
    setOcupado(true);

    try {
      const resultado = await solicitar(
        "DELETE",
        {clientePruebaId: id}
      );

      if (
        !esObjeto(resultado) ||
        resultado.ok !== true
      ) {
        throw new Error(
          "No se pudo confirmar la revocación."
        );
      }

      if (
        enlace?.clientePruebaId === id
      ) {
        setEnlace(null);
      }

      setIdRevocar("");

      setVersionListado(
        valor => valor + 1
      );

      setMensaje(
        "Acceso revocado correctamente."
      );
    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo revocar el acceso."
      );
    } finally {
      ejecutando.current = false;
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Crear enlace privado
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          El enlace será individual y tendrá
          una fecha de vencimiento.
          No se necesita contraseña del cliente.
        </p>

        <form
          onSubmit={crear}
          className="mt-5 space-y-4"
        >
          <div>
            <label className={etiqueta} htmlFor="pa-origen">
              Tipo de cliente
            </label>

            <select
              id="pa-origen"
              className={campo}
              value={origen}
              disabled={ocupado}
              onChange={e => {
                setOrigen(
                  e.target.value === "existente"
                    ? "existente"
                    : "nuevo"
                );
                setSeguimientoId("");
              }}
            >
              <option value="nuevo">
                Cliente nuevo
              </option>
              <option value="existente">
                Cliente del seguimiento existente
              </option>
            </select>
          </div>

          {origen === "nuevo" ? (
            <>
              <div>
                <label
                  className={etiqueta}
                  htmlFor="pa-nombre"
                >
                  Nombre del cliente
                </label>

                <input
                  id="pa-nombre"
                  className={campo}
                  required
                  minLength={2}
                  maxLength={120}
                  value={nombre}
                  onChange={e =>
                    setNombre(e.target.value)
                  }
                />
              </div>

              <div>
                <label
                  className={etiqueta}
                  htmlFor="pa-telefono"
                >
                  Teléfono (opcional)
                </label>

                <input
                  id="pa-telefono"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={campo}
                  maxLength={30}
                  value={telefono}
                  onChange={e =>
                    setTelefono(e.target.value.replace(/[^0-9]/g, ""))
                  }
                />
              </div>
            </>
          ) : (
            <SelectorClienteSeguimiento
              value={seguimientoId}
              onChange={setSeguimientoId}
              disabled={ocupado}
            />
          )}

          <div>
            <label
              className={etiqueta}
              htmlFor="pa-vigencia"
            >
              Vigencia del enlace
            </label>

            <select
              id="pa-vigencia"
              className={campo}
              value={vigenciaDias}
              disabled={ocupado}
              onChange={e => {
                const dias = Number(
                  e.target.value
                );

                setVigenciaDias(
                  dias === 7
                    ? 7
                    : dias === 90
                      ? 90
                      : 30
                );
              }}
            >
              <option value={7}>7 días</option>
              <option value={30}>30 días</option>
              <option value={90}>90 días</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={ocupado}
            className={boton}
          >
            {ocupado
              ? "Procesando..."
              : "Generar enlace privado"}
          </button>
        </form>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          {error}
        </p>
      )}

      {mensaje && !enlace && (
        <p
          role="status"
          className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800"
        >
          {mensaje}
        </p>
      )}

      {enlace && (
        <>
          <section className="rounded-2xl border border-fuchsia-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-700">
              Enlace generado para <strong>{enlace.nombre}</strong>.
            </p>

            <button
              type="button"
              onClick={() => setDialogoEnlaceAbierto(true)}
              className="mt-3 inline-flex rounded-xl bg-fuchsia-700 px-4 py-3 text-sm font-semibold text-white"
            >
              Ver enlace generado
            </button>
          </section>

          <dialog
            ref={dialogoEnlace}
            onClose={() => setDialogoEnlaceAbierto(false)}
            aria-labelledby="pa-modal-enlace-titulo"
            className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-fuchsia-200 bg-white p-4 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 sm:p-6"
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => dialogoEnlace.current?.close()}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Cerrar ×
              </button>
            </div>

            <section className="space-y-3">
          <h2
            id="pa-modal-enlace-titulo"
            className="text-lg font-bold text-slate-900"
          >
            Enlace generado
          </h2>

          <p className="mt-2 text-sm text-slate-700">
            Cliente: <strong>{enlace.nombre}</strong>
          </p>

          <p className="mt-2 text-sm text-slate-700">
            Vence:{" "}
            {new Date(
              enlace.tokenExpiraAt
            ).toLocaleString("es-BO", {
              timeZone: "America/La_Paz",
            })}
          </p>

          <label
            htmlFor="pa-enlace"
            className={`${etiqueta} mt-4`}
          >
            Enlace privado
          </label>

          <input
            id="pa-enlace"
            className={campo}
            readOnly
            value={enlace.url}
          />

          <button
            type="button"
            onClick={() => void copiarEnlace()}
            className={`${boton} mt-3 w-full justify-center text-center sm:w-auto`}
          >
            Copiar enlace
          </button>

          <a
            href={
              "https://wa.me/?text=" +
              encodeURIComponent(
                "Hola, te comparto tu enlace privado de DioxiLife para registrar tus pruebas de alimentos: " +
                enlace.url
              )
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`${boton} mt-3 inline-flex w-full justify-center text-center sm:ml-2 sm:w-auto`}
          >
            Compartir por WhatsApp
          </a>

          <TarjetaQRPrivada url={enlace.url} />
          <p className="mt-3 text-xs leading-5 text-slate-600">
            No compartas este enlace públicamente.
            Cualquier persona que lo obtenga
            podría acceder a las mediciones
            mientras siga vigente.
          </p>
            </section>

            {mensaje && (
              <p
                role="status"
                className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"
              >
                {mensaje}
              </p>
            )}
          </dialog>
        </>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Revocar un enlace
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Utiliza el identificador del acceso
          que deseas deshabilitar.
        </p>

        <form
          onSubmit={revocar}
          className="mt-4 space-y-4"
        >
          <div>
            <label
              htmlFor="pa-revocar"
              className={etiqueta}
            >
              Identificador del acceso
            </label>

            <input
              id="pa-revocar"
              className={campo}
              required
              maxLength={128}
              value={idRevocar}
              onChange={e =>
                setIdRevocar(e.target.value)
              }
            />
          </div>

          <button
            type="submit"
            className={boton}
            disabled={ocupado}
          >
            {ocupado
              ? "Procesando..."
              : "Revocar enlace"}
          </button>
        </form>
      </section>
      <ListadoEnlacesCliente
        version={versionListado}
        onRevocado={(id) => {
          if (
            enlace?.clientePruebaId === id
          ) {
            setEnlace(null);
          }

          if (idRevocar === id) {
            setIdRevocar("");
          }
        }}
      />

    </div>
  );
}
