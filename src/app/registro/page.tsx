import {
  prisma,
} from "@/lib/prisma";

import RegistroForm from "./RegistroForm";


type Props = {
  searchParams: Promise<{
    ref?: string | string[];
  }>;
};


function nombrePersona(
  persona: {
    nombres: string;
    apellidos: string | null;
  }
) {
  return [
    persona.nombres,
    persona.apellidos,
  ]
    .filter(Boolean)
    .join(" ");
}


export default async function RegistroPage({
  searchParams,
}: Props) {

  const params =
    await searchParams;


  const codigoInicial =
    (
      Array.isArray(
        params.ref
      )
        ? params.ref[0]
        : params.ref || ""
    )
      .trim()
      .toUpperCase();


  let invitacionValida:
    boolean | undefined =
    undefined;

  let patrocinadorNombre =
    "";


  if (codigoInicial) {

    const patrocinador =
      await prisma.miembro.findUnique({
        where: {
          codigoReferido:
            codigoInicial,
        },

        select: {
          nombres: true,
          apellidos: true,
          estado: true,
        },
      });


    invitacionValida =
      patrocinador?.estado ===
      "ACTIVO";


    if (
      patrocinador &&
      invitacionValida
    ) {
      patrocinadorNombre =
        nombrePersona(
          patrocinador
        );
    }
  }


  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">

      <RegistroForm
        codigoInicial={
          codigoInicial
        }
        invitacionValida={
          invitacionValida
        }
        patrocinadorNombre={
          patrocinadorNombre
        }
      />

    </main>
  );
}
