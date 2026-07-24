import { describe, it, expect } from "vitest";
import {
  getTaxConfig,
  calculateTax,
  calculateTotalWithTax,
  calculateChange,
} from "@/server/lib/tax";

describe("calculateTax", () => {
  it("should return 0 when tax disabled", () => {
    const config = { type: "FLAT" as const, value: 5000, enabled: false };
    expect(calculateTax(100000, config)).toBe(0);
  });

  it("should calculate flat tax", () => {
    const config = { type: "FLAT" as const, value: 5000, enabled: true };
    expect(calculateTax(100000, config)).toBe(5000);
  });

  it("should calculate percentage tax", () => {
    const config = { type: "PERCENTAGE" as const, value: 10, enabled: true };
    expect(calculateTax(100000, config)).toBe(10000);
  });

  it("should round percentage tax", () => {
    const config = { type: "PERCENTAGE" as const, value: 10, enabled: true };
    expect(calculateTax(105000, config)).toBe(10500);
  });

  it("should return 0 for zero value", () => {
    const config = { type: "FLAT" as const, value: 0, enabled: true };
    expect(calculateTax(100000, config)).toBe(0);
  });
});

describe("calculateTotalWithTax", () => {
  it("should add flat tax to subtotal", () => {
    const config = { type: "FLAT" as const, value: 5000, enabled: true };
    expect(calculateTotalWithTax(100000, config)).toBe(105000);
  });

  it("should add percentage tax to subtotal", () => {
    const config = { type: "PERCENTAGE" as const, value: 10, enabled: true };
    expect(calculateTotalWithTax(100000, config)).toBe(110000);
  });

  it("should return subtotal when tax disabled", () => {
    const config = { type: "FLAT" as const, value: 5000, enabled: false };
    expect(calculateTotalWithTax(100000, config)).toBe(100000);
  });
});

describe("calculateChange", () => {
  it("should calculate change for overpayment", () => {
    expect(calculateChange(150000, 100000)).toBe(50000);
  });

  it("should return 0 for exact payment", () => {
    expect(calculateChange(100000, 100000)).toBe(0);
  });

  it("should return 0 for underpayment", () => {
    expect(calculateChange(50000, 100000)).toBe(0);
  });

  it("should handle zero payment", () => {
    expect(calculateChange(0, 100000)).toBe(0);
  });
});
