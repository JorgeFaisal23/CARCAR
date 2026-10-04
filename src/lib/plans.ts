import type { Plan } from "@/generated/prisma/enums";

/**
 * Límites de cada plan. Los mismos números que promete la página /premium.
 *
 * - buildings / units: propiedades y unidades registradas.
 * - staff: usuarios del equipo además del dueño (administrativos y de
 *   consulta) con la cuenta activa.
 *
 * Bajar de plan no borra nada: solo impide dar de alta más allá del límite.
 */
export const PLAN_LIMITS: Record<Plan, { buildings: number; units: number; staff: number }> = {
  FREE: { buildings: 2, units: 20, staff: 1 },
  PREMIUM: { buildings: Infinity, units: Infinity, staff: Infinity },
};

export type LimitedResource = keyof (typeof PLAN_LIMITS)["FREE"];

const LIMIT_MESSAGES: Record<LimitedResource, (limit: number) => string> = {
  buildings: (n) => `El plan gratuito permite hasta ${n} propiedades. Activa Premium para registrar más.`,
  units: (n) => `El plan gratuito permite hasta ${n} unidades. Activa Premium para registrar más.`,
  staff: (n) =>
    `El plan gratuito incluye ${n} ${n === 1 ? "usuario" : "usuarios"} de equipo además del dueño. Activa Premium para sumar más.`,
};

/** Mensaje de error si `current + 1` supera el límite del plan, o null si cabe. */
export function limitError(plan: Plan, resource: LimitedResource, current: number) {
  const limit = PLAN_LIMITS[plan][resource];
  return current + 1 > limit ? LIMIT_MESSAGES[resource](limit) : null;
}
