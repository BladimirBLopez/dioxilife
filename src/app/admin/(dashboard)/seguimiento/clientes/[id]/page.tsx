export const dynamic = "force-dynamic";

import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerDiaSeguimiento } from "@/lib/seguimiento-publico";
import {
  indicadorComunicacion,
  tiempoRelativo,
  type NivelComunicacion,
} from "@/lib/seguimiento-estado";
import AgendaCliente from "@/components/admin/seguimiento/AgendaCliente";
import AccionesSeguimientoCliente from "@/components/admin/seguimiento/AccionesSeguimientoCliente";
import HistorialWhatsApp from "@/components/admin/seguimiento/HistorialWhatsApp";
import ResumenCumplimiento from "@/components/admin/seguimiento/ResumenCumplimiento";

function estiloEstado(estado: string) {
  switch (estado) {
    case "PENDIENTE":
      return "bg-amber-100 text-amber-700";

    case "ACTIVO":
      return "bg-green-100 text-green-700";

    case "PAUSADO":
      return "bg-orange-100 text-orange-700";

    case "COMPLETADO":
      return "bg-blue-100 text-blue-700";

    case "CANCELADO":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

const estiloNivel: Record<
  NivelComunicacion,
  { caja: string; punto: string }
> = {
  ok: {
    caja: "border-green-200 bg-green-50 text-green-900",
    punto: "bg-green-500",
  },
  aviso: {
    caja: "border-amber-200 bg-amber-50 text-amber-900",
    punto: "bg-amber-500",
  },
  alerta: {
    caja: "border-red-200 bg-red-50 text-red-900",
    punto: "bg-red-500",
  },
  neutro: {
    caja: "border-gray-200 bg-gray-50 text-gray-800",
    punto: "bg-gray-400",
  },
};

function nombreOrigen(origen: string) {
  switch (origen) {
    case "WHATSAPP":
      return "WhatsApp";
    case "LLAMADA":
      return "Llamada";
    case "TIENDA":
      return "Tienda";
    case "PEDIDO_WEB":
      return "Pedido web";
    default:
      return "Otro";
  }
}

function fechaCorta(valor: Date | null) {
  if (!valor) {
    return null;
  }

  return valor.toLocaleDateString("es-BO", {
    timeZone: "UTC",
  });
}

function Fila({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-gray-500">
        {etiqueta}
      </dt>

      <dd className="text-right text-sm font-medium text-gray-900">
        {children}
      </dd>
    </div>
  );
}

export default async function SeguimientoClientePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const seguimiento =
    await prisma.seguimientoCliente.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        nombreCliente: true,
        telefonoCliente: true,

        nombrePlan: true,
        duracionDias: true,

        estado: true,

        fechaInicioPrevista: true,
        fechaInicio: true,

        ultimoAccesoAt: true,
        observacionInterna: true,
        origen: true,
        referenciaCompra: true,

        enviosWhatsApp: {
          orderBy: {
            fechaEnvio: "desc",
          },

          select: {
            id: true,
            telefono: true,
            mensaje: true,
            fechaEnvio: true,
            enviadoPorUsuario: true,
          },

          take: 5,
        },

        pedido: {
          select: {
            id: true,
            codigo: true,
          },
        },

        actividades: {
          orderBy: [
            {
              diaInicio: "asc",
            },
            {
              orden: "asc",
            },
            {
              createdAt: "asc",
            },
          ],

          select: {
            id: true,
            tipo: true,
            recordatorio: true,
            titulo: true,
            descripcion: true,
            momento: true,
            hora: true,
            diaInicio: true,
            diaFin: true,
            orden: true,
            activo: true,

            _count: {
              select: {
                progresos: true,
              },
            },
          },
        },

        progresos: {
          where: {
            completado: true,
          },

          select: {
            id: true,
          },
        },
      },
    });

  if (!seguimiento) {
    notFound();
  }

  const ahora = new Date();

  const ultimoEnvio =
    seguimiento.enviosWhatsApp[0] || null;

  const indicador =
    indicadorComunicacion({
      estado: seguimiento.estado,
      ultimoAccesoAt:
        seguimiento.ultimoAccesoAt,
      ultimoEnvioAt:
        ultimoEnvio?.fechaEnvio || null,
      ahora,
    });

  const estilo =
    estiloNivel[indicador.nivel];

  const enCurso =
    (seguimiento.estado === "ACTIVO" ||
      seguimiento.estado === "PAUSADO") &&
    seguimiento.fechaInicio;

  const diaActual =
    seguimiento.estado === "COMPLETADO"
      ? seguimiento.duracionDias
      : enCurso
      ? Math.min(
          Math.max(
            obtenerDiaSeguimiento(
              seguimiento.fechaInicio as Date,
              ahora
            ),
            1
          ),
          seguimiento.duracionDias
        )
      : null;

  const porcentajeTiempo =
    diaActual
      ? Math.round(
          (diaActual /
            seguimiento.duracionDias) *
            100
        )
      : 0;

  const inicioReal =
    seguimiento.fechaInicio
      ? seguimiento.fechaInicio.toLocaleDateString(
          "es-BO",
          {
            timeZone: "America/La_Paz",
          }
        )
      : null;

  return (
    <div className="space-y-4">

      <div>

        <Link
          href="/admin/seguimiento/clientes"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Clientes
        </Link>


        <div className="mt-3 flex items-start justify-between gap-3">

          <div className="min-w-0">

            <h1 className="truncate text-2xl font-semibold text-gray-900">
              {seguimiento.nombreCliente ||
                "Cliente sin nombre"}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {seguimiento.nombrePlan} ·{" "}
              {seguimiento.duracionDias} días
            </p>

          </div>


          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${estiloEstado(
              seguimiento.estado
            )}`}
          >
            {seguimiento.estado}
          </span>

        </div>

      </div>


      <section className="space-y-4 rounded-xl bg-white p-4 shadow sm:p-5">

        <div
          className={`flex items-start gap-3 rounded-xl border p-3 ${estilo.caja}`}
        >

          <span
            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${estilo.punto}`}
          />

          <div>

            <p className="text-sm font-semibold">
              {indicador.titulo}
            </p>

            <p className="mt-0.5 text-xs opacity-90">
              {indicador.detalle}
            </p>

          </div>

        </div>


        <div className="grid grid-cols-3 gap-2 text-center">

          <div className="rounded-xl bg-gray-50 p-3">

            <p className="text-[11px] text-gray-500">
              Progreso
            </p>

            <p className="mt-1 text-sm font-bold text-gray-900">
              {diaActual
                ? `Día ${diaActual}/${seguimiento.duracionDias}`
                : "No iniciado"}
            </p>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{
                  width: `${porcentajeTiempo}%`,
                }}
              />
            </div>

          </div>


          <div className="rounded-xl bg-gray-50 p-3">

            <p className="text-[11px] text-gray-500">
              Último acceso
            </p>

            <p className="mt-1 text-sm font-bold text-gray-900">
              {tiempoRelativo(
                seguimiento.ultimoAccesoAt,
                ahora
              )}
            </p>

          </div>


          <div className="rounded-xl bg-gray-50 p-3">

            <p className="text-[11px] text-gray-500">
              Último WhatsApp
            </p>

            <p className="mt-1 text-sm font-bold text-gray-900">
              {tiempoRelativo(
                ultimoEnvio?.fechaEnvio || null,
                ahora
              )}
            </p>

          </div>

        </div>


        <AccionesSeguimientoCliente
          seguimientoId={seguimiento.id}
          tieneTelefono={Boolean(
            seguimiento.telefonoCliente
          )}
          haEnviado={Boolean(ultimoEnvio)}
        />

      </section>


      <ResumenCumplimiento
        seguimientoId={seguimiento.id}
        tieneTelefono={Boolean(
          seguimiento.telefonoCliente
        )}
      />


      <section className="rounded-xl bg-white px-4 py-2 shadow sm:px-5">

        <dl className="divide-y divide-gray-100">

          <Fila etiqueta="WhatsApp">
            {seguimiento.telefonoCliente ||
              "No registrado"}
          </Fila>

          <Fila etiqueta="Origen">
            {nombreOrigen(seguimiento.origen)}
          </Fila>

          {seguimiento.referenciaCompra && (
            <Fila etiqueta="Compra">
              {seguimiento.referenciaCompra}
            </Fila>
          )}

          {seguimiento.pedido && (
            <Fila etiqueta="Pedido">
              <Link
                href={`/admin/pedidos/${seguimiento.pedido.id}`}
                className="font-mono text-blue-600 hover:underline"
              >
                {seguimiento.pedido.codigo}
              </Link>
            </Fila>
          )}

          <Fila etiqueta="Inicio previsto">
            {fechaCorta(
              seguimiento.fechaInicioPrevista
            ) || "—"}
          </Fila>

          <Fila etiqueta="Inicio real">
            {inicioReal || "Sin iniciar"}
          </Fila>

        </dl>


        {seguimiento.observacionInterna && (
          <div className="mb-3 rounded-lg bg-amber-50 p-3">

            <p className="text-xs font-semibold text-amber-900">
              Nota interna
            </p>

            <p className="mt-1 whitespace-pre-wrap text-xs text-amber-800">
              {seguimiento.observacionInterna}
            </p>

          </div>
        )}

      </section>


      <HistorialWhatsApp
        envios={seguimiento.enviosWhatsApp}
      />


      <p className="px-1 text-xs text-gray-500">
        {seguimiento.actividades.length}{" "}
        actividades ·{" "}
        {seguimiento.progresos.length}{" "}
        registros completados
      </p>


      <AgendaCliente
        seguimientoId={seguimiento.id}
        duracionDias={seguimiento.duracionDias}
        estado={seguimiento.estado}
        diaActual={diaActual}
        actividades={seguimiento.actividades.map(
          (actividad) => ({
            id: actividad.id,
            tipo: actividad.tipo,
            recordatorio: actividad.recordatorio,
            titulo: actividad.titulo,
            descripcion: actividad.descripcion,
            momento: actividad.momento,
            hora: actividad.hora,
            diaInicio: actividad.diaInicio,
            diaFin: actividad.diaFin,
            orden: actividad.orden,
            activo: actividad.activo,
            cantidadProgresos:
              actividad._count.progresos,
          })
        )}
      />

    </div>
  );
}
