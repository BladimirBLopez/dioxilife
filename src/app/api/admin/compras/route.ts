
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerAdminActual } from "@/lib/admin-auth";

function codigoCompra() {
  return (
    "CMP-" +
    Date.now()
      .toString()
      .slice(-8)
  );
}

export async function GET() {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const compras =
    await prisma.compra.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        proveedor: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

  return NextResponse.json(compras);
}


export async function POST(
  req: NextRequest
) {
  const admin = await obtenerAdminActual();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const body = await req.json();

  if (
    !body.proveedorId ||
    !Array.isArray(body.detalles) ||
    body.detalles.length === 0
  ) {
    return NextResponse.json(
      {
        error:
          "Proveedor y productos requeridos",
      },
      { status: 400 }
    );
  }

  try {

    const resultado =
      await prisma.$transaction(
        async (tx) => {

          let total = 0;

          const detallesPreparados = [];

          for (
            const item of body.detalles
          ) {

            const cantidad =
              Number(item.cantidad);

            const costo =
              Number(item.costoUnitario);


            if (
              !Number.isInteger(cantidad) ||
              cantidad <= 0 ||
              !Number.isFinite(costo) ||
              costo < 0
            ) {
              throw new Error(
                "DETALLE_INVALIDO"
              );
            }


            const producto =
              await tx.producto.findUnique({
                where:{
                  id:item.productoId
                },
                select:{
                  id:true,
                  stockActual:true
                }
              });


            if(!producto){
              throw new Error(
                "PRODUCTO_NO_EXISTE"
              );
            }


            const subtotal =
              cantidad * costo;

            total += subtotal;


            await tx.producto.update({
              where:{
                id:producto.id
              },
              data:{
                stockActual:{
                  increment:cantidad
                }
              }
            });


            detallesPreparados.push({
              productoId: producto.id,
              cantidad,
              costoUnitario:costo,
              subtotal
            });
          }


          const compra =
            await tx.compra.create({
              data:{
                codigo:codigoCompra(),
                proveedorId:
                  body.proveedorId,
                total,

                detalles:{
                  create:
                    detallesPreparados
                }
              }
            });


          for(
            const detalle of detallesPreparados
          ){

            const producto =
              await tx.producto.findUnique({
                where:{
                  id:
                  detalle.productoId
                },
                select:{
                  stockActual:true,
                  nombre:true
                }
              });


            if(producto){

              await tx.movimientoInventario.create({
                data:{
                  productoId:
                    detalle.productoId,
                  tipo:"ENTRADA",
                  cantidad:
                    detalle.cantidad,
                  stockAnterior:
                    producto.stockActual -
                    detalle.cantidad,
                  stockNuevo:
                    producto.stockActual,
                  motivo:
                    `Compra ${compra.codigo}`,
                  compraId:
                    compra.id,
                  adminId:
                    admin.id
                }
              });

            }
          }


          return compra;
        }
      );


    return NextResponse.json(resultado);

  } catch(error){

    return NextResponse.json(
      {
        error:
          error instanceof Error
          ? error.message
          : "Error al registrar compra"
      },
      {
        status:400
      }
    );
  }
}
