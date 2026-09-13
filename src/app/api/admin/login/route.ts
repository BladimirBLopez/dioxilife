import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { crearSesion } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { usuario, password } = await req.json();

  if (!usuario || !password) {
    return NextResponse.json(
      { error: "Usuario y contraseña requeridos" },
      { status: 400 }
    );
  }

  const admin = await prisma.admin.findUnique({ where: { usuario } });

  if (!admin) {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 }
    );
  }

  const passwordOk = await bcrypt.compare(password, admin.passwordHash);

  if (!passwordOk) {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 }
    );
  }

  const token = await crearSesion(admin.usuario);

  const response = NextResponse.json({ ok: true });
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
