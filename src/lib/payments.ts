import type { ChargeStatus } from "@/generated/prisma/enums";

/**
 * Estado de un cargo de renta a partir de lo pagado. Todo en centavos: sumar
 * pagos en punto flotante deja residuos (0.1 + 0.2) que convertirían un cargo
 * liquidado en "parcial".
 */

export function toCents(amount: number) {
  return Math.round(amount * 100);
}

/** Inicio del día de hoy: un cargo vence a partir del día siguiente a su fecha. */
export function startOfToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function computeChargeStatus(input: {
  amount: number;
  paid: number;
  dueDate: Date;
  now?: Date;
}): ChargeStatus {
  const amount = toCents(input.amount);
  const paid = toCents(input.paid);
  if (paid >= amount) return "PAID";
  if (paid > 0) return "PARTIAL";
  return input.dueDate < startOfToday(input.now) ? "OVERDUE" : "PENDING";
}

/** Lo que falta por pagar, nunca negativo. */
export function remainingOf(amount: number, paid: number) {
  return Math.max(0, toCents(amount) - toCents(paid)) / 100;
}
