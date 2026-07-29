import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/prisma", () => {
  const mockClient = {
    supplier: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    supplierChangeRequest: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    purchaseOrder: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    purchaseOrderItem: {
      create: vi.fn(),
      update: vi.fn(),
    },
    goodsReceipt: {
      create: vi.fn(),
    },
    product: {
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
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
}));

vi.mock("@/lib/utils", () => ({
  generatePONumber: vi.fn(() => "PO-2026-0725-00001"),
  generateGRNumber: vi.fn(() => "GR-2026-0725-00001"),
}));

import {
  createSupplier,
  createPurchaseOrder,
  receiveGoodsReceipt,
} from "@/server/actions/suppliers";
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

describe("Supplier Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSupplier", () => {
    it("should create a supplier as OWNER", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      (mockPrisma.supplier.findFirst as any).mockResolvedValue(null);
      (mockPrisma.supplier.create as any).mockResolvedValue({
        id: "sup-1",
        name: "PT Obat Sehat",
      });

      const fd = createFormData({
        name: "PT Obat Sehat",
        phone: "08123456789",
        email: "info@obatsehat.com",
      });

      const result = await createSupplier(null, fd);
      expect(result.success).toBe(true);
      expect((result as any).data).toBe("sup-1");
      expect(mockPrisma.supplierChangeRequest.create).not.toHaveBeenCalled();
    });

    it("should create a supplier as KASIR with change request", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.supplier.findFirst as any).mockResolvedValue(null);
      (mockPrisma.supplier.create as any).mockResolvedValue({
        id: "sup-2",
        name: "PT Farmasi Jaya",
      });
      (mockPrisma.supplierChangeRequest.create as any).mockResolvedValue({
        id: "cr-1",
      });

      const fd = createFormData({
        name: "PT Farmasi Jaya",
        phone: "08198765432",
      });

      const result = await createSupplier(null, fd);
      expect(result.success).toBe(true);
      expect((result as any).data).toBe("sup-2");
      expect(mockPrisma.supplierChangeRequest.create).toHaveBeenCalled();
    });
  });

  describe("createPurchaseOrder", () => {
    it("should create a purchase order successfully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.supplier.findUnique as any).mockResolvedValue({
        id: "sup-1",
        status: "ACTIVE",
      });
      (mockPrisma.$transaction as any).mockImplementation(async (fn: any) => {
        if (typeof fn === "function") {
          return fn({
            purchaseOrder: {
              create: vi.fn().mockResolvedValue({
                id: "po-1",
                poNumber: "PO-2026-0725-00001",
              }),
            },
            purchaseOrderItem: {
              create: vi.fn().mockResolvedValue({}),
            },
          });
        }
        return fn;
      });

      const result = await createPurchaseOrder(
        "sup-1",
        [{ productId: "prod-1", quantity: 10, unitPrice: 5000 }],
        "Urgent order"
      );
      expect(result.success).toBe(true);
    });

    it("should return error when items is empty", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.supplier.findUnique as any).mockResolvedValue({
        id: "sup-1",
        status: "ACTIVE",
      });

      const result = await createPurchaseOrder("sup-1", []);
      expect(result.success).toBe(false);
      expect((result as any).error?.field).toBe("items");
    });

    it("should return error when supplier is inactive", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.supplier.findUnique as any).mockResolvedValue({
        id: "sup-1",
        status: "INACTIVE",
      });

      const result = await createPurchaseOrder("sup-1", [
        { productId: "prod-1", quantity: 10, unitPrice: 5000 },
      ]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect((result as any).error?.code).toBe("BUSINESS_RULE");
      }
    });
  });

  describe("receiveGoodsReceipt", () => {
    it("should receive goods successfully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.purchaseOrder.findUnique as any).mockResolvedValue({
        id: "po-1",
        status: "PENDING",
        items: [
          {
            id: "poi-1",
            quantity: 10,
            receivedQuantity: 0,
            productId: "prod-1",
          },
        ],
      });
      (mockPrisma.$transaction as any).mockImplementation(async (fn: any) => {
        if (typeof fn === "function") {
          return fn({
            goodsReceipt: {
              create: vi.fn().mockResolvedValue({ id: "gr-1" }),
            },
            purchaseOrderItem: {
              update: vi.fn().mockResolvedValue({}),
            },
            product: {
              update: vi.fn().mockResolvedValue({}),
            },
            purchaseOrder: {
              update: vi.fn().mockResolvedValue({}),
            },
          });
        }
        return fn;
      });

      const result = await receiveGoodsReceipt("po-1", [
        { poItemId: "poi-1", receivedQuantity: 10 },
      ]);
      expect(result.success).toBe(true);
    });

    it("should reject over-receive", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.purchaseOrder.findUnique as any).mockResolvedValue({
        id: "po-1",
        status: "PENDING",
        items: [
          {
            id: "poi-1",
            quantity: 10,
            receivedQuantity: 8,
            productId: "prod-1",
          },
        ],
      });

      const result = await receiveGoodsReceipt("po-1", [
        { poItemId: "poi-1", receivedQuantity: 5 },
      ]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect((result as any).error?.field).toBe("items");
      }
    });
  });
});
