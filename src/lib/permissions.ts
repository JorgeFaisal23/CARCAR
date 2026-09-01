import type { Role } from "@/lib/auth/jwt";

/**
 * Reglas de acceso en un solo lugar. El middleware las usa para bloquear rutas
 * y la UI para ocultar acciones; ambas leen de aquí para que nunca se
 * contradigan.
 */

/** Rutas del panel administrativo a las que el rol VIEWER (solo lectura) puede entrar. */
export const VIEWER_ALLOWED_PREFIXES = ["/dashboard", "/calendario"];

export function isTenant(role: Role) {
  return role === "TENANT";
}

/** Puede modificar datos (altas, ediciones, capturas de montos). */
export function canEdit(role: Role) {
  return role === "OWNER" || role === "ADMIN";
}

/** Solo el arrendador administra la marca, el plan y el equipo. */
export function canManageOrganization(role: Role) {
  return role === "OWNER";
}

/** Puede entrar al panel administrativo (cualquier cosa que no sea el portal). */
export function canAccessDashboard(role: Role) {
  return role !== "TENANT";
}

/** Decide si un rol puede abrir una ruta concreta del panel. */
export function canAccessPath(role: Role, pathname: string) {
  if (role === "TENANT") return pathname.startsWith("/portal");
  if (pathname.startsWith("/portal")) return false;
  if (role === "VIEWER") {
    return VIEWER_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  }
  if (pathname.startsWith("/configuracion")) return role === "OWNER";
  return true;
}

/** A dónde mandar a cada rol después de iniciar sesión. */
export function homePathFor(role: Role) {
  return role === "TENANT" ? "/portal" : "/dashboard";
}
