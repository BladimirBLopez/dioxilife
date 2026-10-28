import { NextRequest, NextResponse } from "next/server";
import { pruebasAlimentosHabilitadas } from
  "@/lib/pruebas-alimentos/activacion";
import { z } from "zod";
import { obtenerClientePilotoPush } from
  "@/lib/pruebas-alimentos/piloto-push";
import { resolverClientePruebaPorToken } from
  "@/lib/pruebas-alimentos/autorizar-acceso";
import { evaluarAccesoPublicoPrueba } from
  "@/lib/pruebas-alimentos/puerta-publica";
import { obtenerIpVerificadaVercel } from
  "@/lib/pruebas-alimentos/ip-verificada";
import { consumidorCuotaDesdeEntorno } from
  "@/lib/pruebas-alimentos/contador-upstash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Contexto = {
  params: Promise<{ token: string }>;
};

const endpointSchema = z.string().url().max(2048)
  .refine(valor => {
    try {
      const u = new URL(valor);
      const h = u.hostname.toLowerCase();
      return u.protocol === "https:" &&
        !u.username && !u.password &&
        (!u.port || u.port === "443") &&
        (
          h === "fcm.googleapis.com" ||
          h === "web.push.apple.com" ||
          h.endsWith(".push.services.mozilla.com") ||
          h.endsWith(".notify.windows.com")
        );
    } catch {
      return false;
    }
  });

const guardarSchema = z.strictObject({
  endpoint: endpointSchema,
  keys: z.strictObject({
    p256dh: z.string().regex(/^[A-Za-z0-9_-]{80,120}$/),
    auth: z.string().regex(/^[A-Za-z0-9_-]{18,60}$/),
  }),
});

const revocarSchema = z.strictObject({
  endpoint: endpointSchema,
});

function pushHabilitado() {
  return (
    Boolean(obtenerClientePilotoPush()) &&
    pruebasAlimentosHabilitadas() &&
    process.env.PRUEBAS_ALIMENTOS_PUSH_ACTIVO === "true" &&
    Boolean(process.env.VAPID_PRIVATE_KEY) &&
    Boolean(process.env.VAPID_SUBJECT)
  );
}

function responder(status: number, mensaje: string) {
  return NextResponse.json(
    { ok: false, mensaje },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    }
  );
}

async function procesar(
  req: NextRequest,
  contexto: Contexto,
  modo: "guardar" | "revocar"
) {
  // No se activa antes de aprobar las tablas en Neon.
  if (!pushHabilitado()) {
    return responder(503, "Recordatorios no habilitados.");
  }

  if (
    req.headers.get("origin") !==
    new URL(req.url).origin
  ) {
    return responder(403, "Origen no autorizado.");
  }

  if (
    !req.headers.get("content-type")
      ?.startsWith("application/json")
  ) {
    return responder(415, "Formato no admitido.");
  }

  const { token } = await contexto.params;

  if (!/^[0-9a-f]{64}$/.test(token)) {
    return responder(404, "Acceso no disponible.");
  }

  const secretoTexto =
    process.env.PRUEBAS_ALIMENTOS_HMAC_SECRET ?? "";

  const secreto = /^[0-9a-f]{64}$/i.test(secretoTexto)
    ? Buffer.from(secretoTexto, "hex")
    : null;

  const resultado = await evaluarAccesoPublicoPrueba({
    token,
    ipVerificada: obtenerIpVerificadaVercel(req),
    secreto,
    consumirCuota: consumidorCuotaDesdeEntorno(),
    buscarPorHash: async hash => {
      const { buscarClientePorHash } = await import(
        "@/lib/pruebas-alimentos/buscador-cliente-prisma"
      );
      return buscarClientePorHash(hash);
    },
  });

  if (!resultado.autorizado) {
    return responder(
      resultado.motivo === "limite" ? 429 : 404,
      "Acceso no disponible."
    );
  }

  if (
    resultado.cliente.id !== obtenerClientePilotoPush()
  ) {
    return responder(404, "Acceso no disponible.");
  }

  try {
    const cuerpo = await req.text();

    if (cuerpo.length > 8192) {
      return responder(413, "Solicitud demasiado grande.");
    }

    const entrada: unknown = JSON.parse(cuerpo);

    if (modo === "guardar") {
      const datos = guardarSchema.safeParse(entrada);

      if (!datos.success) {
        return responder(400, "Suscripción no válida.");
      }

      const { registrarSuscripcionPush } = await import(
        "@/lib/pruebas-alimentos/suscripciones-push-servidor"
      );

      await registrarSuscripcionPush(
        resultado.cliente.id,
        datos.data
      );
    } else {
      const datos = revocarSchema.safeParse(entrada);

      if (!datos.success) {
        return responder(400, "Suscripción no válida.");
      }

      const { revocarSuscripcionPush } = await import(
        "@/lib/pruebas-alimentos/suscripciones-push-servidor"
      );

      await revocarSuscripcionPush(
        resultado.cliente.id,
        datos.data.endpoint
      );
    }

    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return responder(503, "Servicio no disponible.");
  }
}

export async function POST(
  req: NextRequest,
  ctx: Contexto
) {
  return procesar(req, ctx, "guardar");
}

export async function DELETE(
  req: NextRequest,
  ctx: Contexto
) {
  return procesar(req, ctx, "revocar");
}


/**
 * Solo informa si el servicio está habilitado.
 * No consulta datos privados ni la base de datos.
 */
export async function GET(
  _req: NextRequest,
  ctx: Contexto
) {
  const { token } = await ctx.params;

  if (!/^[0-9a-f]{64}$/.test(token)) {
    return responder(404, "Acceso no disponible.");
  }

  const clave =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

  let habilitado = false;

  if (
    pushHabilitado() &&
    /^[A-Za-z0-9_-]{86,88}$/.test(clave)
  ) {
    try {
      const { buscarClientePorHash } = await import(
        "@/lib/pruebas-alimentos/buscador-cliente-prisma"
      );

      const cliente = await resolverClientePruebaPorToken(
        token,
        buscarClientePorHash
      );

      habilitado =
        cliente !== null &&
        cliente.id === obtenerClientePilotoPush();
    } catch {
      habilitado = false;
    }
  }

  return NextResponse.json(
    {
      habilitado,
      ...(habilitado ? { clavePublica: clave } : {}),
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    }
  );
}
