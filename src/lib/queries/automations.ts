import { prisma } from "@/lib/prisma";
import { periodKey } from "@/lib/format";

const DAYS_AHEAD = 60;

/**
 * Cifras de la pantalla de automatizaciones: cuántos recordatorios se
 * dispararían hoy y cuántos contratos están por vencer.
 */
export async function getAutomationCounts() {
  const now = new Date();
  const horizon = new Date(now.getTime() + DAYS_AHEAD * 86_400_000);

  const [pendingCharges, expiringLeases] = await Promise.all([
    prisma.rentCharge.count({
      where: { period: periodKey(now), status: { in: ["PENDING", "OVERDUE"] } },
    }),
    prisma.lease.count({
      where: { status: "ACTIVE", endDate: { gte: now, lte: horizon } },
    }),
  ]);

  return { pendingCharges, expiringLeases, daysAhead: DAYS_AHEAD };
}
