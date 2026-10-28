import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { pruebasAlimentosHabilitadas } from "@/lib/pruebas-alimentos/activacion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;

  if (!secreto) {
    return NextResponse.json(
      { ok: false },
      { status: 401 }
    );
  }

  const recibido = Buffer.from(
    req.headers.get("authorization") ?? ""
  );

  const esperado = Buffer.from(`Bearer ${secreto}`);

  if (
    recibido.length !== esperado.length ||
    !timingSafeEqual(recibido, esperado)
  ) {
    return NextResponse.json(
      { ok: false },
      { status: 401 }
    );
  }

  if (
    !pruebasAlimentosHabilitadas() ||
    process.env.PRUEBAS_ALIMENTOS_PUSH_ACTIVO !== "true"
  ) {
    return NextResponse.json(
      { ok: false, mensaje: "Recordatorios desactivados" },
      { status: 503 }
    );
  }

  try {
    const { ejecutarRecordatoriosPush } = await import(
      "@/lib/pruebas-alimentos/procesar-recordatorios-push"
    );

    const resultado = await ejecutarRecordatoriosPush();

    return NextResponse.json({
      ok: resultado.fallidos === 0,
      ...resultado,
    });
  } catch {
    return NextResponse.json(
      { ok: false, mensaje: "Error de procesamiento" },
      { status: 503 }
    );
  }
}
