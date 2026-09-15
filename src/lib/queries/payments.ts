import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

/** Cobros de renta de un periodo, agrupados por propiedad. */
export async function getPaymentsBoard(
  period: string,
  organizationId?: string | null,
) {
  const orgFilter = organizationId ? { organizationId } : undefined;

  const [charges, activeLeases] = await Promise.all([
    prisma.rentCharge.findMany({
      where: {
        period,
        ...(organizationId
          ? { lease: { unit: { building: orgFilter } } }
          : {}),
      },
      orderBy: [
        { lease: { unit: { building: { name: "asc" } } } },
        { lease: { unit: { code: "asc" } } },
      ],
      select: {
        id: true,
        period: true,
        amount: true,
        paidAmount: true,
        status: true,
        dueDate: true,
        paidAt: true,
        method: true,
        reference: true,
        receiptUrl: true,
        lease: {
          select: {
            id: true,
            tenant: { select: { id: true, name: true } },
            unit: {
              select: {
                id: true,
                code: true,
                building: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.lease.count({
      where: {
        status: "ACTIVE",
        ...(organizationId ? { unit: { building: orgFilter } } : {}),
      },
    }),
  ]);

  const groups = new Map<
    string,
    {
      id: string;
      name: string;
      charges: {
        id: string;
        tenantId: string;
        tenantName: string;
        unitId: string;
        unitCode: string;
        amount: number;
        paidAmount: number;
        status: (typeof charges)[number]["status"];
        dueDate: Date;
        paidAt: Date | null;
        method: string | null;
        receiptUrl: string | null;
      }[];
      total: number;
      collected: number;
    }
  >();

  for (const charge of charges) {
    const building = charge.lease.unit.building;
    const group = groups.get(building.id) ?? {
      id: building.id,
      name: building.name,
      charges: [],
      total: 0,
      collected: 0,
    };

    const amount = toNumber(charge.amount);
    const paid = toNumber(charge.paidAmount);

    group.charges.push({
      id: charge.id,
      tenantId: charge.lease.tenant.id,
      tenantName: charge.lease.tenant.name,
      unitId: charge.lease.unit.id,
      unitCode: charge.lease.unit.code,
      amount,
      paidAmount: paid,
      status: charge.status,
      dueDate: charge.dueDate,
      paidAt: charge.paidAt,
      method: charge.method,
      receiptUrl: charge.receiptUrl,
    });
    group.total += amount;
    group.collected += paid;
    groups.set(building.id, group);
  }

  const buildings = [...groups.values()];
  const expected = buildings.reduce((sum, b) => sum + b.total, 0);
  const collected = buildings.reduce((sum, b) => sum + b.collected, 0);
  const overdue = charges.filter((c) => c.status === "OVERDUE");

  return {
    period,
    buildings,
    expected,
    collected,
    pending: expected - collected,
    overdueCount: overdue.length,
    chargeCount: charges.length,
    activeLeases,
    /** Cuántos contratos vigentes aún no tienen cargo generado este mes. */
    missingCharges: Math.max(0, activeLeases - charges.length),
  };
}
