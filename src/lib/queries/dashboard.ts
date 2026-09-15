import { prisma } from "@/lib/prisma";
import { periodKey, toNumber, daysBetween } from "@/lib/format";

/**
 * Consultas del resumen. Todo el cálculo vive aquí para que la página solo se
 * ocupe de presentar; así los mismos números se pueden reutilizar en reportes.
 */

const DAYS_BEFORE_EXPIRY_WARNING = 60;

export async function getDashboardData(organizationId?: string | null) {
  const now = new Date();
  const period = periodKey(now);

  const orgFilter = organizationId ? { organizationId } : undefined;
  const buildingFilter = organizationId ? { building: orgFilter } : undefined;
  const unitBuildingFilter = organizationId
    ? { unit: { building: orgFilter } }
    : undefined;

  const [units, rentCharges, serviceCharges, leases, upcomingBookings, serviceAccounts] =
    await Promise.all([
      prisma.unit.findMany({
        where: buildingFilter,
        select: {
          id: true,
          code: true,
          status: true,
          baseRent: true,
          building: { select: { id: true, name: true } },
        },
      }),
      prisma.rentCharge.findMany({
        where: {
          period,
          ...(organizationId
            ? { lease: { unit: { building: orgFilter } } }
            : {}),
        },
        select: {
          amount: true,
          paidAmount: true,
          status: true,
          lease: {
            select: {
              unit: { select: { currency: true } },
            },
          },
        },
      }),
      prisma.serviceCharge.findMany({
        where: {
          period,
          ...(organizationId
            ? {
                serviceAccount: {
                  OR: [
                    { building: orgFilter },
                    { unit: { building: orgFilter } },
                  ],
                },
              }
            : {}),
        },
        select: { amount: true },
      }),
      prisma.lease.findMany({
        where: {
          status: "ACTIVE",
          ...unitBuildingFilter,
        },
        select: {
          id: true,
          endDate: true,
          tenant: { select: { id: true, name: true } },
          unit: {
            select: { id: true, code: true, building: { select: { name: true } } },
          },
        },
        orderBy: { endDate: "asc" },
      }),
      prisma.booking.findMany({
        where: {
          checkIn: { gte: now },
          status: "CONFIRMED",
          ...unitBuildingFilter,
        },
        select: {
          id: true,
          guestName: true,
          checkIn: true,
          checkOut: true,
          source: true,
          totalAmount: true,
          unit: {
            select: { id: true, code: true, building: { select: { name: true } } },
          },
        },
        orderBy: { checkIn: "asc" },
        take: 6,
      }),
      prisma.serviceAccount.count({
        where: {
          active: true,
          ...(organizationId
            ? {
                OR: [
                  { building: orgFilter },
                  { unit: { building: orgFilter } },
                ],
              }
            : {}),
        },
      }),
    ]);

  const totalUnits = units.length;
  const occupied = units.filter(
    (u) => u.status === "OCCUPIED" || u.status === "SHORT_TERM",
  ).length;

  const expectedIncomeMXN = rentCharges
    .filter((c) => c.lease.unit.currency === "MXN")
    .reduce((sum, c) => sum + toNumber(c.amount), 0);
  const expectedIncomeUSD = rentCharges
    .filter((c) => c.lease.unit.currency === "USD")
    .reduce((sum, c) => sum + toNumber(c.amount), 0);
  const expectedIncome = rentCharges.reduce((sum, c) => sum + toNumber(c.amount), 0);

  const collectedMXN = rentCharges
    .filter((c) => c.lease.unit.currency === "MXN")
    .reduce((sum, c) => sum + toNumber(c.paidAmount), 0);
  const collectedUSD = rentCharges
    .filter((c) => c.lease.unit.currency === "USD")
    .reduce((sum, c) => sum + toNumber(c.paidAmount), 0);
  const collected = rentCharges.reduce((sum, c) => sum + toNumber(c.paidAmount), 0);

  const overdue = rentCharges.filter((c) => c.status === "OVERDUE");
  const overdueAmountMXN = overdue
    .filter((c) => c.lease.unit.currency === "MXN")
    .reduce(
      (sum, c) => sum + toNumber(c.amount) - toNumber(c.paidAmount),
      0,
    );
  const overdueAmountUSD = overdue
    .filter((c) => c.lease.unit.currency === "USD")
    .reduce(
      (sum, c) => sum + toNumber(c.amount) - toNumber(c.paidAmount),
      0,
    );
  const overdueAmount = overdue.reduce(
    (sum, c) => sum + toNumber(c.amount) - toNumber(c.paidAmount),
    0,
  );
  const pendingCount = rentCharges.filter(
    (c) => c.status === "PENDING" || c.status === "PARTIAL",
  ).length;

  const servicesTotal = serviceCharges.reduce(
    (sum, c) => sum + toNumber(c.amount),
    0,
  );

  // Cuántas cuentas de servicio siguen sin monto capturado este mes.
  const servicesMissing = serviceAccounts - serviceCharges.length;

  const expiringSoon = leases.filter((lease) => {
    const days = daysBetween(now, lease.endDate);
    return days >= 0 && days <= DAYS_BEFORE_EXPIRY_WARNING;
  });

  // Ocupación desglosada por edificio.
  const byBuilding = new Map<
    string,
    { name: string; total: number; occupied: number }
  >();
  for (const unit of units) {
    const entry = byBuilding.get(unit.building.id) ?? {
      name: unit.building.name,
      total: 0,
      occupied: 0,
    };
    entry.total += 1;
    if (unit.status === "OCCUPIED" || unit.status === "SHORT_TERM") {
      entry.occupied += 1;
    }
    byBuilding.set(unit.building.id, entry);
  }

  return {
    period,
    totalUnits,
    occupied,
    occupancyRate: totalUnits === 0 ? 0 : Math.round((occupied / totalUnits) * 100),
    availableUnits: units.filter((u) => u.status === "AVAILABLE").length,
    maintenanceUnits: units.filter((u) => u.status === "MAINTENANCE").length,
    expectedIncome,
    expectedIncomeMXN,
    expectedIncomeUSD,
    collected,
    collectedMXN,
    collectedUSD,
    overdueCount: overdue.length,
    overdueAmount,
    overdueAmountMXN,
    overdueAmountUSD,
    pendingCount,
    servicesTotal,
    servicesMissing: Math.max(0, servicesMissing),
    serviceAccounts,
    expiringSoon: expiringSoon.map((lease) => ({
      id: lease.id,
      tenantName: lease.tenant.name,
      tenantId: lease.tenant.id,
      unitCode: lease.unit.code,
      buildingName: lease.unit.building.name,
      endDate: lease.endDate,
      daysLeft: daysBetween(now, lease.endDate),
    })),
    upcomingBookings: upcomingBookings.map((b) => ({
      id: b.id,
      guestName: b.guestName,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      source: b.source,
      totalAmount: toNumber(b.totalAmount),
      unitCode: b.unit.code,
      buildingName: b.unit.building.name,
    })),
    buildings: [...byBuilding.entries()].map(([id, value]) => ({
      id,
      ...value,
      rate: value.total === 0 ? 0 : Math.round((value.occupied / value.total) * 100),
    })),
  };
}
