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
    descripcion: "Administra el catálogo de productos DioxiLife.",
    pasos: [
      {
        titulo: "Crear producto",
        texto: "Presiona Nuevo producto y completa nombre, categoría, precio e imagen.",
        ruta: "/admin/productos",
        boton: "Abrir Productos",
        consejo: "Verifica que la imagen, precio y datos principales estén completos.",
      },
      {
        titulo: "Agregar información",
        texto: "Añade beneficios, protocolos, aplicaciones y contenido adicional.",
      },
      {
        titulo: "Publicar producto",
        texto: "Activa el producto para que aparezca disponible en la tienda.",
      },
    ],
  },

  {
    ruta: "/admin/resenas",
    titulo: "⭐ Testimonios",
    descripcion: "Gestiona experiencias enviadas por clientes.",
    pasos: [
      {
        titulo: "Revisar pendientes",
        texto: "Verifica los testimonios antes de publicarlos.",
        ruta: "/admin/resenas",
        boton: "Abrir Testimonios",
        consejo: "Revisa que la experiencia sea real antes de aprobar.",
      },
      {
        titulo: "Aprobar experiencia",
        texto: "Aprueba testimonios reales de clientes.",
      },
      {
        titulo: "Destacar testimonio",
        texto: "Marca los mejores testimonios para mostrarlos en la portada.",
      },
    ],
  },

  {
    ruta: "/admin/pedidos",
    titulo: "🛒 Pedidos",
    descripcion: "Gestiona las compras realizadas por clientes.",
    pasos: [
      {
        titulo: "Revisar pedidos nuevos",
        texto: "Visualiza pedidos pendientes y solicitudes recientes.",
        ruta: "/admin/pedidos",
        boton: "Abrir Pedidos",
        consejo: "Confirma la información del cliente antes de actualizar estados.",
      },
      {
        titulo: "Ver detalle",
        texto: "Revisa productos, cliente, pago y observaciones.",
      },
      {
        titulo: "Actualizar estado",
        texto: "Realiza seguimiento hasta completar la entrega.",
      },
    ],
  },

  {
    ruta: "/admin/banner",
    titulo: "🖼 Banner",
    descripcion: "Administra imágenes principales y campañas.",
    pasos: [
      {
        titulo: "Crear banner",
        texto: "Sube una imagen promocional.",
        ruta: "/admin/banner",
        boton: "Abrir Banner",
        consejo: "Utiliza imágenes de buena calidad para mantener una presentación profesional.",
      },
      {
        titulo: "Configurar contenido",
        texto: "Define información y enlaces.",
      },
      {
        titulo: "Activar banner",
        texto: "Publica la campaña en la tienda.",
      },
    ],
  },

  {
    ruta: "/admin/categorias",
    titulo: "🏷 Categorías",
    descripcion: "Organiza los productos del catálogo.",
    pasos: [
      {
        titulo: "Crear categoría",
        texto: "Registra grupos para clasificar productos.",
        ruta: "/admin/categorias",
        boton: "Abrir Categorías",
        consejo: "Mantén categorías claras para facilitar la navegación del cliente.",
      },
      {
        titulo: "Ordenar",
        texto: "Define cómo aparecerán en la tienda.",
      },
      {
        titulo: "Relacionar productos",
        texto: "Asigna productos correctamente.",
      },
    ],
  },

  {
    ruta: "/admin/protocolos",
    titulo: "📄 Protocolos",
    descripcion: "Gestiona información de uso de productos.",
    pasos: [
      {
        titulo: "Seleccionar producto",
        texto: "Elige el producto asociado.",
      },
      {
        titulo: "Crear protocolo",
        texto: "Agrega instrucciones o recomendaciones.",
        ruta: "/admin/protocolos",
        boton: "Abrir Protocolos",
        consejo: "Revisa que la información sea clara antes de publicarla.",
      },
      {
        titulo: "Publicar",
        texto: "Verifica y muestra la información.",
      },
    ],
  },

  {
    ruta: "/admin/aplicaciones-cds",
    titulo: "🧪 Aplicaciones CDS",
    descripcion: "Administra información adicional relacionada con CDS.",
    pasos: [
      {
        titulo: "Crear contenido",
        texto: "Registra información organizada.",
        ruta: "/admin/aplicaciones-cds",
        boton: "Abrir Aplicaciones CDS",
        consejo: "Mantén actualizado el contenido informativo del producto.",
      },
      {
        titulo: "Revisar datos",
        texto: "Comprueba que la información sea correcta.",
      },
      {
        titulo: "Guardar cambios",
        texto: "Publica la información actualizada.",
      },
    ],
  },

  {
    ruta: "/admin/sucursales",
    titulo: "🏪 Sucursales",
    descripcion: "Gestiona puntos de atención y contacto.",
    pasos: [
      {
        titulo: "Registrar sucursal",
        texto: "Agrega departamento, dirección y datos.",
        ruta: "/admin/sucursales",
        boton: "Abrir Sucursales",
        consejo: "Verifica que teléfonos y direcciones estén actualizados.",
      },
      {
        titulo: "Agregar redes",
        texto: "Configura enlaces sociales.",
      },
      {
        titulo: "Activar",
        texto: "Habilita la información para clientes.",
      },
    ],
  },

  {
    ruta: "/admin/multinivel",
    titulo: "👥 Multinivel",
    descripcion: "Administra miembros, red y comisiones.",
    pasos: [
      {
        titulo: "Gestionar miembros",
        texto: "Revisa usuarios registrados.",
        ruta: "/admin/multinivel",
        boton: "Abrir Multinivel",
        consejo: "Administra la red verificando correctamente los datos.",
      },
      {
        titulo: "Consultar red",
        texto: "Visualiza estructura de referidos.",
      },
      {
        titulo: "Revisar comisiones",
        texto: "Analiza movimientos generados.",
      },
    ],
  },
];
