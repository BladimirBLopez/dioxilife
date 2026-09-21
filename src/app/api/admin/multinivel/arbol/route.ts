import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

type NodoRed = {
  id: string;
  nombres: string;
  codigoReferido: string;
  email: string;
  nivel: number;
  hijos: NodoRed[];
};


async function obtenerRed(
  id: string,
  nivel = 1,
  maxNivel = 3
): Promise<NodoRed[]> {

  if (nivel > maxNivel) {
    return [];
  }


  const hijos = await prisma.miembro.findMany({
    where: {
      patrocinadorId: id,
    },
    select: {
      id: true,
      nombres: true,
      codigoReferido: true,
      email: true,
    },
  });


  return Promise.all(
    hijos.map(async (hijo) => ({
      ...hijo,
      nivel,
      hijos: await obtenerRed(
        hijo.id,
        nivel + 1,
        maxNivel
      ),
    }))
  );
}


export async function GET(req: NextRequest) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }


  try {

    const id =
      req.nextUrl.searchParams.get("id");


    if (!id) {

      return NextResponse.json(
        {
          error: "Falta id del miembro",
        },
        {
          status: 400,
        }
      );

    }


    const miembro =
      await prisma.miembro.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          nombres: true,
          codigoReferido: true,
        },
      });


    if (!miembro) {

      return NextResponse.json(
        {
          error: "Miembro no encontrado",
        },
        {
          status: 404,
        }
      );

    }


    const red =
      await obtenerRed(id);


    return NextResponse.json({
      miembro,
      red,
    });


  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error: "Error interno",
      },
      {
        status: 500,
      }
    );

  }

}
