import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/prisma", () => {
  const mockClient = {
    setting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
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

import {
  updateHotelRates,
  updateFraudPreventionPolicies,
  revertSetting,
} from "@/server/actions/settings";
import prisma from "@/server/lib/prisma";
import { auth } from "@/server/lib/auth";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

describe("Settings Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateHotelRates", () => {
    it("should update hotel rates successfully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      (mockPrisma.setting.upsert as any).mockResolvedValue({});

      const rates = [
        { roomType: "STANDARD", dailyRate: 100000 },
        { roomType: "VIP", dailyRate: 250000 },
      ];

      const result = await updateHotelRates(rates);

      expect(result.success).toBe(true);
      expect(mockPrisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: "hotel_rates" },
        update: { value: rates },
        create: { key: "hotel_rates", value: rates },
      });
    });

    it("should return error when rates array is empty", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      const result = await updateHotelRates([]);

      expect(result.success).toBe(false);
    });
  });

  describe("updateFraudPreventionPolicies", () => {
    it("should update fraud prevention policies successfully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      (mockPrisma.setting.upsert as any).mockResolvedValue({});

      const policies = {
        discountThreshold: 20,
        stockAdjustmentThreshold: 10,
        poApprovalThreshold: 5000000,
        reconciliationTolerance: 50000,
      };

      const result = await updateFraudPreventionPolicies(policies);

      expect(result.success).toBe(true);
      expect(mockPrisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: "fraud_prevention_policies" },
        update: { value: policies },
        create: { key: "fraud_prevention_policies", value: policies },
      });
    });
  });

  describe("revertSetting", () => {
    it("should revert a setting to a previous version", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      (mockPrisma.auditLog.findMany as any).mockResolvedValue([
        {
          id: "log-2",
          changes: { value: { old: { name: "V2" }, new: { name: "V3" } } },
        },
        {
          id: "log-1",
          changes: { value: { old: { name: "V1" }, new: { name: "V2" } } },
        },
      ]);

      (mockPrisma.setting.findUnique as any).mockResolvedValue({
        key: "company_info",
        value: { name: "V3" },
      });

      (mockPrisma.setting.update as any).mockResolvedValue({});

      const result = await revertSetting("company_info", 1);

      expect(result.success).toBe(true);
      expect(mockPrisma.setting.update).toHaveBeenCalledWith({
        where: { key: "company_info" },
        data: { value: { name: "V1" } },
      });
    });

    it("should return error when no change history exists", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      (mockPrisma.auditLog.findMany as any).mockResolvedValue([]);

      const result = await revertSetting("unknown_key", 0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NOT_FOUND");
      }
    });
  });
});
