"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  prepararInicioCliente,
  prepararFinalCliente,
  obtenerSugerenciaCliente,
  type CamposInicioCliente,
  type CamposFinalCliente,
} from "./datos-formulario-cliente";

import {
  leerHistorialCliente,
  obtenerSugerenciaPendiente,
  type RegistroHistorialCliente,
} from "./historial-formulario-cliente";

import GraficaHistorialCliente from "./GraficaHistorialCliente";
import ControlRecordatoriosPush from "./ControlRecordatoriosPush";
import AvisosGlucosa from "./AvisosGlucosa";
import type { AvisoHistorialUI } from "./contrato-avisos-historial";

import {
  decidirRecuperacionGuardado,
} from "./recuperacion-guardado-cliente";

const TOKEN_VALIDO = /^[0-9a-f]{64}$/;
const REGISTRO_VALIDO = /^[A-Za-z0-9_-]{5,128}$/;

const campo =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 focus:border-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-100";

const etiqueta =
  "mb-2 block text-sm font-semibold text-slate-700";

const boton =
  "rounded-xl bg-fuchsia-700 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50";

type Fase = "inicio" | "pendiente" | "completado";

function mensajeHTTP(estado: number): string {
  if (estado === 409) {
    return (
      "Ya tienes una prueba sin terminar. " +
      "Recarga esta página para recuperarla y " +
      "completar la segunda medición antes de iniciar otra."
    );
  }

  if (estado === 429) {
    return "Demasiados intentos. Intenta nuevamente más tarde.";
  }

  if (estado === 404) {
    return "El acceso o registro ya no está disponible.";
  }

  if (estado === 503) {
    return "El servicio todavía no está disponible.";
  }

  if (estado === 400 || estado === 415) {
    return "Revisa los datos introducidos.";
  }

  return "No se pudo guardar la medición.";
}

async function guardarMedicion(
  ruta: string,
  datos: unknown
): Promise<string> {
  const respuesta = await fetch(ruta, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    body: JSON.stringify(datos),
  });

  if (!respuesta.ok) {
    throw new Error(mensajeHTTP(respuesta.status));
  }

  const resultado: unknown =
    await respuesta.json();

  if (
    !resultado ||
    typeof resultado !== "object" ||
    !("ok" in resultado) ||
    resultado.ok !== true ||
    !("registroId" in resultado) ||
    typeof resultado.registroId !== "string" ||
    !REGISTRO_VALIDO.test(resultado.registroId)
  ) {
    throw new Error(
      "La respuesta del registro no es válida."
    );
  }

  return resultado.registroId;
}


function descargarRecordatorioCalendario(
  fecha: string,
  hora: string
): void {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
    !/^\d{2}:\d{2}$/.test(hora)
  ) return;

  const [anio, mes, dia] = fecha.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);

  if (hh > 23 || mm > 59) return;

  const comprobacion = new Date(
    Date.UTC(anio, mes - 1, dia)
  );

  if (
    comprobacion.toISOString().slice(0, 10) !== fecha
  ) return;

  const inicio = new Date(
    fecha + "T" + hora + ":00-04:00"
  );

  const fin = new Date(
    inicio.getTime() + 10 * 60_000
  );

  const formato = (valor: Date) =>
    valor.toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const calendario = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "PRODID:-//DioxiLife Bolivia//Glucosa//ES",
    "BEGIN:VEVENT",
    "UID:glucosa-" + Date.now() + "@dioxilife.invalid",
    "DTSTAMP:" + formato(new Date()),
    "DTSTART:" + formato(inicio),
    "DTEND:" + formato(fin),
    "SUMMARY:Medir glucosa despues de comer",
    "DESCRIPTION:Registrar medicion en DioxiLife.",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:PT0S",
    "DESCRIPTION:Es hora de medir la glucosa.",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n") + "\r\n";

  const archivo = new Blob([calendario], {
    type: "text/calendar;charset=utf-8"
  });

  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = "recordatorio-glucosa.ics";

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  window.setTimeout(
    () => URL.revokeObjectURL(url),
    15000
  );
}

