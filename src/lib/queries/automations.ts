import { prisma } from "@/lib/prisma";
import { periodKey } from "@/lib/format";

const DAYS_AHEAD = 60;

/**
 * Cifras de la pantalla de automatizaciones: cuántos recordatorios se
 * dispararían hoy y cuántos contratos están por vencer.
 */
export async function getAutomationCounts(organizationId?: string | null) {
  const now = new Date();
  const horizon = new Date(now.getTime() + DAYS_AHEAD * 86_400_000);
  const orgFilter = organizationId ? { organizationId } : undefined;

  const [pendingCharges, expiringLeases] = await Promise.all([
    prisma.rentCharge.count({
      where: {
        period: periodKey(now),
        status: { in: ["PENDING", "OVERDUE"] },
        ...(organizationId
          ? { lease: { unit: { building: orgFilter } } }
          : {}),
      },
    }),
    prisma.lease.count({
      where: {
        status: "ACTIVE",
        endDate: { gte: now, lte: horizon },
        ...(organizationId ? { unit: { building: orgFilter } } : {}),
      },
    }),
  ]);

  return { pendingCharges, expiringLeases, daysAhead: DAYS_AHEAD };
}
