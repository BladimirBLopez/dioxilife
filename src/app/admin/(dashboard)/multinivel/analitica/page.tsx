export const dynamic =
  "force-dynamic";

import Link from "next/link";

import {
  ArrowLeft,
  BarChart3,
} from "lucide-react";

import {
  prisma,
} from "@/lib/prisma";

import MultinivelAnalytics from "@/components/admin/MultinivelAnalytics";


export default async function AnaliticaMultinivelPage() {

  const inicio30Dias =
    new Date();

  inicio30Dias.setHours(
    0,
    0,
    0,
    0
  );

  inicio30Dias.setDate(
    inicio30Dias.getDate() - 29
  );


  const [
    totalMiembros,
    miembrosActivos,

    volumenPagado,

    montoPendientes,
    montoAprobadas,
    montoPagadas,
    montoAnuladas,

    cantidadPendientes,
    cantidadAprobadas,
    cantidadPagadas,
    cantidadAnuladas,

    miembrosPeriodo,
  ] = await Promise.all([

    prisma.miembro.count(),

    prisma.miembro.count({
      where: {
        estado: "ACTIVO",
      },
    }),


    prisma.pedido.aggregate({
      where: {
        estado: {
          in: [
            "PAGADO",
            "COMPLETADO",
          ],
        },
      },

      _sum: {
        totalCV: true,
        totalPV: true,
      },
    }),


    prisma.comisionMultinivel.aggregate({
      where: {
        estado: "PENDIENTE",
      },

      _sum: {
        monto: true,
      },
    }),

    prisma.comisionMultinivel.aggregate({
      where: {
        estado: "APROBADA",
      },

      _sum: {
        monto: true,
      },
    }),

    prisma.comisionMultinivel.aggregate({
      where: {
        estado: "PAGADA",
      },

      _sum: {
        monto: true,
      },
    }),

    prisma.comisionMultinivel.aggregate({
      where: {
        estado: "ANULADA",
      },

      _sum: {
        monto: true,
      },
    }),


    prisma.comisionMultinivel.count({
      where: {
        estado: "PENDIENTE",
      },
    }),

    prisma.comisionMultinivel.count({
      where: {
        estado: "APROBADA",
      },
    }),

    prisma.comisionMultinivel.count({
      where: {
        estado: "PAGADA",
      },
    }),

    prisma.comisionMultinivel.count({
      where: {
        estado: "ANULADA",
      },
    }),


    prisma.miembro.findMany({
      where: {
        createdAt: {
          gte: inicio30Dias,
        },
      },

      select: {
        createdAt: true,
      },
    }),

  ]);


  const inactivos =
    totalMiembros -
    miembrosActivos;


  const mapaCrecimiento =
    new Map<
      string,
      {
        fecha: string;
        etiqueta: string;
        nuevos: number;
      }
    >();


  for (
    let indice = 0;
    indice < 30;
    indice++
  ) {
    const fecha =
      new Date(
        inicio30Dias
      );

    fecha.setDate(
      inicio30Dias.getDate() +
        indice
    );

    const clave =
      fecha
        .toISOString()
        .slice(0, 10);

    mapaCrecimiento.set(
      clave,
      {
        fecha:
          clave,

        etiqueta:
          fecha.toLocaleDateString(
            "es-BO",
            {
              day: "2-digit",
              month: "short",
            }
          ),

        nuevos:
          0,
      }
    );
  }


  for (
    const miembro of miembrosPeriodo
  ) {
    const clave =
      miembro.createdAt
        .toISOString()
        .slice(0, 10);

    const dia =
      mapaCrecimiento.get(
        clave
      );

    if (dia) {
      dia.nuevos += 1;
    }
  }


  const crecimiento = [
    ...mapaCrecimiento.values(),
  ];


  const estadosMiembros = [
    {
      estado:
        "ACTIVO",

      etiqueta:
        "Activos",

      total:
        miembrosActivos,
    },

    {
      estado:
        "NO_ACTIVOS",

      etiqueta:
        "No activos",

      total:
        inactivos,
    },
  ];


  const comisiones = [
    {
      estado:
        "PENDIENTE",

      etiqueta:
        "Pendientes",

      monto:
        Number(
          String(
            montoPendientes
              ._sum
              .monto ?? 0
          )
        ),

      cantidad:
        cantidadPendientes,
    },

    {
      estado:
        "APROBADA",

      etiqueta:
        "Aprobadas",

      monto:
        Number(
          String(
            montoAprobadas
              ._sum
              .monto ?? 0
          )
        ),

      cantidad:
        cantidadAprobadas,
    },

    {
      estado:
        "PAGADA",

      etiqueta:
        "Pagadas",

      monto:
        Number(
          String(
            montoPagadas
              ._sum
              .monto ?? 0
          )
        ),

      cantidad:
        cantidadPagadas,
    },

    {
      estado:
        "ANULADA",

      etiqueta:
        "Anuladas",

      monto:
        Number(
          String(
            montoAnuladas
              ._sum
              .monto ?? 0
          )
        ),

      cantidad:
        cantidadAnuladas,
    },
  ];


  const volumen = [
    {
      nombre:
        "CV",

      valor:
        Number(
          String(
            volumenPagado
              ._sum
              .totalCV ?? 0
          )
        ),
    },

    {
      nombre:
        "PV",

      valor:
        Number(
          String(
            volumenPagado
              ._sum
              .totalPV ?? 0
          )
        ),
    },
  ];


  return (
    <div className="mx-auto max-w-[1500px] space-y-6">

      <div>

        <Link
          href="/admin/multinivel"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Resumen multinivel
        </Link>


        <div className="mt-5 flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <BarChart3 className="h-5 w-5" />
          </div>

          <div>

            <p className="text-sm font-semibold text-blue-600">
              Inteligencia comercial
            </p>

            <h1 className="mt-0.5 text-2xl font-bold text-slate-900 md:text-3xl">
              Analítica multinivel
            </h1>

          </div>

        </div>


        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Análisis del crecimiento de la red, volumen generado y estado financiero de las comisiones.
        </p>

      </div>


      <MultinivelAnalytics
        crecimiento={crecimiento}
        estadosMiembros={estadosMiembros}
        comisiones={comisiones}
        volumen={volumen}
      />

    </div>
  );
}
