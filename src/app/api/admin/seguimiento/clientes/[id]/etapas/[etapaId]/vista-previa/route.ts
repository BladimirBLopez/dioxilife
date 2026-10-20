import { NextRequest, NextResponse } from "next/server";

import { obtenerAdminActual } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  crearHuellaRevisionEtapa,
  seleccionRevisionEtapa,
} from "@/lib/seguimiento-aprobacion-etapa";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Contexto = {
  params: Promise<{
    id: string;
    etapaId: string;
  }>;
};

function compararTexto(a: string, b: string) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Vista previa administrativa de una etapa.
 *
 * Se obtiene una sola version del contenido.
 *
 * La huella incluye tambien las actividades
 * desactivadas para detectar modificaciones.
 *
 * En pantalla se muestran solamente las
 * actividades e indicaciones activas.
 *
 * Esta ruta no aprueba ni publica etapas.
 */
export async function GET(
  _req: NextRequest,
  { params }: Contexto
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado." },
      {
        status: 401,
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  }

  const { id, etapaId } = await params;

  if (!id || !etapaId) {
    return NextResponse.json(
      { error: "Identificadores invalidos." },
      { status: 400 }
    );
  }

  const etapa = await prisma.etapaSeguimiento.findFirst({
    where: {
      id: etapaId,
      seguimientoId: id,
    },
    select: seleccionRevisionEtapa,
  });

  if (!etapa) {
    return NextResponse.json(
      { error: "Etapa no encontrada." },
      { status: 404 }
    );
  }

  /*
   * Se calcula la huella usando todo el
   * contenido recuperado, sin filtros.
   *
   * El endpoint de aprobacion vuelve a
   * calcularla antes de guardar.
   */
  const huellaRevision =
    crearHuellaRevisionEtapa(etapa);

  const actividades = etapa.actividades
    .filter((actividad) => actividad.activo)
    .map((actividad) => ({
      id: actividad.id,
      titulo: actividad.titulo,
      descripcion: actividad.descripcion,
      momento: actividad.momento,
      hora: actividad.hora,
      tipo: actividad.tipo,
      seccion: actividad.seccion,
      recordatorio: actividad.recordatorio,
      diaInicio: actividad.diaInicio,
      diaFin: actividad.diaFin,
      orden: actividad.orden,

      indicaciones: actividad.indicaciones
        .filter((indicacion) => indicacion.activo)
        .map((indicacion) => ({
          id: indicacion.id,
          hora: indicacion.hora,
          texto: indicacion.texto,
          orden: indicacion.orden,
        }))
        .sort(
          (a, b) =>
            a.orden - b.orden ||
            compararTexto(a.id, b.id)
        ),
    }))
    .sort(
      (a, b) =>
        compararTexto(
          a.hora ?? "",
          b.hora ?? ""
        ) ||
        a.orden - b.orden ||
        compararTexto(a.id, b.id)
    );

  return NextResponse.json(
    {
      etapa: {
        id: etapa.id,
        nombre: etapa.nombre,
        orden: etapa.orden,
        diaInicio: etapa.diaInicio,
        diaFin: etapa.diaFin,
        estado: etapa.estado,
        modoPublicacion: etapa.modoPublicacion,
        publicadaAt: etapa.publicadaAt,
        actividades,
      },

      totalActividades: actividades.length,

      // Identifica exactamente lo revisado.
      huellaRevision,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
