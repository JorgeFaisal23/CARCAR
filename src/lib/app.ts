/**
 * Identidad del producto.
 *
 * CARCAR es el software. Es distinto de la marca que el arrendador configura
 * en /configuracion/marca: esa viste la interfaz (nombre, logo, color) y
 * cambia en cada instalación; esta es fija, igual para todos los clientes, y
 * por eso vive en código y no en la base de datos. Ningún formulario la edita.
 *
 * Regla de uso: lo que el inquilino ve como "quién le cobra" es la marca del
 * arrendador; lo que identifica "con qué software se lo cobran" es CARCAR, y
 * aparece solo en los márgenes (pie de página, metadatos, acerca de).
 */
export const APP = {
  name: "CARCAR",
  tagline: "Administración de rentas",
  description:
    "Plataforma para administrar arrendamientos, servicios, cobros y reservas de corta estancia.",
  /** Se mantiene a mano junto a la versión de package.json. */
  version: "0.1.0",
  url: "https://carcar.mx",
  /**
   * Color propio del producto. No sale de los tokens de marca a propósito: el
   * distintivo de CARCAR debe verse igual aunque el arrendador elija cualquier
   * color primario.
   */
  color: "#12263F",
} as const;

/** Texto corto para pies de página y menús: "CARCAR 0.1.0". */
export const APP_VERSION_LABEL = `${APP.name} ${APP.version}`;
