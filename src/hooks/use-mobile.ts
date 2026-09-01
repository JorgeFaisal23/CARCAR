import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Suscripción a la media query del ancho de pantalla.
 *
 * Se usa useSyncExternalStore en lugar de un efecto con setState: es la forma
 * idiomática de leer una fuente externa y evita el render en cascada.
 */
const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(query).matches;
}

/** En el servidor no hay ventana: asumimos escritorio. */
function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
