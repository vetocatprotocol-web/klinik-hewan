import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/prisma", () => {
  const mockClient = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
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

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async () => "hashed-password"),
    compare: vi.fn(async () => true),
  },
}));

import {
  updateUserRole,
  lockUser,
  unlockUser,
  getFailedLoginAttempts,
} from "@/server/actions/users";
import prisma from "@/server/lib/prisma";
import { auth } from "@/server/lib/auth";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

describe("User Management Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateUserRole", () => {
    it("should update a user role successfully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: "user-1",
        name: "Test User",
        roleId: "old-role",
      });

      (mockPrisma.user.update as any).mockResolvedValue({});

      const result = await updateUserRole("user-1", "new-role");

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { roleId: "new-role" },
      });
    });

    it("should return error when user is not found", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      (mockPrisma.user.findUnique as any).mockResolvedValue(null);

      const result = await updateUserRole("user-missing", "new-role");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("lockUser", () => {
    it("should lock a user until the specified time", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: "user-1",
        lockedUntil: null,
      });

      (mockPrisma.user.update as any).mockResolvedValue({});

      const result = await lockUser("user-1", 30);

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { lockedUntil: expect.any(Date) },
      });

      const callData = (mockPrisma.user.update as any).mock.calls[0][0];
      const lockedUntil = callData.data.lockedUntil as Date;
      const now = Date.now();
      const diff = lockedUntil.getTime() - now;
      expect(diff).toBeGreaterThan(29 * 60 * 1000);
      expect(diff).toBeLessThanOrEqual(31 * 60 * 1000);
    });

    it("should return error when trying to lock own account", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      const result = await lockUser("owner-1", 30);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("BUSINESS_RULE");
      }
    });
  });

  describe("unlockUser", () => {
    it("should unlock a user successfully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: "user-1",
        lockedUntil: new Date(Date.now() + 60 * 60 * 1000),
      });

      (mockPrisma.user.update as any).mockResolvedValue({});

      const result = await unlockUser("user-1");

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { lockedUntil: null },
      });
    });
  });

  describe("getFailedLoginAttempts", () => {
    it("should return failed login attempts and lock status", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      const futureDate = new Date(Date.now() + 60 * 60 * 1000);
      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        failedLoginAttempts: 5,
        lockedUntil: futureDate,
      });

      const result = await getFailedLoginAttempts("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { failedLoginAttempts: number; isLocked: boolean; lockedUntil: Date };
        expect(data.failedLoginAttempts).toBe(5);
        expect(data.isLocked).toBe(true);
        expect(data.lockedUntil).toEqual(futureDate);
      }
    });

    it("should return not locked when lockedUntil is in the past", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner-1", role: "OWNER" },
      } as any);

      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        failedLoginAttempts: 3,
        lockedUntil: pastDate,
      });

      const result = await getFailedLoginAttempts("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { isLocked: boolean };
        expect(data.isLocked).toBe(false);
      }
    });
  });
});
