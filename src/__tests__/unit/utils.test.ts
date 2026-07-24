import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatShortDate,
  formatNumber,
  generateVisitNumber,
  generateInvoiceNumber,
  generateBillingNumber,
  generatePaymentNumber,
  generateOrderNumber,
  generatePrescriptionNumber,
  calculateAge,
  getInitials,
  slugify,
  truncate,
} from "@/lib/utils";

describe("formatCurrency", () => {
  it("should format IDR currency", () => {
    const result = formatCurrency(250000);
    expect(result).toContain("Rp");
    expect(result).toContain("250.000");
  });

  it("should format zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("Rp");
  });

  it("should format large numbers", () => {
    const result = formatCurrency(1000000);
    expect(result).toContain("1.000.000");
  });
});

describe("formatDate", () => {
  it("should format date in Indonesian", () => {
    const result = formatDate(new Date("2024-07-24"));
    expect(result).toContain("24");
    expect(result).toContain("2024");
  });

  it("should accept string input", () => {
    const result = formatDate("2024-07-24");
    expect(result).toContain("24");
  });
});

describe("formatDateTime", () => {
  it("should format date with time", () => {
    const result = formatDateTime(new Date("2024-07-24T10:30:00"));
    expect(result).toContain("24");
    expect(result).toContain("2024");
  });
});

describe("formatShortDate", () => {
  it("should format short date", () => {
    const result = formatShortDate(new Date("2024-07-24"));
    expect(result).toContain("2024");
  });
});

describe("formatNumber", () => {
  it("should format number with dots", () => {
    const result = formatNumber(1000000);
    expect(result).toBe("1.000.000");
  });

  it("should format zero", () => {
    expect(formatNumber(0)).toBe("0");
  });
});

describe("generateVisitNumber", () => {
  it("should generate visit number with VIS prefix", () => {
    const result = generateVisitNumber(new Date("2024-07-24"));
    expect(result).toMatch(/^VIS-2024-0724-\d{5}$/);
  });

  it("should follow VIS prefix pattern", () => {
    const result = generateVisitNumber(new Date());
    expect(result).toMatch(/^VIS-\d{4}-\d{4}-\d{5}$/);
  });
});

describe("generateInvoiceNumber", () => {
  it("should generate invoice number with INV prefix", () => {
    const result = generateInvoiceNumber(new Date("2024-07-24"));
    expect(result).toMatch(/^INV-2024-0724-\d{5}$/);
  });
});

describe("generateBillingNumber", () => {
  it("should generate billing number with BIL prefix", () => {
    const result = generateBillingNumber(new Date("2024-07-24"));
    expect(result).toMatch(/^BIL-2024-0724-\d{5}$/);
  });
});

describe("generatePaymentNumber", () => {
  it("should generate payment number with PAY prefix", () => {
    const result = generatePaymentNumber(new Date("2024-07-24"));
    expect(result).toMatch(/^PAY-2024-0724-\d{5}$/);
  });
});

describe("generateOrderNumber", () => {
  it("should generate order number with RCP prefix", () => {
    const result = generateOrderNumber(new Date("2024-07-24"));
    expect(result).toMatch(/^RCP-2024-0724-\d{5}$/);
  });
});

describe("generatePrescriptionNumber", () => {
  it("should generate prescription number with RX prefix", () => {
    const result = generatePrescriptionNumber(new Date("2024-07-24"));
    expect(result).toMatch(/^RX-2024-0724-\d{5}$/);
  });
});

describe("calculateAge", () => {
  it("should calculate age in years", () => {
    const birth = new Date();
    birth.setFullYear(birth.getFullYear() - 3);
    const result = calculateAge(birth);
    expect(result).toContain("3");
    expect(result).toContain("tahun");
  });

  it("should calculate age in months", () => {
    const birth = new Date();
    birth.setMonth(birth.getMonth() - 5);
    const result = calculateAge(birth);
    expect(result).toContain("bulan");
  });

  it("should accept string input", () => {
    const birth = new Date();
    birth.setFullYear(birth.getFullYear() - 2);
    const result = calculateAge(birth.toISOString());
    expect(result).toContain("2");
  });
});

describe("getInitials", () => {
  it("should return first letters of name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("should handle single name", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("should limit to 2 characters", () => {
    expect(getInitials("John Michael Doe")).toBe("JM");
  });

  it("should uppercase initials", () => {
    expect(getInitials("john doe")).toBe("JD");
  });
});

describe("slugify", () => {
  it("should convert to lowercase slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should handle special characters", () => {
    expect(slugify("Hello! @World#")).toBe("hello-world");
  });

  it("should handle multiple spaces", () => {
    expect(slugify("Hello   World")).toBe("hello-world");
  });

  it("should trim dashes", () => {
    expect(slugify("-Hello-")).toBe("hello");
  });
});

describe("truncate", () => {
  it("should not truncate short text", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("should truncate long text", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
  });

  it("should handle exact length", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });
});
