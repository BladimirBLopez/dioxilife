import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarSesion } from "@/lib/auth";

async function sesionValida(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  const payload = await verificarSesion(token);
  return !!payload;
}

export async function GET(req: NextRequest) {
  if (!(await sesionValida(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resenas = await prisma.resena.findMany({
    include: { producto: { select: { nombre: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(resenas);
}
