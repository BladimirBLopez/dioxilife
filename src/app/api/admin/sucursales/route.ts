import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sucursales = await prisma.sucursal.findMany({
    orderBy: { departamento: "asc" },
  });
  return NextResponse.json(sucursales);
}

export async function POST(req: NextRequest) {
  const data = await req.json();

  if (!data.departamento) {
    return NextResponse.json(
      { error: "Departamento requerido" },
      { status: 400 }
    );
  }

  const sucursal = await prisma.sucursal.create({ data });
  return NextResponse.json(sucursal);
}
