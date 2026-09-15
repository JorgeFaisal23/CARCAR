import { describe, it, expect } from "vitest";
import { allocate, type AllocationTarget } from "./allocation";

describe("allocate (Financial Service Allocation)", () => {
  it("returns empty array when mode is NONE or targets is empty", () => {
    const targets: AllocationTarget[] = [
      { id: "u1", label: "101", sizeM2: 50 },
      { id: "u2", label: "102", sizeM2: 50 },
    ];
    expect(allocate(1000, targets, "NONE")).toEqual([]);
    expect(allocate(1000, [], "EQUAL")).toEqual([]);
  });

  it("splits equally with strict cent conservation (1000 / 3)", () => {
    const targets: AllocationTarget[] = [
      { id: "u1", label: "101" },
      { id: "u2", label: "102" },
      { id: "u3", label: "103" },
    ];
    const result = allocate(1000, targets, "EQUAL");

    expect(result).toHaveLength(3);
    const sum = result.reduce((acc, curr) => acc + curr.amount, 0);
    // 333.34 + 333.33 + 333.33 = 1000.00
    expect(Math.round(sum * 100)).toBe(100000);
    expect(result[0].amount).toBe(333.34);
    expect(result[1].amount).toBe(333.33);
    expect(result[2].amount).toBe(333.33);
  });

  it("splits proportionally BY_SIZE", () => {
    const targets: AllocationTarget[] = [
      { id: "u1", label: "101", sizeM2: 60 },
      { id: "u2", label: "102", sizeM2: 40 },
    ];
    const result = allocate(1500, targets, "BY_SIZE");

    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(900);
    expect(result[1].amount).toBe(600);
    expect(result[0].amount + result[1].amount).toBe(1500);
  });

  it("falls back to EQUAL if all targets have 0 or null sizeM2 in BY_SIZE mode", () => {
    const targets: AllocationTarget[] = [
      { id: "u1", label: "101", sizeM2: null },
      { id: "u2", label: "102", sizeM2: 0 },
    ];
    const result = allocate(100, targets, "BY_SIZE");

    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(50);
    expect(result[1].amount).toBe(50);
  });

  it("conserves pennies across complex decimal numbers", () => {
    const targets: AllocationTarget[] = [
      { id: "u1", label: "101", sizeM2: 35.5 },
      { id: "u2", label: "102", sizeM2: 42.8 },
      { id: "u3", label: "103", sizeM2: 65.2 },
      { id: "u4", label: "104", sizeM2: 28.0 },
      { id: "u5", label: "105", sizeM2: 50.0 },
    ];

    const totalAmount = 4578.93;
    const result = allocate(totalAmount, targets, "BY_SIZE");

    expect(result).toHaveLength(5);
    const sumCents = result.reduce((acc, curr) => acc + Math.round(curr.amount * 100), 0);
    expect(sumCents).toBe(Math.round(totalAmount * 100));
  });
});