export default function FormularioClientePruebaAlimento({
  token,
}: {
  token: string;
}) {
  const enviando = useRef(false);

  const [fase, setFase] = useState<Fase>("inicio");
  const [registroId, setRegistroId] =
    useState<string | null>(null);

  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  const [carga, setCarga] = useState<
    "cargando" | "lista" | "error"
  >("cargando");

  const [historial, setHistorial] = useState<
    RegistroHistorialCliente[]
  >([]);

  const [avisosGlucosa, setAvisosGlucosa] =
    useState<AvisoHistorialUI[]>([]);

  const refrescandoHistorial = useRef(false);

  const [actualizandoHistorial, setActualizandoHistorial] =
    useState(false);

  const [avisoHistorial, setAvisoHistorial] =
    useState("");

  const [inicio, setInicio] =
    useState<CamposInicioCliente>({
      fecha: "",
      glucosaAyunas: "",
      glucosaAntes: "",
      alimento: "",
      cantidad: "",
      horaComida: "",
      observacion: "",
    });

  const [final, setFinal] =
    useState<CamposFinalCliente>({
      fechaMedicionReal: "",
      horaMedicionDespues: "",
      glucosaDespues: "",
    });

  /**
   * Recupera desde la API el historial y
   * la última medición pendiente.
   * No almacena mediciones en el navegador.
   */
  useEffect(() => {
    const controlador = new AbortController();

    async function recuperar() {
      if (!TOKEN_VALIDO.test(token)) {
        setError("Acceso no válido.");
        setCarga("error");
        return;
      }

      setCarga("cargando");

      try {
        const respuesta = await fetch(
          `/api/prueba-alimentos/${token}`,
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            referrerPolicy: "no-referrer",
            signal: controlador.signal,
          }
        );

        if (!respuesta.ok) {
          throw new Error(
            mensajeHTTP(respuesta.status)
          );
        }

        const entrada: unknown =
          await respuesta.json();

        const datos = leerHistorialCliente(entrada);

        if (!datos) {
          throw new Error(
            "No se pudo validar el historial."
          );
        }

        if (controlador.signal.aborted) {
          return;
        }

        setHistorial(datos.registros);
        setAvisosGlucosa(
          datos.alertasActivas ? datos.avisos : []
        );

        if (datos.pendiente) {
          setRegistroId(datos.pendiente.id);

          const sugerencia =
            obtenerSugerenciaPendiente(
              datos.pendiente.horaComida
            );

          if (sugerencia) {
            setFinal(actual => ({
              ...actual,
              fechaMedicionReal: sugerencia.fecha,
              horaMedicionDespues: sugerencia.hora,
            }));
          }

          setFase("pendiente");
        } else {
          setRegistroId(null);
          setFase("inicio");
        }

        setError("");
        setCarga("lista");
      } catch (errorRecuperacion) {
        if (controlador.signal.aborted) {
          return;
        }

        setError(
          errorRecuperacion instanceof Error
            ? errorRecuperacion.message
            : "No se pudo recuperar el historial."
        );

        setCarga("error");
      }
    }

    void recuperar();

    return () => {
      controlador.abort();
    };
  }, [token]);

  const sugerencia = obtenerSugerenciaCliente(
    inicio.fecha,
    inicio.horaComida
  );

  function cambiarInicio(
    nombre: keyof CamposInicioCliente,
    valor: string
  ) {
    setInicio(actual => ({
      ...actual,
      [nombre]: valor,
    }));
  }

  function cambiarFinal(
    nombre: keyof CamposFinalCliente,
    valor: string
  ) {
    setFinal(actual => ({
      ...actual,
      [nombre]: valor,
    }));
  }


  /**
   * Consulta nuevamente los datos confirmados
   * por el servidor tras una escritura.
   *
   * No crea ni modifica registros.
   * No altera la fase actual del formulario.
   *
   * Si la consulta falla, se conserva el historial
   * anterior y se permite reintentar manualmente.
   */
  async function actualizarHistorial(): Promise<void> {
    if (
      refrescandoHistorial.current ||
      !TOKEN_VALIDO.test(token)
    ) {
      return;
    }

    refrescandoHistorial.current = true;
    setActualizandoHistorial(true);
    setAvisoHistorial("");

    try {
      const respuesta = await fetch(
        `/api/prueba-alimentos/${token}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "same-origin",
          cache: "no-store",
          referrerPolicy: "no-referrer",
        }
      );

      if (!respuesta.ok) {
        throw new Error(
          "No se pudo recuperar el historial."
        );
      }

      const cuerpo: unknown =
        await respuesta.json();

      const datos =
        leerHistorialCliente(cuerpo);

      if (!datos) {
        throw new Error(
          "El historial recibido no es válido."
        );
      }

      setHistorial(datos.registros);
        setAvisosGlucosa(
          datos.alertasActivas ? datos.avisos : []
        );
      setAvisoHistorial("");
    } catch {
      setAvisoHistorial(
        "No se pudo actualizar el historial. " +
        "Puedes intentarlo nuevamente con el botón " +
        "Actualizar historial. No vuelvas a guardar " +
        "la medición solo por este aviso."
      );
    } finally {
      refrescandoHistorial.current = false;
      setActualizandoHistorial(false);
    }
  }


  /**
   * Ante una respuesta perdida o un error de guardado,
   * verificar primero el estado del servidor.
   *
   * No vuelve a ejecutar una escritura POST.
   * Si GET falla, no afirma que se haya guardado.
   */
  async function verificarGuardadoTrasFallo(
    tipo: "inicio" | "finalizacion",
    idIntentado: string | null
  ): Promise<"pendiente" | "completado" | "no_confirmado"> {
    if (!TOKEN_VALIDO.test(token)) {
      return "no_confirmado";
    }

    try {
      const respuesta = await fetch(
        `/api/prueba-alimentos/${token}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "same-origin",
          cache: "no-store",
          referrerPolicy: "no-referrer",
        }
      );

      if (!respuesta.ok) {
        return "no_confirmado";
      }

      const cuerpo: unknown =
        await respuesta.json();

      const datos = leerHistorialCliente(cuerpo);

      if (!datos) {
        return "no_confirmado";
      }

      setHistorial(datos.registros);
        setAvisosGlucosa(
          datos.alertasActivas ? datos.avisos : []
        );

      const recuperacion = decidirRecuperacionGuardado(
        tipo,
        idIntentado,
        datos
      );

      if (recuperacion.estado === "pendiente") {
        setRegistroId(recuperacion.registroId);

        if (
          tipo === "inicio" &&
          datos.pendiente &&
          datos.pendiente.id === recuperacion.registroId
        ) {
          const sugerencia = obtenerSugerenciaPendiente(
            datos.pendiente.horaComida
          );

          if (sugerencia) {
            setFinal(actual => ({
              ...actual,
              fechaMedicionReal: sugerencia.fecha,
              horaMedicionDespues: sugerencia.hora,
            }));
          }
        }

        setFase("pendiente");

        setAvisoHistorial(
          tipo === "inicio"
            ? "Se encontró una prueba pendiente en el servidor. " +
              "Comprueba que corresponda al alimento que registraste. " +
              "Esto no confirma por sí solo que el último envío se guardó."
            : "La segunda medición todavía figura pendiente. " +
              "Revisa los datos antes de volver a intentar guardarla."
        );

        return "pendiente";
      }

      if (recuperacion.estado === "completado") {
        setRegistroId(recuperacion.registroId);
        setFase("completado");

        setAvisoHistorial(
          "El historial confirma que la segunda " +
          "medición de este registro ya está guardada."
        );

        return "completado";
      }

      return "no_confirmado";
    } catch {
      return "no_confirmado";
    }
  }

  async function guardarInicio(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (enviando.current || fase !== "inicio") {
      return;
    }

    setError("");

    if (!TOKEN_VALIDO.test(token)) {
      setError("Acceso no válido.");
      return;
    }

    const datos = prepararInicioCliente(inicio);

    if (!datos) {
      setError(
        "Revisa la fecha, las mediciones y los datos del alimento."
      );
      return;
    }

    enviando.current = true;
    setOcupado(true);

    try {
      const id = await guardarMedicion(
        `/api/prueba-alimentos/${token}/iniciar`,
        datos
      );

      setRegistroId(id);

      if (sugerencia) {
        setFinal(actual => ({
          ...actual,
          fechaMedicionReal: sugerencia.fecha,
          horaMedicionDespues: sugerencia.hora,
        }));
      }

      setFase("pendiente");
      await actualizarHistorial();
    } catch (fallo) {
      const estado = await verificarGuardadoTrasFallo(
        "inicio",
        null
      );

      if (estado === "pendiente") {
        setError(
          "No fue posible confirmar el último envío. " +
          "Se encontró una prueba pendiente vinculada " +
          "a tu enlace. Comprueba en el historial que " +
          "corresponda al alimento registrado antes " +
          "de completar la segunda medición."
        );
      } else {
        const motivo =
          fallo instanceof Error
            ? fallo.message
            : "No se pudo confirmar el registro.";

        setError(
          motivo +
          " No se pudo confirmar el estado del guardado. " +
          "Recarga la página y revisa el historial " +
          "antes de volver a enviarlo."
        );
      }
    } finally {
      enviando.current = false;
      setOcupado(false);
    }
  }

  async function guardarFinal(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (
      enviando.current ||
      fase !== "pendiente" ||
      !registroId
    ) {
      return;
    }

    setError("");

    const datos = prepararFinalCliente(
      registroId,
      final
    );

    if (!datos) {
      setError(
        "Revisa la fecha, hora y glucosa posterior."
      );
      return;
    }

    enviando.current = true;
    setOcupado(true);

    try {
      const confirmado = await guardarMedicion(
        `/api/prueba-alimentos/${token}/completar`,
        datos
      );

      if (confirmado !== registroId) {
        throw new Error(
          "La confirmación no corresponde al registro."
        );
      }

      setFase("completado");
      await actualizarHistorial();
    } catch (fallo) {
      const estado = await verificarGuardadoTrasFallo(
        "finalizacion",
        registroId
      );

      if (estado === "completado") {
        setError("");
      } else if (estado === "pendiente") {
        setError(
          "La segunda medición todavía aparece pendiente. " +
          "Su guardado no está confirmado. " +
          "Revisa los datos antes de intentarlo de nuevo."
        );
      } else {
        const motivo =
          fallo instanceof Error
            ? fallo.message
            : "No se pudo confirmar la medición.";

        setError(
          motivo +
          " El resultado no pudo verificarse. " +
          "Recarga la página y comprueba el historial " +
          "antes de repetir el envío."
        );
      }
    } finally {
      enviando.current = false;
      setOcupado(false);
    }
  }

  if (carga !== "lista") {
    return (
      <div
        role={carga === "error" ? "alert" : "status"}
        className="rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-6 text-slate-700"
      >
        {carga === "cargando"
          ? "Verificando el acceso y recuperando las mediciones..."
          : error ||
            "No fue posible recuperar la información."}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <ControlRecordatoriosPush token={token} />
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Mi respuesta a los alimentos
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Registra las mediciones antes y después
          de consumir un alimento. Los valores
          se expresan en mg/dL.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          {error}
        </div>
      )}

      {fase === "inicio" && (
        <form
          onSubmit={guardarInicio}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900">
            1. Antes de comer
          </h2>

          <div>
            <label htmlFor="pa-fecha" className={etiqueta}>
              Fecha de la prueba
            </label>
            <input
              id="pa-fecha"
              type="date"
              required
              className={campo}
              value={inicio.fecha}
              onChange={e =>
                cambiarInicio("fecha", e.target.value)
              }
            />
          </div>

          <div>
            <label htmlFor="pa-ayunas" className={etiqueta}>
              Glucosa en ayunas (opcional)
            </label>
            <input
              id="pa-ayunas"
              type="text"
              inputMode="decimal"
              className={campo}
              value={inicio.glucosaAyunas}
              onChange={e =>
                cambiarInicio(
                  "glucosaAyunas",
                  e.target.value
                )
              }
              placeholder="Ej. 90"
            />
          </div>

          <div>
            <label htmlFor="pa-antes" className={etiqueta}>
              Glucosa antes de comer
            </label>
            <input
              id="pa-antes"
              type="text"
              inputMode="decimal"
              required
              className={campo}
              value={inicio.glucosaAntes}
              onChange={e =>
                cambiarInicio(
                  "glucosaAntes",
                  e.target.value
                )
              }
              placeholder="Ej. 95"
            />
          </div>

          <div>
            <label htmlFor="pa-alimento" className={etiqueta}>
              Alimento consumido
            </label>
            <input
              id="pa-alimento"
              required
              maxLength={120}
              className={campo}
              value={inicio.alimento}
              onChange={e =>
                cambiarInicio(
                  "alimento",
                  e.target.value
                )
              }
              placeholder="Ej. Arroz"
            />
          </div>

          <div>
            <label htmlFor="pa-cantidad" className={etiqueta}>
              Cantidad (opcional)
            </label>
            <input
              id="pa-cantidad"
              maxLength={100}
              className={campo}
              value={inicio.cantidad}
              onChange={e =>
                cambiarInicio(
                  "cantidad",
                  e.target.value
                )
              }
              placeholder="Ej. 1 taza"
            />
          </div>

          <div>
            <label htmlFor="pa-hora" className={etiqueta}>
              Hora de inicio de la comida (Bolivia)
            </label>
            <input
              id="pa-hora"
              type="time"
              required
              className={campo}
              value={inicio.horaComida}
              onChange={e =>
                cambiarInicio(
                  "horaComida",
                  e.target.value
                )
              }
            />
          </div>

          {sugerencia && (
            <div className="rounded-xl bg-fuchsia-50 p-4 text-sm text-fuchsia-950">
              Segunda medición sugerida:{" "}
              <strong>
                {sugerencia.fecha} a las{" "}
                {sugerencia.hora}
              </strong>
              {sugerencia.siguienteDia
                ? " (día siguiente)"
                : ""}
              <p className="mt-2 text-xs">
                Es una sugerencia de horario,
                no una alarma automática.
              </p>
              <button
                type="button"
                onClick={() =>
                  descargarRecordatorioCalendario(
                    sugerencia.fecha,
                    sugerencia.hora
                  )
                }
                className="mt-3 rounded-xl bg-fuchsia-700 px-4 py-2 text-sm font-bold text-white hover:bg-fuchsia-800"
              >
                Descargar recordatorio (.ics)
              </button>
              <p className="mt-2 text-xs">
                Importa el archivo en tu calendario
                y verifica que sus alertas estén activas.
                Esto no guarda automáticamente la prueba.
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="pa-observacion"
              className={etiqueta}
            >
              Observaciones (opcional)
            </label>
            <textarea
              id="pa-observacion"
              rows={3}
              maxLength={1500}
              className={campo}
              value={inicio.observacion}
              onChange={e =>
                cambiarInicio(
                  "observacion",
                  e.target.value
                )
              }
            />
          </div>

          <button
            type="submit"
            className={boton}
            disabled={ocupado}
          >
            {ocupado
              ? "Guardando..."
              : "Guardar primera medición"}
          </button>
        </form>
      )}

      {fase === "pendiente" && (
        <form
          onSubmit={guardarFinal}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div
            role="status"
            className="rounded-xl bg-green-50 p-4 text-sm text-green-900"
          >
            Hay una prueba pendiente para este enlace.
            Antes de completar la segunda medición,
            comprueba que corresponda al alimento
            que registraste.
          </div>

          <h2 className="text-lg font-bold text-slate-900">
            2. Después de comer
          </h2>

          <p className="text-sm leading-6 text-slate-600">
            Introduce la fecha y la hora reales
            de tu segunda medición. Puedes
            corregir el horario sugerido.
          </p>

          <div>
            <label
              htmlFor="pa-fecha-real"
              className={etiqueta}
            >
              Fecha real de medición
            </label>
            <input
              id="pa-fecha-real"
              type="date"
              required
              className={campo}
              value={final.fechaMedicionReal}
              onChange={e =>
                cambiarFinal(
                  "fechaMedicionReal",
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label
              htmlFor="pa-hora-real"
              className={etiqueta}
            >
              Hora real de medición (Bolivia)
            </label>
            <input
              id="pa-hora-real"
              type="time"
              required
              className={campo}
              value={final.horaMedicionDespues}
              onChange={e =>
                cambiarFinal(
                  "horaMedicionDespues",
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label
              htmlFor="pa-despues"
              className={etiqueta}
            >
              Glucosa posterior (mg/dL)
            </label>
            <input
              id="pa-despues"
              type="text"
              inputMode="decimal"
              required
              className={campo}
              value={final.glucosaDespues}
              onChange={e =>
                cambiarFinal(
                  "glucosaDespues",
                  e.target.value
                )
              }
              placeholder="Ej. 115"
            />
          </div>

          <button
            type="submit"
            className={boton}
            disabled={ocupado}
          >
            {ocupado
              ? "Guardando..."
              : "Guardar segunda medición"}
          </button>
        </form>
      )}

      {fase === "completado" && (
        <div
          role="status"
          className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-950"
        >
          <h2 className="text-lg font-bold">
            Prueba completada
          </h2>
          <p className="mt-2 text-sm">
            Se confirmaron las dos etapas
            del registro.
          </p>
        </div>
      )}


      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-800">
            Historial de mediciones
          </p>

          <button
            type="button"
            disabled={actualizandoHistorial || ocupado}
            onClick={() => void actualizarHistorial()}
            className="rounded-xl border border-fuchsia-300 px-4 py-2 text-sm font-semibold text-fuchsia-800 disabled:opacity-50"
          >
            {actualizandoHistorial
              ? "Actualizando..."
              : "Actualizar historial"}
          </button>
        </div>

        {avisoHistorial && (
          <p
            role="status"
            className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900"
          >
            {avisoHistorial}
          </p>
        )}
      </div>

      {avisosGlucosa.length > 0 && (
        <AvisosGlucosa
          avisosDirectos={avisosGlucosa
            .slice(0, 20)
            .map(item => item.aviso)}
        />
      )}
      {historial.length > 0 && (
        <GraficaHistorialCliente
          registros={historial}
        />
      )}

      {historial.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Historial reciente
          </h2>

          <ul className="mt-4 space-y-3">
            {historial.slice(0, 5).map(registro => (
              <li
                key={registro.id}
                className="rounded-xl bg-slate-50 p-4 text-sm"
              >
                <p className="font-semibold">
                  {registro.alimento}
                </p>

                <p className="mt-1 text-slate-600">
                  {registro.fecha}
                </p>

                <p className="mt-2">
                  Antes: {registro.glucosaAntes} mg/dL
                </p>

                <p>
                  Después:{" "}
                  {registro.glucosaDespues === null
                    ? "Pendiente"
                    : `${registro.glucosaDespues} mg/dL`}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs leading-5 text-slate-500">
        Este registro es informativo y no
        constituye un diagnóstico médico.
        No compartas tu enlace privado.
      </p>
    </section>
  );
}
