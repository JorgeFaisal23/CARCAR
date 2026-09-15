import { describe, it, expect } from "vitest";
import {
  money,
  moneyCompact,
  toNumber,
  periodKey,
  periodLabel,
  shiftPeriod,
  daysBetween,
  deadlineLabel,
} from "./format";

describe("format (Currency & Date Formatting)", () => {
  describe("toNumber", () => {
    it("handles null, undefined, strings and numbers", () => {
      expect(toNumber(null)).toBe(0);
      expect(toNumber(undefined)).toBe(0);
      expect(toNumber(42)).toBe(42);
      expect(toNumber("123.45")).toBe(123.45);
      expect(toNumber("invalid")).toBe(0);
    });
  });

  describe("money", () => {
    it("formats MXN by default", () => {
      const formatted = money(1500.5);
      expect(formatted).toContain("1,500.50");
      expect(formatted).toContain("$");
    });

    it("formats USD when explicitly requested", () => {
      const formatted = money(2500, "USD");
      expect(formatted).toContain("2,500.00");
      expect(formatted).toContain("$");
    });
  });

  describe("moneyCompact", () => {
    it("formats without cents", () => {
      const formattedMXN = moneyCompact(50000, "MXN");
      expect(formattedMXN).toContain("50,000");

      const formattedUSD = moneyCompact(25000, "USD");
      expect(formattedUSD).toContain("25,000");
    });
  });

  describe("period functions", () => {
    it("formats date to periodKey YYYY-MM", () => {
      const date = new Date(2026, 7, 15); // August 2026 (0-indexed month)
      expect(periodKey(date)).toBe("2026-08");
    });

    it("formats period to human label", () => {
      expect(periodLabel("2026-08")).toBe("Agosto 2026");
    });

    it("shifts period by months", () => {
      expect(shiftPeriod("2026-08", -1)).toBe("2026-07");
      expect(shiftPeriod("2026-08", 1)).toBe("2026-09");
      expect(shiftPeriod("2026-01", -1)).toBe("2025-12");
    });
  });

  describe("daysBetween", () => {
    it("calculates difference in days between two dates", () => {
      const d1 = new Date(2026, 7, 1);
      const d2 = new Date(2026, 7, 11);
      expect(daysBetween(d1, d2)).toBe(10);
    });
  });

  describe("deadlineLabel", () => {
    it("returns correct natural language deadline descriptions", () => {
      expect(deadlineLabel(-3)).toBe("venció hace 3 días");
      expect(deadlineLabel(-1)).toBe("venció hace 1 día");
      expect(deadlineLabel(0)).toBe("vence hoy");
      expect(deadlineLabel(1)).toBe("vence mañana");
      expect(deadlineLabel(5)).toBe("vence en 5 días");
    });
  });
});
