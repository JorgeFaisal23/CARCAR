import { describe, expect, it } from "vitest";
import { computeChargeStatus, remainingOf } from "@/lib/payments";

const now = new Date(2026, 9, 15, 10); // 15 oct 2026
const yesterday = new Date(2026, 9, 14, 12);
const today = new Date(2026, 9, 15, 12);

describe("computeChargeStatus", () => {
  it("pagado completo, aunque los pagos sumen con decimales", () => {
    expect(computeChargeStatus({ amount: 0.3, paid: 0.1 + 0.2, dueDate: yesterday, now })).toBe("PAID");
    expect(computeChargeStatus({ amount: 6500, paid: 7000, dueDate: today, now })).toBe("PAID");
  });

  it("parcial cuando hay algo pagado", () => {
    expect(computeChargeStatus({ amount: 6500, paid: 3000, dueDate: yesterday, now })).toBe("PARTIAL");
  });

  it("vencido solo a partir del día siguiente a la fecha de pago", () => {
    expect(computeChargeStatus({ amount: 6500, paid: 0, dueDate: today, now })).toBe("PENDING");
    expect(computeChargeStatus({ amount: 6500, paid: 0, dueDate: yesterday, now })).toBe("OVERDUE");
  });
});

describe("remainingOf", () => {
  it("resta en centavos y nunca da negativo", () => {
    expect(remainingOf(6500, 3000.5)).toBe(3499.5);
    expect(remainingOf(100, 150)).toBe(0);
  });
});
