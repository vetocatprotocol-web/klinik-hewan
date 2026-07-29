import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/prisma", () => {
  const mockClient = {
    dailyReconciliation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    posOrder: {
      findMany: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
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

import {
  submitDailyReconciliation,
  approveReconciliation,
} from "@/server/actions/reconciliation";
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

describe("Reconciliation Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitDailyReconciliation", () => {
    it("should submit reconciliation successfully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.dailyReconciliation.findFirst as any).mockResolvedValue(null);
      (mockPrisma.posOrder.findMany as any).mockResolvedValue([
        { total: 100000 },
        { total: 50000 },
      ]);
      (mockPrisma.invoice.findMany as any).mockResolvedValue([
        { total: 150000 },
      ]);
      (mockPrisma.payment.findMany as any).mockResolvedValue([
        { amount: 80000, paymentMethod: "CASH" },
        { amount: 70000, paymentMethod: "CARD" },
      ]);
      (mockPrisma.dailyReconciliation.create as any).mockResolvedValue({
        id: "rec-1",
      });

      const fd = createFormData({
        date: "2026-07-25",
        actualCash: "80000",
        actualCard: "70000",
        notes: "Hari normal",
      });

      const result = await submitDailyReconciliation(null, fd);
      expect(result.success).toBe(true);
      expect((result as any).data).toBe("rec-1");
    });

    it("should return error when reconciliation already exists", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "kasir-1", role: "KASIR" },
      } as any);

      (mockPrisma.dailyReconciliation.findFirst as any).mockResolvedValue({
        id: "rec-existing",
        date: new Date("2026-07-25"),
        kasirId: "kasir-1",
      });

      const fd = createFormData({
        date: "2026-07-25",
        actualCash: "80000",
        actualCard: "70000",
      });

      const result = await submitDailyReconciliation(null, fd);
      expect(result.success).toBe(false);
      expect((result as any).error?.code).toBe("BUSINESS_RULE");
    });
  });

  describe("approveReconciliation", () => {
    it("should approve a pending reconciliation", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      (mockPrisma.dailyReconciliation.findUnique as any).mockResolvedValue({
        id: "rec-1",
        status: "PENDING",
        notes: null,
      });
      (mockPrisma.dailyReconciliation.update as any).mockResolvedValue({});

      const result = await approveReconciliation("rec-1", "Looks good");
      expect(result.success).toBe(true);
      expect(mockPrisma.dailyReconciliation.update).toHaveBeenCalledWith({
        where: { id: "rec-1" },
        data: {
          status: "APPROVED",
          reviewedBy: "owner-1",
          reviewedAt: expect.any(Date),
          notes: "Looks good",
        },
      });
    });

    it("should return error when reconciliation is not PENDING", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      (mockPrisma.dailyReconciliation.findUnique as any).mockResolvedValue({
        id: "rec-1",
        status: "APPROVED",
        notes: null,
      });

      const result = await approveReconciliation("rec-1");
      expect(result.success).toBe(false);
      expect((result as any).error?.code).toBe("BUSINESS_RULE");
    });
  });
});
