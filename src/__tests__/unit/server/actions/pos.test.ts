import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/prisma", () => {
  const mockClient = {
    posOrder: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    posOrderItem: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    setting: {
      findUnique: vi.fn(),
    },
    stockAdjustment: {
      create: vi.fn(),
    },
    invoice: {
      create: vi.fn(),
    },
    invoiceItem: {
      create: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  return {
    default: mockClient,
    prisma: vi.fn(async () => mockClient),
  };
});

vi.mock("@/server/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/server/lib/audit", () => ({
  createAuditLog: vi.fn(),
}));

vi.mock("@/server/lib/notifications", () => ({
  checkLowStock: vi.fn(),
}));

vi.mock("@/lib/utils", () => ({
  generateOrderNumber: vi.fn(() => "RCP-2026-0724-00001"),
  generatePaymentNumber: vi.fn(() => "PAY-2026-0724-00001"),
}));

import { processPosTransaction } from "@/server/actions/pos";
import prisma from "@/server/lib/prisma";
import { auth } from "@/server/lib/auth";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

describe("POS Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("processPosTransaction", () => {
    it("should process a complete POS transaction atomically", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "KASIR" },
      } as any);

      (mockPrisma.product.findMany as any).mockResolvedValue([
        { id: "prod-1", name: "Royal Canin", price: 450000, currentStock: 50, status: "ACTIVE" },
      ]);

      (mockPrisma.setting.findUnique as any).mockResolvedValue({
        key: "tax_config",
        value: { type: "PERCENTAGE", value: 10, enabled: true },
      });

      let transactionFn: Function;
      (mockPrisma.$transaction as any).mockImplementation(async (fn: Function) => {
        transactionFn = fn;
        const tx = {
          posOrder: {
            create: vi.fn().mockResolvedValue({ id: "order-1" }),
          },
          posOrderItem: {
            create: vi.fn(),
          },
          product: {
            findUnique: vi.fn().mockResolvedValue({ id: "prod-1", currentStock: 50 }),
            findMany: vi.fn().mockResolvedValue([
              { id: "prod-1", name: "Royal Canin", price: 450000, currentStock: 50, status: "ACTIVE" },
            ]),
            update: vi.fn(),
          },
          stockAdjustment: {
            create: vi.fn(),
          },
          setting: {
            findUnique: vi.fn().mockResolvedValue({
              value: { type: "PERCENTAGE", value: 10, enabled: true },
            }),
          },
        };
        return fn(tx);
      });

      const result = await processPosTransaction({
        items: [{ productId: "prod-1", quantity: 2 }],
        paymentMethod: "CASH",
        paymentAmount: 1000000,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.orderNumber).toBe("RCP-2026-0724-00001");
        expect(result.data?.changeAmount).toBeGreaterThan(0);
      }
    });

    it("should reject empty cart", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "KASIR" },
      } as any);

      const result = await processPosTransaction({
        items: [],
        paymentMethod: "CASH",
        paymentAmount: 100000,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("BUSINESS_RULE");
      }
    });

    it("should reject insufficient payment", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "KASIR" },
      } as any);

      (mockPrisma.product.findMany as any).mockResolvedValue([
        { id: "prod-1", name: "Royal Canin", price: 450000, currentStock: 50, status: "ACTIVE" },
      ]);

      (mockPrisma.setting.findUnique as any).mockResolvedValue({
        key: "tax_config",
        value: { type: "FLAT", value: 0, enabled: false },
      });

      (mockPrisma.$transaction as any).mockImplementation(async (fn: Function) => {
        const tx = {
          product: {
            findUnique: vi.fn().mockResolvedValue({ id: "prod-1", currentStock: 50 }),
            findMany: vi.fn().mockResolvedValue([
              { id: "prod-1", name: "Royal Canin", price: 450000, currentStock: 50, status: "ACTIVE" },
            ]),
            update: vi.fn(),
          },
          setting: {
            findUnique: vi.fn().mockResolvedValue({ value: { enabled: false } }),
          },
          posOrder: {
            create: vi.fn().mockResolvedValue({ id: "order-1" }),
          },
          posOrderItem: {
            create: vi.fn(),
          },
          stockAdjustment: {
            create: vi.fn(),
          },
          invoice: {
            create: vi.fn(),
          },
          invoiceItem: {
            create: vi.fn(),
          },
          payment: {
            create: vi.fn(),
          },
        };
        return fn(tx);
      });

      await expect(
        processPosTransaction({
          items: [{ productId: "prod-1", quantity: 2 }],
          paymentMethod: "CASH",
          paymentAmount: 100000,
        })
      ).rejects.toThrow("Jumlah pembayaran kurang");
    });

    it("should reject unauthorized users", async () => {
      mockAuth.mockResolvedValue(null as any);

      const result = await processPosTransaction({
        items: [{ productId: "prod-1", quantity: 1 }],
        paymentMethod: "CASH",
        paymentAmount: 100000,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should reject non-KASIR/OWNER roles", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "DOKTER" },
      } as any);

      const result = await processPosTransaction({
        items: [{ productId: "prod-1", quantity: 1 }],
        paymentMethod: "CASH",
        paymentAmount: 100000,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("FORBIDDEN");
      }
    });
  });
});
