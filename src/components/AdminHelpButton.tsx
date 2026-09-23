"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

const ayudas = [
  {
    ruta: "/admin/productos",
    titulo: "📦 Productos",
    texto:
      "Administra el catálogo DioxiLife. Puedes crear productos, editar información, precios, imágenes, promociones y contenido adicional.",
  },
  {
    ruta: "/admin/resenas",
    titulo: "⭐ Testimonios",
    texto:
      "Revisa experiencias de clientes, aprueba testimonios y marca los mejores como destacados para mostrarlos en la página principal.",
  },
  {
    ruta: "/admin/banner",
    titulo: "🖼 Banner",
    texto:
      "Gestiona imágenes principales, campañas y promociones visibles en la tienda.",
  },
  {
    ruta: "/admin/categorias",
    titulo: "🏷 Categorías",
    texto:
      "Organiza los productos por categorías para mejorar la navegación de clientes.",
  },
  {
    ruta: "/admin/sucursales",
    titulo: "🏪 Sucursales",
    texto:
      "Administra puntos de venta, direcciones y datos de contacto.",
  },
  {
    ruta: "/admin/multinivel",
    titulo: "👥 Multinivel",
    texto:
      "Gestiona miembros, estructura de red, rangos y comisiones del sistema.",
  },
];

export default function AdminHelpButton() {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  const actual =
    ayudas.find((a) => pathname.startsWith(a.ruta)) ||
    {
      titulo: "🌱 Panel DioxiLife",
      texto:
        "Aquí puedes administrar todas las funciones principales del negocio.",
    };

  const otros = ayudas.filter(
    (a) => a.titulo !== actual.titulo
  );

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-brand-pink text-white text-2xl shadow-lg hover:scale-105 transition"
        aria-label="Ayuda"
      >
        ?
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="bg-white w-full max-w-sm h-full p-6 overflow-y-auto">

            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-lg">
                🌱 Ayuda DioxiLife
              </h2>

              <button
                onClick={() => setAbierto(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>


            <div className="bg-brand-pink/10 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-500">
                Estás en:
              </p>

              <h3 className="font-semibold mt-1">
                {actual.titulo}
              </h3>

              <p className="text-sm text-gray-700 mt-3">
                {actual.texto}
              </p>
            </div>


            <h3 className="font-semibold text-sm mb-3">
              Otros módulos
            </h3>


            <div className="space-y-3">
              {otros.map((a) => (
                <div
                  key={a.titulo}
                  className="bg-gray-50 rounded-xl p-4"
                >
                  <h4 className="font-medium">
                    {a.titulo}
                  </h4>

                  <p className="text-sm text-gray-600 mt-1">
                    {a.texto}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
