"use client";

import { useState } from "react";

export default function ConfigurarMultinivelPage() {

  const [empresa, setEmpresa] = useState("");
  const [contacto, setContacto] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [correo, setCorreo] = useState("");
  const [tipo, setTipo] = useState("");
  const [niveles, setNiveles] = useState<string[]>([]);
  const [funciones, setFunciones] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState("");


  function enviarWhatsApp(){

    const mensaje = `
*NUEVA SOLICITUD SISTEMA MULTINIVEL*

Empresa:
${empresa}

Contacto:
${contacto}

WhatsApp:
${whatsapp}

Correo:
${correo}

Tipo de multinivel:
${tipo}

Niveles:
${niveles.join(", ")}

Funciones requeridas:
${funciones.join(", ")}

Observaciones:
${observaciones}
    `;


    const url =
      "https://wa.me/59169356292?text=" +
      encodeURIComponent(mensaje);


    window.open(url, "_blank");

  }



  function cambiarLista(
    valor:string,
    lista:string[],
    setLista:any
  ){

    if(lista.includes(valor)){
      setLista(
        lista.filter((x)=>x!==valor)
      );
    }else{
      setLista([
        ...lista,
        valor
      ]);
    }

  }



  return (
    <main className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8">


        <h1 className="text-3xl font-bold text-center mb-3">
          Diseñemos tu Sistema Multinivel
        </h1>


        <p className="text-gray-600 text-center mb-8">
          Cuéntanos cómo deseas que funcione tu modelo de negocio.
        </p>



        <div className="space-y-6">


          <input
            className="border rounded-lg p-3 w-full"
            placeholder="Nombre de empresa"
            value={empresa}
            onChange={(e)=>setEmpresa(e.target.value)}
          />


          <input
            className="border rounded-lg p-3 w-full"
            placeholder="Persona de contacto"
            value={contacto}
            onChange={(e)=>setContacto(e.target.value)}
          />


          <input
            className="border rounded-lg p-3 w-full"
            placeholder="WhatsApp"
            value={whatsapp}
            onChange={(e)=>setWhatsapp(e.target.value)}
          />


          <input
            className="border rounded-lg p-3 w-full"
            placeholder="Correo electrónico"
            value={correo}
            onChange={(e)=>setCorreo(e.target.value)}
          />



          <section>

            <h2 className="font-semibold mb-3">
              Tipo de multinivel
            </h2>

            {[
              "Un nivel",
              "Multinivel por niveles",
              "Binario",
              "Matricial"
            ].map((x)=>(

              <label
                key={x}
                className="block mb-2"
              >

                <input
                  type="radio"
                  name="tipo"
                  className="mr-2"
                  onChange={()=>setTipo(x)}
                />

                {x}

              </label>

            ))}

          </section>




          <section>

            <h2 className="font-semibold mb-3">
              Cantidad de niveles
            </h2>

            {[
              "1 nivel",
              "3 niveles",
              "5 niveles",
              "Ilimitado"
            ].map((x)=>(

              <label
                key={x}
                className="block mb-2"
              >

                <input
                  type="checkbox"
                  className="mr-2"
                  onChange={()=>
                    cambiarLista(
                      x,
                      niveles,
                      setNiveles
                    )
                  }
                />

                {x}

              </label>

            ))}

          </section>




          <section>

            <h2 className="font-semibold mb-3">
              Funciones necesarias
            </h2>


            {[
              "Árbol de red",
              "Código de referido",
              "Comisiones",
              "Bonos",
              "Panel administrativo",
              "Historial de pagos"
            ].map((x)=>(

              <label
                key={x}
                className="block mb-2"
              >

                <input
                  type="checkbox"
                  className="mr-2"
                  onChange={()=>
                    cambiarLista(
                      x,
                      funciones,
                      setFunciones
                    )
                  }
                />

                {x}

              </label>

            ))}

          </section>




          <textarea
            className="border rounded-lg p-3 w-full h-32"
            placeholder="Observaciones"
            value={observaciones}
            onChange={(e)=>setObservaciones(e.target.value)}
          />



          <button
            onClick={enviarWhatsApp}
            className="w-full bg-green-600 text-white rounded-lg p-3 font-semibold"
          >
            Enviar información por WhatsApp
          </button>


        </div>


      </div>

    </main>
  );
}
