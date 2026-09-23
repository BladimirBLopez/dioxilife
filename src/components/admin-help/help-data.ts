export type PasoAyuda = {
  titulo: string;
  texto: string;
  ruta?: string;
  boton?: string;
  consejo?: string;
  imagen?: string;
  video?: string;
};

export type AyudaModulo = {
  ruta: string;
  titulo: string;
  descripcion: string;
  pasos: PasoAyuda[];
};

export const ayudas: AyudaModulo[] = [
  {
    ruta: "/admin/productos",
    titulo: "📦 Productos",
    descripcion:
      "Administra el catálogo de productos DioxiLife.",
    pasos: [
      {
        titulo: "Crear producto",
        texto:
          "Registra un nuevo producto completando nombre, categoría, precio e imagen.",
        ruta: "/admin/productos",
        boton: "Abrir Productos",
        consejo:
          "Verifica que los datos principales estén completos antes de guardar.",
      },
      {
        titulo: "Agregar información",
        texto:
          "Añade beneficios, protocolos, aplicaciones y contenido adicional del producto.",
        ruta: "/admin/productos",
        boton: "Abrir Productos",
        consejo:
          "Mantén organizada la información para facilitar la decisión del cliente.",
      },
      {
        titulo: "Publicar producto",
        texto:
          "Activa el producto para que aparezca disponible en la tienda.",
        ruta: "/admin/productos",
        boton: "Abrir Productos",
        consejo:
          "Revisa toda la información antes de activar la publicación.",
      },
    ],
  },

  {
    ruta: "/admin/resenas",
    titulo: "⭐ Testimonios",
    descripcion:
      "Gestiona experiencias enviadas por clientes.",
    pasos: [
      {
        titulo: "Revisar pendientes",
        texto:
          "Verifica los testimonios enviados por clientes antes de publicarlos.",
        ruta: "/admin/resenas",
        boton: "Abrir Testimonios",
        consejo:
          "Comprueba que el contenido sea adecuado antes de aprobar.",
      },
      {
        titulo: "Aprobar experiencia",
        texto:
          "Publica testimonios revisados para que aparezcan en la tienda.",
        ruta: "/admin/resenas",
        boton: "Abrir Testimonios",
        consejo:
          "Aprueba experiencias completas y claras.",
      },
      {
        titulo: "Destacar testimonio",
        texto:
          "Selecciona experiencias importantes para mostrarlas en la página principal.",
        ruta: "/admin/resenas",
        boton: "Abrir Testimonios",
        consejo:
          "Utiliza destacados para mostrar opiniones relevantes.",
      },
    ],
  },

  {
    ruta: "/admin/pedidos",
    titulo: "🛒 Pedidos",
    descripcion:
      "Gestiona las compras realizadas por clientes.",
    pasos: [
      {
        titulo: "Revisar pedidos nuevos",
        texto:
          "Visualiza solicitudes recientes realizadas por clientes y revisa la información principal.",
        ruta: "/admin/pedidos",
        boton: "Abrir Pedidos",
        consejo:
          "Confirma los datos del cliente antes de cambiar estados.",
      },
      {
        titulo: "Ver detalle del pedido",
        texto:
          "Consulta productos, cantidades, cliente, pago y observaciones.",
        ruta: "/admin/pedidos",
        boton: "Abrir Pedidos",
        consejo:
          "Verifica que los datos del pedido sean correctos.",
      },
      {
        titulo: "Actualizar estado",
        texto:
          "Realiza seguimiento del pedido hasta completar la entrega.",
        ruta: "/admin/pedidos",
        boton: "Abrir Pedidos",
        consejo:
          "Mantén actualizado el estado para mejorar el seguimiento.",
      },
    ],
  },

  {
    ruta: "/admin/banner",
    titulo: "🖼 Banner",
    descripcion:
      "Administra imágenes principales y campañas visibles en la tienda.",
    pasos: [
      {
        titulo: "Crear banner",
        texto:
          "Agrega una nueva imagen promocional para la página principal.",
        ruta: "/admin/banner",
        boton: "Abrir Banner",
        consejo:
          "Utiliza imágenes claras y adaptadas a la identidad visual de DioxiLife.",
      },
      {
        titulo: "Configurar contenido",
        texto:
          "Define información, enlaces y elementos relacionados con la campaña.",
        ruta: "/admin/banner",
        boton: "Abrir Banner",
        consejo:
          "Verifica que la información corresponda a la promoción activa.",
      },
      {
        titulo: "Activar banner",
        texto:
          "Habilita el banner para mostrarlo en la tienda.",
        ruta: "/admin/banner",
        boton: "Abrir Banner",
        consejo:
          "Revisa la presentación antes de publicarlo.",
      },
    ],
  },

  {
    ruta: "/admin/categorias",
    titulo: "🏷 Categorías",
    descripcion:
      "Organiza los productos para mejorar la navegación.",
    pasos: [
      {
        titulo: "Crear categoría",
        texto:
          "Registra nuevas categorías para clasificar productos.",
        ruta: "/admin/categorias",
        boton: "Abrir Categorías",
        consejo:
          "Utiliza nombres claros para facilitar la búsqueda.",
      },
      {
        titulo: "Organizar productos",
        texto:
          "Asocia productos a sus categorías correspondientes.",
        ruta: "/admin/categorias",
        boton: "Abrir Categorías",
        consejo:
          "Mantén una estructura ordenada del catálogo.",
      },
      {
        titulo: "Actualizar categorías",
        texto:
          "Modifica información cuando cambien las necesidades del catálogo.",
        ruta: "/admin/categorias",
        boton: "Abrir Categorías",
        consejo:
          "Evita crear categorías duplicadas.",
      },
    ],
  },

  {
    ruta: "/admin/protocolos",
    titulo: "📄 Protocolos",
    descripcion:
      "Administra información complementaria de productos.",
    pasos: [
      {
        titulo: "Crear protocolo",
        texto:
          "Registra recomendaciones e información relacionada al producto.",
        ruta: "/admin/protocolos",
        boton: "Abrir Protocolos",
        consejo:
          "Mantén la información clara y organizada.",
      },
      {
        titulo: "Revisar contenido",
        texto:
          "Verifica que la información sea correcta antes de publicarla.",
        ruta: "/admin/protocolos",
        boton: "Abrir Protocolos",
        consejo:
          "Actualiza los datos cuando sea necesario.",
      },
      {
        titulo: "Publicar protocolo",
        texto:
          "Activa la información para que sea visible.",
        ruta: "/admin/protocolos",
        boton: "Abrir Protocolos",
        consejo:
          "Comprueba la visualización final.",
      },
    ],
  },


  {
    ruta: "/admin/aplicaciones-cds",
    titulo: "🧪 Aplicaciones CDS",
    descripcion:
      "Administra información adicional relacionada con aplicaciones CDS.",
    pasos: [
      {
        titulo: "Crear información",
        texto:
          "Registra contenido organizado sobre aplicaciones relacionadas al producto.",
        ruta: "/admin/aplicaciones-cds",
        boton: "Abrir Aplicaciones CDS",
        consejo:
          "Mantén la información clara y estructurada.",
      },
      {
        titulo: "Revisar datos",
        texto:
          "Verifica que el contenido registrado sea correcto y comprensible.",
        ruta: "/admin/aplicaciones-cds",
        boton: "Abrir Aplicaciones CDS",
        consejo:
          "Actualiza la información cuando sea necesario.",
      },
      {
        titulo: "Guardar cambios",
        texto:
          "Publica la información actualizada dentro del sistema.",
        ruta: "/admin/aplicaciones-cds",
        boton: "Abrir Aplicaciones CDS",
        consejo:
          "Comprueba el resultado antes de finalizar.",
      },
    ],
  },

  {
    ruta: "/admin/sucursales",
    titulo: "🏪 Sucursales",
    descripcion:
      "Gestiona puntos de atención y datos de contacto.",
    pasos: [
      {
        titulo: "Registrar sucursal",
        texto:
          "Agrega departamento, dirección y datos principales.",
        ruta: "/admin/sucursales",
        boton: "Abrir Sucursales",
        consejo:
          "Mantén actualizada la información de ubicación.",
      },
      {
        titulo: "Agregar contactos",
        texto:
          "Configura teléfonos y medios de comunicación disponibles.",
        ruta: "/admin/sucursales",
        boton: "Abrir Sucursales",
        consejo:
          "Verifica que los datos permitan contacto con clientes.",
      },
      {
        titulo: "Activar sucursal",
        texto:
          "Habilita la información para mostrarla en la tienda.",
        ruta: "/admin/sucursales",
        boton: "Abrir Sucursales",
        consejo:
          "Confirma que toda la información sea correcta.",
      },
    ],
  },

  {
    ruta: "/admin/multinivel",
    titulo: "👥 Multinivel",
    descripcion:
      "Administra miembros, red, analítica y comisiones.",
    pasos: [
      {
        titulo: "Gestionar miembros",
        texto:
          "Revisa usuarios registrados, estados y datos principales.",
        ruta: "/admin/multinivel/miembros",
        boton: "Abrir Miembros",
        consejo:
          "Verifica los datos antes de modificar información.",
      },
      {
        titulo: "Consultar red",
        texto:
          "Visualiza la estructura de referidos y relaciones.",
        ruta: "/admin/multinivel/red",
        boton: "Abrir Red",
        consejo:
          "Utiliza la estructura para revisar conexiones.",
      },
      {
        titulo: "Revisar comisiones",
        texto:
          "Analiza movimientos y cálculos generados.",
        ruta: "/admin/multinivel/comisiones",
        boton: "Abrir Comisiones",
        consejo:
          "Revisa los movimientos antes de realizar acciones administrativas.",
      },
      {
        titulo: "Analítica del sistema",
        texto:
          "Consulta métricas generales del sistema multinivel.",
        ruta: "/admin/multinivel/analitica",
        boton: "Abrir Analítica",
        consejo:
          "Utiliza la información para seguimiento y control.",
      },
    ],
  },
];
