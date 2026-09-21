import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

async function generarCodigoReferido() {
  for (let intento = 0; intento < 10; intento++) {
    const codigo = randomBytes(4).toString("hex").toUpperCase();

    const existe = await prisma.miembro.findUnique({
      where: { codigoReferido: codigo },
      select: { id: true },
    });

    if (!existe) {
      return codigo;
    }
  }

  throw new Error("No se pudo generar un código de referido único");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const nombres = String(body.nombres || "").trim();
    const apellidos = String(body.apellidos || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const telefono = String(body.telefono || "").trim();
    const password = String(body.password || "");
    const ref = String(body.ref || "").trim().toUpperCase();

    if (!nombres || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, correo y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const miembroExistente = await prisma.miembro.findUnique({
      where: { email },
      select: { id: true },
    });

    if (miembroExistente) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este correo electrónico" },
        { status: 409 }
      );
    }

    let patrocinadorId: string | null = null;

    if (ref) {
      const patrocinador = await prisma.miembro.findUnique({
        where: { codigoReferido: ref },
        select: {
          id: true,
          estado: true,
        },
      });

      if (!patrocinador) {
        return NextResponse.json(
          { error: "El código de referido no existe" },
          { status: 400 }
        );
      }

      if (patrocinador.estado !== "ACTIVO") {
        return NextResponse.json(
          { error: "El patrocinador no se encuentra activo" },
          { status: 400 }
        );
      }

      patrocinadorId = patrocinador.id;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const codigoReferido = await generarCodigoReferido();

    const miembro = await prisma.miembro.create({
      data: {
        nombres,
        apellidos: apellidos || null,
        email,
        telefono: telefono || null,
        passwordHash,
        codigoReferido,
        patrocinadorId,
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
        codigoReferido: true,
        patrocinadorId: true,
        estado: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        mensaje: "Cuenta creada correctamente",
        miembro,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al registrar miembro:", error);

    return NextResponse.json(
      { error: "No se pudo crear la cuenta" },
      { status: 500 }
    );
  }
}
