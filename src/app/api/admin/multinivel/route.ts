import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

export async function GET() {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {

    const total = await prisma.miembro.count();

    const activos = await prisma.miembro.count({
      where:{
        estado:"ACTIVO"
      }
    });


    const miembros = await prisma.miembro.findMany({
      orderBy:{
        createdAt:"desc"
      },
      take:10,
      select:{
        id:true,
        nombres:true,
        apellidos:true,
        email:true,
        codigoReferido:true,
        estado:true,
        createdAt:true
      }
    });


    return NextResponse.json({
      total,
      activos,
      miembros
    });


  } catch(error){

    console.error(error);

    return NextResponse.json(
      {
        error:"Error interno"
      },
      {
        status:500
      }
    );
  }
}
