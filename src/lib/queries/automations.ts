import type { OrgDb } from "@/lib/db/scoped";
import { periodKey } from "@/lib/format";

const DAYS_AHEAD = 60;

/**
 * Cifras de la pantalla de automatizaciones: cuántos recordatorios se
 * dispararían hoy y cuántos contratos están por vencer.
 */
export async function getAutomationCounts(db: OrgDb) {
  const now = new Date();
  const horizon = new Date(now.getTime() + DAYS_AHEAD * 86_400_000);

  const [pendingCharges, expiringLeases] = await Promise.all([
    db.rentCharge.count({
      where: { period: periodKey(now), status: { in: ["PENDING", "OVERDUE"] } },
    }),
    db.lease.count({
      where: { status: "ACTIVE", endDate: { gte: now, lte: horizon } },
    }),
  ]);

  return { pendingCharges, expiringLeases, daysAhead: DAYS_AHEAD };
}
