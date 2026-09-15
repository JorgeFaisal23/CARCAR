/**
 * Identidad del producto SaaS (Marca Blanca).
 *
 * "RentaCore" es un PLACEHOLDER temporal para el producto SaaS multinquilino
 * (el nombre comercial definitivo se acordará antes del lanzamiento al mercado).
 *
 * CARCAR NO ES EL SOFTWARE: CARCAR es nuestro CLIENTE BETA / FUNDADOR.
 * La marca de CARCAR (su logo, colores, edificios y contratos) vive en la base
 * de datos dentro de la tabla `Organization`.
 *
 * Regla de arquitectura:
 * - El producto SaaS (RentaCore) aparece en los márgenes técnicos (pie de página,
 *   metadatos de aplicación, favicon por defecto).
 * - La marca del cliente arrendador (CARCAR o cualquier otro futuro cliente)
 *   viste toda la interfaz operativa.
 */
export const APP = {
  name: "RentaCore", // Placeholder de la plataforma SaaS
  tagline: "Plataforma de gestión de rentas",
  description:
    "Plataforma multi-empresa para administrar arrendamientos, servicios, cobros y reservas de corta estancia.",
  /** Se mantiene a mano junto a la versión de package.json. */
  version: "0.1.0",
  url: "https://rentacore.app",
  /**
   * Color neutro propio del producto.
   */
  color: "#12263F",
} as const;

/** Texto corto para pies de página y menús: "CARCAR 0.1.0". */
export const APP_VERSION_LABEL = `${APP.name} ${APP.version}`;
