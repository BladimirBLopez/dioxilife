"use client";

import { useState } from "react";

function leerGlucosa(valor: string): number | null {
  if (!valor.trim()) return null;

  const numero = Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero < 0 ||
    numero > 1000
  ) {
    return null;
  }

  return numero;
}

function horaDosHorasDespues(hora: string) {
  if (!/^\d{2}:\d{2}$/.test(hora)) return null;

  const [horas, minutos] = hora.split(":").map(Number);

  if (
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59
  ) {
    return null;
  }

  const total = horas * 60 + minutos + 120;
  const siguienteDia = total >= 1440;
  const calculado = total % 1440;

  return {
    hora:
      String(Math.floor(calculado / 60)).padStart(2, "0") +
      ":" +
      String(calculado % 60).padStart(2, "0"),
    siguienteDia,
  };
}


/**
 * Calcula la fecha local sugerida sin depender
 * de la zona horaria del teléfono.
 *
 * Opera con fechas de calendario UTC únicamente
 * para sumar días; no representa una conversión
 * del instante real de la medición.
 */
function fechaSugeridaDeMedicion(
  fecha: string,
  siguienteDia: boolean
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return null;
  }

  const calendario = new Date(
    `${fecha}T00:00:00.000Z`
  );

  if (
    !Number.isFinite(calendario.getTime()) ||
    calendario.toISOString().slice(0, 10) !== fecha
  ) {
    return null;
  }

  if (siguienteDia) {
    calendario.setUTCDate(
      calendario.getUTCDate() + 1
    );
  }

  return calendario.toISOString().slice(0, 10);
}

const campo =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-fuchsia-600 focus:ring-2 focus:ring-fuchsia-100";

const etiqueta = "mb-2 block text-sm font-semibold text-slate-700";

