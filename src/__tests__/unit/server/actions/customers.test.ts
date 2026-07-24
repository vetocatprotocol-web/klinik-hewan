import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/prisma", () => ({
  default: {
    customer: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    pet: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    visit: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    billing: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/server/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/server/lib/audit", () => ({
  createAuditLog: vi.fn(),
}));

vi.mock("@/server/lib/email", () => ({
  sendEmail: vi.fn(),
  generateCustomerRegistrationEmail: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("$2a$12$hashedpassword") },
}));

import { createCustomer, updateCustomer, archiveCustomer } from "@/server/actions/customers";
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

describe("Customer Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCustomer", () => {
    it("should create customer successfully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "OWNER" },
      } as any);
      (mockPrisma.customer.findFirst as any).mockResolvedValue(null);
      (mockPrisma.customer.create as any).mockResolvedValue({
        id: "cust-1",
        name: "John Doe",
        phone: "081234567890",
      });

      const formData = createFormData({
        name: "John Doe",
        phone: "081234567890",
        address: "Jakarta",
      });

      const result = await createCustomer(null, formData);

      expect(result.success).toBe(true);
    });

    it("should reject duplicate phone", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "OWNER" },
      } as any);
      (mockPrisma.customer.findFirst as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "existing", phone: "081234567890" });

      const formData = createFormData({
        name: "Jane Doe",
        phone: "081234567890",
        address: "Bandung",
      });

      const result = await createCustomer(null, formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.field).toBe("phone");
      }
    });

    it("should reject unauthorized users", async () => {
      mockAuth.mockResolvedValue(null as any);

      const formData = createFormData({
        name: "Test",
        phone: "081234567890",
        address: "Test",
      });

      const result = await createCustomer(null, formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("archiveCustomer", () => {
    it("should archive customer with no active visits", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "OWNER" },
      } as any);
      (mockPrisma.customer.findUnique as any).mockResolvedValue({
        id: "cust-1",
        status: "ACTIVE",
        visits: [],
      });
      (mockPrisma.customer.update as any).mockResolvedValue({ id: "cust-1" });

      const result = await archiveCustomer("cust-1");

      expect(result.success).toBe(true);
    });

    it("should fail to archive customer with active visits", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "OWNER" },
      } as any);
      (mockPrisma.customer.findUnique as any).mockResolvedValue({
        id: "cust-1",
        status: "ACTIVE",
        visits: [{ id: "visit-1" }],
      });

      const result = await archiveCustomer("cust-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("BUSINESS_RULE");
      }
    });
  });
});
