"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Image from "next/image";

import {
  Ban,
  Bell,
  BellOff,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock3,
  Home,
  LoaderCircle,
  PauseCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";

import { toast } from "sonner";
import MedicionesSeguimientoPublico from "@/components/seguimiento/MedicionesSeguimientoPublico";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";


type EstadoSeguimiento =
  | "PENDIENTE"
  | "ACTIVO"
  | "PAUSADO"
  | "COMPLETADO"
  | "CANCELADO";


type Progreso = {
  diaPlan: number;
  completado: boolean;
  completadoAt: string | null;
};


type RecordatorioActividad =
  | "NINGUNO"
  | "A_LA_HORA"
  | "MIN_15_ANTES"
  | "MIN_30_ANTES"
  | "MIN_60_ANTES";


type IndicacionActividad = {
  id: string;
  hora: string;
  texto: string;
  orden: number;
  progresos: Progreso[];
};


type Actividad = {
  id: string;
  tipo: "TAREA" | "INFORMACION" | "CONTROL";
  seccion:
    | "PRINCIPAL"
    | "ADICIONAL";
  recordatorio: RecordatorioActividad;
  titulo: string;
  descripcion: string | null;
  momento: string | null;
  hora: string | null;
  diaInicio: number;
  diaFin: number | null;
  orden: number;
  indicaciones: IndicacionActividad[];
  progresos: Progreso[];
};


type RegistroPeso = {
  diaPlan: number;
  peso: number;
};


type Seguimiento = {
  nombreCliente: string | null;
  nombrePlan: string;
  duracionDias: number;
  estado: EstadoSeguimiento;
  fechaInicioPrevista: string | null;
  fechaInicio: string | null;
  fechaFinalizado: string | null;
  diaActual: number | null;
  pesos: RegistroPeso[];
  actividades: Actividad[];
};


type DatosRespuesta = {
  seguimiento: Seguimiento;
};


type Pestana =
  | "hoy"
  | "calendario"
  | "plan";


type EstadoRecordatorios =
  | "COMPROBANDO"
  | "NO_COMPATIBLE"
  | "BLOQUEADOS"
  | "INACTIVOS"
  | "ACTIVOS";


function convertirClaveVapid(
  base64String: string
) {
  const padding =
    "=".repeat(
      (4 -
        (
          base64String.length %
          4
        )) %
        4
    );

  const base64 =
    (
      base64String +
      padding
    )
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const rawData =
    window.atob(
      base64
    );

  return Uint8Array.from(
    [...rawData].map(
      (char) =>
        char.charCodeAt(0)
    )
  );
}


function primerNombre(
  nombre: string | null
) {
  if (!nombre) {
    return "Hola";
  }

  const limpio =
    nombre.trim();

  if (!limpio) {
    return "Hola";
  }

  return limpio.split(/\s+/)[0];
}


function formatearFecha(
  fecha: string | null
) {
  if (!fecha) {
    return "No definida";
  }

  return new Intl.DateTimeFormat(
    "es-BO",
    {
      timeZone:
        "America/La_Paz",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(
    new Date(fecha)
  );
}


function actividadCorrespondeDia(
  actividad: Actividad,
  dia: number
) {
  const diaFin =
    actividad.diaFin ??
    (
      actividad.seccion ===
        "ADICIONAL"
        ? Number.MAX_SAFE_INTEGER
        : actividad.diaInicio
    );

  return (
    dia >=
      actividad.diaInicio &&
    dia <= diaFin
  );
}


function textoRecordatorio(
  recordatorio: RecordatorioActividad
) {
  switch (recordatorio) {
    case "A_LA_HORA":
      return "A la hora";
    case "MIN_15_ANTES":
      return "15 min antes";
    case "MIN_30_ANTES":
      return "30 min antes";
    case "MIN_60_ANTES":
      return "1 hora antes";
    default:
      return null;
  }
}


const ORDEN_MOMENTOS: Record<string, number> = {
  "Ayunas": 10,
  "Desayuno": 20,
  "Mañana": 25,
  "Media mañana": 30,
  "Almuerzo": 40,
  "Mediodía": 45,
  "Tarde": 50,
  "Cena": 60,
  "Noche": 70,
  "Antes de dormir": 80,
  "Importante": 100,
};


function ordenarActividadesAgenda(
  a: Actividad,
  b: Actividad
) {
  const momentoA =
    a.momento
      ? ORDEN_MOMENTOS[a.momento] ?? 90
      : 90;

  const momentoB =
    b.momento
      ? ORDEN_MOMENTOS[b.momento] ?? 90
      : 90;

  if (momentoA !== momentoB) {
    return momentoA - momentoB;
  }

  const horaA =
    a.hora || "99:99";

  const horaB =
    b.hora || "99:99";

  const porHora =
    horaA.localeCompare(horaB);

  if (porHora !== 0) {
    return porHora;
  }

  return a.orden - b.orden;
}


function ordenarActividadesPorSeccionYAgenda(
  a: Actividad,
  b: Actividad
) {
  if (a.seccion !== b.seccion) {
    return a.seccion === "PRINCIPAL"
      ? -1
      : 1;
  }

  return ordenarActividadesAgenda(
    a,
    b
  );
}


function actividadCompletadaEnDia(
  actividad: Actividad,
  dia: number
) {
  return actividad.progresos.some(
    (progreso) =>
      progreso.diaPlan ===
        dia &&
      progreso.completado
  );
}


function indicacionCompletadaEnDia(
  indicacion: IndicacionActividad,
  dia: number
) {
  return indicacion.progresos.some(
    (progreso) =>
      progreso.diaPlan ===
        dia &&
      progreso.completado
  );
}


function cantidadTotalTareas(
  seguimiento: Seguimiento
) {
  return seguimiento.actividades.reduce(
    (
      total,
      actividad
    ) => {
      if (
        actividad.tipo !==
        "TAREA"
      ) {
        return total;
      }

      const fin =
        Math.min(
          actividad.diaFin ??
            (
              actividad.seccion ===
                "ADICIONAL"
                ? seguimiento.duracionDias
                : actividad.diaInicio
            ),
          seguimiento.duracionDias
        );

      const inicio =
        Math.max(
          actividad.diaInicio,
          1
        );

      if (fin < inicio) {
        return total;
      }

      const diasActivos =
        fin - inicio + 1;

      const checksPorDia =
        1 +
        actividad.indicaciones.length;

      return (
        total +
        diasActivos *
          checksPorDia
      );
    },
    0
  );
}


function cantidadCompletadas(
  seguimiento: Seguimiento
) {
  return seguimiento.actividades.reduce(
    (
      total,
      actividad
    ) =>
      actividad.tipo === "TAREA"
        ? total +
          actividad.progresos.filter(
            (progreso) =>
              progreso.completado
          ).length +
          actividad.indicaciones.reduce(
            (
              totalIndicaciones,
              indicacion
            ) =>
              totalIndicaciones +
              indicacion.progresos.filter(
                (progreso) =>
                  progreso.completado
              ).length,
            0
          )
        : total,
    0
  );
}


const MINUTOS_DE_TOLERANCIA = 30;

function minutosAhoraBolivia() {
  const partes =
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/La_Paz",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());

  const horas = Number(
    partes.find((p) => p.type === "hour")?.value ?? 0
  );

  const minutos = Number(
    partes.find((p) => p.type === "minute")?.value ?? 0
  );

  return horas * 60 + minutos;
}


function minutosDeHora(hora: string | null) {
  const partes =
    /^([01]\d|2[0-3]):([0-5]\d)$/.exec(
      (hora || "").trim()
    );

  if (!partes) {
    return null;
  }

  return Number(partes[1]) * 60 + Number(partes[2]);
}


function AvisoHora({
  hora,
  esSiguiente,
}: {
  hora: string | null;
  esSiguiente: boolean;
}) {
  const [ahora, setAhora] = useState(
    () => minutosAhoraBolivia()
  );

  useEffect(() => {
    const intervalo = window.setInterval(
      () => setAhora(minutosAhoraBolivia()),
      60_000
    );

    return () => window.clearInterval(intervalo);
  }, []);

  const minutosHora = minutosDeHora(hora);

  if (minutosHora === null || !hora) {
    return null;
  }

  const diferencia = ahora - minutosHora;

  if (diferencia > MINUTOS_DE_TOLERANCIA) {
    return (
      <span className="mt-2 inline-block rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
        Pendiente · era a las {hora}
      </span>
    );
  }

  if (diferencia >= 0) {
    return (
      <span className="mt-2 inline-block rounded-lg bg-[#FBE7F4] px-2.5 py-1 text-xs font-bold text-brand-pink">
        Ahora toca
      </span>
    );
  }

  if (esSiguiente) {
    return (
      <span className="mt-2 inline-block rounded-lg bg-[#F4F2F8] px-2.5 py-1 text-xs font-bold text-brand-blue">
        Siguiente · a las {hora}
      </span>
    );
  }

  return null;
}


export default function SeguimientoPublico({
  token,
}: {
  token: string;
}) {
  const [
    seguimiento,
    setSeguimiento,
  ] =
    useState<Seguimiento | null>(
      null
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(true);

  const [
    iniciando,
    setIniciando,
  ] =
    useState(false);

  const [
    actualizandoActividad,
    setActualizandoActividad,
  ] =
    useState<string | null>(
      null
    );

  const [
    actualizandoIndicacion,
    setActualizandoIndicacion,
  ] =
    useState<string | null>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    pestana,
    setPestana,
  ] =
    useState<Pestana>(
      "hoy"
    );

  const [
    mostrarTodosCalendario,
    setMostrarTodosCalendario,
  ] =
    useState(false);

  const [
    diaCalendarioAbierto,
    setDiaCalendarioAbierto,
  ] =
    useState<number | null>(
      null
    );

  const [
    estadoRecordatorios,
    setEstadoRecordatorios,
  ] =
    useState<EstadoRecordatorios>(
      "COMPROBANDO"
    );

  const [
    cambiandoRecordatorios,
    setCambiandoRecordatorios,
  ] =
    useState(false);


  const cargarSeguimiento =
    useCallback(
      async () => {
        try {
          setError("");

          const respuesta =
            await fetch(
              `/api/seguimiento/${encodeURIComponent(token)}`,
              {
                cache:
                  "no-store",
              }
            );

          const data =
            await respuesta.json();

          if (!respuesta.ok) {
            throw new Error(
              data.error ||
                "No se pudo abrir el seguimiento."
            );
          }

          const datos =
            data as DatosRespuesta;

          setSeguimiento(
            datos.seguimiento
          );

        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo abrir el seguimiento."
          );

        } finally {
          setCargando(
            false
          );
        }
      },
      [
        token,
      ]
    );


  useEffect(
    () => {
      cargarSeguimiento();
    },
    [
      cargarSeguimiento,
    ]
  );


  useEffect(
    () => {
      let cancelado =
        false;

      async function comprobarRecordatorios() {
        if (
          !("serviceWorker" in navigator) ||
          !("PushManager" in window) ||
          !("Notification" in window)
        ) {
          if (!cancelado) {
            setEstadoRecordatorios(
              "NO_COMPATIBLE"
            );
          }

          return;
        }

        if (
          Notification.permission ===
          "denied"
        ) {
          if (!cancelado) {
            setEstadoRecordatorios(
              "BLOQUEADOS"
            );
          }

          return;
        }

        try {
          const registro =
            await navigator.serviceWorker.ready;

          const suscripcion =
            await registro.pushManager.getSubscription();

          if (!suscripcion) {
            if (!cancelado) {
              setEstadoRecordatorios(
                "INACTIVOS"
              );
            }

            return;
          }

          const respuesta =
            await fetch(
              `/api/seguimiento/${encodeURIComponent(token)}/push`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    suscripcion.toJSON()
                  ),
              }
            );

          if (!respuesta.ok) {
            if (!cancelado) {
              setEstadoRecordatorios(
                "INACTIVOS"
              );
            }

            return;
          }

          if (!cancelado) {
            setEstadoRecordatorios(
              "ACTIVOS"
            );
          }

        } catch {
          if (!cancelado) {
            setEstadoRecordatorios(
              "INACTIVOS"
            );
          }
        }
      }

      comprobarRecordatorios();

      return () => {
        cancelado =
          true;
      };
    },
    [token]
  );


  async function activarRecordatorios() {
    if (
      cambiandoRecordatorios
    ) {
      return;
    }

    const clavePublica =
      process.env
        .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!clavePublica) {
      toast.error(
        "Los recordatorios todavía no están disponibles."
      );

      return;
    }

    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setEstadoRecordatorios(
        "NO_COMPATIBLE"
      );

      toast.error(
        "Este navegador no admite recordatorios."
      );

      return;
    }

    setCambiandoRecordatorios(
      true
    );

    try {
      let permiso =
        Notification.permission;

      if (
        permiso ===
        "default"
      ) {
        permiso =
          await Notification.requestPermission();
      }

      if (
        permiso !==
        "granted"
      ) {
        setEstadoRecordatorios(
          permiso === "denied"
            ? "BLOQUEADOS"
            : "INACTIVOS"
        );

        throw new Error(
          permiso === "denied"
            ? "Las notificaciones están bloqueadas en este navegador."
            : "No se concedió permiso para las notificaciones."
        );
      }

      const registro =
        await navigator.serviceWorker.ready;

      let suscripcion =
        await registro.pushManager.getSubscription();

      if (!suscripcion) {
        suscripcion =
          await registro.pushManager.subscribe({
            userVisibleOnly:
              true,

            applicationServerKey:
              convertirClaveVapid(
                clavePublica
              ),
          });
      }

      const respuesta =
        await fetch(
          `/api/seguimiento/${encodeURIComponent(token)}/push`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                suscripcion.toJSON()
              ),
          }
        );

      const data =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.error ||
            "No se pudieron activar los recordatorios."
        );
      }

      setEstadoRecordatorios(
        "ACTIVOS"
      );

      toast.success(
        "Recordatorios activados en este dispositivo."
      );

    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudieron activar los recordatorios."
      );

    } finally {
      setCambiandoRecordatorios(
        false
      );
    }
  }


  async function desactivarRecordatorios() {
    if (
      cambiandoRecordatorios
    ) {
      return;
    }

    setCambiandoRecordatorios(
      true
    );

    try {
      const registro =
        await navigator.serviceWorker.ready;

      const suscripcion =
        await registro.pushManager.getSubscription();

      if (!suscripcion) {
        setEstadoRecordatorios(
          "INACTIVOS"
        );

        return;
      }

      const respuesta =
        await fetch(
          `/api/seguimiento/${encodeURIComponent(token)}/push`,
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                endpoint:
                  suscripcion.endpoint,
              }),
          }
        );

      const data =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.error ||
            "No se pudieron desactivar los recordatorios."
        );
      }

      await suscripcion.unsubscribe();

      setEstadoRecordatorios(
        "INACTIVOS"
      );

      toast.success(
        "Recordatorios desactivados en este dispositivo."
      );

    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudieron desactivar los recordatorios."
      );

    } finally {
      setCambiandoRecordatorios(
        false
      );
    }
  }


  const actividadesHoy =
    useMemo(
      () => {
        if (
          !seguimiento ||
          !seguimiento.diaActual
        ) {
          return [];
        }

        return seguimiento.actividades
          .filter(
            (actividad) =>
              actividadCorrespondeDia(
                actividad,
                seguimiento.diaActual as number
              )
          )
          .sort(ordenarActividadesPorSeccionYAgenda);
      },
      [
        seguimiento,
      ]
    );


  const tareasHoy =
    useMemo(
      () =>
        actividadesHoy.filter(
          (actividad) =>
            actividad.tipo === "TAREA"
        ),
      [actividadesHoy]
    );


  const completadasHoy =
    useMemo(
      () => {
        if (
          !seguimiento ||
          !seguimiento.diaActual
        ) {
          return 0;
        }

        return tareasHoy.filter(
          (actividad) =>
            actividadCompletadaEnDia(
              actividad,
              seguimiento.diaActual as number
            )
        ).length;
      },
      [
        tareasHoy,
        seguimiento,
      ]
    );


  const siguienteTareaId = (() => {
    const dia = seguimiento?.diaActual;

    if (!dia) {
      return null;
    }

    const ahoraMin = minutosAhoraBolivia();

    const siguiente = actividadesHoy.find(
      (actividad) => {
        if (actividad.tipo !== "TAREA") {
          return false;
        }

        if (actividadCompletadaEnDia(actividad, dia)) {
          return false;
        }

        const minutos = minutosDeHora(actividad.hora);

        return minutos !== null && minutos > ahoraMin;
      }
    );

    return siguiente ? siguiente.id : null;
  })();


  const totalTareas =
    seguimiento
      ? cantidadTotalTareas(
          seguimiento
        )
      : 0;


  const totalCompletadas =
    seguimiento
      ? cantidadCompletadas(
          seguimiento
        )
      : 0;


  const porcentajeGeneral =
    totalTareas > 0
      ? Math.min(
          100,
          Math.round(
            (
              totalCompletadas /
              totalTareas
            ) * 100
          )
        )
      : 0;


  const totalIndicacionesHoy =
    tareasHoy.reduce(
      (
        total,
        actividad
      ) =>
        total +
        actividad.indicaciones.length,
      0
    );


  const indicacionesCompletadasHoy =
    seguimiento?.diaActual
      ? tareasHoy.reduce(
          (
            total,
            actividad
          ) =>
            total +
            actividad.indicaciones.filter(
              (indicacion) =>
                indicacionCompletadaEnDia(
                  indicacion,
                  seguimiento.diaActual as number
                )
            ).length,
          0
        )
      : 0;


  const totalChecksHoy =
    tareasHoy.length +
    totalIndicacionesHoy;


  const checksCompletadosHoy =
    completadasHoy +
    indicacionesCompletadasHoy;


  const porcentajeHoy =
    totalChecksHoy > 0
      ? Math.round(
          (
            checksCompletadosHoy /
            totalChecksHoy
          ) * 100
        )
      : 0;


  const pesos =
    seguimiento?.pesos ??
    [];


  const pesoInicial =
    pesos.length > 0
      ? pesos[0]
      : null;


  const ultimoPeso =
    pesos.length > 0
      ? pesos[
          pesos.length - 1
        ]
      : null;


  const pesoPromedio =
    pesos.length > 0
      ? Math.round(
          (
            pesos.reduce(
              (
                acumulado,
                registro
              ) =>
                acumulado +
                registro.peso,
              0
            ) /
            pesos.length
          ) *
            100
        ) / 100
      : null;


  const cambioPeso =
    pesoInicial &&
    ultimoPeso
      ? Math.round(
          (
            ultimoPeso.peso -
            pesoInicial.peso
          ) *
            100
        ) / 100
      : null;


  async function iniciarSeguimiento() {
    if (iniciando) {
      return;
    }

    setIniciando(
      true
    );

    try {
      const respuesta =
        await fetch(
          `/api/seguimiento/${encodeURIComponent(token)}/iniciar`,
          {
            method:
              "POST",
          }
        );

      const data =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.error ||
            "No se pudo iniciar el seguimiento."
        );
      }

      toast.success(
        "Tu seguimiento comenzó correctamente."
      );

      setCargando(
        true
      );

      await cargarSeguimiento();

    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar el seguimiento."
      );

    } finally {
      setIniciando(
        false
      );
    }
  }


  async function cambiarEstadoActividad(
    actividad: Actividad
  ) {
    if (
      !seguimiento?.diaActual ||
      seguimiento.estado !==
        "ACTIVO"
    ) {
      return;
    }

    const completada =
      actividadCompletadaEnDia(
        actividad,
        seguimiento.diaActual
      );

    setActualizandoActividad(
      actividad.id
    );

    try {
      const respuesta =
        await fetch(
          `/api/seguimiento/${encodeURIComponent(token)}/actividades/${encodeURIComponent(actividad.id)}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                completado:
                  !completada,
              }),
          }
        );

      const data =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.error ||
            "No se pudo actualizar la actividad."
        );
      }

      setSeguimiento(
        (actual) => {
          if (
            !actual ||
            !actual.diaActual
          ) {
            return actual;
          }

          const dia =
            actual.diaActual;

          return {
            ...actual,

            actividades:
              actual.actividades.map(
                (item) => {
                  if (
                    item.id !==
                    actividad.id
                  ) {
                    return item;
                  }

                  const otros =
                    item.progresos.filter(
                      (progreso) =>
                        progreso.diaPlan !==
                        dia
                    );

                  return {
                    ...item,

                    progresos: [
                      ...otros,
                      {
                        diaPlan:
                          dia,

                        completado:
                          data.completado,

                        completadoAt:
                          data.completadoAt,
                      },
                    ],
                  };
                }
              ),
          };
        }
      );

      if (
        data.completado
      ) {
        toast.success(
          "Actividad marcada como realizada."
        );
      }

    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la actividad."
      );

    } finally {
      setActualizandoActividad(
        null
      );
    }
  }


  async function cambiarEstadoIndicacion(
    actividad: Actividad,
    indicacionId: string
  ) {
    if (
      !seguimiento?.diaActual ||
      seguimiento.estado !==
        "ACTIVO" ||
      actualizandoIndicacion
    ) {
      return;
    }

    const indicacion =
      actividad.indicaciones.find(
        (item) =>
          item.id ===
          indicacionId
      );

    if (!indicacion) {
      return;
    }

    const dia =
      seguimiento.diaActual;

    const completada =
      indicacionCompletadaEnDia(
        indicacion,
        dia
      );

    setActualizandoIndicacion(
      indicacionId
    );

    try {
      const respuesta =
        await fetch(
          `/api/seguimiento/${encodeURIComponent(token)}/actividades/${encodeURIComponent(actividad.id)}/indicaciones/${encodeURIComponent(indicacionId)}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                completado:
                  !completada,
              }),
          }
        );

      const data =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.error ||
            "No se pudo actualizar la indicación."
        );
      }

      setSeguimiento(
        (actual) => {
          if (
            !actual ||
            !actual.diaActual
          ) {
            return actual;
          }

          const diaActual =
            actual.diaActual;

          return {
            ...actual,

            actividades:
              actual.actividades.map(
                (item) => {

                  if (
                    item.id !==
                    actividad.id
                  ) {
                    return item;
                  }

                  return {
                    ...item,

                    indicaciones:
                      item.indicaciones.map(
                        (
                          indicacionActual
                        ) => {

                          if (
                            indicacionActual.id !==
                            indicacionId
                          ) {
                            return indicacionActual;
                          }

                          const otros =
                            indicacionActual.progresos.filter(
                              (progreso) =>
                                progreso.diaPlan !==
                                diaActual
                            );

                          return {
                            ...indicacionActual,

                            progresos: [
                              ...otros,
                              {
                                diaPlan:
                                  diaActual,

                                completado:
                                  data.completado,

                                completadoAt:
                                  data.completadoAt,
                              },
                            ],
                          };
                        }
                      ),
                  };
                }
              ),
          };
        }
      );

    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la indicación."
      );

    } finally {
      setActualizandoIndicacion(
        null
      );
    }
  }


  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F7FC] px-5">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-[#E9E4F2] bg-white shadow-sm">
            <Image
              src="/logo.png"
              alt="DioxiLife Bolivia"
              width={80}
              height={66}
              priority
              className="h-auto w-16"
            />
          </div>

          <LoaderCircle className="mx-auto mt-6 h-7 w-7 animate-spin text-brand-pink" />

          <p className="mt-3 text-sm font-medium text-brand-gray">
            Abriendo tu seguimiento...
          </p>
        </div>
      </main>
    );
  }


  if (
    error ||
    !seguimiento
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F7FC] px-5 py-10">
        <div className="w-full max-w-md rounded-3xl border border-[#E9E4F2] bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <h1 className="mt-5 text-xl font-bold text-[#1F1B24]">
            Enlace no disponible
          </h1>

          <p className="mt-2 text-sm leading-6 text-brand-gray">
            {error ||
              "No pudimos encontrar este seguimiento."}
          </p>

          <p className="mt-5 text-xs leading-5 text-brand-gray">
            Si recibiste un enlace nuevo, utiliza siempre el más reciente enviado por DioxiLife.
          </p>
        </div>
      </main>
    );
  }


  if (
    seguimiento.estado ===
    "PENDIENTE"
  ) {
    const nombreBienvenida =
      seguimiento.nombreCliente?.trim() ||
      "Cliente";

    return (
      <main className="min-h-screen bg-gradient-to-b from-[#F2EDFF] via-[#FBFAFD] to-[#F8F7FC] px-4 py-6 sm:py-10">

        <div className="mx-auto w-full max-w-lg">


          <header className="text-center">

            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[28px] border border-white/80 bg-white shadow-[0_18px_45px_rgba(67,48,130,0.16)]">

              <Image
                src="/logo.png"
                alt="DioxiLife Bolivia"
                width={120}
                height={100}
                priority
                className="h-auto w-20"
              />

            </div>


            <p className="mt-5 text-sm font-extrabold uppercase tracking-[0.2em] text-brand-pink">
              DioxiLife Bolivia
            </p>

            <p className="mt-1 text-sm font-semibold text-brand-gray">
              Seguimiento personalizado
            </p>

          </header>


          <section className="mt-6 overflow-hidden rounded-[28px] border border-[#E6E0F0] bg-white shadow-[0_22px_60px_rgba(42,31,79,0.12)]">


            <div className="relative overflow-hidden bg-gradient-to-br from-brand-blue via-[#5B3DB9] to-[#41258E] px-6 py-7 text-white sm:px-7 sm:py-8">

              <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10" />

              <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-white/[0.06]" />


              <div className="relative">

                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90">

                  <Sparkles className="h-4 w-4" />

                  Tu seguimiento está listo

                </div>


                <p className="mt-6 text-sm font-semibold text-white/70">
                  Bienvenido
                </p>


                <h1 className="mt-1 break-words text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {nombreBienvenida}
                </h1>


                <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
                  Tu espacio personal de seguimiento ya está preparado. Desde aquí podrás consultar tu agenda y registrar tus avances día a día.
                </p>


                <div className="mt-6">

                  <button
                    type="button"
                    onClick={
                      iniciarSeguimiento
                    }
                    disabled={
                      iniciando
                    }
                    className="group inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-white/20 bg-brand-pink px-5 py-4.5 text-base font-extrabold text-white shadow-[0_16px_35px_rgba(219,63,133,0.42)] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                  >

                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">

                      {iniciando ? (
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                      ) : (
                        <Play className="h-5 w-5 fill-current" />
                      )}

                    </span>


                    <span>
                      {iniciando
                        ? "Preparando tu seguimiento..."
                        : "Iniciar mi seguimiento"}
                    </span>

                  </button>


                  {!iniciando && (

                    <p className="mt-2 text-center text-xs font-semibold text-white/65">
                      Comenzar Día 1
                    </p>

                  )}

                </div>

              </div>

            </div>


            <div className="p-5 sm:p-6">


              <div className="rounded-2xl border border-[#E9E4F2] bg-[#FAF8FF] p-5">

                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-pink">
                  Tu plan personalizado
                </p>


                <h2 className="mt-2 text-xl font-extrabold leading-tight text-[#1F1B24]">
                  {seguimiento.nombrePlan}
                </h2>


                <div className="mt-5 grid grid-cols-2 gap-3">

                  <div className="rounded-2xl bg-white p-3.5 shadow-sm">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0ECFA] text-brand-blue">
                      <CalendarDays className="h-5 w-5" />
                    </div>

                    <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-brand-gray">
                      Duración
                    </p>

                    <p className="mt-0.5 text-base font-extrabold text-[#1F1B24]">
                      {seguimiento.duracionDias} días
                    </p>

                  </div>


                  <div className="rounded-2xl bg-white p-3.5 shadow-sm">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0ECFA] text-brand-blue">
                      <Clock3 className="h-5 w-5" />
                    </div>

                    <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-brand-gray">
                      Inicio previsto
                    </p>

                    <p className="mt-0.5 text-sm font-extrabold leading-5 text-[#1F1B24]">

                      {seguimiento.fechaInicioPrevista
                        ? formatearFecha(
                            seguimiento.fechaInicioPrevista
                          )
                        : "Al iniciar"}

                    </p>

                  </div>

                </div>

              </div>


              <div className="mt-6">

                <p className="text-sm font-extrabold text-[#1F1B24]">
                  Desde este enlace podrás
                </p>


                <div className="mt-3 grid grid-cols-2 gap-3">


                  <div className="rounded-2xl border border-[#EEEAF5] bg-white p-4">

                    <CalendarDays className="h-5 w-5 text-brand-pink" />

                    <p className="mt-3 text-sm font-bold text-[#1F1B24]">
                      Agenda diaria
                    </p>

                    <p className="mt-1 text-xs leading-5 text-brand-gray">
                      Revisar las actividades correspondientes a cada día.
                    </p>

                  </div>


                  <div className="rounded-2xl border border-[#EEEAF5] bg-white p-4">

                    <Sparkles className="h-5 w-5 text-brand-pink" />

                    <p className="mt-3 text-sm font-bold text-[#1F1B24]">
                      Tu avance
                    </p>

                    <p className="mt-1 text-xs leading-5 text-brand-gray">
                      Visualizar tu porcentaje de progreso diario.
                    </p>

                  </div>


                  <div className="rounded-2xl border border-[#EEEAF5] bg-white p-4">

                    <Clock3 className="h-5 w-5 text-brand-pink" />

                    <p className="mt-3 text-sm font-bold text-[#1F1B24]">
                      Indicaciones
                    </p>

                    <p className="mt-1 text-xs leading-5 text-brand-gray">
                      Consultar horarios e indicaciones organizadas.
                    </p>

                  </div>


                  <div className="rounded-2xl border border-[#EEEAF5] bg-white p-4">

                    <ShieldCheck className="h-5 w-5 text-brand-pink" />

                    <p className="mt-3 text-sm font-bold text-[#1F1B24]">
                      Evolución
                    </p>

                    <p className="mt-1 text-xs leading-5 text-brand-gray">
                      Consultar tus registros y la evolución de tu peso.
                    </p>

                  </div>

                </div>

              </div>


              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#E9E4F2] bg-[#FAF9FC] p-4">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0ECFA] text-brand-blue">
                  <ShieldCheck className="h-5 w-5" />
                </div>


                <div>

                  <p className="text-xs font-extrabold text-[#34303A]">
                    Enlace personal
                  </p>

                  <p className="mt-1 text-xs leading-5 text-brand-gray">
                    Guarda este enlace de WhatsApp. Podrás utilizarlo para volver a consultar tu seguimiento y tus avances.
                  </p>

                </div>

              </div>

            </div>

          </section>


          <footer className="px-4 pb-4 pt-7 text-center">

            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-blue">
              DioxiLife Bolivia
            </p>

            <p className="mt-1 text-xs text-brand-gray">
              Tu seguimiento organizado en un solo lugar.
            </p>

          </footer>

        </div>

      </main>
    );
  }


  if (
    seguimiento.estado ===
    "PAUSADO"
  ) {
    return (
      <EstadoEspecial
        titulo="Seguimiento pausado"
        descripcion="Tu seguimiento está temporalmente pausado. Contacta con DioxiLife antes de continuar."
        icono={
          <PauseCircle className="h-8 w-8" />
        }
      />
    );
  }


  if (
    seguimiento.estado ===
    "CANCELADO"
  ) {
    return (
      <EstadoEspecial
        titulo="Seguimiento finalizado"
        descripcion="Este seguimiento fue cerrado y ya no admite nuevos registros."
        icono={
          <Ban className="h-8 w-8" />
        }
      />
    );
  }


  if (
    seguimiento.estado ===
    "COMPLETADO"
  ) {
    return (
      <EstadoEspecial
        titulo="Seguimiento completado"
        descripcion="Tu agenda fue completada. Tus registros anteriores permanecen guardados."
        icono={
          <Trophy className="h-8 w-8" />
        }
      />
    );
  }


  const diaActual =
    seguimiento.diaActual ??
    1;


  const inicioCalendario =
    Math.max(
      1,
      Math.min(
        diaActual - 3,
        Math.max(
          1,
          seguimiento.duracionDias - 6
        )
      )
    );


  const cantidadDiasCalendario =
    mostrarTodosCalendario
      ? seguimiento.duracionDias
      : Math.min(
          7,
          seguimiento.duracionDias
        );


  const diasCalendario =
    Array.from(
      {
        length:
          cantidadDiasCalendario,
      },
      (
        _,
        indice
      ) =>
        mostrarTodosCalendario
          ? indice + 1
          : inicioCalendario +
            indice
    ).filter(
      (dia) =>
        dia >= 1 &&
        dia <=
          seguimiento.duracionDias
    );


  return (
    <main className="min-h-screen bg-[#F8F7FC] pb-24">

      <header className="border-b border-[#E9E4F2] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E9E4F2] bg-white">
              <Image
                src="/logo.png"
                alt="DioxiLife Bolivia"
                width={52}
                height={43}
                priority
                className="h-auto w-9"
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-pink">
                DioxiLife
              </p>

              <p className="text-sm font-semibold text-[#1F1B24]">
                Mi seguimiento
              </p>
            </div>
          </div>


          <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            Activo
          </div>

        </div>
      </header>


        {seguimiento.estado ===
          "ACTIVO" && (

          <section className="sticky top-0 z-40 border-b border-[#E2D9F0] bg-[#F2EDF8]/95 py-2 backdrop-blur">

            <div className="mx-auto max-w-3xl px-3 sm:px-4">

              <div className="rounded-2xl border border-[#E2D9F0] bg-[#F6F1FB] px-4 py-3 shadow-sm">

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <p className="truncate text-base font-extrabold text-[#1F1B24]">
                      {seguimiento.nombreCliente?.trim() || "Cliente"}
                    </p>

                    <p className="mt-0.5 text-[11px] font-semibold text-brand-gray">
                      Seguimiento de hoy
                    </p>

                  </div>


                  <div className="shrink-0 text-right">

                    <p className="text-2xl font-extrabold text-brand-blue">
                      {porcentajeHoy}%
                    </p>

                    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-gray">
                      avance
                    </p>

                  </div>

                </div>


                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#EEEAF5]">

                  <div
                    className="h-full rounded-full bg-brand-pink transition-all duration-300"
                    style={{
                      width:
                        `${porcentajeHoy}%`,
                    }}
                  />

                </div>


                <div className="mt-3 grid grid-cols-2 divide-x divide-[#EEEAF3] rounded-xl bg-[#FAF9FC] py-2.5">

                  <div className="px-3">

                    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-gray">
                      Peso inicial
                    </p>

                    <p className="mt-0.5 text-base font-extrabold text-[#1F1B24]">
                      {pesoInicial
                        ? `${pesoInicial.peso.toLocaleString(
                            "es-BO",
                            {
                              minimumFractionDigits:
                                1,
                              maximumFractionDigits:
                                2,
                            }
                          )} kg`
                        : "—"}
                    </p>

                  </div>


                  <div className="px-3">

                    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-gray">
                      Peso actual
                    </p>

                    <p className="mt-0.5 text-base font-extrabold text-[#1F1B24]">
                      {ultimoPeso
                        ? `${ultimoPeso.peso.toLocaleString(
                            "es-BO",
                            {
                              minimumFractionDigits:
                                1,
                              maximumFractionDigits:
                                2,
                            }
                          )} kg`
                        : "—"}
                    </p>

                  </div>

                </div>


                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-brand-gray">

                  <span className="font-bold text-brand-blue">
                    {checksCompletadosHoy}/{totalChecksHoy} checks completados
                  </span>

                  <span>
                    Títulos {completadasHoy}/{tareasHoy.length}
                  </span>

                  {totalIndicacionesHoy >
                    0 && (

                    <span>
                      Indicaciones {indicacionesCompletadasHoy}/{totalIndicacionesHoy}
                    </span>

                  )}

                </div>

              </div>

            </div>

          </section>

        )}

      <div className="mx-auto max-w-3xl px-4 py-5">

        <section>
          <p className="text-sm text-brand-gray">
            {primerNombre(
              seguimiento.nombreCliente
            ) === "Hola"
              ? "Bienvenido"
              : `Hola, ${primerNombre(
                  seguimiento.nombreCliente
                )}`}
          </p>

          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1F1B24]">
            Tu seguimiento de hoy
          </h1>
        </section>


        {pestana === "hoy" &&
          seguimiento.estado === "ACTIVO" && (
          <MedicionesSeguimientoPublico
            token={token}
          />
        )}


          {pestana === "hoy" && (

          <section className="mt-5 overflow-hidden rounded-2xl border border-[#E9E4F2] bg-white p-4 shadow-sm sm:p-5">

            <div className="flex items-start justify-between gap-4">

              <div className="min-w-0">

                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
                  Evolución del peso
                </p>

                <div className="mt-1 flex flex-wrap items-baseline gap-2">

                  <p className="text-2xl font-extrabold text-[#1F1B24]">
                    {ultimoPeso
                      ? `${ultimoPeso.peso.toLocaleString(
                          "es-BO",
                          {
                            minimumFractionDigits:
                              1,
                            maximumFractionDigits:
                              2,
                          }
                        )} kg`
                      : "Sin registros"}
                  </p>

                  {ultimoPeso && (
                    <span className="text-xs font-semibold text-brand-gray">
                      Día {ultimoPeso.diaPlan}
                    </span>
                  )}

                </div>

              </div>


              {cambioPeso !==
                null && (

                <div className="shrink-0 rounded-xl bg-[#F8F6FF] px-3 py-2 text-right">

                  <p
                    className={`text-sm font-extrabold ${
                      cambioPeso >
                        0
                        ? "text-amber-700"
                        : cambioPeso <
                            0
                          ? "text-brand-blue"
                          : "text-brand-gray"
                    }`}
                  >
                    {cambioPeso >
                    0
                      ? `↑ ${Math.abs(
                          cambioPeso
                        ).toLocaleString(
                          "es-BO",
                          {
                            maximumFractionDigits:
                              2,
                          }
                        )} kg`
                      : cambioPeso <
                          0
                        ? `↓ ${Math.abs(
                            cambioPeso
                          ).toLocaleString(
                            "es-BO",
                            {
                              maximumFractionDigits:
                                2,
                            }
                          )} kg`
                        : "— 0 kg"}
                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold text-brand-gray">
                    desde el inicio
                  </p>

                </div>

              )}

            </div>


            {pesos.length >
            0 ? (

              <>

                <div className="mt-5 h-52 w-full">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <LineChart
                      data={pesos.map(
                        (registro) => ({
                          ...registro,
                          dia:
                            `D${registro.diaPlan}`,
                        })
                      )}
                      margin={{
                        top: 8,
                        right: 8,
                        left: -12,
                        bottom: 0,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        opacity={0.25}
                      />

                      <XAxis
                        dataKey="dia"
                        axisLine={false}
                        tickLine={false}
                        fontSize={11}
                      />

                      <YAxis
                        dataKey="peso"
                        domain={[
                          "auto",
                          "auto",
                        ]}
                        axisLine={false}
                        tickLine={false}
                        fontSize={11}
                        width={46}
                      />

                      <Tooltip />

                      <Line
                        type="monotone"
                        dataKey="peso"
                        name="Peso"
                        unit=" kg"
                        stroke="#6750A4"
                        strokeWidth={3}
                        dot={{
                          r: 4,
                          fill:
                            "#FFFFFF",
                          stroke:
                            "#6750A4",
                          strokeWidth:
                            3,
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>


                {pesos.length ===
                  1 && (

                  <p className="mt-2 text-center text-xs text-brand-gray">
                    Registra más días para visualizar la tendencia del peso.
                  </p>

                )}


                <div className="mt-4 grid grid-cols-3 divide-x divide-[#EEEAF3] rounded-xl bg-[#FAF9FC] py-3 text-center">

                  <div className="px-2">

                    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-gray">
                      Inicial
                    </p>

                    <p className="mt-1 text-sm font-extrabold text-[#1F1B24]">
                      {pesoInicial
                        ? `${pesoInicial.peso.toLocaleString(
                            "es-BO",
                            {
                              maximumFractionDigits:
                                2,
                            }
                          )} kg`
                        : "—"}
                    </p>

                  </div>


                  <div className="px-2">

                    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-gray">
                      Último
                    </p>

                    <p className="mt-1 text-sm font-extrabold text-[#1F1B24]">
                      {ultimoPeso
                        ? `${ultimoPeso.peso.toLocaleString(
                            "es-BO",
                            {
                              maximumFractionDigits:
                                2,
                            }
                          )} kg`
                        : "—"}
                    </p>

                  </div>


                  <div className="px-2">

                    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-gray">
                      Promedio
                    </p>

                    <p className="mt-1 text-sm font-extrabold text-[#1F1B24]">
                      {pesoPromedio !==
                      null
                        ? `${pesoPromedio.toLocaleString(
                            "es-BO",
                            {
                              maximumFractionDigits:
                                2,
                            }
                          )} kg`
                        : "—"}
                    </p>

                  </div>

                </div>

              </>

            ) : (

              <div className="mt-4 rounded-xl border border-dashed border-[#DDD7E8] bg-[#FAF9FC] px-4 py-5 text-center">

                <p className="text-sm font-semibold text-[#4F4B56]">
                  Aún no hay registros de peso
                </p>

                <p className="mt-1 text-xs leading-5 text-brand-gray">
                  Cuando se registre un peso, aquí aparecerá su evolución.
                </p>

              </div>

            )}

          </section>

          )}


        <section className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue to-[#4B2DB7] p-5 text-white shadow-sm">

          <div className="flex items-start justify-between gap-4">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                {seguimiento.nombrePlan}
              </p>

              <p className="mt-2 text-3xl font-extrabold">
                Día {diaActual}
              </p>

              <p className="mt-1 text-sm text-white/75">
                de {seguimiento.duracionDias} días
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <CalendarDays className="h-6 w-6" />
            </div>

          </div>


        </section>


        {pestana ===
          "hoy" && (

          <>


          <section className="mt-6">

            <div className="mb-3 flex items-center justify-between gap-3">

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
                  Hoy
                </p>

                <h2 className="mt-1 text-lg font-bold text-[#1F1B24]">
                  Tu protocolo de hoy
                </h2>
              </div>

              {tareasHoy.length > 0 && (
                <span className="rounded-full border border-[#E9E4F2] bg-white px-3 py-1 text-xs font-semibold text-brand-gray">
                  {completadasHoy}/{tareasHoy.length} realizadas
                </span>
              )}

            </div>


            {actividadesHoy.length ===
            0 ? (

              <div className="rounded-2xl border border-[#E9E4F2] bg-white p-7 text-center shadow-sm">
                <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" />

                <h3 className="mt-3 font-bold text-[#1F1B24]">
                  No tienes actividades para hoy
                </h3>

                <p className="mt-1 text-sm leading-6 text-brand-gray">
                  Puedes revisar tu calendario para ver las próximas actividades.
                </p>
              </div>

            ) : (

              <div className="space-y-3">

                {actividadesHoy.map(
                  (
                    actividad,
                    indice
                  ) => {

                    const completada =
                      actividadCompletadaEnDia(
                        actividad,
                        diaActual
                      );

                    const esSiguiente =
                      siguienteTareaId === actividad.id;

                    const actualizando =
                      actualizandoActividad ===
                      actividad.id;

                    const esInformacion =
                      actividad.tipo ===
                      "INFORMACION";

                    const esControl =
                      actividad.tipo ===
                      "CONTROL";

                    const esAyunas =
                      actividad.momento ===
                        "Ayunas" ||
                      actividad.titulo ===
                        "Ayunas";

                    const momentoDiferente =
                      actividad.momento &&
                      actividad.momento !==
                        actividad.titulo;

                    const descripcionPrincipal =
                      actividad.indicaciones.length >
                        0 &&
                      actividad.descripcion &&
                      actividad.descripcion.trim() !==
                        actividad.indicaciones
                          .map(
                            (indicacion) =>
                              indicacion.texto.trim()
                          )
                          .filter(Boolean)
                          .join("\n")
                          .trim()
                        ? actividad.descripcion.trim()
                        : null;


                    const instrucciones =
                      actividad.indicaciones.length > 0
                        ? actividad.indicaciones.map(
                            (indicacion) => ({
                              id:
                                indicacion.id,

                              hora:
                                indicacion.hora,

                              texto:
                                indicacion.texto,

                              progresos:
                                indicacion.progresos,
                            })
                          )
                        : actividad.descripcion
                          ? actividad.descripcion
                              .split(/\r?\n/)
                              .map(
                                (
                                  linea,
                                  indice
                                ) => ({
                                  id:
                                    `legacy-${indice}`,

                                  hora:
                                    null,

                                  texto:
                                    linea.trim(),

                                  progresos:
                                    null,
                                })
                              )
                              .filter(
                                (item) =>
                                  Boolean(
                                    item.texto
                                  )
                              )
                          : [];

                    const mostrarTituloSeccion =
                      indice === 0 ||
                      actividadesHoy[
                        indice - 1
                      ]?.seccion !==
                        actividad.seccion;

                    return (
                      <div
                        key={
                          actividad.id
                        }
                      >

                        {mostrarTituloSeccion && (
                          <div
                            className={
                              indice === 0
                                ? "pb-1 pt-1"
                                : "pb-1 pt-5"
                            }
                          >

                            <div className="flex items-center gap-3">

                              <p
                                className={`shrink-0 text-xs font-extrabold uppercase tracking-[0.14em] ${
                                  actividad.seccion === "ADICIONAL"
                                    ? "text-purple-700"
                                    : "text-brand-blue"
                                }`}
                              >
                                {actividad.seccion === "ADICIONAL"
                                  ? "Protocolos adicionales"
                                  : "Protocolo principal"}
                              </p>

                              <div className="h-px flex-1 bg-[#E9E4F2]" />

                            </div>

                          </div>
                        )}

                        <article
                        className={`overflow-hidden rounded-2xl border shadow-sm transition ${
                          esInformacion
                            ? "border-blue-200 bg-blue-50/40"
                            : completada
                            ? "border-emerald-200 bg-emerald-50/30"
                            : "border-[#E9E4F2] bg-white"
                        }`}
                      >

                        <div className="p-4 sm:p-5">

                          <div className="flex items-start gap-3">

                            <div
                              className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                esInformacion
                                  ? "bg-blue-100 text-blue-700"
                                  : esControl
                                  ? "bg-amber-100 text-amber-700"
                                  : completada
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-[#F8F6FF] text-brand-blue"
                              }`}
                            >
                              {esInformacion ? (
                                <ClipboardList className="h-5 w-5" />
                              ) : esControl ? (
                                <Clock3 className="h-5 w-5" />
                              ) : completada ? (
                                <Check className="h-5 w-5" />
                              ) : (
                                <Clock3 className="h-5 w-5" />
                              )}
                            </div>


                            <div className="min-w-0 flex-1">

                              <div className="flex flex-wrap items-center gap-2">

                                {actividad.hora && (
                                  <span className="rounded-lg bg-[#F4F2F8] px-2.5 py-1 text-xs font-bold text-brand-blue">
                                    {actividad.hora}
                                  </span>
                                )}

                                {esAyunas &&
                                  !actividad.hora && (
                                  <span className="rounded-lg bg-[#F4F2F8] px-2.5 py-1 text-xs font-semibold text-brand-blue">
                                    Sin hora fija
                                  </span>
                                )}

                                {esInformacion && (
                                  <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                                    Para tener en cuenta
                                  </span>
                                )}

                                {actividad.recordatorio !==
                                  "NINGUNO" && (
                                  <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                                    🔔{" "}
                                    {textoRecordatorio(
                                      actividad.recordatorio
                                    )}
                                  </span>
                                )}

                              </div>

                              {actividad.tipo === "TAREA" &&
                                !completada && (
                                <div>
                                  <AvisoHora
                                    hora={actividad.hora}
                                    esSiguiente={esSiguiente}
                                  />
                                </div>
                              )}


                              <h3
                                className={`mt-2 text-base font-extrabold ${
                                  esInformacion
                                    ? "text-blue-900"
                                    : completada
                                    ? "text-emerald-800"
                                    : "text-[#1F1B24]"
                                }`}
                              >
                                {actividad.titulo}
                              </h3>


                              {momentoDiferente && (
                                <p className="mt-0.5 text-xs font-medium text-brand-gray">
                                  {actividad.momento}
                                </p>
                              )}

                            </div>


                            {actividad.tipo ===
                              "TAREA" && (

                              <button
                                type="button"
                                onClick={() =>
                                  void cambiarEstadoActividad(
                                    actividad
                                  )
                                }
                                disabled={
                                  actualizandoActividad ===
                                  actividad.id
                                }
                                aria-label={
                                  completada
                                    ? `Marcar como pendiente: ${actividad.titulo}`
                                    : `Marcar como realizada: ${actividad.titulo}`
                                }
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                                  completada
                                    ? "border-brand-pink bg-brand-pink text-white"
                                    : "border-brand-pink bg-white text-brand-pink"
                                }`}
                              >

                                {actualizandoActividad ===
                                actividad.id ? (

                                  <LoaderCircle className="h-6 w-6 animate-spin" />

                                ) : (

                                  <Check
                                    className={`h-6 w-6 ${
                                      completada
                                        ? ""
                                        : "opacity-35"
                                    }`}
                                    strokeWidth={3}
                                  />

                                )}

                              </button>

                            )}

                          </div>


                          {descripcionPrincipal && (

                            <div className="mt-4 rounded-xl bg-[#FAF9FC] px-3.5 py-3">

                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-gray">
                                Instrucción principal
                              </p>

                              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-[#4F4B56]">
                                {descripcionPrincipal}
                              </p>

                            </div>

                          )}


                          {instrucciones.length > 0 && (
                            <div className="mt-4 border-t border-black/5 pt-4">

                              <div className="mb-3 flex items-center justify-between gap-3">

                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-gray">
                                  {esInformacion
                                    ? "Información"
                                    : "Instrucciones"}
                                </p>


                                {actividad.tipo ===
                                  "TAREA" &&
                                  actividad.indicaciones.length >
                                    0 && (

                                  <span className="rounded-full bg-[#F8F6FF] px-2.5 py-1 text-xs font-bold text-brand-blue">
                                    {
                                      actividad.indicaciones.filter(
                                        (indicacion) =>
                                          indicacionCompletadaEnDia(
                                            indicacion,
                                            diaActual
                                          )
                                      ).length
                                    }{" "}
                                    de{" "}
                                    {
                                      actividad.indicaciones.length
                                    }
                                  </span>

                                )}

                              </div>

                              <ul className="space-y-2.5">

                                {instrucciones.map(
                                  (
                                    instruccion
                                  ) => {

                                    const esIndicacionEstructurada =
                                      instruccion.progresos !==
                                      null;

                                    const indicacionRealizada =
                                      instruccion.progresos?.some(
                                        (progreso) =>
                                          progreso.diaPlan ===
                                            diaActual &&
                                          progreso.completado
                                      ) ??
                                      false;

                                    const cargandoIndicacion =
                                      actualizandoIndicacion ===
                                      instruccion.id;

                                    return (
                                      <li
                                        key={`${actividad.id}-${instruccion.id}`}
                                        className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-sm leading-6 transition ${
                                          indicacionRealizada
                                            ? "border-emerald-200 bg-emerald-50/60 text-emerald-800"
                                            : "border-[#EEEAF3] bg-[#FCFBFD] text-[#4F4B56]"
                                        }`}
                                      >

                                        {instruccion.hora && (
                                          <span className="mt-0.5 min-w-[58px] shrink-0 rounded-lg bg-[#F4F2F8] px-2 py-1 text-center font-mono text-xs font-bold text-brand-blue">
                                            {
                                              instruccion.hora
                                            }
                                          </span>
                                        )}


                                        {esInformacion && (
                                          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                        )}


                                        {!esInformacion &&
                                          !esIndicacionEstructurada && (
                                          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue/40" />
                                        )}


                                        <span
                                          className={`min-w-0 flex-1 ${
                                            indicacionRealizada
                                              ? "opacity-70"
                                              : ""
                                          }`}
                                        >
                                          {
                                            instruccion.texto
                                          }
                                        </span>


                                        {actividad.tipo ===
                                          "TAREA" &&
                                          esIndicacionEstructurada && (

                                          <button
                                            type="button"
                                            disabled={
                                              cargandoIndicacion ||
                                              actualizando
                                            }
                                            onClick={() =>
                                              void cambiarEstadoIndicacion(
                                                actividad,
                                                instruccion.id
                                              )
                                            }
                                            aria-label={
                                              indicacionRealizada
                                                ? `Marcar como pendiente: ${instruccion.texto}`
                                                : `Marcar como realizada: ${instruccion.texto}`
                                            }
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                                              indicacionRealizada
                                                ? "border-brand-pink bg-brand-pink text-white"
                                                : "border-brand-pink bg-white text-brand-pink"
                                            }`}
                                          >

                                            {cargandoIndicacion ? (

                                              <LoaderCircle className="h-6 w-6 animate-spin" />

                                            ) : (

                                              <Check
                                                className={`h-6 w-6 ${
                                                  indicacionRealizada
                                                    ? ""
                                                    : "opacity-35"
                                                }`}
                                                strokeWidth={3}
                                              />

                                            )}

                                          </button>

                                        )}

                                      </li>
                                    );
                                  }
                                )}

                              </ul>

                            </div>
                          )}





                          {esControl && (
                            <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                              Control programado
                            </div>
                          )}

                        </div>
                        </article>

                      </div>
                    );
                  }
                )}

              </div>
            )}
          </section>


          <section className="mt-6 rounded-2xl border border-[#E9E4F2] bg-white p-4 shadow-sm">

                    <div className="flex items-start gap-3">

                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        estadoRecordatorios === "ACTIVOS"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-[#F8F6FF] text-brand-blue"
                      }`}>
                        {estadoRecordatorios === "ACTIVOS" ? (
                          <Bell className="h-5 w-5" />
                        ) : (
                          <BellOff className="h-5 w-5" />
                        )}
                      </div>


                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center justify-between gap-2">

                          <h2 className="font-bold text-[#1F1B24]">
                            Recordatorios
                          </h2>

                          {estadoRecordatorios === "ACTIVOS" && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                              Activados
                            </span>
                          )}

                        </div>


                        <p className="mt-1 text-sm leading-6 text-brand-gray">
                          {estadoRecordatorios === "ACTIVOS"
                            ? "Recibirás avisos de las actividades que tengan un recordatorio programado."
                            : estadoRecordatorios === "BLOQUEADOS"
                            ? "Las notificaciones están bloqueadas en la configuración de este navegador."
                            : estadoRecordatorios === "NO_COMPATIBLE"
                            ? "Este navegador no admite notificaciones de seguimiento."
                            : "Activa avisos en este dispositivo para tus actividades programadas."}
                        </p>


                        {estadoRecordatorios === "INACTIVOS" && (
                          <button
                            type="button"
                            onClick={
                              activarRecordatorios
                            }
                            disabled={
                              cambiandoRecordatorios
                            }
                            className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {cambiandoRecordatorios ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Bell className="h-4 w-4" />
                            )}

                            Activar recordatorios
                          </button>
                        )}


                        {estadoRecordatorios === "ACTIVOS" && (
                          <button
                            type="button"
                            onClick={
                              desactivarRecordatorios
                            }
                            disabled={
                              cambiandoRecordatorios
                            }
                            className="mt-3 text-sm font-semibold text-brand-gray underline decoration-[#CEC7DB] underline-offset-4 transition hover:text-[#1F1B24] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {cambiandoRecordatorios
                              ? "Desactivando..."
                              : "Desactivar en este dispositivo"}
                          </button>
                        )}


                        {estadoRecordatorios === "COMPROBANDO" && (
                          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-brand-gray">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Comprobando este dispositivo...
                          </div>
                        )}

                      </div>

                    </div>

                  </section>


          </>

        )}


        {pestana ===
          "calendario" && (

          <section className="mt-6">

            <div className="flex items-end justify-between gap-4">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
                  Calendario
                </p>

                <h2 className="mt-1 text-lg font-bold text-[#1F1B24]">
                  Tu agenda
                </h2>

                <p className="mt-1 text-sm text-brand-gray">
                  Día {diaActual} de {seguimiento.duracionDias}
                </p>

              </div>


              <div className="rounded-xl bg-[#F8F6FF] px-3 py-2 text-center">

                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-gray">
                  Avance
                </p>

                <p className="mt-0.5 text-sm font-extrabold text-brand-blue">
                  {porcentajeGeneral}%
                </p>

              </div>

            </div>


            <div className="mt-4 space-y-3">

              {diasCalendario.map(
                (dia) => {

                  const actividadesDia =
                    seguimiento.actividades
                      .filter(
                        (actividad) =>
                          actividadCorrespondeDia(
                            actividad,
                            dia
                          )
                      )
                      .sort(ordenarActividadesPorSeccionYAgenda);


                  const tareasDia =
                    actividadesDia.filter(
                      (actividad) =>
                        actividad.tipo ===
                        "TAREA"
                    );


                  const completadasDia =
                    tareasDia.filter(
                      (actividad) =>
                        actividadCompletadaEnDia(
                          actividad,
                          dia
                        )
                    ).length;


                  const esHoy =
                    dia ===
                    diaActual;


                  const esPasado =
                    dia <
                    diaActual;


                  const esFuturo =
                    dia >
                    diaActual;


                  const diaCompleto =
                    tareasDia.length >
                      0 &&
                    completadasDia ===
                      tareasDia.length;


                  const porcentajeDia =
                    tareasDia.length >
                    0
                      ? Math.round(
                          (
                            completadasDia /
                            tareasDia.length
                          ) *
                            100
                        )
                      : 0;


                  const estadoDia =
                    tareasDia.length ===
                    0
                      ? "Sin tareas"
                      : esHoy
                      ? "Hoy"
                      : esFuturo
                      ? "Próximo"
                      : diaCompleto
                      ? "Completado"
                      : esPasado
                      ? "Pendiente"
                      : "";


                  return (
                    <details
                      key={
                        dia
                      }
                      open={
                        diaCalendarioAbierto ===
                        dia
                      }
                      onToggle={(
                        evento
                      ) => {
                        const abierto =
                          evento.currentTarget.open;

                        setDiaCalendarioAbierto(
                          (
                            actual
                          ) =>
                            abierto
                              ? dia
                              : actual ===
                                dia
                              ? null
                              : actual
                        );
                      }}
                      className={`group overflow-hidden rounded-2xl border bg-white shadow-sm ${
                        esHoy
                          ? "border-brand-pink"
                          : diaCompleto
                          ? "border-emerald-200"
                          : "border-[#E9E4F2]"
                      }`}
                    >

                      <summary className="cursor-pointer list-none p-4">

                        <div className="flex items-center justify-between gap-3">

                          <div className="flex min-w-0 items-center gap-3">

                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${
                                esHoy
                                  ? "bg-brand-pink text-white"
                                  : diaCompleto
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-[#F8F6FF] text-brand-blue"
                              }`}
                            >
                              {dia}
                            </div>


                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <p className="font-bold text-[#1F1B24]">
                                  Día {dia}
                                </p>


                                {estadoDia && (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                      esHoy
                                        ? "bg-pink-50 text-brand-pink"
                                        : diaCompleto
                                        ? "bg-emerald-50 text-emerald-700"
                                        : esFuturo
                                        ? "bg-[#F8F6FF] text-brand-blue"
                                        : "bg-amber-50 text-amber-700"
                                    }`}
                                  >
                                    {estadoDia}
                                  </span>
                                )}

                              </div>


                              <p className="mt-0.5 text-xs text-brand-gray">
                                {tareasDia.length ===
                                0
                                  ? "Sin tareas"
                                  : `${completadasDia} de ${tareasDia.length} realizadas`}
                              </p>

                            </div>

                          </div>


                          <div className="flex items-center gap-2">

                            {tareasDia.length >
                              0 && (
                              <span
                                className={`text-xs font-bold ${
                                  diaCompleto
                                    ? "text-emerald-600"
                                    : "text-brand-gray"
                                }`}
                              >
                                {porcentajeDia}%
                              </span>
                            )}


                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F6FF] text-base font-bold text-brand-blue transition group-open:rotate-45">
                              +
                            </div>

                          </div>

                        </div>


                        {tareasDia.length >
                          0 && (

                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EEEAF5]">

                            <div
                              className={`h-full rounded-full transition-all ${
                                diaCompleto
                                  ? "bg-emerald-500"
                                  : esHoy
                                  ? "bg-brand-pink"
                                  : "bg-brand-blue"
                              }`}
                              style={{
                                width:
                                  `${porcentajeDia}%`,
                              }}
                            />

                          </div>
                        )}

                      </summary>


                      <div className="border-t border-[#EEEAF5] px-4 pb-4 pt-3">

                        {actividadesDia.length ===
                        0 ? (

                          <p className="text-sm text-brand-gray">
                            No hay actividades programadas para este día.
                          </p>

                        ) : (

                          <div className="space-y-2.5">

                            {actividadesDia.map(
                              (
                                actividad
                              ) => {

                                const hecha =
                                  actividadCompletadaEnDia(
                                    actividad,
                                    dia
                                  );


                                const esInformacion =
                                  actividad.tipo ===
                                  "INFORMACION";


                                return (
                                  <div
                                    key={
                                      actividad.id
                                    }
                                    className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${
                                      esInformacion
                                        ? "bg-blue-50"
                                        : hecha
                                        ? "bg-emerald-50"
                                        : "bg-[#FAF9FC]"
                                    }`}
                                  >

                                    <div className="mt-0.5 shrink-0">

                                      {actividad.tipo ===
                                      "TAREA" ? (

                                        hecha ? (
                                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                          <Circle className="h-4 w-4 text-slate-300" />
                                        )

                                      ) : esInformacion ? (

                                        <ClipboardList className="h-4 w-4 text-blue-500" />

                                      ) : (

                                        <Clock3 className="h-4 w-4 text-amber-500" />

                                      )}

                                    </div>


                                    <div className="min-w-0 flex-1">

                                      <div className="flex flex-wrap items-center gap-2">

                                        <p
                                          className={`text-sm font-semibold ${
                                            esInformacion
                                              ? "text-blue-900"
                                              : hecha
                                              ? "text-emerald-800"
                                              : "text-[#1F1B24]"
                                          }`}
                                        >
                                          {actividad.titulo}
                                        </p>


                                        {actividad.hora && (
                                          <span className="text-xs font-bold text-brand-blue">
                                            {actividad.hora}
                                          </span>
                                        )}

                                        {actividad.seccion === "ADICIONAL" && (
                                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                                            Adicional
                                          </span>
                                        )}

                                      </div>


                                      {esInformacion && (
                                        <p className="mt-0.5 text-xs text-blue-700">
                                          Información importante
                                        </p>
                                      )}

                                    </div>

                                  </div>
                                );
                              }
                            )}

                          </div>

                        )}

                      </div>

                    </details>
                  );
                }
              )}

            </div>


            {seguimiento.duracionDias >
              7 && (

              <button
                type="button"
                onClick={() =>
                  setMostrarTodosCalendario(
                    (
                      actual
                    ) =>
                      !actual
                  )
                }
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-[#E1DCEB] bg-white px-4 py-3 text-sm font-bold text-brand-blue transition hover:bg-[#F8F6FF]"
              >
                {mostrarTodosCalendario
                  ? "Mostrar alrededor de hoy"
                  : `Ver los ${seguimiento.duracionDias} días`}
              </button>

            )}


            {!mostrarTodosCalendario &&
              seguimiento.duracionDias >
                7 && (

              <p className="mt-3 text-center text-xs leading-5 text-brand-gray">
                Mostrando los días más cercanos a tu día actual.
              </p>

            )}

          </section>
        )}


        {pestana ===
          "plan" && (

          <section className="mt-6">

            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
              Mi plan
            </p>

            <h2 className="mt-1 text-lg font-bold text-[#1F1B24]">
              Tu seguimiento
            </h2>


            <div className="mt-4 rounded-2xl border border-[#E9E4F2] bg-white p-5 shadow-sm">

              <p className="text-sm font-bold text-[#1F1B24]">
                {seguimiento.nombrePlan}
              </p>


              <div className="mt-4 grid grid-cols-2 gap-3">

                <div className="rounded-xl bg-[#F8F6FF] p-3">
                  <p className="text-xs text-brand-gray">
                    Duración
                  </p>

                  <p className="mt-1 text-lg font-bold text-brand-blue">
                    {seguimiento.duracionDias} días
                  </p>
                </div>


                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-700">
                    Progreso
                  </p>

                  <p className="mt-1 text-lg font-bold text-emerald-700">
                    {porcentajeGeneral}%
                  </p>
                </div>

              </div>


              <div className="mt-5">

                <div className="flex items-center justify-between text-xs font-semibold text-brand-gray">
                  <span>
                    Avance general
                  </span>

                  <span>
                    {totalCompletadas}/{totalTareas}
                  </span>
                </div>

                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#EEEAF5]">
                  <div
                    className="h-full rounded-full bg-brand-pink transition-all"
                    style={{
                      width:
                        `${porcentajeGeneral}%`,
                    }}
                  />
                </div>

              </div>


              <div className="mt-5 grid gap-3 border-t border-[#EEEAF5] pt-4 sm:grid-cols-2">

                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 shrink-0 text-brand-blue" />

                  <div>
                    <p className="text-xs text-brand-gray">
                      Fecha de inicio
                    </p>

                    <p className="text-sm font-semibold text-[#1F1B24]">
                      {formatearFecha(
                        seguimiento.fechaInicio
                      )}
                    </p>
                  </div>
                </div>


                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 shrink-0 text-brand-blue" />

                  <div>
                    <p className="text-xs text-brand-gray">
                      Día actual
                    </p>

                    <p className="text-sm font-semibold text-[#1F1B24]">
                      Día {diaActual} de {seguimiento.duracionDias}
                    </p>
                  </div>
                </div>

              </div>

            </div>


            <div className="mt-6">

              <div className="mb-3">

                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
                  Tu rutina
                </p>

                <h3 className="mt-1 text-lg font-bold text-[#1F1B24]">
                  Actividades de tu seguimiento
                </h3>

                <p className="mt-1 text-sm leading-6 text-brand-gray">
                  Toca cada sección para consultar sus instrucciones.
                </p>

              </div>


              <div className="space-y-3">

                {seguimiento.actividades
                  .slice()
                  .filter(
                    (actividad) =>
                      actividad.seccion === "PRINCIPAL" ||
                      (
                        actividad.diaFin ??
                        seguimiento.duracionDias
                      ) >= diaActual
                  )
                  .sort(ordenarActividadesPorSeccionYAgenda)
                  .map(
                    (actividad) => {

                      const esInformacion =
                        actividad.tipo ===
                        "INFORMACION";

                      const esAyunas =
                        actividad.momento ===
                          "Ayunas" ||
                        actividad.titulo ===
                          "Ayunas";

                      const descripcionPrincipal =
                        actividad.indicaciones.length >
                          0 &&
                        actividad.descripcion &&
                        actividad.descripcion.trim() !==
                          actividad.indicaciones
                            .map(
                              (indicacion) =>
                                indicacion.texto.trim()
                            )
                            .filter(Boolean)
                            .join("\n")
                            .trim()
                          ? actividad.descripcion.trim()
                          : null;


                      const instrucciones =
                        actividad.indicaciones.length > 0
                          ? actividad.indicaciones.map(
                              (indicacion) => ({
                                id:
                                  indicacion.id,

                                hora:
                                  indicacion.hora,

                                texto:
                                  indicacion.texto,
                              })
                            )
                          : actividad.descripcion
                            ? actividad.descripcion
                                .split(/\r?\n/)
                                .map(
                                  (
                                    linea,
                                    indice
                                  ) => ({
                                    id:
                                      `legacy-${indice}`,

                                    hora:
                                      null,

                                    texto:
                                      linea.trim(),
                                  })
                                )
                                .filter(
                                  (item) =>
                                    Boolean(
                                      item.texto
                                    )
                                )
                            : [];

                      return (
                        <details
                          key={
                            actividad.id
                          }
                          className={`group overflow-hidden rounded-2xl border shadow-sm ${
                            esInformacion
                              ? "border-blue-200 bg-blue-50/40"
                              : "border-[#E9E4F2] bg-white"
                          }`}
                        >

                          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                {actividad.hora ? (
                                  <span className="rounded-lg bg-[#F4F2F8] px-2.5 py-1 text-xs font-bold text-brand-blue">
                                    {actividad.hora}
                                  </span>
                                ) : esAyunas ? (
                                  <span className="rounded-lg bg-[#F4F2F8] px-2.5 py-1 text-xs font-semibold text-brand-blue">
                                    Sin hora fija
                                  </span>
                                ) : esInformacion ? (
                                  <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                                    Información
                                  </span>
                                ) : null}

                                {actividad.seccion === "ADICIONAL" && (
                                  <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
                                    Protocolo adicional
                                  </span>
                                )}

                              </div>


                              <p
                                className={`mt-2 font-bold ${
                                  esInformacion
                                    ? "text-blue-900"
                                    : "text-[#1F1B24]"
                                }`}
                              >
                                {actividad.titulo}
                              </p>

                            </div>


                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold transition group-open:rotate-45 ${
                                esInformacion
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-[#F8F6FF] text-brand-blue"
                              }`}
                            >
                              +
                            </div>

                          </summary>


                          <div className="border-t border-black/5 px-4 pb-4 pt-4">

                            {descripcionPrincipal && (

                              <div className="mb-4 rounded-xl bg-[#FAF9FC] px-3.5 py-3">

                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-gray">
                                  Instrucción principal
                                </p>

                                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-[#4F4B56]">
                                  {descripcionPrincipal}
                                </p>

                              </div>

                            )}


                            {instrucciones.length >
                            0 ? (

                              <ul className="space-y-2.5">

                                {instrucciones.map(
                                  (
                                    instruccion,
                                    indice
                                  ) => (
                                    <li
                                      key={`${actividad.id}-plan-${instruccion.id}`}
                                      className="flex items-start gap-2.5 text-sm leading-6 text-[#4F4B56]"
                                    >

                                      {instruccion.hora && (
                                        <span className="mt-0.5 min-w-[58px] shrink-0 rounded-lg bg-[#F4F2F8] px-2 py-1 text-center font-mono text-xs font-bold text-brand-blue">
                                          {
                                            instruccion.hora
                                          }
                                        </span>
                                      )}


                                      {esInformacion ? (
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                      ) : (
                                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F8F6FF] text-[11px] font-bold text-brand-blue">
                                          {indice + 1}
                                        </span>
                                      )}


                                      <span className="min-w-0 flex-1">
                                        {
                                          instruccion.texto
                                        }
                                      </span>

                                    </li>
                                  )
                                )}

                              </ul>

                            ) : (

                              <p className="text-sm text-brand-gray">
                                Sin instrucciones adicionales.
                              </p>

                            )}

                          </div>

                        </details>
                      );
                    }
                  )}

              </div>

            </div>


            <div className="mt-5 rounded-2xl border border-[#E9E4F2] bg-white p-4">

              <div className="flex items-start gap-3">

                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />

                <p className="text-xs leading-5 text-brand-gray">
                  Tu agenda es personal. Las actividades que ves corresponden al seguimiento preparado para ti por DioxiLife.
                </p>

              </div>

            </div>

          </section>
        )}


      </div>


      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E9E4F2] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">

        <div className="mx-auto grid max-w-md grid-cols-3">

          <BotonNavegacion
            activo={
              pestana ===
              "hoy"
            }
            texto="Hoy"
            icono={
              <Home className="h-5 w-5" />
            }
            onClick={() =>
              setPestana(
                "hoy"
              )
            }
          />

          <BotonNavegacion
            activo={
              pestana ===
              "calendario"
            }
            texto="Calendario"
            icono={
              <CalendarDays className="h-5 w-5" />
            }
            onClick={() => {
              setPestana(
                "calendario"
              );

              setDiaCalendarioAbierto(
                diaActual
              );
            }}
          />

          <BotonNavegacion
            activo={
              pestana ===
              "plan"
            }
            texto="Mi plan"
            icono={
              <ClipboardList className="h-5 w-5" />
            }
            onClick={() =>
              setPestana(
                "plan"
              )
            }
          />

        </div>
      </nav>

    </main>
  );
}


function BotonNavegacion({
  activo,
  texto,
  icono,
  onClick,
}: {
  activo: boolean;
  texto: string;
  icono: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-xs font-semibold transition ${
        activo
          ? "text-brand-pink"
          : "text-brand-gray"
      }`}
    >
      {icono}

      <span>
        {texto}
      </span>
    </button>
  );
}


function EstadoEspecial({
  titulo,
  descripcion,
  icono,
}: {
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F7FC] px-5 py-10">

      <div className="w-full max-w-md rounded-3xl border border-[#E9E4F2] bg-white p-7 text-center shadow-sm">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-[#E9E4F2] bg-white">
          <Image
            src="/logo.png"
            alt="DioxiLife Bolivia"
            width={80}
            height={66}
            className="h-auto w-16"
          />
        </div>

        <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8F6FF] text-brand-blue">
          {icono}
        </div>

        <h1 className="mt-4 text-xl font-bold text-[#1F1B24]">
          {titulo}
        </h1>

        <p className="mt-2 text-sm leading-6 text-brand-gray">
          {descripcion}
        </p>

      </div>
    </main>
  );
}
