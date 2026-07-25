import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/prisma", () => {
  const mockClient = {
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    stockAdjustment: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    stockAdjustmentApproval: {
      findMany: vi.fn(),
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
  createNotification: vi.fn(),
  checkLowStock: vi.fn(),
}));

vi.mock("@/lib/validators", () => ({
  stockAdjustmentSchema: {
    safeParse: vi.fn((data: any) => {
      if (!data.productId || !data.quantity || !data.reason) {
        return {
          success: false,
          error: { issues: [{ message: "Field wajib harus diisi", path: ["productId"] }] },
        };
      }
      return { success: true, data };
    }),
  },
}));

import {
  adjustStock,
  getLowStockAlerts,
  recordStockOpname,
} from "@/server/actions/stock";
import prisma from "@/server/lib/prisma";
import { auth } from "@/server/lib/auth";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value);
  }
  return fd;
}

describe("Stock Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("adjustStock", () => {
    it("should adjust stock successfully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.product.findUnique as any).mockResolvedValue({
        id: "prod-1",
        currentStock: 100,
      });
      (mockPrisma.$transaction as any).mockResolvedValue([{}, {}]);

      const fd = createFormData({
        productId: "prod-1",
        quantity: "10",
        reason: "PURCHASE",
      });

      const result = await adjustStock(null, fd);
      expect(result.success).toBe(true);
    });

    it("should return error when stock would go negative", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.product.findUnique as any).mockResolvedValue({
        id: "prod-1",
        currentStock: 5,
      });

      const fd = createFormData({
        productId: "prod-1",
        quantity: "-10",
        reason: "SALE",
      });

      const result = await adjustStock(null, fd);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("BUSINESS_RULE");
    });

    it("should return error when user is unauthorized", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "doc-1", role: "DOKTER" },
      } as any);

      const fd = createFormData({
        productId: "prod-1",
        quantity: "10",
        reason: "PURCHASE",
      });

      const result = await adjustStock(null, fd);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("getLowStockAlerts", () => {
    it("should return low stock products", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      (mockPrisma.product.findMany as any).mockResolvedValue([
        {
          id: "prod-1",
          name: "Obat A",
          currentStock: 2,
          reorderPoint: 10,
          status: "ACTIVE",
          category: { id: "cat-1", name: "Obat" },
        },
        {
          id: "prod-2",
          name: "Obat B",
          currentStock: 50,
          reorderPoint: 10,
          status: "ACTIVE",
          category: { id: "cat-1", name: "Obat" },
        },
      ]);

      const result = await getLowStockAlerts();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("prod-1");
    });

    it("should return empty array when no low stock", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      (mockPrisma.product.findMany as any).mockResolvedValue([
        {
          id: "prod-1",
          name: "Obat A",
          currentStock: 50,
          reorderPoint: 10,
          status: "ACTIVE",
          category: { id: "cat-1", name: "Obat" },
        },
      ]);

      const result = await getLowStockAlerts();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe("recordStockOpname", () => {
    it("should record stock opname with variance", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.product.findMany as any).mockResolvedValue([
        { id: "prod-1", currentStock: 100 },
        { id: "prod-2", currentStock: 50 },
      ]);
      (mockPrisma.$transaction as any).mockResolvedValue([{}, {}, {}, {}]);

      const result = await recordStockOpname([
        { productId: "prod-1", physicalCount: 95 },
        { productId: "prod-2", physicalCount: 50 },
      ]);
      expect(result.success).toBe(true);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should return success when no variance", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.product.findMany as any).mockResolvedValue([
        { id: "prod-1", currentStock: 100 },
      ]);

      const result = await recordStockOpname([
        { productId: "prod-1", physicalCount: 100 },
      ]);
      expect(result.success).toBe(true);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
