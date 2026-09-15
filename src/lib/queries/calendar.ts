import { prisma } from "@/lib/prisma";
import { toNumber, periodToDate } from "@/lib/format";

/**
 * Datos del calendario global: contratos de largo plazo y reservas de corta
 * estancia sobre el mismo eje de tiempo.
 *
 * Se consulta por mes y se recortan las barras a los límites del mes, de modo
 * que un contrato de doce meses se dibuje igual de bien que una estancia de
 * tres noches.
 */

export type CalendarBarKind = "LEASE" | "AIRBNB" | "DIRECT" | "MANUAL";

export type CalendarBar = {
  id: string;
  kind: CalendarBarKind;
  label: string;
  /** Día del mes donde empieza la barra (1-based). */
  startDay: number;
  /** Día del mes donde termina, inclusive. */
  endDay: number;
  /** La estancia real empieza antes del mes mostrado. */
  continuesBefore: boolean;
  continuesAfter: boolean;
  detail: string;
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export async function getCalendarData(
  period: string,
  buildingId?: string,
  organizationId?: string | null,
) {
  const monthStart = periodToDate(period);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const totalDays = daysInMonth(year, month);
  const monthEnd = new Date(year, month, totalDays, 23, 59, 59);

  const orgFilter = organizationId ? { organizationId } : undefined;

  const [buildings, units, leases, bookings] = await Promise.all([
    prisma.building.findMany({
      where: orgFilter,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.unit.findMany({
      where: {
        ...(buildingId ? { buildingId } : {}),
        ...(organizationId ? { building: orgFilter } : {}),
      },
      orderBy: [{ building: { name: "asc" } }, { code: "asc" }],
      select: {
        id: true,
        code: true,
        status: true,
        building: { select: { id: true, name: true } },
      },
    }),
    prisma.lease.findMany({
      where: {
        status: "ACTIVE",
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
        ...(buildingId ? { unit: { buildingId } } : {}),
        ...(organizationId ? { unit: { building: orgFilter } } : {}),
      },
      select: {
        id: true,
        unitId: true,
        startDate: true,
        endDate: true,
        rentAmount: true,
        tenant: { select: { name: true } },
      },
    }),
    prisma.booking.findMany({
      where: {
        status: { not: "CANCELLED" },
        checkIn: { lte: monthEnd },
        checkOut: { gte: monthStart },
        ...(buildingId ? { unit: { buildingId } } : {}),
        ...(organizationId ? { unit: { building: orgFilter } } : {}),
      },
      select: {
        id: true,
        unitId: true,
        source: true,
        guestName: true,
        checkIn: true,
        checkOut: true,
        guests: true,
        totalAmount: true,
      },
    }),
  ]);

  /** Recorta un intervalo al mes visible y lo expresa en días del mes. */
  function clip(start: Date, end: Date) {
    const startsBefore = start < monthStart;
    const endsAfter = end > monthEnd;
    const startDay = startsBefore ? 1 : start.getDate();
    const endDay = endsAfter ? totalDays : end.getDate();
    return { startDay, endDay, startsBefore, endsAfter };
  }

  const barsByUnit = new Map<string, CalendarBar[]>();
  const push = (unitId: string, bar: CalendarBar) => {
    const list = barsByUnit.get(unitId) ?? [];
    list.push(bar);
    barsByUnit.set(unitId, list);
  };

  for (const lease of leases) {
    const { startDay, endDay, startsBefore, endsAfter } = clip(
      lease.startDate,
      lease.endDate,
    );
    push(lease.unitId, {
      id: lease.id,
      kind: "LEASE",
      label: lease.tenant.name,
      startDay,
      endDay,
      continuesBefore: startsBefore,
      continuesAfter: endsAfter,
      detail: `Contrato de arrendamiento · ${toNumber(lease.rentAmount).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })} al mes`,
    });
  }

  for (const booking of bookings) {
    // La salida libera la unidad ese mismo día: la barra termina el día previo.
    const lastNight = new Date(booking.checkOut.getTime() - 86_400_000);
    const effectiveEnd = lastNight < booking.checkIn ? booking.checkIn : lastNight;
    const { startDay, endDay, startsBefore, endsAfter } = clip(
      booking.checkIn,
      effectiveEnd,
    );
    push(booking.unitId, {
      id: booking.id,
      kind: booking.source,
      label: booking.guestName,
      startDay,
      endDay,
      continuesBefore: startsBefore,
      continuesAfter: endsAfter,
      detail: `${booking.guests} ${booking.guests === 1 ? "huésped" : "huéspedes"} · ${toNumber(booking.totalAmount).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })}`,
    });
  }

  const rows = units.map((unit) => ({
    unitId: unit.id,
    code: unit.code,
    status: unit.status,
    buildingId: unit.building.id,
    buildingName: unit.building.name,
    bars: (barsByUnit.get(unit.id) ?? []).sort((a, b) => a.startDay - b.startDay),
  }));

  // Eventos por día para la vista de mes.
  const events = [
    ...bookings.map((b) => ({
      id: `in-${b.id}`,
      type: "checkin" as const,
      date: b.checkIn,
      label: b.guestName,
      unitId: b.unitId,
      source: b.source,
    })),
    ...bookings.map((b) => ({
      id: `out-${b.id}`,
      type: "checkout" as const,
      date: b.checkOut,
      label: b.guestName,
      unitId: b.unitId,
      source: b.source,
    })),
  ].filter((e) => e.date >= monthStart && e.date <= monthEnd);

  const unitCodes = new Map(units.map((u) => [u.id, u.code]));

  return {
    period,
    year,
    month,
    totalDays,
    buildings,
    rows,
    events: events.map((e) => ({ ...e, unitCode: unitCodes.get(e.unitId) ?? "" })),
    counts: {
      leases: leases.length,
      bookings: bookings.length,
      units: units.length,
    },
  };
}