export default function VistaPreviaPruebaAlimento() {
  const [nombre, setNombre] = useState("Cliente de ejemplo");
  const [fecha, setFecha] = useState("");
  const [ayunas, setAyunas] = useState("");
  const [antes, setAntes] = useState("");
  const [alimento, setAlimento] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [horaComida, setHoraComida] = useState("");
  const [despues, setDespues] = useState("");
  const [horaMedicion, setHoraMedicion] = useState("");
  const [fechaMedicion, setFechaMedicion] = useState("");
  const [observacion, setObservacion] = useState("");

  const valorAntes = leerGlucosa(antes);
  const valorDespues = leerGlucosa(despues);

  const diferencia =
    valorAntes !== null && valorDespues !== null
      ? valorDespues - valorAntes
      : null;

  const horaSugerida = horaDosHorasDespues(horaComida);

  const fechaSugerida = horaSugerida
    ? fechaSugeridaDeMedicion(
        fecha,
        horaSugerida.siguienteDia
      )
    : null;

  const formato = (numero: number) =>
    numero.toLocaleString("es-BO", {
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <strong>Vista previa del administrador.</strong>{" "}
        Esta pantalla no guarda mediciones, no envía datos
        y no programa alarmas.
        Utiliza información ficticia para probarla.
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          1. Datos del cliente
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={etiqueta} htmlFor="pa-nombre">
              Nombre
            </label>
            <input
              id="pa-nombre"
              className={campo}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del cliente"
            />
          </div>

          <div>
            <label className={etiqueta} htmlFor="pa-fecha">
              Fecha de la prueba
            </label>
            <input
              id="pa-fecha"
              type="date"
              className={campo}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          2. Mediciones iniciales
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={etiqueta} htmlFor="pa-ayunas">
              Glucosa en ayunas (mg/dL)
            </label>
            <input
              id="pa-ayunas"
              type="number"
              inputMode="decimal"
              min="0"
              max="1000"
              step="0.1"
              className={campo}
              value={ayunas}
              onChange={(e) => setAyunas(e.target.value)}
              placeholder="Ej. 90"
            />
          </div>

          <div>
            <label className={etiqueta} htmlFor="pa-antes">
              Glucosa antes de comer (mg/dL)
            </label>
            <input
              id="pa-antes"
              type="number"
              inputMode="decimal"
              min="0"
              max="1000"
              step="0.1"
              className={campo}
              value={antes}
              onChange={(e) => setAntes(e.target.value)}
              placeholder="Ej. 95"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          3. Alimento consumido
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={etiqueta} htmlFor="pa-alimento">
              Alimento
            </label>
            <input
              id="pa-alimento"
              className={campo}
              value={alimento}
              onChange={(e) => setAlimento(e.target.value)}
              placeholder="Ej. Arroz"
            />
          </div>

          <div>
            <label className={etiqueta} htmlFor="pa-cantidad">
              Cantidad consumida
            </label>
            <input
              id="pa-cantidad"
              className={campo}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Ej. 1 taza"
            />
          </div>

          <div>
            <label className={etiqueta} htmlFor="pa-hora">
              Hora en que comenzaste a comer (Bolivia)
            </label>
            <input
              id="pa-hora"
              type="time"
              className={campo}
              value={horaComida}
              onChange={(e) => setHoraComida(e.target.value)}
            />
          </div>

          <div className="rounded-xl bg-fuchsia-50 p-4">
            <p className="text-xs font-semibold text-fuchsia-800">
              Segunda medición sugerida
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {horaSugerida
                ? horaSugerida.hora
                : "--:--"}
            </p>
            {horaSugerida?.siguienteDia && (
              <p className="text-xs text-slate-600">
                Día siguiente
              </p>
            )}
            {fechaSugerida && (
              <p className="mt-2 text-sm font-semibold text-fuchsia-800">
                Fecha sugerida:{" "}
                {fechaSugerida.split("-").reverse().join("/")}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-600">
              Dos horas desde el inicio de la comida,
              según el horario de Bolivia (UTC−4).
              No es una alarma activa.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          4. Segunda medición
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={etiqueta} htmlFor="pa-despues">
              Glucosa posterior (mg/dL)
            </label>
            <input
              id="pa-despues"
              type="number"
              inputMode="decimal"
              min="0"
              max="1000"
              step="0.1"
              className={campo}
              value={despues}
              onChange={(e) => setDespues(e.target.value)}
              placeholder="Ej. 115"
            />
          </div>

          <div>
            <label className={etiqueta} htmlFor="pa-fecha-medicion">
              Fecha real de la segunda medición
            </label>
            <input
              id="pa-fecha-medicion"
              type="date"
              className={campo}
              value={fechaMedicion}
              onChange={(e) => setFechaMedicion(e.target.value)}
            />
          </div>

          <div>
            <label className={etiqueta} htmlFor="pa-hora-medicion">
              Hora real de la segunda medición
            </label>
            <input
              id="pa-hora-medicion"
              type="time"
              className={campo}
              value={horaMedicion}
              onChange={(e) => setHoraMedicion(e.target.value)}
            />
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-600">
          Registra la fecha y hora en que realmente
          mediste tu glucosa. Si comenzaste a comer
          cerca de la medianoche, puede corresponder
          al día siguiente. Utiliza el horario de Bolivia.
        </p>

        <div className="mt-4">
          <label className={etiqueta} htmlFor="pa-observacion">
            Observaciones
          </label>
          <textarea
            id="pa-observacion"
            className={campo}
            rows={3}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Observaciones opcionales"
          />
        </div>
      </section>

      <section
        aria-live="polite"
        className="rounded-2xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-violet-50 p-5"
      >
        <h2 className="text-lg font-bold text-slate-900">
          Resultado de la prueba
        </h2>

        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-fuchsia-800">
          Diferencia entre ambas mediciones
        </p>

        <p className="mt-1 text-3xl font-bold text-slate-900">
          {diferencia === null
            ? "--"
            : `${diferencia > 0 ? "+" : ""}${formato(diferencia)}`}{" "}
          <span className="text-base font-medium">mg/dL</span>
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-700">
          {diferencia === null
            ? "Introduce la glucosa anterior y posterior para obtener la diferencia."
            : "La diferencia es descriptiva y no constituye un diagnóstico ni determina por sí sola si un alimento es perjudicial."}
        </p>
      </section>
    </div>
  );
}
