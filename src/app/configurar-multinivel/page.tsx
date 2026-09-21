"use client";

import { useState } from "react";

export default function ConfigurarMultinivelPage() {

  const [datos, setDatos] = useState({
    estructura: "",
    niveles: "",
    registro: "",
    ubicacion: "",
    arbol: "",
    comisiones: "",
    rangos: "",
    panel: "",
    reglas: ""
  });


  function cambiar(
    campo:string,
    valor:string
  ){
    setDatos({
      ...datos,
      [campo]: valor
    });
  }


  function enviar(){

    const mensaje = `
*REQUERIMIENTOS SISTEMA MULTINIVEL*

*Tipo de estructura:*
${datos.estructura}

*Niveles:*
${datos.niveles}

*Registro de usuarios:*
${datos.registro}

*Ubicación de nuevos miembros:*
${datos.ubicacion}

*Visualización del árbol:*
${datos.arbol}

*Sistema de comisiones:*
${datos.comisiones}

*Rangos:*
${datos.rangos}

*Panel del usuario:*
${datos.panel}

*Reglas especiales:*
${datos.reglas}
`;

    window.open(
      "https://wa.me/59169356292?text=" +
      encodeURIComponent(mensaje),
      "_blank"
    );

  }


  return (

    <main className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8">


        <h1 className="text-3xl font-bold text-center mb-3">
          Configuración del Sistema Multinivel
        </h1>


        <p className="text-gray-600 text-center mb-8">
          Defina cómo desea que funcione su plataforma antes del desarrollo.
        </p>



        <div className="space-y-8">



          <section>
            <h2 className="font-semibold text-xl mb-3">
              1. Tipo de estructura
            </h2>

            <textarea
              className="border rounded-lg p-3 w-full"
              placeholder="Ejemplo: multinivel por niveles, binario, matricial..."
              onChange={(e)=>cambiar("estructura",e.target.value)}
            />

          </section>




          <section>
            <h2 className="font-semibold text-xl mb-3">
              2. Niveles de la red
            </h2>

            <textarea
              className="border rounded-lg p-3 w-full"
              placeholder="Ejemplo: Nivel 1 10%, Nivel 2 5%, Nivel 3 3%"
              onChange={(e)=>cambiar("niveles",e.target.value)}
            />

          </section>




          <section>
            <h2 className="font-semibold text-xl mb-3">
              3. Registro de miembros
            </h2>

            <textarea
              className="border rounded-lg p-3 w-full"
              placeholder="¿Necesita código referido, enlace de invitación, aprobación?"
              onChange={(e)=>cambiar("registro",e.target.value)}
            />

          </section>




          <section>
            <h2 className="font-semibold text-xl mb-3">
              4. Ubicación de nuevos usuarios
            </h2>

            <textarea
              className="border rounded-lg p-3 w-full"
              placeholder="¿Automático debajo del patrocinador o asignación manual?"
              onChange={(e)=>cambiar("ubicacion",e.target.value)}
            />

          </section>




          <section>
            <h2 className="font-semibold text-xl mb-3">
              5. Árbol de red
            </h2>

            <textarea
              className="border rounded-lg p-3 w-full"
              placeholder="¿Qué información debe mostrar el árbol?"
              onChange={(e)=>cambiar("arbol",e.target.value)}
            />

          </section>




          <section>
            <h2 className="font-semibold text-xl mb-3">
              6. Comisiones y bonos
            </h2>

            <textarea
              className="border rounded-lg p-3 w-full"
              placeholder="Explique cómo desea calcular ganancias y bonos"
              onChange={(e)=>cambiar("comisiones",e.target.value)}
            />

          </section>




          <section>
            <h2 className="font-semibold text-xl mb-3">
              7. Rangos o niveles especiales
            </h2>

            <textarea
              className="border rounded-lg p-3 w-full"
              placeholder="Ejemplo: Bronce, Plata, Oro, Diamante..."
              onChange={(e)=>cambiar("rangos",e.target.value)}
            />

          </section>




          <section>
            <h2 className="font-semibold text-xl mb-3">
              8. Panel del usuario
            </h2>

            <textarea
              className="border rounded-lg p-3 w-full"
              placeholder="¿Qué desea que vea cada miembro?"
              onChange={(e)=>cambiar("panel",e.target.value)}
            />

          </section>




          <section>
            <h2 className="font-semibold text-xl mb-3">
              9. Reglas especiales del negocio
            </h2>

            <textarea
              className="border rounded-lg p-3 w-full h-32"
              placeholder="Describa cualquier regla adicional"
              onChange={(e)=>cambiar("reglas",e.target.value)}
            />

          </section>




          <button
            onClick={enviar}
            className="w-full bg-green-600 text-white rounded-lg p-4 font-semibold"
          >
            Enviar configuración por WhatsApp
          </button>



        </div>


      </div>

    </main>

  );

}
